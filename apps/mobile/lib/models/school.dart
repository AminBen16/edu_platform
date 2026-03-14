// apps/mobile/lib/models/school.dart
import 'package:json_annotation/json_annotation.dart';

part 'school.g.dart';

@JsonSerializable()
class School {
  final String id;
  final String name;
  final String? logoUrl;

  School({
    required this.id,
    required this.name,
    this.logoUrl,
  });

  factory School.fromJson(Map<String, dynamic> json) => _$SchoolFromJson(json);
  Map<String, dynamic> toJson() => _$SchoolToJson(this);
}
