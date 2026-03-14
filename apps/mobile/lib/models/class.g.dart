// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'class.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Class _$ClassFromJson(Map<String, dynamic> json) => Class(
  id: json['id'] as String,
  name: json['name'] as String,
  code: json['code'] as String?,
  grade: json['grade'] as String?,
  capacity: (json['capacity'] as num?)?.toInt(),
  schoolId: json['schoolId'] as String,
  teacherId: json['teacherId'] as String?,
  teacher: json['teacher'] == null
      ? null
      : TeacherUser.fromJson(json['teacher'] as Map<String, dynamic>),
  lessons: (json['lessons'] as List<dynamic>?)
      ?.map((e) => Lesson.fromJson(e as Map<String, dynamic>))
      .toList(),
  counts: ClassCounts.fromJson(json['_count'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ClassToJson(Class instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'code': instance.code,
  'grade': instance.grade,
  'capacity': instance.capacity,
  'schoolId': instance.schoolId,
  'teacherId': instance.teacherId,
  'teacher': instance.teacher,
  'lessons': instance.lessons,
  '_count': instance.counts,
};

TeacherUser _$TeacherUserFromJson(Map<String, dynamic> json) => TeacherUser(
  id: json['id'] as String,
  user: User.fromJson(json['user'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TeacherUserToJson(TeacherUser instance) =>
    <String, dynamic>{'id': instance.id, 'user': instance.user};

ClassCounts _$ClassCountsFromJson(Map<String, dynamic> json) =>
    ClassCounts(enrollments: (json['enrollments'] as num).toInt());

Map<String, dynamic> _$ClassCountsToJson(ClassCounts instance) =>
    <String, dynamic>{'enrollments': instance.enrollments};
