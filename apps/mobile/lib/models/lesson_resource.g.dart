// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson_resource.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LessonResource _$LessonResourceFromJson(Map<String, dynamic> json) =>
    LessonResource(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      url: json['url'] as String,
      size: (json['size'] as num?)?.toInt(),
      lessonId: json['lessonId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$LessonResourceToJson(LessonResource instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'type': instance.type,
      'url': instance.url,
      'size': instance.size,
      'lessonId': instance.lessonId,
      'createdAt': instance.createdAt.toIso8601String(),
    };
