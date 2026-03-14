// apps/mobile/lib/models/class.dart
import 'package:json_annotation/json_annotation.dart';
import 'user.dart'; // For teacher user details
import 'lesson.dart'; // To include lessons in class details

part 'class.g.dart';

@JsonSerializable()
class Class {
  final String id;
  final String name;
  final String? code;
  final String? grade;
  final int? capacity;
  final String schoolId;
  final String? teacherId; // Teacher profile ID
  final TeacherUser? teacher; // Nested teacher user details
  final List<Lesson>? lessons; // Lessons associated with this class
  
  @JsonKey(name: '_count')
  final ClassCounts counts; // For enrollments count

  Class({
    required this.id,
    required this.name,
    this.code,
    this.grade,
    this.capacity,
    required this.schoolId,
    this.teacherId,
    this.teacher,
    this.lessons,
    required this.counts,
  });

  factory Class.fromJson(Map<String, dynamic> json) => _$ClassFromJson(json);
  Map<String, dynamic> toJson() => _$ClassToJson(this);
}

@JsonSerializable()
class TeacherUser {
  final String id; // Teacher profile ID
  final User user;

  TeacherUser({required this.id, required this.user});

  factory TeacherUser.fromJson(Map<String, dynamic> json) => _$TeacherUserFromJson(json);
  Map<String, dynamic> toJson() => _$TeacherUserToJson(this);
}


@JsonSerializable()
class ClassCounts {
  final int enrollments;

  ClassCounts({required this.enrollments});

  factory ClassCounts.fromJson(Map<String, dynamic> json) => _$ClassCountsFromJson(json);
  Map<String, dynamic> toJson() => _$ClassCountsToJson(this);
}
