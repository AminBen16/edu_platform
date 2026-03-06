import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:convert';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';

class DocumentViewerWidget extends StatefulWidget {
  final String url;
  final String title;
  final String type; // 'pdf', 'word', 'excel', 'powerpoint', 'text'
  final VoidCallback? onClose;

  const DocumentViewerWidget({
    super.key,
    required this.url,
    required this.title,
    required this.type,
    this.onClose,
  });

  @override
  State<DocumentViewerWidget> createState() => _DocumentViewerWidgetState();
}

class _DocumentViewerWidgetState extends State<DocumentViewerWidget> {
  bool _isLoading = true;
  String? _error;
  Uint8List? _documentBytes;
  String? _textContent;
  int _currentPage = 1;
  int _totalPages = 1;
  double _scale = 1.0;
  List<String> _searchResults = [];
  int _currentSearchIndex = 0;
  final TextEditingController _searchController = TextEditingController();
  String? _localFilePath;
  PDFViewController? _pdfController;

  @override
  void initState() {
    super.initState();
    _loadDocument();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDocument() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final response = await http.get(Uri.parse(widget.url));
      if (response.statusCode != 200) {
        throw 'Failed to load document: ${response.statusCode}';
      }

      final bytes = response.bodyBytes;
      _documentBytes = bytes;

      if (widget.type == 'pdf') {
        final directory = await getTemporaryDirectory();
        final file = File(
          '${directory.path}/temp_doc_${DateTime.now().millisecondsSinceEpoch}.pdf',
        );
        await file.writeAsBytes(bytes);
        _localFilePath = file.path;
      } else if (widget.type == 'text') {
        _textContent = _extractTextFromBytes(bytes);
        _totalPages = 1;
      } else {
        // For other types like word, excel, powerpoint, show as binary info
        _textContent =
            'Document type "${widget.type}" is not supported for inline viewing.\n\n'
            'File size: ${bytes.length} bytes\n'
            'Please download the file to view it with an appropriate application.';
        _totalPages = 1;
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load document: $e';
      });
    }
  }

  String _extractTextFromBytes(Uint8List bytes) {
    try {
      // Try to decode as UTF-8 text
      return utf8.decode(bytes, allowMalformed: true);
    } catch (e) {
      // If UTF-8 fails, try other encodings or return binary info
      return 'Document content could not be decoded as text.\n\n'
          'File size: ${bytes.length} bytes\n'
          'This might be a binary document format that requires a specialized viewer.\n\n'
          'Please download the file to view it with an appropriate application.';
    }
  }

  void _searchInDocument() {
    if (_textContent == null || _searchController.text.isEmpty) {
      setState(() {
        _searchResults = [];
        _currentSearchIndex = 0;
      });
      return;
    }

    final searchTerm = _searchController.text.toLowerCase();
    final lines = _textContent!.split('\n');
    final results = <String>[];

    for (int i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().contains(searchTerm)) {
        results.add('Line ${i + 1}: ${lines[i].trim()}');
      }
    }

    setState(() {
      _searchResults = results;
      _currentSearchIndex = 0;
    });
  }

  void _nextSearchResult() {
    if (_searchResults.isNotEmpty) {
      setState(() {
        _currentSearchIndex = (_currentSearchIndex + 1) % _searchResults.length;
      });
    }
  }

  void _previousSearchResult() {
    if (_searchResults.isNotEmpty) {
      setState(() {
        _currentSearchIndex =
            (_currentSearchIndex - 1 + _searchResults.length) %
            _searchResults.length;
      });
    }
  }

  void _changePage(int pageNumber) {
    if (pageNumber >= 1 && pageNumber <= _totalPages) {
      if (widget.type == 'pdf' && _pdfController != null) {
        _pdfController!.setPage(pageNumber - 1);
      } else {
        // For non-PDFs, pagination isn't supported in this view.
        // The original code had a bug here that re-triggered _loadDocument().
        setState(() => _currentPage = pageNumber);
      }
    }
  }

  void _zoom(double delta) {
    final newScale = (_scale + delta).clamp(0.5, 3.0);
    setState(() => _scale = newScale);
  }

  Future<void> _downloadDocument() async {
    try {
      Uint8List bytes;
      if (_documentBytes != null) {
        bytes = _documentBytes!;
      } else {
        final response = await http.get(Uri.parse(widget.url));
        if (response.statusCode != 200) {
          throw 'Download failed with status: ${response.statusCode}';
        }
        bytes = response.bodyBytes;
      }

      final directory = await getApplicationDocumentsDirectory();
      final fileName =
          '${widget.title.replaceAll(' ', '_')}.${_getFileExtension()}';
      final filePath = '${directory.path}/$fileName';
      final file = File(filePath);

      await file.writeAsBytes(bytes);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document downloaded successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Download failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _printDocument() async {
    // On mobile, "printing" is often handled via the Share sheet which includes "Print"
    try {
      setState(() => _isLoading = true);
      Uint8List bytes;
      if (_documentBytes != null) {
        bytes = _documentBytes!;
      } else {
        final response = await http.get(Uri.parse(widget.url));
        if (response.statusCode != 200) {
          throw 'Failed to download for printing';
        }
        bytes = response.bodyBytes;
      }

      final directory = await getTemporaryDirectory();
      final fileName =
          '${widget.title.replaceAll(' ', '_')}.${_getFileExtension()}';
      final file = File('${directory.path}/$fileName');
      await file.writeAsBytes(bytes);

      if (mounted) {
        await Share.shareXFiles([
          XFile(file.path),
        ], text: 'Print ${widget.title}');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error preparing print: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getFileExtension() {
    switch (widget.type) {
      case 'pdf':
        return 'pdf';
      case 'word':
        return 'docx';
      case 'excel':
        return 'xlsx';
      case 'powerpoint':
        return 'pptx';
      case 'text':
        return 'txt';
      default:
        return 'file';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Theme.of(context).primaryColor,
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: _downloadDocument,
            tooltip: 'Download',
          ),
          IconButton(
            icon: const Icon(Icons.print, color: Colors.white),
            onPressed: _printDocument,
            tooltip: 'Print Document',
          ),
          if (widget.onClose != null)
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => widget.onClose!(),
              tooltip: 'Close',
            ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    'Loading document...',
                    style: TextStyle(color: Theme.of(context).primaryColor),
                  ),
                ],
              ),
            )
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadDocument,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                // Search Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: 'Search in document...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _searchInDocument,
                        child: const Text('Search'),
                      ),
                    ],
                  ),
                ),

                // Search Results
                if (_searchResults.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      border: Border.all(color: Colors.blue[200]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text('${_searchResults.length} results'),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.keyboard_arrow_up),
                          onPressed: _previousSearchResult,
                        ),
                        Text(
                          '${_currentSearchIndex + 1}/${_searchResults.length}',
                        ),
                        IconButton(
                          icon: const Icon(Icons.keyboard_arrow_down),
                          onPressed: _nextSearchResult,
                        ),
                      ],
                    ),
                  ),

                // Page Navigation (for PDFs)
                if (widget.type == 'pdf' && _totalPages > 1)
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          onPressed: _currentPage > 1
                              ? () => _changePage(_currentPage - 1)
                              : null,
                          icon: const Icon(Icons.arrow_back),
                        ),
                        Text(
                          'Page $_currentPage of $_totalPages',
                          style: const TextStyle(fontSize: 16),
                        ),
                        IconButton(
                          onPressed: _currentPage < _totalPages
                              ? () => _changePage(_currentPage + 1)
                              : null,
                          icon: const Icon(Icons.arrow_forward),
                        ),
                      ],
                    ),
                  ),

                // Document Content
                Expanded(
                  child: Container(
                    padding: widget.type == 'pdf'
                        ? EdgeInsets.zero
                        : const EdgeInsets.all(16),
                    child: widget.type == 'pdf' && _localFilePath != null
                        ? PDFView(
                            filePath: _localFilePath!,
                            enableSwipe: true,
                            swipeHorizontal: true,
                            autoSpacing: false,
                            pageFling: true,
                            pageSnap: true,
                            defaultPage: _currentPage - 1,
                            onRender: (pages) {
                              setState(() => _totalPages = pages ?? 0);
                            },
                            onViewCreated: (controller) {
                              _pdfController = controller;
                            },
                            onPageChanged: (page, total) {
                              setState(() => _currentPage = (page ?? 0) + 1);
                            },
                          )
                        : SingleChildScrollView(
                            child: Transform.scale(
                              scale: _scale,
                              child: _buildDocumentContent(),
                            ),
                          ),
                  ),
                ),

                // Zoom Controls
                if (widget.type != 'pdf')
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      border: Border(top: BorderSide(color: Colors.grey[300]!)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          onPressed: () => _zoom(-0.25),
                          icon: const Icon(Icons.zoom_out),
                        ),
                        Text(
                          '${(_scale * 100).round()}%',
                          style: const TextStyle(fontSize: 16),
                        ),
                        IconButton(
                          onPressed: () => _zoom(0.25),
                          icon: const Icon(Icons.zoom_in),
                        ),
                        const SizedBox(width: 16),
                        TextButton(
                          onPressed: () => setState(() => _scale = 1.0),
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildDocumentContent() {
    if (_textContent == null) {
      return const Text('No content available');
    }

    // The previous implementation of showing search results here was not user-friendly.
    // A proper implementation would involve highlighting text within the scroll view,
    // which requires a more complex setup. For now, we just display the text.
    // The search bar will still indicate the number of results found.

    return Text(
      _textContent!,
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
    );
  }
}
