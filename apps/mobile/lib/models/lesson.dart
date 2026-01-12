// apps/mobile/lib/models/lesson.dart
import 'package:json_annotation/json_annotation.dart';
import 'lesson_resource.dart';

part 'lesson.g.dart';

@JsonSerializable()
class Lesson {
  final String id;
  final String title;
  final String? description;
  final String? content;
  final String type; // Assuming this maps to LessonType enum string
  final String? videoUrl;
  final String? documentUrl;
  final int? duration;
  final int? order;
  final bool isPublished;
  final String? subject;
  final String? className; // 'class' is a reserved keyword in Dart
  final String? difficulty;
  final List<String> tags;
  final String schoolId;
  final String? subjectId;
  final String? teacherId;
  final String? classId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<LessonResource>? resources; // Include resources

  Lesson({
    required this.id,
    required this.title,
    this.description,
    this.content,
    required this.type,
    this.videoUrl,
    this.documentUrl,
    this.duration,
    this.order,
    required this.isPublished,
    this.subject,
    this.className,
    this.difficulty,
    this.tags = const [],
    required this.schoolId,
    this.subjectId,
    this.teacherId,
    this.classId,
    required this.createdAt,
    required this.updatedAt,
    this.resources,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => _$LessonFromJson(json);
  Map<String, dynamic> toJson() => _$LessonToJson(this);
}
