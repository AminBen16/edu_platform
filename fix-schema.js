const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'packages', 'db', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Identify all field renames per model
const modelBlocks = content.split('model ');
const fieldRenames = {};

modelBlocks.forEach(block => {
    const lines = block.split('\n');
    const modelNameMatch = lines[0].match(/^([A-Za-z0-9_]+)\s+{/);
    if (!modelNameMatch) return;
    const modelName = modelNameMatch[1];
    fieldRenames[modelName] = {};
    
    lines.forEach(line => {
        const fieldMatch = line.match(/^(\s+)([a-z0-9_]+)\s+([A-Za-z0-9\[\]?]+)(\s+.*|)$/);
        if (fieldMatch) {
            const [full, indent, oldName, type, rest] = fieldMatch;
            if (oldName.includes('_') && !rest.includes('@map') && !oldName.startsWith('@@')) {
                const newName = oldName.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
                fieldRenames[modelName][oldName] = newName;
            }
        }
    });
});

const arrayPlurals = {
    'user': 'users',
    'teacher': 'teachers',
    'student': 'students',
    'lesson': 'lessons',
    'quiz': 'quizzes',
    'subject': 'subjects',
    'class': 'classes',
    'enrollment': 'enrollments',
    'assignment': 'assignments',
    'submission': 'submissions',
    'message': 'messages',
    'notification': 'notifications',
    'ticket': 'tickets',
    'announcement': 'announcements',
    'attendance': 'attendances',
    'topic': 'topics',
    'resource': 'resources',
    'lessonResource': 'resources',
    'competency': 'competencies',
    'learningOutcome': 'learningOutcomes',
    'assessment': 'assessments',
    'assessmentResult': 'results',
    'reportCard': 'reportCards',
    'lessonCompetency': 'lessonCompetencies',
    'liveSessionParticipant': 'participants',
    'question': 'questions',
    'option': 'options',
    'quizAttempt': 'quizAttempts',
    'answer': 'answers',
    'auditLog': 'auditLogs',
    'rateLimit': 'rateLimits',
    'curriculum': 'curriculums',
    'term': 'terms'
};

const singularMappings = {
    'user': 'user',
    'teacher': 'teacher',
    'student': 'student',
    'school': 'school',
    'class': 'class',
    'lesson': 'lesson',
    'quiz': 'quiz',
    'subject': 'subject',
    'term': 'term',
    'assessment': 'assessment',
    'reportCard': 'reportCard',
    'curriculum': 'curriculum'
};

const modelSpecificMappings = {
    'User': {
        'student': 'studentProfile',
        'teacher': 'teacherProfile'
    },
    'Announcement': {
        'user': 'author'
    },
    'Invitation': {
        'user': 'creator'
    },
    'AssessmentResult': {
        'user': 'grader'
    },
    'CompetencyProgress': {
        'user': 'evaluator'
    },
    'Message': {
        'user': 'sender'
    },
    'ReportCard': {
        'reportCardSubject': 'subjects'
    },
    'CurriculumLevel': {
        'curriculum': 'curriculum',
        'levelSubject': 'subjects'
    },
    'Ticket': {
        'user_Ticket_user_idToUser': 'user',
        'user_Ticket_assigned_to_idToUser': 'assignedTo'
    }
};

let currentModel = '';
const newContent = content.split('\n').map(line => {
    const modelMatch = line.match(/^model\s+([A-Za-z0-9_]+)\s+{/);
    if (modelMatch) {
        currentModel = modelMatch[1];
    }

    // 1. Match ID field: "  id String @id"
    const idMatch = line.match(/^(\s+)id\s+String\s+@id(\s+.*|)$/);
    if (idMatch) {
        const [full, indent, rest] = idMatch;
        if (!rest.includes('@default')) {
            return `${indent}id${' '.repeat(23)}String @id @default(cuid())${rest}`;
        }
    }

    // 2. Match updatedAt field: "  updatedAt DateTime"
    if (line.includes('updatedAt') && line.includes('DateTime') && !line.includes('@updatedAt')) {
        return line.replace('DateTime', 'DateTime @updatedAt');
    }

    // 3. Match relation field (Singular): "  Model Model @relation(...)" OR "  Model Model?"
    const relMatch = line.match(/^(\s+)([A-Za-z0-9_]*)\s+([A-Z][A-Za-z0-9_]*)(\??)(\s+.*)$/);
    if (relMatch) {
        const [full, indent, oldProp, type, opt, rest] = relMatch;
        const builtInTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal'];
        if (!builtInTypes.includes(type)) {
            let newProp = oldProp;
            if (oldProp.length > 0 && oldProp[0] === oldProp[0].toUpperCase()) {
                newProp = oldProp[0].toLowerCase() + oldProp.substring(1);
            }
            if (modelSpecificMappings[currentModel] && modelSpecificMappings[currentModel][oldProp]) {
                newProp = modelSpecificMappings[currentModel][oldProp];
            } else if (modelSpecificMappings[currentModel] && modelSpecificMappings[currentModel][newProp]) {
                newProp = modelSpecificMappings[currentModel][newProp];
            } else if (singularMappings[newProp]) {
                newProp = singularMappings[newProp];
            }
            const spacing = ' '.repeat(Math.max(1, 25 - indent.length - newProp.length));
            line = `${indent}${newProp}${spacing}${type}${opt}${rest}`;
        }
    }

    // 4. Match array relation: "  Model Model[]"
    const arrayRelMatch = line.match(/^(\s+)([A-Z][A-Za-z0-9_]*)\s+([A-Z][A-Za-z0-9_]*)\[\](\s+.*|)$/);
    if (arrayRelMatch) {
        const [full, indent, oldProp, type, rest] = arrayRelMatch;
        let newProp = oldProp;
        if (oldProp.length > 0 && oldProp[0] === oldProp[0].toUpperCase()) {
            newProp = oldProp[0].toLowerCase() + oldProp.substring(1);
        }
        if (modelSpecificMappings[currentModel] && modelSpecificMappings[currentModel][oldProp]) {
            newProp = modelSpecificMappings[currentModel][oldProp];
        } else if (modelSpecificMappings[currentModel] && modelSpecificMappings[currentModel][newProp]) {
            newProp = modelSpecificMappings[currentModel][newProp];
        } else if (arrayPlurals[newProp]) {
            newProp = arrayPlurals[newProp];
        }
        const spacing = ' '.repeat(Math.max(1, 25 - indent.length - newProp.length));
        line = `${indent}${newProp}${spacing}${type}[]${rest}`;
    }

    // 5. Match @relation(fields: [field_name], ...)
    const relationMatch = line.match(/@relation\((.*)fields: \[([a-zA-Z0-9_ ,]+)\],(.*)\)/);
    if (relationMatch) {
        const [full, before, fields, after] = relationMatch;
        const newFields = fields.split(',').map(f => {
            const trimmed = f.trim();
            if (currentModel && fieldRenames[currentModel] && fieldRenames[currentModel][trimmed]) {
                return fieldRenames[currentModel][trimmed];
            }
            return trimmed.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
        }).join(', ');
        line = line.replace(`fields: [${fields}]`, `fields: [${newFields}]`);
    }

    // 6. Match @@unique([field_name, ...]) or @@index([field_name, ...])
    const constraintMatch = line.match(/@@(unique|index)\(\[([a-zA-Z0-9_ ,]+)\]\)/);
    if (constraintMatch) {
        const [full, type, fields] = constraintMatch;
        const newFields = fields.split(',').map(f => {
            const trimmed = f.trim();
            if (currentModel && fieldRenames[currentModel] && fieldRenames[currentModel][trimmed]) {
                return fieldRenames[currentModel][trimmed];
            }
            return trimmed.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
        }).join(', ');
        line = line.replace(`[${fields}]`, `[${newFields}]`);
    }

    // 7. Match lines like "  school_id String"
    const fieldMatch = line.match(/^(\s+)([a-z0-9_]+)\s+([A-Za-z0-9\[\]?]+)(\s+.*|)$/);
    if (fieldMatch) {
        const [full, indent, oldName, type, rest] = fieldMatch;
        if (oldName.includes('_') && !rest.includes('@map') && !oldName.startsWith('@@')) {
            const newName = oldName.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
            const spacing = ' '.repeat(Math.max(1, 25 - indent.length - newName.length));
            return `${indent}${newName}${spacing}${type}${rest} @map("${oldName}")`;
        }
    }

    return line;
}).join('\n');

fs.writeFileSync(schemaPath, newContent);
console.log('Schema converted successfully.');
