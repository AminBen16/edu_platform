import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:just_audio/just_audio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:permission_handler/permission_handler.dart';

class VideoPlayerScreen extends StatefulWidget {
  final String videoUrl;
  final String title;
  final String? downloadUrl;

  const VideoPlayerScreen({
    super.key,
    required this.videoUrl,
    required this.title,
    this.downloadUrl,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  VideoPlayerController? _videoPlayerController;
  bool _isLoading = true;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  String? _downloadedPath;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    try {
      _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      await _videoPlayerController!.initialize();

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error initializing video player: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _videoPlayerController?.dispose();
    super.dispose();
  }

  Future<void> _downloadVideo() async {
    if (widget.downloadUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Download not available for this video')),
      );
      return;
    }

    // Request storage permission
    final status = await Permission.storage.request();
    if (!status.isGranted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Storage permission required for downloads')),
      );
      return;
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    try {
      final dio = Dio();
      final directory = await getExternalStorageDirectory();
      final savePath = '${directory!.path}/${widget.title.replaceAll(' ', '_')}.mp4';

      await dio.download(
        widget.downloadUrl!,
        savePath,
        onReceiveProgress: (received, total) {
          setState(() {
            _downloadProgress = (received / total * 100);
          });
        },
      );

      setState(() {
        _isDownloading = false;
        _downloadedPath = savePath;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video downloaded successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isDownloading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (widget.downloadUrl != null)
            IconButton(
              icon: _isDownloading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.download),
              onPressed: _isDownloading ? null : _downloadVideo,
            ),
          if (_downloadedPath != null)
            IconButton(
              icon: const Icon(Icons.play_circle),
              onPressed: () {
                // Play downloaded video
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => VideoPlayerScreen(
                      videoUrl: _downloadedPath!,
                      title: '${widget.title} (Offline)',
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _videoPlayerController != null
              ? Column(
                  children: [
                    Expanded(
                      child: AspectRatio(
                        aspectRatio: _videoPlayerController!.value.aspectRatio,
                        child: VideoPlayer(_videoPlayerController!),
                      ),
                    ),
                    if (_isDownloading)
                      Container(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            LinearProgressIndicator(value: _downloadProgress / 100),
                            const SizedBox(height: 8),
                            Text(
                              'Downloading: ${_downloadProgress.toStringAsFixed(1)}%',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                  ],
                )
              : const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error, size: 64, color: Colors.red),
                      SizedBox(height: 16),
                      Text('Failed to load video'),
                      SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => _initializePlayer(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class AudioPlayerScreen extends StatefulWidget {
  final String audioUrl;
  final String title;
  final String? downloadUrl;

  const AudioPlayerScreen({
    super.key,
    required this.audioUrl,
    required this.title,
    this.downloadUrl,
  });

  @override
  State<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends State<AudioPlayerScreen> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  bool _isLoading = true;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  String? _downloadedPath;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    try {
      await _audioPlayer.setUrl(widget.audioUrl);
      
      _audioPlayer.durationStream.listen((duration) {
        setState(() {
          _duration = duration ?? Duration.zero;
        });
      });

      _audioPlayer.positionStream.listen((position) {
        setState(() {
          _position = position;
        });
      });

      _audioPlayer.playerStateStream.listen((state) {
        setState(() {
          _isPlaying = state.playing;
        });
      });

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error initializing audio player: $e')),
        );
      }
    }
  }

  Future<void> _downloadAudio() async {
    if (widget.downloadUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Download not available for this audio')),
      );
      return;
    }

    // Request storage permission
    final status = await Permission.storage.request();
    if (!status.isGranted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Storage permission required for downloads')),
      );
      return;
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    try {
      final dio = Dio();
      final directory = await getExternalStorageDirectory();
      final savePath = '${directory!.path}/${widget.title.replaceAll(' ', '_')}.mp3';

      await dio.download(
        widget.downloadUrl!,
        savePath,
        onReceiveProgress: (received, total) {
          setState(() {
            _downloadProgress = (received / total * 100);
          });
        },
      );

      setState(() {
        _isDownloading = false;
        _downloadedPath = savePath;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Audio downloaded successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isDownloading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (widget.downloadUrl != null)
            IconButton(
              icon: _isDownloading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.download),
              onPressed: _isDownloading ? null : _downloadAudio,
            ),
          if (_downloadedPath != null)
            IconButton(
              icon: const Icon(Icons.play_circle),
              onPressed: () {
                // Play downloaded audio
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AudioPlayerScreen(
                      audioUrl: _downloadedPath!,
                      title: '${widget.title} (Offline)',
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Audio Visualizer
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isPlaying ? Icons.graphic_eq : Icons.music_note,
                          size: 64,
                          color: Theme.of(context).primaryColor,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          widget.title,
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Progress Bar
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                      trackHeight: 4,
                    ),
                    child: Slider(
                      value: _position.inSeconds.toDouble(),
                      max: _duration.inSeconds.toDouble(),
                      onChanged: (value) {
                        _audioPlayer.seek(Duration(seconds: value.toInt()));
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Time Display
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatDuration(_position)),
                      Text(_formatDuration(_duration)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // Control Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      IconButton(
                        onPressed: () {
                          _audioPlayer.seek(_position - const Duration(seconds: 10));
                        },
                        icon: const Icon(Icons.replay_10),
                        iconSize: 32,
                      ),
                      IconButton(
                        onPressed: () {
                          if (_isPlaying) {
                            _audioPlayer.pause();
                          } else {
                            _audioPlayer.play();
                          }
                        },
                        icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
                        iconSize: 48,
                      ),
                      IconButton(
                        onPressed: () {
                          _audioPlayer.seek(_position + const Duration(seconds: 10));
                        },
                        icon: const Icon(Icons.forward_10),
                        iconSize: 32,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // Download Progress
                  if (_isDownloading)
                    Column(
                      children: [
                        LinearProgressIndicator(value: _downloadProgress / 100),
                        const SizedBox(height: 8),
                        Text(
                          'Downloading: ${_downloadProgress.toStringAsFixed(1)}%',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                ],
              ),
            ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "${twoDigits(duration.inHours)}:$twoDigitMinutes:$twoDigitSeconds";
  }
}
