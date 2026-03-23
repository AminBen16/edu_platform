import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import MediaPlayer from '../components/MediaPlayer';
import DocumentViewer from '../components/DocumentViewer';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'audio' | 'other' | 'word' | 'excel' | 'powerpoint' | 'text';
  url: string;
  path: string;
  size?: number;
  lessonId?: string;
  uploadedBy: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ResourcesPage() {
  const { isAuthenticated } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playingMedia, setPlayingMedia] = useState<{ url: string; type: 'video' | 'audio'; title: string } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; type: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text'; title: string } | null>(null);

  const [newResource, setNewResource] = useState<{
    title: string;
    lessonId: string;
    type: Resource['type'];
  }>({
    title: '',
    lessonId: '',
    type: 'document',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [lessonsResponse, usersResponse, resourcesResponse] = await Promise.all([
        api.get('/lessons'),
        api.get('/users'),
        api.get('/files').catch(() => ({ data: { resources: [] } }))
      ]);
      
      setLessons(lessonsResponse.data);
      setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
      setResources(resourcesResponse.data?.resources || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewResource({
        ...newResource,
        title: file.name.split('.')[0],
        type: getFileType(file.type),
      });
    }
  };

  const getFileType = (mimeType: string): Resource['type'] => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    return 'document';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      default: return '📄';
    }
  };

  const getFileColor = (type: Resource['type']) => {
    switch (type) {
      case 'pdf': return '#dc3545';
      case 'video': return '#17a2b8';
      case 'image': return '#28a745';
      case 'audio': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newResource.title) return;

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', newResource.title);
      if (newResource.lessonId) {
        formData.append('lessonId', newResource.lessonId);
      }

      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadProgress(100);

      // Add the new resource to the list
      const createdResource = response.data.resource;
      const newResourceData: Resource = {
        id: createdResource.id,
        title: createdResource.title,
        type: (createdResource.type || newResource.type).toLowerCase(),
        url: createdResource.url,
        path: createdResource.url,
        size: createdResource.size || selectedFile.size,
        lessonId: createdResource.lessonId || newResource.lessonId,
        uploadedBy: teachers[0]?.id || '',
        createdAt: createdResource.createdAt || new Date().toISOString(),
      };

      setResources([newResourceData, ...resources]);

      setShowUploadModal(false);
      setSelectedFile(null);
      setNewResource({ title: '', lessonId: '', type: 'document' });
      setUploadProgress(0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      await api.delete(`/files/${resourceId}`);
      setResources(resources.filter(r => r.id !== resourceId));
    } catch (err) {
      setError('Failed to delete resource');
    }
  };

  const handlePlayMedia = (resource: Resource) => {
    if (resource.type === 'video' || resource.type === 'audio') {
      setPlayingMedia({ url: resource.url, type: resource.type, title: resource.title });
    }
  };

  const handleCloseMedia = () => setPlayingMedia(null);

  const handleViewDocument = (resource: Resource) => {
    if (['pdf', 'word', 'excel', 'powerpoint', 'text'].includes(resource.type)) {
      setViewingDocument({ url: resource.url, type: resource.type as 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text', title: resource.title });
    }
  };

  const handleCloseDocument = () => setViewingDocument(null);

  const handleDownloadResource = async (resourceId: string, resourceUrl: string, resourceTitle: string) => {
    try {
      const response = await fetch(resourceUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resourceTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download resource');
    }
  };

  if (loading) {
    return <main style={{ padding: '2rem' }}><h1>Manage Resources</h1><LoadingSpinner /></main>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Resources</h1>
          <p>Upload and manage educational materials like PDFs, videos, and documents.</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          + Upload Resource
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No resources yet</h3>
            <p>Click "Upload Resource" to add your first educational material</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {resources.map((resource) => (
              <div key={resource.id} style={{ border: '1px solid #e1e8ed', borderRadius: '8px', padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: getFileColor(resource.type), borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginRight: '0.75rem', fontSize: '1.2rem' }}>
                    {getFileIcon(resource.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{resource.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: getFileColor(resource.type), color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>{resource.type.toUpperCase()}</span>
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>{formatFileSize(resource.size)}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {resource.lessonId && (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {lessons.find(l => l.id === resource.lessonId)?.title || 'No Lesson'}
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>Uploaded {new Date(resource.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['video', 'audio'].includes(resource.type) ? (
                      <button onClick={() => handlePlayMedia(resource)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>▶ Play</button>
                    ) : ['pdf', 'word', 'excel', 'powerpoint', 'text'].includes(resource.type) ? (
                      <button onClick={() => handleViewDocument(resource)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>📄 View</button>
                    ) : (
                      <button onClick={() => window.open(resource.url, '_blank')} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>View</button>
                    )}
                    <button onClick={() => handleDownloadResource(resource.id, resource.url, resource.title)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Download</button>
                    <button onClick={() => handleDeleteResource(resource.id)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Upload Resource</h2>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select File</label>
                <input type="file" aria-label="Select File" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Resource Title</label>
                <input type="text" aria-label="Resource Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="e.g., Mathematics Textbook Chapter 1" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Associated Lesson (Optional)</label>
                <select value={newResource.lessonId} aria-label="Associated Lesson" onChange={(e) => setNewResource({ ...newResource, lessonId: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">No specific lesson</option>
                  {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
                </select>
              </div>
              
              {selectedFile && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}><strong>Selected file:</strong> {selectedFile.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}><strong>Size:</strong> {formatFileSize(selectedFile.size)}</div>
                </div>
              )}
              
              {uploading && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Uploading...</span><span>{uploadProgress}%</span></div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#007bff', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} disabled={uploading} style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer' }}>Cancel</button>
                <button type="submit" disabled={uploading || !selectedFile} style={{ padding: '0.5rem 1rem', backgroundColor: uploading || !selectedFile ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer' }}>{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDocument && <DocumentViewer url={viewingDocument.url} type={viewingDocument.type} title={viewingDocument.title} onClose={handleCloseDocument} />}
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
