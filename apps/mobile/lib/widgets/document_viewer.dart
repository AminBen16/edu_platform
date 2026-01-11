import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_pdf/flutter_pdf.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
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
  int _currentPage = 1;
  int _totalPages = 0;
  double _scale = 1.0;
  String _searchTerm = '';
  List<Match> _searchResults = [];
  PDFDocument? _pdfDocument;

  @override
  void initState() {
    super.initState();
    _loadDocument();
  }

  Future<void> _loadDocument() async {
    try {
      setState(() => _isLoading = true, _error = null);
      
      if (widget.type == 'pdf') {
        await _loadPDF();
      } else if (widget.type == 'word' || widget.type == 'text') {
        await _loadTextDocument();
      } else {
        // For other types, open in web view
        setState(() {
          _isLoading = false,
          _error = 'Opening in web view...',
        });
        
        if (await canLaunchUrl(Uri.parse(widget.url))) {
          await launchUrl(Uri.parse(widget.url));
        } else {
          throw 'Could not launch URL';
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false,
        _error = 'Failed to load document: $e',
      });
    }
  }

  Future<void> _loadPDF() async {
    try {
      final response = await http.get(Uri.parse(widget.url));
      if (response.statusCode != 200) {
        throw 'Failed to load PDF';
      }

      final bytes = response.bodyBytes;
      final pdfDocument = await PDFDocument.documentData(bytes);
      
      setState(() {
        _pdfDocument = pdfDocument;
        _totalPages = pdfDocument.pageCount;
        _isLoading = false;
      });
      
      _renderPage(1);
    } catch (e) {
      setState(() {
        _isLoading = false,
        _error = 'Failed to load PDF: $e',
      });
    }
  }

  Future<void> _loadTextDocument() async {
    try {
      final response = await http.get(Uri.parse(widget.url));
      if (response.statusCode != 200) {
        throw 'Failed to load document';
      }

      final content = response.body;
      setState(() {
        _isLoading = false,
      _error = null,
      });
    } catch (e) {
      setState(() {
        _isLoading = false,
        _error = 'Failed to load document: $e',
      });
    }
  }

  void _renderPage(int pageNumber) {
    if (_pdfDocument == null) return;
    
    _pdfDocument!.getPage(pageNumber).then((page) {
      page.render(
        page.width,
        page.height,
        context: context,
        builder: (context) {
          return Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            margin: const EdgeInsets.all(8),
            child: Image(
              image: MemoryImage(page.toImage()),
              fit: BoxFit.contain,
            ),
          );
        },
      );
    });
  }

  void _changePage(int pageNumber) {
    if (pageNumber >= 1 && pageNumber <= _totalPages) {
      setState(() => _currentPage = pageNumber);
      _renderPage(pageNumber);
    }
  }

  void _zoom(double delta) {
    final newScale = (_scale + delta).clamp(0.5, 3.0);
    setState(() => _scale = newScale);
    if (_pdfDocument != null) {
      _renderPage(_currentPage);
    }
  }

  void _searchInDocument() {
    if (_pdfDocument == null || _searchTerm.isEmpty) return;
    
    final results = <Match>[];
    
    for (int i = 1; i <= _totalPages; i++) {
      final page = await _pdfDocument!.getPage(i);
      final textContent = await page.getText();
      
      final matches = textContent.text
          .toLowerCase()
          .split(' ')
          .where((word) => word.contains(_searchTerm.toLowerCase()))
          .toList();
      
      for (final match in matches) {
        if (match.isNotEmpty) {
          results.add(Match(page: i, text: match));
        }
      }
    }
    
    setState(() {
      _searchResults = results,
    });
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
          onPressed: widget.onClose,
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
                  const SizedBox(height: 16),
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
                  ),
                ],
              ),
            )
          : widget.type == 'pdf' && _pdfDocument != null
              ? Column(
                  children: [
                    // Toolbar
                    Container(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            onPressed: () => _changePage(_currentPage - 1),
                            icon: const Icon(Icons.arrow_back),
                            disabled: _currentPage <= 1,
                          ),
                          Text(
                            'Page $_currentPage of $_totalPages',
                            style: const TextStyle(fontSize: 16),
                          ),
                          IconButton(
                            onPressed: () => _changePage(_currentPage + 1),
                            icon: const Icon(Icons.arrow_forward),
                            disabled: _currentPage >= _totalPages,
                          ),
                        ],
                      ),
                    ),
                    
                    // Search bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        onChanged: (value) => setState(() => _searchTerm = value)),
                        decoration: InputDecoration(
                          hintText: 'Search in document...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    
                    // Search button
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ElevatedButton(
                        onPressed: _searchInDocument,
                        child: const Text('Search'),
                      ),
                    ),
                    
                    // Zoom controls
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
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
                        ],
                      ),
                    ),
                    
                    // PDF content
                    Expanded(
                      child: InteractiveViewer(
                        canShowSelectionHandles: true,
                        onInteractionChanged: (interaction) {
                          // Handle text selection if needed
                        },
                        onDocumentLoaded: (document) {
                          setState(() {
                            _pdfDocument = document;
                            _totalPages = document.pageCount;
                          });
                        },
                        builder: (context) {
                          return Container(
                            margin: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey[300]!),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: PDFViewer(
                              document: _pdfDocument!,
                              page: _currentPage - 1,
                              controller: PdfController(
                                document: _pdfDocument!,
                                initialPage: _currentPage - 1,
                              viewportFraction: 0.8,
                              keepPage: true,
                              autoSpacing: false,
                              enableTextSelection: true,
                              onTextSelectionChanged: (selection) {
                                // Handle text selection
                              },
                              onAnnotationTap: (annotation) {
                                // Handle annotations
                              },
                            ),
                            ),
                          ),
                        );
                        },
                      ),
                    ),
                    
                    // Search results
                    if (_searchResults.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Found ${_searchResults.length} results:',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            ..._searchResults.map((result, index) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.yellow[100],
                                border: Border.all(color: Colors.yellow[600]!),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Page ${result.page}:',
                                    style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.brown[800],
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    result.text,
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ],
                              ),
                            ))
                          ],
                        ),
                      ),
                  ],
                )
              : widget.type == 'word' || widget.type == 'text'
                  ? Container(
                      padding: const EdgeInsets.all(20),
                      child: SingleChildScrollView(
                        child: Text(
                          _error ?? 'Document content not available',
                          style: const TextStyle(
                            fontSize: 16,
                            fontFamily: 'monospace',
                            height: 1.5,
                          ),
                        ),
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.description,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'This document type is not supported for in-app viewing.',
                            style: const TextStyle(fontSize: 16),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              launchUrl(Uri.parse(widget.url));
                            },
                            child: const Text('Open in Browser'),
                          ),
                        ],
                      ),
                    ),
            ],
    );
  }
}

class Match {
  final int page;
  final String text;

  Match({required this.page, required this.text});
}
