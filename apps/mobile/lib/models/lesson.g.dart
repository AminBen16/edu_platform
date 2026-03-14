// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Lesson _$LessonFromJson(Map<String, dynamic> json) => Lesson(
  id: json['id'] as String,
  title: json['title'] as String,
  description: json['description'] as String?,
  content: json['content'] as String?,
  type: json['type'] as String,
  videoUrl: json['videoUrl'] as String?,
  documentUrl: json['documentUrl'] as String?,
  duration: (json['duration'] as num?)?.toInt(),
  order: (json['order'] as num?)?.toInt(),
  isPublished: json['isPublished'] as bool,
  subject: json['subject'] as String?,
  className: json['className'] as String?,
  difficulty: json['difficulty'] as String?,
  tags:
      (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  schoolId: json['schoolId'] as String,
  subjectId: json['subjectId'] as String?,
  teacherId: json['teacherId'] as String?,
  classId: json['classId'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  resources: (json['resources'] as List<dynamic>?)
      ?.map((e) => LessonResource.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$LessonToJson(Lesson instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'description': instance.description,
  'content': instance.content,
  'type': instance.type,
  'videoUrl': instance.videoUrl,
  'documentUrl': instance.documentUrl,
  'duration': instance.duration,
  'order': instance.order,
  'isPublished': instance.isPublished,
  'subject': instance.subject,
  'className': instance.className,
  'difficulty': instance.difficulty,
  'tags': instance.tags,
  'schoolId': instance.schoolId,
  'subjectId': instance.subjectId,
  'teacherId': instance.teacherId,
  'classId': instance.classId,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'resources': instance.resources,
};
