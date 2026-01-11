import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
class DocumentViewerWidget extends StatefulWidget {
  final String url;
  final String title;
  final String type; // 'pdf', 'word', 'excel', 'powerpoint', 'text'
  final VoidCallback? onClose;

  const DocumentViewerWidget({
    Key? key,
    required this.url,
    required this.title,
    required this.type,
    this.onClose,
  }) : super(key: key);

  @override
  State<DocumentViewerWidget> createState() => _DocumentViewerWidgetState();
}

class _DocumentViewerWidgetState extends State<DocumentViewerWidget> {
  bool _isLoading = true;
  String? _error;
  String? _textContent;
  int _currentPage = 1;
  int _totalPages = 1;
  double _scale = 1.0;
  String _searchTerm = '';
  List<String> _searchResults = [];
  int _currentSearchIndex = 0;
  TextEditingController _searchController = TextEditingController();

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
      setState(() => _isLoading = true, _error = null);
      
      final response = await http.get(Uri.parse(widget.url));
      if (response.statusCode != 200) {
        throw 'Failed to load document: ${response.statusCode}';
      }

      final bytes = response.bodyBytes;
      
      if (widget.type == 'pdf') {
        // For PDF, we'll create a simple text representation
        // In a real app, you'd use flutter_pdf or syncfusion_flutter_pdfviewer
        _textContent = _extractTextFromPDF(bytes);
        _totalPages = 10; // Simulated page count
      } else if (widget.type == 'word' || widget.type == 'text') {
        // For Word documents and text files
        _textContent = _extractTextFromBytes(bytes);
        _totalPages = 1;
      } else if (widget.type == 'excel') {
        // For Excel files
        _textContent = _extractTextFromExcel(bytes);
        _totalPages = 1;
      } else if (widget.type == 'powerpoint') {
        // For PowerPoint files
        _textContent = _extractTextFromPowerPoint(bytes);
        _totalPages = 1;
      } else {
        // For other types, show as binary info
        _textContent = 'Document type "${widget.type}" is not supported for inline viewing.\n\n'
                    'File size: ${bytes.length} bytes\n'
                    'Please download the file to view it with an appropriate application.';
        _totalPages = 1;
      }
      
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false,
        _error = 'Failed to load document: $e',
      });
    }
  }

  String _extractTextFromPDF(Uint8List bytes) {
    // Simulated PDF text extraction
    // In a real app, you'd use a proper PDF parsing library
    return '''
PDF Document: ${widget.title}

This is a simulated PDF viewer. In a production application, this would display the actual PDF content with proper formatting, images, and interactive elements.

Page $_currentPage of $_totalPages

Sample PDF Content:
-------------------
Chapter 1: Introduction
This is sample content that would be extracted from the actual PDF document. The real implementation would use a PDF parsing library to extract text, images, and formatting from the PDF file.

Chapter 2: Main Content
Here would be the main content of the PDF document with proper text extraction, preserving paragraphs, headings, and other formatting elements.

Chapter 3: Conclusion
The document viewer would provide navigation between pages, zoom controls, search functionality, and the ability to select and copy text.
    ''';
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

  String _extractTextFromExcel(Uint8List bytes) {
    return '''
Excel Document: ${widget.title}

This is a simulated Excel viewer. In a production application, this would display the actual spreadsheet content with proper table formatting.

Sample Excel Content:
-------------------
Sheet 1: Data
| Column A | Column B | Column C |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
| Data 7   | Data 8   | Data 9   |

Sheet 2: Analysis
| Metric   | Value    | Status   |
|----------|----------|----------|
| Total    | 100      | Complete |
| Average  | 50       | Good     |
| Maximum  | 100      | Excellent|
    ''';
  }

  String _extractTextFromPowerPoint(Uint8List bytes) {
    return '''
PowerPoint Document: ${widget.title}

This is a simulated PowerPoint viewer. In a production application, this would display the actual presentation slides with proper formatting.

Slide 1: Title Slide
-------------------
${widget.title}

Subtitle or author information

Slide 2: Introduction
-------------------
• Key point 1
• Key point 2
• Key point 3

Slide 3: Main Content
-------------------
Detailed content with bullet points, images, and formatting would appear here.

Slide 4: Conclusion
-------------------
Summary of the presentation
Next steps
Contact information
    ''';
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
        _currentSearchIndex = (_currentSearchIndex - 1 + _searchResults.length) % _searchResults.length;
      });
    }
  }

  void _changePage(int pageNumber) {
    if (pageNumber >= 1 && pageNumber <= _totalPages) {
      setState(() => _currentPage = pageNumber);
      // Reload content for the new page
      _loadDocument();
    }
  }

  void _zoom(double delta) {
    final newScale = (_scale + delta).clamp(0.5, 3.0);
    setState(() => _scale = newScale);
  }

  Future<void> _downloadDocument() async {
    try {
      final response = await http.get(Uri.parse(widget.url));
      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final fileName = '${widget.title.replaceAll(' ', '_')}.${_getFileExtension()}';
        final filePath = '${directory.path}/$fileName';
        final file = File(filePath);
        
        await file.writeAsBytes(response.bodyBytes);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Document downloaded to $fileName'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw 'Download failed with status: ${response.statusCode}';
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

  void _printDocument() {
    // For now, just show a message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Print functionality coming soon!')),
    );
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
        backgroundColor: Colors.blue[800],
        title: Text(
          widget.title,
          style: const TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: widget.onClose ?? () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: _downloadDocument,
          ),
          IconButton(
            icon: const Icon(Icons.print, color: Colors.white),
            onPressed: _printDocument,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.blue[800]),
                  SizedBox(height: 16),
                  Text(
                    'Loading document...',
                    style: TextStyle(color: Colors.blue[800]),
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
                            Text('${_currentSearchIndex + 1}/${_searchResults.length}'),
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
                              onPressed: _currentPage > 1 ? () => _changePage(_currentPage - 1) : null,
                              icon: const Icon(Icons.arrow_back),
                            ),
                            Text(
                              'Page $_currentPage of $_totalPages',
                              style: const TextStyle(fontSize: 16),
                            ),
                            IconButton(
                              onPressed: _currentPage < _totalPages ? () => _changePage(_currentPage + 1) : null,
                              icon: const Icon(Icons.arrow_forward),
                            ),
                          ],
                        ),
                      ),
                    
                    // Document Content
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        child: SingleChildScrollView(
                          child: Transform.scale(
                            scale: _scale,
                            child: _buildDocumentContent(),
                          ),
                        ),
                      ),
                    ),
                    
                    // Zoom Controls
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

    if (_searchResults.isNotEmpty) {
      // Highlight current search result
      final currentResult = _searchResults[_currentSearchIndex];
      
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            backgroundColor: Colors.yellow[200],
            child: Text(
              currentResult,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                backgroundColor: Colors.yellow,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _textContent!,
            style: const TextStyle(fontSize: 16, height: 1.5),
          ),
        ],
      );
    }

    return Text(
      _textContent!,
      style: const TextStyle(fontSize: 16, height: 1.5),
    );
  }
}

class Match {
  final int page;
  final String text;

  Match({required this.page, required this.text});
}
