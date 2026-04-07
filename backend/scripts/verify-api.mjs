/**
 * End-to-end CRUD smoke + domain-rule checks against a running API.
 *
 * Prerequisites:
 *   DATABASE_URL set, schema applied (npx prisma db push OR migrate dev), optional seed
 *   npm run start:dev  (default API http://localhost:3001/api)
 *
 * Usage:
 *   node scripts/verify-api.mjs
 *   BASE_URL=http://localhost:3001/api node scripts/verify-api.mjs
 */

const BASE = (process.env.BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

/** Set after POST /auth/login — all requests except login use Bearer. */
let authToken = null;

const results = { pass: 0, fail: 0, notes: [] };

function log(msg) {
  console.log(msg);
}

async function req(method, path, body, expectStatus = [200, 201]) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    results.fail++;
    results.notes.push(`NETWORK ${method} ${url}: ${e.cause?.message || e.message}`);
    return { res: null, data: null, ok: false };
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  const ok = Array.isArray(expectStatus) ? expectStatus.includes(res.status) : res.status === expectStatus;
  if (!ok) {
    results.fail++;
    results.notes.push(`FAIL ${method} ${path} -> ${res.status} ${text.slice(0, 500)}`);
    return { res, data, ok: false };
  }
  results.pass++;
  return { res, data, ok: true };
}

function assert(cond, msg) {
  if (!cond) {
    results.fail++;
    results.notes.push(`ASSERT: ${msg}`);
  } else results.pass++;
}

async function main() {
  log(`\n=== API verify against ${BASE} ===\n`);

  // Health + docs
  const h = await req('GET', '/health', undefined, [200]);
  if (!h.ok) {
    log('Server not reachable. Start Postgres + apply schema, then: npm run start:dev');
    return printExit();
  }
  try {
    const swaggerUrl = BASE.replace(/\/api$/, '/api/docs');
    const swaggerRes = await fetch(swaggerUrl);
    assert(
      swaggerRes.ok || swaggerRes.status === 304,
      `Swagger UI GET /api/docs -> ${swaggerRes.status}`,
    );
  } catch (e) {
    assert(false, `Swagger fetch: ${e.message}`);
  }

  // Auth (JWT) — compte seed SUPER_ADMIN
  const loginEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@g3c.local';
  const loginPass = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const loginRes = await req(
    'POST',
    '/auth/login',
    { email: loginEmail, password: loginPass },
    [200, 201],
  );
  if (!loginRes.ok) {
    log('Login failed — run: npx prisma migrate deploy && npx prisma db seed');
    return printExit();
  }
  authToken = loginRes.data.accessToken;

  const me = await req('GET', '/auth/me', undefined, [200]);
  if (!me.ok) return printExit();
  assert(me.data?.email === loginEmail, 'auth/me email matches login');

  // Users CRUD (SUPER_ADMIN)
  const qaEmail = `qa_${Date.now()}@test.local`;
  const rUser = await req(
    'POST',
    '/users',
    {
      email: qaEmail,
      password: 'password123',
      firstName: 'QA',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    },
    [201],
  );
  if (!rUser.ok) return printExit();
  const userId = rUser.data.id;
  assert(
    rUser.data.passwordHash === undefined,
    'User create response must not expose passwordHash',
  );

  await req('GET', `/users/${userId}`, undefined, [200]);
  const uGet = await req('GET', `/users/${userId}`, undefined, [200]);
  assert(uGet.data.passwordHash === undefined, 'User get must not expose passwordHash');

  await req('PATCH', `/users/${userId}`, { lastName: 'User 2' }, [200]);
  await req('GET', '/users?search=qa_', undefined, [200]);
  await req('DELETE', `/users/${userId}`, undefined, [200]);

  const rActor = await req('POST', '/actors', {
    name: 'QA Actor',
    organization: 'Org',
    role: 'ARCHITECT',
  });
  if (!rActor.ok) return printExit();
  const actorId = rActor.data.id;

  // Materials
  const rMat = await req('POST', '/materials', {
    name: 'Pierre',
    type: 'STONE',
    origin: 'Carrière locale',
  });
  const matId = rMat.data.id;

  // Project
  const rProj = await req('POST', '/projects', {
    name: 'QA Project',
    location: 'Lieu test',
    startDate: '2026-01-01T00:00:00.000Z',
    status: 'PLANNED',
  });
  if (!rProj.ok) return printExit();
  const projectId = rProj.data.id;
  await req('GET', '/projects', undefined, [200]);
  await req('GET', `/projects/${projectId}`, undefined, [200]);
  await req('PATCH', `/projects/${projectId}`, { name: 'QA Project 2' }, [200]);

  // Zones
  const rZone = await req('POST', '/zones', {
    projectId,
    name: 'Facade',
    type: 'WALL',
  });
  const zoneId = rZone.data.id;
  const rChild = await req(
    'POST',
    '/zones',
    {
      projectId,
      parentZoneId: zoneId,
      name: 'Child',
      type: 'SECTION',
    },
    [201],
  );
  const childZoneId = rChild.data.id;
  await req('GET', `/zones?projectId=${projectId}`, undefined, [200]);
  await req('PATCH', `/zones/${zoneId}`, { name: 'Facade 2' }, [200]);

  // Second zone for cross-zone negative tests
  const rZoneB = await req('POST', '/zones', {
    projectId,
    name: 'Other zone',
    type: 'SECTION',
  });
  const zoneBId = rZoneB.data.id;

  // Elements
  const rEl = await req(
    'POST',
    '/elements',
    {
      zoneId,
      code: `EL-${Date.now()}`,
      name: 'Mur',
      elementType: 'WALL',
      materialId: matId,
    },
    [201],
  );
  const elementId = rEl.data.id;
  const rElB = await req(
    'POST',
    '/elements',
    {
      zoneId: zoneBId,
      code: `EL-B-${Date.now()}`,
      name: 'Other el',
      elementType: 'WALL',
    },
    [201],
  );
  const elementBId = rElB.data.id;

  // Observations
  await req(
    'POST',
    '/observations',
    {
      zoneId,
      code: `OBS-${Date.now()}`,
      title: 'Sans element',
      observationType: 'CONDITION_SURVEY',
    },
    [201],
  );
  const rObs2 = await req(
    'POST',
    '/observations',
    {
      zoneId,
      elementId,
      code: `OBS-EL-${Date.now()}`,
      title: 'Avec element',
      observationType: 'SITE_VISUAL',
    },
    [201],
  );
  const obs2Id = rObs2.data.id;
  await req(
    'POST',
    '/observations',
    {
      zoneId,
      elementId: elementBId,
      code: `OBS-BAD-${Date.now()}`,
      title: 'Bad',
      observationType: 'OTHER',
    },
    [400],
  );

  // Pathologies
  const rPath = await req(
    'POST',
    '/pathologies',
    {
      zoneId,
      observationId: obs2Id,
      code: `PATH-${Date.now()}`,
      name: 'Fissure test',
      pathologyType: 'CRACKING',
      severity: 'HIGH',
    },
    [201],
  );
  const pathId = rPath.data.id;
  await req(
    'POST',
    '/pathologies',
    {
      zoneId,
      observationId: obs2Id,
      code: `PATH-OBS-${Date.now()}`,
      name: 'Humidité test',
      pathologyType: 'MOISTURE',
      severity: 'MEDIUM',
    },
    [201],
  );
  await req(
    'POST',
    '/pathologies',
    {
      zoneId: zoneBId,
      observationId: obs2Id,
      code: `PATH-X-${Date.now()}`,
      name: 'Incohérence zone/observation',
      pathologyType: 'OTHER',
      severity: 'LOW',
    },
    [400],
  );

  // Decisions
  const rDec = await req(
    'POST',
    '/decisions',
    {
      zoneId,
      observationId: obs2Id,
      pathologyId: pathId,
      code: `DEC-${Date.now()}`,
      title: 'Decision',
      decisionType: 'CONSERVATION_APPROACH',
    },
    [201],
  );
  const decisionId = rDec.data.id;
  await req(
    'POST',
    '/decisions',
    {
      zoneId: zoneBId,
      observationId: obs2Id,
      code: `DEC-BAD-${Date.now()}`,
      title: 'Bad',
      decisionType: 'OTHER',
    },
    [400],
  );

  // Interventions
  await req(
    'POST',
    '/interventions',
    {
      decisionId,
      zoneId,
      elementId,
      pathologyId: pathId,
      code: `INT-${Date.now()}`,
      interventionType: 'REPAIR',
      progress: 10,
    },
    [201],
  );
  await req(
    'POST',
    '/interventions',
    {
      decisionId,
      zoneId: zoneBId,
      code: `INT-BAD-${Date.now()}`,
      interventionType: 'SURVEY',
    },
    [400],
  );

  // Logbook (journal projet — sans zones)
  const rLog = await req(
    'POST',
    '/logbooks',
    {
      projectId,
      title: 'Journal QA',
      eventAt: new Date().toISOString(),
      decisionIds: [decisionId],
    },
    [201],
  );
  const logId = rLog.data.id;
  await req(
    'POST',
    '/logbooks',
    {
      projectId,
      title: 'Lien invalide',
      eventAt: new Date().toISOString(),
      decisionIds: ['00000000-0000-0000-0000-000000000099'],
    },
    [404],
  );
  await req('PATCH', `/logbooks/${logId}`, { decisionIds: [], interventionIds: [] }, [200]);

  // Lab test
  await req(
    'POST',
    '/lab-tests',
    {
      zoneId,
      materialId: matId,
      labTestType: 'MOISTURE',
    },
    [201],
  );

  // Documents / Photos
  await req(
    'POST',
    '/documents',
    {
      fileKind: 'REPORT',
      originalFilename: 'x.pdf',
      mimeType: 'application/pdf',
      url: 'http://example.invalid/x',
      secureUrl: 'http://example.invalid/x',
      publicId: 'x',
      assetFolder: 'y',
    },
    [400],
  );
  const rDoc = await req(
    'POST',
    '/documents',
    {
      fileKind: 'REPORT',
      originalFilename: 'x.pdf',
      mimeType: 'application/pdf',
      url: 'http://example.invalid/x',
      secureUrl: 'http://example.invalid/x',
      publicId: `qa-doc-${Date.now()}`,
      assetFolder: 'y',
      projectId,
    },
    [201],
  );
  const docId = rDoc.data.id;
  await req('GET', `/documents/${docId}`, undefined, [200]);

  await req(
    'POST',
    '/photos',
    {
      originalFilename: 'p.jpg',
      mimeType: 'image/jpeg',
      url: 'http://example.invalid/p',
      secureUrl: 'http://example.invalid/p',
      publicId: `qa-ph-${Date.now()}`,
      assetFolder: 'z',
    },
    [400],
  );
  await req(
    'POST',
    '/photos',
    {
      originalFilename: 'p.jpg',
      mimeType: 'image/jpeg',
      url: 'http://example.invalid/p',
      secureUrl: 'http://example.invalid/p',
      publicId: `qa-ph2-${Date.now()}`,
      assetFolder: 'z',
      zoneId,
    },
    [201],
  );

  // Risks
  await req(
    'POST',
    '/risks',
    {
      title: 'No scope',
      riskCategory: 'OTHER',
    },
    [400],
  );
  await req(
    'POST',
    '/risks',
    {
      title: 'Scoped',
      riskCategory: 'SCHEDULE',
      projectId,
    },
    [201],
  );

  await req('DELETE', `/actors/${actorId}`, undefined, [200]);

  log('\n(Done — QA data left in DB; delete project manually if needed.)');
  printExit();
}

function printExit() {
  log(`\n--- Results: ${results.pass} checks ok, ${results.fail} failed ---`);
  if (results.notes.length) results.notes.forEach((n) => log(n));
  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
