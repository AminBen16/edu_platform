import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../services/api.dart';

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
  io.Socket? _socket;
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

  final ApiService _apiService = ApiService();

  Future<String?> getToken() async {
    return await _apiService.getToken();
  }

  void _connectToSignalingServer() async {
    try {
      final token = await getToken();
      if (token == null) {
        debugPrint("Authentication token not found. Cannot connect to signaling server.");
        return;
      }

      _socket = io.io('https://api-32v26rbb4-ainamanipro.vercel.app', {
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
        if (data['peers'] is List) {
          _connectToPeers(data['peers']);
        }
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
      if (peerId is String) {
        _createPeerConnection(peerId, true);
      }
    }
  }

  Future<void> _createPeerConnection(String peerId, bool isInitiator) async {
    final configuration = <String, dynamic>{
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ],
    };

    _peerConnection = await createPeerConnection(configuration);

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

    // Add local stream to the peer connection
    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) {
        _peerConnection!.addTrack(track, _localStream!);
      });
    }

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
    await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp['sdp'], sdp['type']));
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
    await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp['sdp'], sdp['type']));
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
      final stream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': true,
      });

      setState(() {
        _localStream = stream;
        _localRenderer.srcObject = stream;
      });

      if (_peerConnection != null) {
        stream.getTracks().forEach((track) {
          _peerConnection!.addTrack(track, stream);
        });
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
      final enabled = !_isAudioEnabled;
      _localStream!.getAudioTracks().forEach((track) {
        track.enabled = enabled;
      });
      setState(() {
        _isAudioEnabled = enabled;
      });
    }
  }

  void _toggleVideo() {
    if (_localStream != null) {
      final enabled = !_isVideoEnabled;
      _localStream!.getVideoTracks().forEach((track) {
        track.enabled = enabled;
      });
      setState(() {
        _isVideoEnabled = enabled;
      });
    }
  }

  void _toggleSpeaker() {
    setState(() {
      _isSpeakerEnabled = !_isSpeakerEnabled;
    });
    for (final renderer in _remoteRenderers.values) {
      // RTCVideoRenderer does not have a volume property, this is a placeholder
      // You might need to handle audio output on the native side
    }
  }

  void _leaveRoom() {
    _socket?.emit('leave-room', {'roomId': widget.roomId, 'userId': widget.userId});
    _cleanup();
    Navigator.of(context).pop();
  }

  void _cleanup() {
    _localStream?.getTracks().forEach((track) => track.stop());
    _localStream?.dispose();
    _localRenderer.dispose();
    for (final renderer in _remoteRenderers.values) {
      renderer.dispose();
    }
    _remoteRenderers.clear();
    _peerConnection?.close();
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
            icon: const Icon(Icons.call_end),
            onPressed: _leaveRoom,
            tooltip: 'Leave Room',
          ),
        ],
      ),
      body: Column(
        children: [
          // Local video
          Container(
            margin: const EdgeInsets.all(8),
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(8),
            ),
            child: _localRenderer.srcObject != null
                ? RTCVideoView(_localRenderer, mirror: true)
                : const Center(child: CircularProgressIndicator()),
          ),
          // Remote videos
          Expanded(
            child: _remoteRenderers.isEmpty
                ? Center(
                    child: Text(
                      "Waiting for others to join...",
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  )
                : GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 4 / 3,
                    ),
                    itemCount: _remoteRenderers.length,
                    itemBuilder: (context, index) {
                      final entry = _remoteRenderers.entries.elementAt(index);
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        child: RTCVideoView(entry.value),
                      );
                    },
                  ),
          ),
          // Control buttons (optional, as they are in the AppBar)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Wrap(
              spacing: 16,
              alignment: WrapAlignment.center,
              children: [
                FloatingActionButton(
                  heroTag: 'toggle_audio',
                  onPressed: _toggleAudio,
                  child: Icon(_isAudioEnabled ? Icons.mic : Icons.mic_off),
                ),
                FloatingActionButton(
                  heroTag: 'toggle_video',
                  onPressed: _toggleVideo,
                  child: Icon(_isVideoEnabled ? Icons.videocam : Icons.videocam_off),
                ),
                FloatingActionButton(
                  backgroundColor: Colors.red,
                  heroTag: 'leave_room',
                  onPressed: _leaveRoom,
                  child: const Icon(Icons.call_end),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
