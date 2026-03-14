// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Message _$MessageFromJson(Map<String, dynamic> json) => Message(
  id: json['id'] as String,
  content: json['content'] as String,
  type: json['type'] as String,
  fileUrl: json['fileUrl'] as String?,
  senderId: json['senderId'] as String,
  sender: json['sender'] == null
      ? null
      : User.fromJson(json['sender'] as Map<String, dynamic>),
  classId: json['classId'] as String?,
  isRead: json['isRead'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$MessageToJson(Message instance) => <String, dynamic>{
  'id': instance.id,
  'content': instance.content,
  'type': instance.type,
  'fileUrl': instance.fileUrl,
  'senderId': instance.senderId,
  'sender': instance.sender,
  'classId': instance.classId,
  'isRead': instance.isRead,
  'createdAt': instance.createdAt.toIso8601String(),
};
