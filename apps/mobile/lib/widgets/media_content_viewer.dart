import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'media_player.dart';
import '../services/api_service.dart';

class MediaContentViewer extends ConsumerStatefulWidget {
  final List<dynamic> resources;
  final String courseTitle;

  const MediaContentViewer({
    super.key,
    required this.resources,
    required this.courseTitle,
  });

  @override
  ConsumerState<MediaContentViewer> createState() => _MediaContentViewerState();
}

class _MediaContentViewerState extends ConsumerState<MediaContentViewer> {
  String _selectedFilter = 'all';

  List<dynamic> get _filteredResources {
    switch (_selectedFilter) {
      case 'video':
        return resources.where((r) => _isVideo(r['type'])).toList();
      case 'audio':
        return resources.where((r) => _isAudio(r['type'])).toList();
      case 'document':
        return resources.where((r) => _isDocument(r['type'])).toList();
      default:
        return resources;
    }
  }

  bool _isVideo(String? type) {
    if (type == null) return false;
    return ['video/mp4', 'video/webm', 'video/avi', 'video/mov'].contains(type.toLowerCase());
  }

  bool _isAudio(String? type) {
    if (type == null) return false;
    return ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac'].contains(type.toLowerCase());
  }

  bool _isDocument(String? type) {
    if (type == null) return false;
    return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].contains(type.toLowerCase());
  }

  IconData _getMediaIcon(String? type) {
    if (_isVideo(type)) return Icons.video_library;
    if (_isAudio(type)) return Icons.audiotrack;
    if (_isDocument(type)) return Icons.description;
    return Icons.insert_drive_file;
  }

  Color _getMediaColor(String? type) {
    if (_isVideo(type)) return Colors.red;
    if (_isAudio(type)) return Colors.purple;
    if (_isDocument(type)) return Colors.blue;
    return Colors.grey;
  }

  String _formatFileSize(int? bytes) {
    if (bytes == null) return 'Unknown size';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  void _openMedia(dynamic resource) {
    final url = resource['url'] ?? '';
    final title = resource['title'] ?? 'Media';
    final type = resource['type'] ?? '';

    if (_isVideo(type)) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => VideoPlayerScreen(
            videoUrl: url,
            title: title,
            downloadUrl: url, // Use same URL for download
          ),
        ),
      );
    } else if (_isAudio(type)) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AudioPlayerScreen(
            audioUrl: url,
            title: title,
            downloadUrl: url, // Use same URL for download
          ),
        ),
      );
    } else if (_isDocument(type)) {
      // Open document viewer or download
      _showDocumentOptions(resource);
    }
  }

  void _showDocumentOptions(dynamic resource) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              resource['title'] ?? 'Document',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.visibility),
              title: const Text('View Document'),
              onTap: () {
                Navigator.pop(context);
                // Implement document viewer
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Document viewer coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.download),
              title: const Text('Download'),
              onTap: () {
                Navigator.pop(context);
                _downloadDocument(resource);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _downloadDocument(dynamic resource) async {
    try {
      final apiService = ApiService();
      // Implement document download logic
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Download started!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Download failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredResources = _filteredResources;

    return Column(
      children: [
        // Filter Chips
        Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              FilterChip(
                label: const Text('All'),
                selected: _selectedFilter == 'all',
                onSelected: (selected) {
                  setState(() {
                    _selectedFilter = 'all';
                  });
                },
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('Videos'),
                selected: _selectedFilter == 'video',
                onSelected: (selected) {
                  setState(() {
                    _selectedFilter = 'video';
                  });
                },
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('Audio'),
                selected: _selectedFilter == 'audio',
                onSelected: (selected) {
                  setState(() {
                    _selectedFilter = 'audio';
                  });
                },
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('Documents'),
                selected: _selectedFilter == 'document',
                onSelected: (selected) {
                  setState(() {
                    _selectedFilter = 'document';
                  });
                },
              ),
            ],
          ),
        ),
        
        // Media Grid
        Expanded(
          child: filteredResources.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.folder_open,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No ${_selectedFilter == 'all' ? 'media' : _selectedFilter} files found',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: filteredResources.length,
                  itemBuilder: (context, index) {
                    final resource = filteredResources[index];
                    return MediaCard(
                      resource: resource,
                      onTap: () => _openMedia(resource),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class MediaCard extends StatelessWidget {
  final dynamic resource;
  final VoidCallback onTap;

  const MediaCard({
    super.key,
    required this.resource,
    required this.onTap,
  });

  bool _isVideo(String? type) {
    if (type == null) return false;
    return ['video/mp4', 'video/webm', 'video/avi', 'video/mov'].contains(type.toLowerCase());
  }

  bool _isAudio(String? type) {
    if (type == null) return false;
    return ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac'].contains(type.toLowerCase());
  }

  IconData _getMediaIcon(String? type) {
    if (_isVideo(type)) return Icons.video_library;
    if (_isAudio(type)) return Icons.audiotrack;
    return Icons.description;
  }

  Color _getMediaColor(String? type) {
    if (_isVideo(type)) return Colors.red;
    if (_isAudio(type)) return Colors.purple;
    return Colors.blue;
  }

  String _formatFileSize(int? bytes) {
    if (bytes == null) return 'Unknown size';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final title = resource['title'] ?? 'Media';
    final type = resource['type'] ?? '';
    final size = resource['size'] ?? 0;
    final icon = _getMediaIcon(type);
    final color = _getMediaColor(type);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Media Icon/Thumbnail
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                ),
                child: Icon(
                  icon,
                  size: 48,
                  color: color,
                ),
              ),
            ),
            
            // Media Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Icon(
                          Icons.file_download,
                          size: 14,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatFileSize(size),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
