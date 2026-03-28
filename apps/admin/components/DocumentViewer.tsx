import React, { useState, useRef, useEffect } from 'react';

interface DocumentViewerProps {
  url?: string;
  type: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'text';
  title?: string;
  onClose?: () => void;
}

export default function DocumentViewer({ url, type, title, onClose }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ page: number; text: string }[]>([]);

  // For PDF viewing
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<any>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // For Word document viewing
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (url && type) {
      loadDocument();
    }
  }, [url, type]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      
      if (type === 'pdf') {
        await loadPDF();
      } else if (type === 'word' || type === 'text') {
        await loadTextDocument();
      } else if (type === 'excel' || type === 'powerpoint') {
        // For now, open in new tab (can be enhanced later)
        window.open(url, '_blank');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setIsLoading(false);
    }
  };

  const loadPDF = async () => {
    try {
      // Check if PDF.js is already loaded
      if ((window as any).pdfjsLib) {
        const pdfjs = (window as any).pdfjsLib;
        const pdfjsWorker = (window as any).pdfjsWorker;
        
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        
        pdfDocumentRef.current = pdf;
        setTotalPages(pdf.numPages);
        setPdfLoaded(true);
        
        // Render first page
        renderPage(1);
      } else {
        // Fallback to iframe if PDF.js is not available
        setDocumentContent(`<iframe src="${url}" style="width: 100%; height: 80vh; border: none;"></iframe>`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      // Fallback to iframe if PDF.js fails
      setDocumentContent(`<iframe src="${url}" style="width: 100%; height: 80vh; border: none;"></iframe>`);
      setIsLoading(false);
    }
  };

  const renderPage = (pageNumber: number) => {
    if (!pdfDocumentRef.current || !pdfCanvasRef.current) return;
    
    const pdf = pdfDocumentRef.current;
    const canvas = pdfCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    pdf.getPage(pageNumber).then((page: any) => {
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      
      page.render(renderContext);
      setCurrentPage(pageNumber);
    });
  };

  const loadTextDocument = async () => {
    try {
      if (!url) {
        setDocumentContent('No document URL provided');
        setIsLoading(false);
        return;
      }
      const response = await fetch(url);
      const content = await response.text();
      
      if (type === 'word') {
        // Basic Word document parsing (simplified)
        const cleanContent = content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        setDocumentContent(cleanContent);
      } else {
        setDocumentContent(content);
      }
    } catch (error) {
      console.error('Error loading text document:', error);
      setDocumentContent('Error loading document');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
    if (pdfLoaded && pdfDocumentRef.current) {
      renderPage(currentPage);
    }
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (pdfLoaded && pdfDocumentRef.current) {
      renderPage(currentPage);
    }
  };

  const searchInDocument = () => {
    if (!searchTerm.trim() || !pdfDocumentRef.current) return;
    
    const results: { page: number; text: string }[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pdfDocumentRef.current.getPage(i).then((page: any) => {
        const textContent = page.getTextContent();
        const matches = textContent.items.filter((item: any) => 
          item.str.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        matches.forEach((match: any) => {
          results.push({
            page: i,
            text: match.str
          });
        });
      });
    }
    
    setSearchResults(results);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark style="background: yellow; padding: 2px;">$1</mark>');
  };

  const downloadDocument = () => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const printDocument = () => {
    if (type === 'pdf' && pdfCanvasRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>${title || 'Document'}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0; }
              }
            </style>
          </head>
          <body>
            <img src="${pdfCanvasRef.current.toDataURL()}" style="width: 100%;" />
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.print();
    } else {
      window.print();
    }
  };

  if (!url) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        width: '90vw',
        height: '90vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '16px',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
              {title || 'Document Viewer'}
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {type.toUpperCase()} • Page {currentPage} of {totalPages}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={downloadDocument}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📥 Download
            </button>
            <button
              onClick={printDocument}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              🖨 Print
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {type === 'pdf' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage <= 1 ? '#e9ecef' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              <input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                min="1"
                max={totalPages}
                style={{
                  width: '80px',
                  textAlign: 'center',
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage >= totalPages ? '#e9ecef' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handleZoom(-0.25)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🔍-
              </button>
              <span style={{ fontSize: '0.875rem', minWidth: '60px', textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.25)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🔍+
              </button>
              <button
                onClick={handleRotate}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🔄
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '200px',
                }}
              />
              <button
                onClick={searchInDocument}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Document Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          position: 'relative',
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📄</div>
                <div>Loading document...</div>
              </div>
            </div>
          ) : type === 'pdf' && pdfLoaded ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <canvas
                ref={pdfCanvasRef}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '1px solid #ddd',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : (
            <div style={{
              padding: '20px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              maxHeight: '70vh',
              overflow: 'auto',
            }}>
              {searchResults.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#666' }}>
                    Found {searchResults.length} results:
                  </div>
                  {searchResults.map((result, index) => (
                    <div key={index} style={{
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#856404' }}>
                        Page {result.page}:
                      </div>
                      <div dangerouslySetInnerHTML={{
                        __html: highlightText(result.text, searchTerm)
                      }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: documentContent }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
