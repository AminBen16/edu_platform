"use strict";
// apps/api/src/lib/database.ts
// Database types and utilities for API
// Note: This file should ONLY contain types and enums, not database connections
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogAction = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["ADMIN"] = "ADMIN";
    Role["TEACHER"] = "TEACHER";
    Role["STUDENT"] = "STUDENT";
    Role["PARENT"] = "PARENT";
    Role["SCHOOL_ADMIN"] = "SCHOOL_ADMIN";
})(Role || (exports.Role = Role = {}));
var AuditLogAction;
(function (AuditLogAction) {
    AuditLogAction["USER_LOGIN"] = "USER_LOGIN";
    AuditLogAction["LESSON_VIEWED"] = "LESSON_VIEWED";
    AuditLogAction["QUIZ_ATTEMPTED"] = "QUIZ_ATTEMPTED";
})(AuditLogAction || (exports.AuditLogAction = AuditLogAction = {}));
