import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../services/api_service.dart';

class LiveClassScreen extends StatefulWidget {
  final String classId;
  final String className;

  const LiveClassScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  State<LiveClassScreen> createState() => _LiveClassScreenState();
}

class _LiveClassScreenState extends State<LiveClassScreen> {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  io.Socket? _socket;
  bool _isAudioEnabled = true;
  bool _isVideoEnabled = true;
  bool _isScreenSharing = false;
  List<RTCVideoRenderer> _remoteRenderers = [];
  bool _isConnected = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebRTC();
    _connectToSignalingServer();
  }

  @override
  void dispose() {
    _localStream?.dispose();
    _remoteStream?.dispose();
    _peerConnection?.close();
    _socket?.disconnect();
    for (final renderer in _remoteRenderers) {
      renderer.dispose();
    }
    super.dispose();
  }

  Future<void> _initializeWebRTC() async {
    try {
      // Create peer connection
      _peerConnection = await createWebRTCPeerConnection({
        'iceServers': [
          {'urls': 'stun:stun.l.google.com:19302'},
        ],
      });

      // Get local media
      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': _isAudioEnabled,
        'video': _isVideoEnabled,
      });

      setState(() {
        _isLoading = false;
      });

      // Add local stream to peer connection
      _localStream?.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });

      // Handle remote stream
      _peerConnection?.onTrack = (RTCTrackEvent event) {
        if (event.track.kind == 'video') {
          setState(() {
            _remoteStream = event.stream as MediaStream;
          });
        }
      };

      // Handle ICE candidates
      _peerConnection?.onIceCandidate = (RTCIceCandidateEvent event) {
        if (event.candidate != null) {
          _socket?.emit('ice-candidate', {
            'candidate': event.candidate?.toMap(),
            'roomId': classId,
          });
        }
      };

    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error accessing camera/microphone: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _connectToSignalingServer() {
    try {
      _socket = io.io('http://localhost:3000', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
      });

      _socket?.onConnect((_) {
        setState(() {
          _isConnected = true;
        });
        
        // Join room
        _socket?.emit('join-room', {
          'roomId': classId,
          'userId': 'current-user-id',
        });
      });

      _socket?.on('user-joined', (data) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${data['userName']} joined the class'),
            backgroundColor: Colors.green,
          ),
        );
      });

      _socket?.on('webrtc-offer', (data) async {
        await _handleOffer(data['offer']);
      });

      _socket?.on('webrtc-answer', (data) async {
        await _handleAnswer(data['answer']);
      });

      _socket?.on('ice-candidate', (data) async {
        await _handleIceCandidate(data['candidate']);
      });

      _socket?.on('user-left', (data) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${data['userName']} left the class'),
            backgroundColor: Colors.orange,
          ),
        );
      });

      _socket?.onDisconnect((_) {
        setState(() {
          _isConnected = false;
        });
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error connecting to server: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleOffer(Map<String, dynamic> offer) async {
    try {
      await _peerConnection?.setRemoteDescription(
        RTCSessionDescription(offer['sdp'], offer['type']),
      );

      final answer = await _peerConnection?.createAnswer();
      await _peerConnection?.setLocalDescription(answer);

      _socket?.emit('webrtc-answer', {
        'answer': answer.toMap(),
        'roomId': classId,
      });
    } catch (e) {
      print('Error handling offer: $e');
    }
  }

  Future<void> _handleAnswer(Map<String, dynamic> answer) async {
    try {
      await _peerConnection?.setRemoteDescription(
        RTCSessionDescription(answer['sdp'], answer['type']),
      );
    } catch (e) {
      print('Error handling answer: $e');
    }
  }

  Future<void> _handleIceCandidate(Map<String, dynamic> candidate) async {
    try {
      await _peerConnection?.addCandidate(RTCIceCandidate(
        candidate['candidate'],
        candidate['sdpMid'],
        candidate['sdpMLineIndex'],
      ));
    } catch (e) {
      print('Error handling ICE candidate: $e');
    }
  }

  Future<void> _toggleAudio() async {
    try {
      setState(() {
        _isAudioEnabled = !_isAudioEnabled;
      });

      final tracks = _localStream?.getAudioTracks();
      for (final track in tracks) {
        track.enabled = _isAudioEnabled;
      }
    } catch (e) {
      print('Error toggling audio: $e');
    }
  }

  Future<void> _toggleVideo() async {
    try {
      setState(() {
        _isVideoEnabled = !_isVideoEnabled;
      });

      final tracks = _localStream?.getVideoTracks();
      for (final track in tracks) {
        track.enabled = _isVideoEnabled;
      }
    } catch (e) {
      print('Error toggling video: $e');
    }
  }

  Future<void> _toggleScreenShare() async {
    try {
      if (_isScreenSharing) {
        // Stop screen sharing
        final screenStream = await navigator.mediaDevices.getDisplayMedia({
          'video': true,
          'audio': false,
        });

        final tracks = screenStream.getVideoTracks();
        for (final track in tracks) {
          track.stop();
        }

        setState(() {
          _isScreenSharing = false;
        });
      } else {
        // Start screen sharing
        final screenStream = await navigator.mediaDevices.getDisplayMedia({
          'video': {
            'cursor': 'always',
          },
          'audio': false,
        });

        final videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack != null) {
          await _peerConnection?.addTrack(videoTrack, screenStream);
        }

        setState(() {
          _isScreenSharing = true;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error sharing screen: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showConnectionStatus() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Connection Status'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    _isConnected ? Icons.wifi : Icons.wifi_off,
                    color: _isConnected ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isConnected ? 'Connected' : 'Disconnected',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: _isConnected ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Server: ${_socket?.connected ?? false ? "Connected" : "Disconnected"}',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                'WebRTC: ${_peerConnection?.connectionState ?? "Not initialized"}',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                'Local Stream: ${_localStream != null ? "Active" : "Not started"}',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                'Remote Users: ${_remoteRenderers.length}',
                style: const TextStyle(fontSize: 14),
              ),
              if (!_isConnected) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Troubleshooting:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text('• Check your internet connection'),
                      Text('• Ensure the server is running'),
                      Text('• Try refreshing the page'),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Close'),
            ),
            if (!_isConnected)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _connectToSignalingServer();
                },
                child: const Text('Reconnect'),
              ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(className),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(
              _isConnected ? Icons.wifi : Icons.wifi_off,
              color: _isConnected ? Colors.green : Colors.red,
            ),
            onPressed: _showConnectionStatus,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Local video
                Container(
                  height: 200,
                  width: double.infinity,
                  color: Colors.black,
                  child: _localStream != null
                      ? RTCVideoView(_localStream!)
                      : const Center(
                          child: Text(
                            'Camera Off',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                ),
                
                // Remote videos
                if (_remoteRenderers.isNotEmpty)
                  Container(
                    height: 200,
                    width: double.infinity,
                    color: Colors.grey[900],
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _remoteRenderers.length,
                      itemBuilder: (context, index) {
                        return Container(
                          width: 150,
                          margin: const EdgeInsets.all(4),
                          child: RTCVideoView(_remoteRenderers[index]),
                        );
                      },
                    ),
                  ),
                
                // Controls
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton.icon(
                            onPressed: _toggleAudio,
                            icon: Icon(
                              _isAudioEnabled ? Icons.mic : Icons.mic_off,
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isAudioEnabled ? Colors.green : Colors.red,
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _toggleVideo,
                            icon: Icon(
                              _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isVideoEnabled ? Colors.green : Colors.red,
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _toggleScreenShare,
                            icon: Icon(
                              _isScreenSharing ? Icons.stop_screen_share : Icons.screen_share,
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isScreenSharing ? Colors.orange : Colors.blue,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      

                      // Chat area
                      Container(
                        height: 200,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Column(
                          children: [
                            Padding(
                              padding: EdgeInsets.all(8),
                              child: Text(
                                'Class Chat',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                            Expanded(
                              child: ListView(
                                children: [
                                  ChatMessage(
                                    sender: 'Teacher',
                                    message: 'Welcome to the live class!',
                                    isOwn: false,
                                  ),
                                  ChatMessage(
                                    sender: 'You',
                                    message: 'Hello everyone!',
                                    isOwn: true,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class ChatMessage extends StatelessWidget {
  final String sender;
  final String message;
  final bool isOwn;

  const ChatMessage({
    super.key,
    required this.sender,
    required this.message,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      child: Row(
        mainAxisAlignment: isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isOwn) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Theme.of(context).primaryColor,
              child: Text(
                sender[0].toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isOwn ? Theme.of(context).primaryColor : Colors.grey[200],
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                message,
                style: TextStyle(
                  color: isOwn ? Colors.white : Colors.black87,
                ),
              ),
            ),
          ),
          if (isOwn) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey[400],
              child: const Icon(
                Icons.person,
                size: 16,
                color: Colors.white,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
