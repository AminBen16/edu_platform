const fs = require('fs');
const path = require('path');
const {
  colors,
  coverageDir,
  loadConfig,
  openDatabase,
  resultsDir,
  writeJson,
} = require('./_lib');

const database = openDatabase();
const routesFile = path.join(coverageDir, 'api-endpoints.json');
const outputFile = path.join(resultsDir, 'api-smoke.json');

function hasUnresolvedParams(routePath, context) {
  return /:([A-Za-z0-9_]+)/.test(routePath) && routePath.includes('missing-test-id');
}

function replaceParams(routePath, context, method) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, (_, paramName) => {
    const invalid = 'missing-test-id';
    const useInvalidForMutation = ['PUT', 'PATCH', 'DELETE'].includes(method);

    const byName = {
      id: context.userId || invalid,
      userId: context.userId || invalid,
      classId: context.classId || invalid,
      lessonId: context.lessonId || invalid,
      quizId: context.quizId || invalid,
      assignmentId: context.assignmentId || invalid,
      sessionId: context.sessionId || invalid,
      roomCode: context.roomCode || invalid,
      reportCardId: context.reportCardId || invalid,
      reportId: context.reportId || invalid,
      notificationId: context.notificationId || invalid,
      topicId: context.topicId || invalid,
      subjectId: context.subjectId || invalid,
      termId: context.termId || invalid,
      competencyId: context.competencyId || invalid,
      chatId: context.classId || invalid,
      code: context.invitationCode || 'invalid-code',
    };

    if (useInvalidForMutation) {
      return invalid;
    }

    return byName[paramName] || invalid;
  });
}

function classifyDiscoveredCheck(route, targetPath, responseStatus) {
  const unresolved = hasUnresolvedParams(targetPath, {});
  if (unresolved) {
    return {
      ok: false,
      reason: 'unresolved-params',
    };
  }

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method);

  if (!isMutation) {
    return {
      ok: responseStatus >= 200 && responseStatus < 300,
      reason: 'read-route',
    };
  }

  return {
    ok:
      (responseStatus >= 200 && responseStatus < 300) ||
      [400, 401, 403, 404, 405, 409, 422].includes(responseStatus),
    reason: 'mutation-probe',
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }

  return { response, body };
}

async function login(apiBaseUrl, credentials, schoolId) {
  const { response, body } = await fetchJson(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      schoolId,
    }),
  });

  if (!response.ok || !body?.token) {
    throw new Error(`Admin login failed with status ${response.status}.`);
  }

  return body.token;
}

async function loadContext() {
  const school = database
    .prepare('SELECT id FROM "School" WHERE domain = ? LIMIT 1')
    .get('eduplatform.local');
  const adminUser = database
    .prepare('SELECT id FROM "User" WHERE email = ? AND school_id = ? LIMIT 1')
    .get('admin@eduplatform.local', school?.id || '');
  const classRecord = database
    .prepare('SELECT id FROM "Class" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const lesson = database
    .prepare('SELECT id FROM "Lesson" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const quiz = database
    .prepare('SELECT id FROM "Quiz" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const assignment = database
    .prepare('SELECT id FROM "Assignment" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const session = database
    .prepare('SELECT id, room_code FROM "LiveSession" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const notification = database
    .prepare('SELECT id FROM "Notification" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const reportCard = database
    .prepare('SELECT id FROM "ReportCard" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const subject = database
    .prepare('SELECT id FROM "Subject" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const topic = database.prepare('SELECT id FROM "Topic" LIMIT 1').get();
  const term = database
    .prepare('SELECT id FROM "Term" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');
  const competency = database.prepare('SELECT id FROM "Competency" LIMIT 1').get();
  const invitation = database
    .prepare('SELECT code FROM "Invitation" WHERE school_id = ? LIMIT 1')
    .get(school?.id || '');

  return {
    schoolId: school?.id || '',
    userId: adminUser?.id || '',
    classId: classRecord?.id || '',
    lessonId: lesson?.id || '',
    quizId: quiz?.id || '',
    assignmentId: assignment?.id || '',
    sessionId: session?.id || '',
    roomCode: session?.room_code || '',
    notificationId: notification?.id || '',
    reportCardId: reportCard?.id || '',
    reportId: `admin-overview-${school?.id || 'school'}`,
    subjectId: subject?.id || '',
    topicId: topic?.id || '',
    termId: term?.id || '',
    competencyId: competency?.id || '',
    invitationCode: invitation?.code || '',
  };
}

async function main() {
  const config = loadConfig();
  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
  const context = await loadContext();
  const token = await login(
    config.apiBaseUrl,
    config.credentials.admin,
    context.schoolId
  );

  console.log(`${colors.cyan}Running API smoke tests...${colors.reset}`);

  const checks = [];
  const skipped = [];

  const curatedChecks = [
    { method: 'GET', path: '/health', authenticated: false },
    { method: 'POST', path: '/auth/login', authenticated: false, body: {
      email: config.credentials.admin.email,
      password: config.credentials.admin.password,
      schoolId: context.schoolId,
    }, expected: [200] },
    { method: 'POST', path: '/auth/login', authenticated: false, body: {
      email: config.credentials.admin.email,
      password: 'WrongPassword!',
      schoolId: context.schoolId,
    }, expected: [401] },
    { method: 'GET', path: '/users', authenticated: true, expected: [200] },
    { method: 'GET', path: `/messages?classId=${context.classId}`, authenticated: true, expected: [200] },
    { method: 'GET', path: '/dashboard', authenticated: true, expected: [200] },
    { method: 'POST', path: '/auth/invite', authenticated: true, body: {
      email: 'invalid-email',
      name: 'Broken Invite',
      role: 'STUDENT',
      schoolId: context.schoolId,
    }, expected: [400] },
  ];

  for (const check of curatedChecks) {
    const { response, body } = await fetchJson(`${config.apiBaseUrl}${check.path}`, {
      method: check.method,
      headers: {
        'Content-Type': 'application/json',
        ...(check.authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: check.body ? JSON.stringify(check.body) : undefined,
    });

    const ok = (check.expected || []).includes(response.status);
    checks.push({
      kind: 'curated',
      method: check.method,
      path: check.path,
      status: response.status,
      ok,
      body,
    });

    if (!ok) {
      throw new Error(`Curated API check failed for ${check.method} ${check.path}.`);
    }
  }

  for (const route of routes) {
    const targetPath = replaceParams(route.path, context, route.method);
    if (targetPath.includes('missing-test-id')) {
      skipped.push({
        method: route.method,
        path: route.path,
        reason: 'missing-context',
      });
      continue;
    }

    const url = `${config.apiBaseUrl}${targetPath}`;
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method);

    const { response, body } = await fetchJson(url, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        ...(route.protected ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isMutation ? JSON.stringify({}) : undefined,
    });

    const classification = classifyDiscoveredCheck(
      route,
      targetPath,
      response.status
    );
    checks.push({
      kind: 'discovered',
      method: route.method,
      path: targetPath,
      status: response.status,
      ok: classification.ok,
      reason: classification.reason,
      body,
    });
  }

  const failures = checks.filter((check) => !check.ok);
  writeJson(outputFile, {
    checkedAt: new Date().toISOString(),
    total: checks.length,
    skipped,
    failures,
    checks,
  });

  if (failures.length > 0) {
    throw new Error(`API smoke failed with ${failures.length} server-side failures.`);
  }

  console.log(`${colors.green}API smoke tests passed.${colors.reset}`);
}

main()
  .catch((error) => {
    console.error(`${colors.red}${error.message}${colors.reset}`);
    process.exitCode = 1;
  })
  .finally(() => {
    database.close();
  });
