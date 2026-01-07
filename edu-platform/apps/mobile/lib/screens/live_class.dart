import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

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
      appBar: AppBar(
        title: Text("Live Class",
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Container(
                height: 220,
                padding: const EdgeInsets.all(8.0),
                child: RTCVideoView(localRenderer),
              ),
            ),
            const SizedBox(height: 16),
            // Render remote videos in a horizontal list
            Expanded(
              child: remoteRenderers.isEmpty
                  ? Center(
                      child: Text(
                        "Remote participants will appear here",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    )
                  : ListView(
                      scrollDirection: Axis.horizontal,
                      children: remoteRenderers.entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0),
                          child: Card(
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
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
          ],
        ),
      ),
    );
  }
}
