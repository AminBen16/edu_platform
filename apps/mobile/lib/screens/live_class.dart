import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../services/api.dart';

// Helper function for WebRTC peer connection
Future<RTCPeerConnection> createWebRTCPeerConnection(Map<String, dynamic> configuration) {
  return createPeerConnection(configuration);
}

class LiveClassScreen extends StatefulWidget {
  final String? roomId;
  final String? userId;

  const LiveClassScreen({super.key, this.roomId, this.userId});

  @override
  State<LiveClassScreen> createState() => _LiveClassScreenState();
}

class _LiveClassScreenState extends State<LiveClassScreen> {
  RTCPeerConnection? _peerConnection;
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final Map<String, RTCVideoRenderer> _remoteRenderers = {};
  IO.Socket? _socket;
  MediaStream? _localStream;
  bool _isAudioEnabled = true;
  bool _isVideoEnabled = true;
  bool _isSpeakerEnabled = true;

  @override
  void initState() {
    super.initState();
    _initializeRenderers();
    _getUserMedia();
    _connectToSignalingServer();
  }

  void _initializeRenderers() async {
    await _localRenderer.initialize();
  }

  void _connectToSignalingServer() async {
    try {
      final token = await getToken();
      if (token == null) return;

      _socket = IO.io('https://api-32v26rbb4-ainamanipro.vercel.app', {
        'auth': {'token': token},
        'transports': ['websocket'],
        'autoConnect': true,
      });

      _socket!.connect();

      _socket!.on('connect', (_) {
        debugPrint('Connected to signaling server');
        _joinRoom();
      });

      _socket!.on('peers-in-room', (data) {
        debugPrint('Peers in room: $data');
        _connectToPeers(data['peers']);
      });

      _socket!.on('user-joined', (data) {
        debugPrint('User joined: ${data['userId']}');
        _createPeerConnection(data['userId'], true);
      });

      _socket!.on('user-left', (data) {
        debugPrint('User left: ${data['userId']}');
        _closePeerConnection(data['userId']);
      });

      _socket!.on('signal', (data) async {
        await _handleSignal(data);
      });
    } catch (e) {
      debugPrint('Error connecting to signaling server: $e');
    }
  }

  void _joinRoom() {
    final roomId = widget.roomId ?? 'default-room';
    final userId =
        widget.userId ?? 'user-${DateTime.now().millisecondsSinceEpoch}';

    _socket!.emit('join-room', {'roomId': roomId, 'userId': userId});
  }

  void _connectToPeers(List<dynamic> peers) {
    for (final peerId in peers) {
      _createPeerConnection(peerId, true);
    }
  }

  Future<void> _createPeerConnection(String peerId, bool isInitiator) async {
    final configuration = <String, dynamic>{
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ],
    };

    _peerConnection = await createWebRTCPeerConnection(configuration);

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      if (candidate.candidate != null) {
        _socket!.emit('signal', {
          'targetUserId': peerId,
          'signal': {'type': 'candidate', 'candidate': candidate.toMap()},
          'userId':
              widget.userId ?? 'user-${DateTime.now().millisecondsSinceEpoch}',
        });
      }
    };

    _peerConnection!.onAddStream = (MediaStream stream) {
      final renderer = RTCVideoRenderer();
      renderer.initialize().then((_) {
        setState(() {
          _remoteRenderers[peerId] = renderer;
          renderer.srcObject = stream;
        });
      });
    };

    if (isInitiator) {
      await _createOffer(peerId);
    }
  }

  Future<void> _createOffer(String peerId) async {
    final offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);

    _socket!.emit('signal', {
      'targetUserId': peerId,
      'signal': {'type': 'offer', 'sdp': offer.toMap()},
      'userId':
          widget.userId ?? 'user-${DateTime.now().millisecondsSinceEpoch}',
    });
  }

  Future<void> _handleSignal(dynamic data) async {
    final signal = data['signal'];
    final fromUserId = data['fromUserId'] ?? data['userId'];

    switch (signal['type']) {
      case 'offer':
        await _handleOffer(signal['sdp'], fromUserId);
        break;
      case 'answer':
        await _handleAnswer(signal['sdp'], fromUserId);
        break;
      case 'candidate':
        await _handleCandidate(signal['candidate'], fromUserId);
        break;
    }
  }

  Future<void> _handleOffer(Map<String, dynamic> sdp, String fromUserId) async {
    await _createPeerConnection(fromUserId, false);
    await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp));
    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);

    _socket!.emit('signal', {
      'targetUserId': fromUserId,
      'signal': {'type': 'answer', 'sdp': answer.toMap()},
      'userId':
          widget.userId ?? 'user-${DateTime.now().millisecondsSinceEpoch}',
    });
  }

  Future<void> _handleAnswer(
    Map<String, dynamic> sdp,
    String fromUserId,
  ) async {
    await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp));
  }

  Future<void> _handleCandidate(
    Map<String, dynamic> candidate,
    String fromUserId,
  ) async {
    await _peerConnection!.addCandidate(
      RTCIceCandidate(
        candidate['candidate'],
        candidate['sdpMid'],
        candidate['sdpMLineIndex'],
      ),
    );
  }

  Future<void> _getUserMedia() async {
    try {
      final stream = await html.navigator.mediaDevices?.getUserMedia({
        'audio': true,
        'video': true,
      });

      if (stream != null) {
        setState(() {
          _localStream = stream;
          _localRenderer.srcObject = stream;
        });

        if (_peerConnection != null) {
          stream.getTracks().forEach((track) {
            _peerConnection!.addTrack(track, stream!);
          });
        }
      }
    } catch (e) {
      debugPrint('Error getting user media: $e');
    }
  }

  void _closePeerConnection(String peerId) {
    setState(() {
      _remoteRenderers[peerId]?.dispose();
      _remoteRenderers.remove(peerId);
    });
  }

  void _toggleAudio() {
    if (_localStream != null) {
      _localStream!.getAudioTracks().forEach((track) {
        track.enabled = !_isAudioEnabled;
      });
      setState(() {
        _isAudioEnabled = !_isAudioEnabled;
      });
    }
  }

  void _toggleVideo() {
    if (_localStream != null) {
      _localStream!.getVideoTracks().forEach((track) {
        track.enabled = !_isVideoEnabled;
      });
      setState(() {
        _isVideoEnabled = !_isVideoEnabled;
      });
    }
  }

  void _toggleSpeaker() {
    setState(() {
      _isSpeakerEnabled = !_isSpeakerEnabled;
    });
    for (final renderer in _remoteRenderers.values) {
      renderer.audioVolume = _isSpeakerEnabled ? 1.0 : 0.0;
    }
  }

  void _leaveRoom() {
    _socket?.emit('leave-room');
    _cleanup();
  }

  void _cleanup() {
    _localStream?.dispose();
    _localRenderer.dispose();
    for (final renderer in _remoteRenderers.values) {
      renderer.dispose();
    }
    _remoteRenderers.clear();
    _peerConnection?.dispose();
    _socket?.disconnect();
  }

  @override
  void dispose() {
    _cleanup();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Class'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(_isAudioEnabled ? Icons.mic : Icons.mic_off),
            onPressed: _toggleAudio,
          ),
          IconButton(
            icon: Icon(_isVideoEnabled ? Icons.videocam : Icons.videocam_off),
            onPressed: _toggleVideo,
          ),
          IconButton(
            icon: Icon(_isSpeakerEnabled ? Icons.volume_up : Icons.volume_off),
            onPressed: _toggleSpeaker,
          ),
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: _leaveRoom,
          ),
        ],
      ),
      body: Column(
        children: [
          // Local video
          Container(
            margin: const EdgeInsets.all(8),
            height: 150,
            child: RTCVideoView(_localRenderer),
          ),
          // Remote videos
          Expanded(
            child: _remoteRenderers.isEmpty
                ? Center(
                    child: Text(
                      "Remote participants will appear here",
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  )
                : ListView(
                    scrollDirection: Axis.horizontal,
                    children: _remoteRenderers.entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                        child: Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: SizedBox(
                            width: 160,
                            height: 120,
                            child: RTCVideoView(entry.value),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
          ),
          // Control buttons
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _getUserMedia,
                  child: const Text('Start Camera'),
                ),
                ElevatedButton(
                  onPressed: _leaveRoom,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Leave Room'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
