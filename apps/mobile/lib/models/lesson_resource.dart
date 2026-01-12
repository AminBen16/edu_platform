// apps/mobile/lib/models/lesson_resource.dart
import 'package:json_annotation/json_annotation.dart';

part 'lesson_resource.g.dart';

@JsonSerializable()
class LessonResource {
  final String id;
  final String title;
  final String type; // Assuming this maps to ResourceType enum string
  final String url;
  final int? size;
  final String lessonId;
  final DateTime createdAt;

  LessonResource({
    required this.id,
    required this.title,
    required this.type,
    required this.url,
    this.size,
    required this.lessonId,
    required this.createdAt,
  });

  factory LessonResource.fromJson(Map<String, dynamic> json) => _$LessonResourceFromJson(json);
  Map<String, dynamic> toJson() => _$LessonResourceToJson(this);
}
