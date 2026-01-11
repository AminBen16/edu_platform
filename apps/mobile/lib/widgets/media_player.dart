import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';

class MediaPlayerWidget extends StatefulWidget {
  final String url;
  final String title;
  final String type; // 'video' or 'audio'
  final VoidCallback? onClose;

  const MediaPlayerWidget({
    Key? key,
    required this.url,
    required this.title,
    required this.type,
    this.onClose,
  }) : super(key: key);

  @override
  State<MediaPlayerWidget> createState() => _MediaPlayerWidgetState();
}

class _MediaPlayerWidgetState extends State<MediaPlayerWidget> {
  VideoPlayerController? _videoController;
  AudioPlayer? _audioPlayer;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  double _volume = 1.0;
  bool _isFullscreen = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _audioPlayer?.dispose();
    super.dispose();
  }

  Future<void> _initializePlayer() async {
    try {
      if (widget.type == 'video') {
        _videoController = VideoPlayerController.network(widget.url);
        await _videoController!.initialize();
        _videoController!.addListener(_videoListener);
        setState(() {});
      } else if (widget.type == 'audio') {
        _audioPlayer = AudioPlayer();
        await _audioPlayer!.setSource(UrlSource(Uri.parse(widget.url)));
        _audioPlayer!.addListener(_audioListener);
        setState(() {});
      }
    } catch (e) {
      print('Error initializing player: $e');
    }
  }

  void _videoListener() {
    if (_videoController != null) {
      setState(() {
        _isPlaying = _videoController!.value.isPlaying;
        _duration = _videoController!.value.duration;
        _position = _videoController!.value.position;
      });
    }
  }

  void _audioListener() {
    if (_audioPlayer != null) {
      setState(() {
        _isPlaying = _audioPlayer!.state == PlayerState.playing;
        _duration = _audioPlayer!.duration ?? Duration.zero;
        _position = _audioPlayer!.position;
      });
    }
  }

  Future<void> _togglePlayPause() async {
    try {
      if (widget.type == 'video') {
        if (_isPlaying) {
          await _videoController!.pause();
        } else {
          await _videoController!.play();
        }
      } else if (widget.type == 'audio') {
        if (_isPlaying) {
          await _audioPlayer!.pause();
        } else {
          await _audioPlayer!.play();
        }
      }
    } catch (e) {
      print('Error toggling play/pause: $e');
    }
  }

  Future<void> _seek(Duration position) async {
    try {
      if (widget.type == 'video') {
        await _videoController!.seekTo(position);
      } else if (widget.type == 'audio') {
        await _audioPlayer!.seek(position);
      }
    } catch (e) {
      print('Error seeking: $e');
    }
  }

  Future<void> _setVolume(double volume) async {
    try {
      if (widget.type == 'video') {
        await _videoController!.setVolume(volume);
      } else if (widget.type == 'audio') {
        await _audioPlayer!.setVolume(volume);
      }
      setState(() => _volume = volume);
    } catch (e) {
      print('Error setting volume: $e');
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return "$hours:$minutes:$seconds";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
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
            icon: Icon(
              _isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen,
              color: Colors.white,
            ),
            onPressed: () {
              setState(() => _isFullscreen = !_isFullscreen);
            },
          ),
        ],
      ),
      body: Center(
        child: widget.type == 'video'
            ? _buildVideoPlayer()
            : _buildAudioPlayer(),
      ),
      bottomNavigationBar: _buildControls(),
    );
  }

  Widget _buildVideoPlayer() {
    if (_videoController == null || !_videoController!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return AspectRatio(
      aspectRatio: _videoController!.value.aspectRatio,
      child: VideoPlayer(_videoController!),
    );
  }

  Widget _buildAudioPlayer() {
    return Container(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Album art placeholder
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[600]!),
            ),
            child: const Icon(
              Icons.music_note,
              size: 80,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 32),
          // Track info
          Text(
            widget.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildControls() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.grey[900],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Progress bar
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
              thumbColor: Colors.white,
              activeTrackColor: Colors.blue,
              inactiveTrackColor: Colors.grey[700],
            ),
            child: Slider(
              min: 0.0,
              max: _duration.inSeconds.toDouble(),
              value: _position.inSeconds.toDouble(),
              onChanged: (value) {
                _seek(Duration(seconds: value.toInt()));
              },
            ),
          ),
          const SizedBox(height: 8),
          // Time display
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDuration(_position),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
              Text(
                _formatDuration(_duration),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Control buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Skip backward
              IconButton(
                icon: const Icon(Icons.replay_10, color: Colors.white),
                onPressed: () {
                  _seek(Duration(seconds: (_position.inSeconds - 10).clamp(0, _duration.inSeconds)));
                },
              ),
              // Play/Pause
              Container(
                decoration: BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: Icon(
                    _isPlaying ? Icons.pause : Icons.play_arrow,
                    color: Colors.white,
                    size: 32,
                  ),
                  onPressed: _togglePlayPause,
                ),
              ),
              // Skip forward
              IconButton(
                icon: const Icon(Icons.forward_30, color: Colors.white),
                onPressed: () {
                  _seek(Duration(seconds: (_position.inSeconds + 30).clamp(0, _duration.inSeconds)));
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Volume control
          Row(
            children: [
              const Icon(Icons.volume_down, color: Colors.white),
              Expanded(
                child: Slider(
                  min: 0.0,
                  max: 1.0,
                  value: _volume,
                  onChanged: _setVolume,
                  activeColor: Colors.blue,
                  inactiveColor: Colors.grey[700],
                ),
              ),
              const Icon(Icons.volume_up, color: Colors.white),
            ],
          ),
        ],
      ),
    );
  }
}
