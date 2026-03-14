// apps/mobile/lib/models/message.dart
import 'package:json_annotation/json_annotation.dart';
import 'user.dart'; // Import the User model

part 'message.g.dart';

@JsonSerializable()
class Message {
  final String id;
  final String content;
  final String type; // e.g., 'TEXT', 'IMAGE', 'VIDEO'
  final String? fileUrl;
  final String senderId;
  final User? sender; // Include sender details
  final String? classId;
  final bool isRead;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.content,
    required this.type,
    this.fileUrl,
    required this.senderId,
    this.sender,
    this.classId,
    required this.isRead,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);
}
