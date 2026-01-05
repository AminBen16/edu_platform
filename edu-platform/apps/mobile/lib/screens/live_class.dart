import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../services/api.dart';

class LiveClassScreen extends StatefulWidget {
  final String roomId;
  LiveClassScreen(this.roomId);

  @override
  State<LiveClassScreen> createState() => _LiveClassState();
}

class _LiveClassState extends State<LiveClassScreen> {
  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final Map<String, RTCVideoRenderer> remoteRenderers = {};

  @override
  void initState() {
    super.initState();
    initRenderers();
    joinRoom();
  }

  initRenderers() async {
    await localRenderer.initialize();
  }

  joinRoom() async {
    // Call Vercel signaling server to join room
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Live Class")),
      body: Column(
        children: [
          Expanded(child: RTCVideoView(localRenderer)),
          // Remote videos placeholder
        ],
      ),
    );
  }
}
