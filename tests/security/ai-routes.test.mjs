/**
 * AI route auth and per-user quota.
 * Model calls are mocked. This file must not read secrets or call a network API.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  AI_ROUTE_NAMES,
  AI_USER_LIMIT,
  AI_WINDOW_SECS,
  aiUserBucket,
  dispatchAiRequest,
} from '../../supabase/functions/make-server-2071350e/ai_routes.mjs';

const ANON = 'test-anon-key';
const NOW = 1_700_000_000_000;

function mockModel(text) {
  const calls = [];
  return {
    calls,
    async create(params) {
      calls.push(params);
      return { content: [{ type: 'text', text }] };
    },
  };
}

function memoryIncrement() {
  const counts = new Map();
  const fn = async (bucket) => {
    const next = (counts.get(bucket) ?? 0) + 1;
    counts.set(bucket, next);
    return next;
  };
  fn.counts = counts;
  return fn;
}

function usersByToken(tokens) {
  const calls = [];
  const getUser = async (token) => {
    calls.push(token);
    if (tokens[token]) return { user: tokens[token], error: null };
    return { user: null, error: new Error('invalid') };
  };
  getUser.calls = calls;
  return getUser;
}

function baseOpts(overrides = {}) {
  return {
    authorizationHeader: 'Bearer good-token',
    anonKey: ANON,
    getUser: usersByToken({ 'good-token': { id: 'user-1' } }),
    increment: memoryIncrement(),
    nowMs: NOW,
    model: mockModel('ok'),
    kv: {
      async set() {},
      async getByPrefix() { return []; },
    },
    ...overrides,
  };
}

const FIXTURES = {
  'rent-estimate': {
    body: { address: '1 Main', city: 'Toronto', province: 'ON', bedrooms: 1, bathrooms: 1, sqft: 500 },
    text: JSON.stringify({
      estimatedRent: { low: 1000, high: 2000 },
      averageRent: 1500,
      confidence: 'high',
      factors: ['Location'],
      marketInsights: 'steady',
      recommendations: 'list it',
    }),
  },
  'compare-listings': {
    body: {
      listings: [
        { title: 'A', price: 1, address: '1', city: 'T', beds: 1, baths: 1, sqft: 1, tags: [] },
        { title: 'B', price: 2, address: '2', city: 'T', beds: 1, baths: 1, sqft: 1, tags: [] },
      ],
    },
    text: JSON.stringify({
      bestValue: 0,
      comparisons: [],
      recommendations: {},
      redFlags: [],
      summary: 'A',
    }),
  },
  'explain-lease': {
    body: { province: 'ON' },
    text: JSON.stringify({
      explanation: 'plain',
      keyTerms: [],
      tenantRights: [],
      landlordObligations: [],
      redFlags: [],
      tips: [],
    }),
  },
  chat: {
    body: { message: 'hello' },
    text: 'hello back',
  },
  'voice-command': {
    body: { command: 'show vacancies' },
    text: 'two vacancies',
  },
  'screen-tenant': {
    body: { tenantName: 'Ada', income: 80000 },
    text: JSON.stringify({
      riskScore: 10,
      riskLevel: 'low',
      recommendation: 'approve',
      strengths: [],
      concerns: [],
      redFlags: [],
      verificationNeeded: [],
      summary: 'ok',
      suggestedActions: [],
    }),
  },
};

test('every AI route rejects a missing session before calling the model', async () => {
  assert.deepEqual(AI_ROUTE_NAMES, [
    'rent-estimate',
    'compare-listings',
    'explain-lease',
    'chat',
    'voice-command',
    'screen-tenant',
  ]);

  for (const path of AI_ROUTE_NAMES) {
    const model = mockModel(FIXTURES[path].text);
    const getUser = usersByToken({ 'good-token': { id: 'user-1' } });
    const result = await dispatchAiRequest(baseOpts({
      path,
      body: FIXTURES[path].body,
      authorizationHeader: undefined,
      model,
      getUser,
    }));
    assert.equal(result.status, 401, path);
    assert.equal(result.body.error, 'Unauthorized - Please log in');
    assert.equal(model.calls.length, 0, path);
    assert.equal(getUser.calls.length, 0, path);
  }
});

test('the anon key is not a user session and does not call the model', async () => {
  const model = mockModel('nope');
  const getUser = usersByToken({ [ANON]: { id: 'should-not-be-used' } });
  const result = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi' },
    authorizationHeader: `Bearer ${ANON}`,
    model,
    getUser,
  }));
  assert.equal(result.status, 401);
  assert.equal(model.calls.length, 0);
  assert.equal(getUser.calls.length, 0);
});

test('an invalid token does not call the model', async () => {
  const model = mockModel('nope');
  const result = await dispatchAiRequest(baseOpts({
    path: 'rent-estimate',
    body: FIXTURES['rent-estimate'].body,
    authorizationHeader: 'Bearer not-a-session',
    model,
  }));
  assert.equal(result.status, 401);
  assert.equal(result.body.error, 'Unauthorized - Invalid or expired token');
  assert.equal(model.calls.length, 0);
});

test('a signed-in user can call each AI route once through the mock model', async () => {
  for (const path of AI_ROUTE_NAMES) {
    const model = mockModel(FIXTURES[path].text);
    const result = await dispatchAiRequest(baseOpts({
      path,
      body: FIXTURES[path].body,
      model,
    }));
    assert.equal(result.status, 200, path);
    assert.equal(result.body.success, true, path);
    assert.equal(model.calls.length, 1, path);
    assert.equal(model.calls[0].model, 'claude-3-5-sonnet-20241022');
  }
});

test('screen-tenant returns the model recommendation unchanged', async () => {
  for (const recommendation of ['approve', 'deny']) {
    const model = mockModel(JSON.stringify({
      riskScore: 90,
      riskLevel: 'high',
      recommendation,
      strengths: [],
      concerns: [],
      redFlags: [],
      verificationNeeded: [],
      summary: 'model said so',
      suggestedActions: [],
    }));
    const result = await dispatchAiRequest(baseOpts({
      path: 'screen-tenant',
      body: { tenantName: 'Ada' },
      model,
    }));
    assert.equal(result.body.screening.recommendation, recommendation);
  }
});

test('per-user quota blocks the next model call and a second user is unaffected', async () => {
  const increment = memoryIncrement();
  const model = mockModel(FIXTURES.chat.text);
  const getUser = usersByToken({
    'good-token': { id: 'user-1' },
    'other-token': { id: 'user-2' },
  });

  for (let i = 0; i < AI_USER_LIMIT; i++) {
    const result = await dispatchAiRequest(baseOpts({
      path: 'chat',
      body: { message: 'hi' },
      model,
      increment,
      getUser,
    }));
    assert.equal(result.status, 200, `request ${i + 1}`);
  }

  const blocked = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi' },
    model,
    increment,
    getUser,
  }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers['Retry-After'], String(AI_WINDOW_SECS));
  assert.equal(model.calls.length, AI_USER_LIMIT);

  const other = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi' },
    authorizationHeader: 'Bearer other-token',
    model,
    increment,
    getUser,
  }));
  assert.equal(other.status, 200);
  assert.equal(model.calls.length, AI_USER_LIMIT + 1);
});

test('quota resets on the next window', async () => {
  const increment = memoryIncrement();
  const model = mockModel(FIXTURES.chat.text);
  const opts = {
    path: 'chat',
    body: { message: 'hi' },
    model,
    increment,
  };
  for (let i = 0; i < AI_USER_LIMIT; i++) {
    await dispatchAiRequest(baseOpts(opts));
  }
  const blocked = await dispatchAiRequest(baseOpts(opts));
  assert.equal(blocked.status, 429);

  const later = await dispatchAiRequest(baseOpts({
    ...opts,
    nowMs: NOW + AI_WINDOW_SECS * 1000,
  }));
  assert.equal(later.status, 200);
  const firstBucket = aiUserBucket('user-1', NOW);
  const nextBucket = aiUserBucket('user-1', NOW + AI_WINDOW_SECS * 1000);
  assert.notEqual(firstBucket, nextBucket);
});

test('a counter failure fails closed and does not call the model', async () => {
  const model = mockModel('nope');
  const thrown = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi' },
    model,
    increment: async () => { throw new Error('kv down'); },
  }));
  assert.equal(thrown.status, 503);
  assert.equal(model.calls.length, 0);

  const bogus = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi' },
    model,
    increment: async () => 0,
  }));
  assert.equal(bogus.status, 503);
  assert.equal(model.calls.length, 0);
});

test('compare-listings rejects a single listing before the model', async () => {
  const model = mockModel('nope');
  const result = await dispatchAiRequest(baseOpts({
    path: 'compare-listings',
    body: { listings: [{ title: 'only' }] },
    model,
  }));
  assert.equal(result.status, 400);
  assert.equal(model.calls.length, 0);
});

test('invalid JSON does not call the model or consume quota', async () => {
  const model = mockModel('nope');
  const increment = memoryIncrement();
  const result = await dispatchAiRequest(baseOpts({
    path: 'chat',
    model,
    increment,
    readBody: async () => { throw new Error('bad json'); },
  }));
  assert.equal(result.status, 400);
  assert.equal(model.calls.length, 0);
  assert.equal(increment.counts.size, 0);
});

test('chat and voice use the authenticated user id, not the body user id', async () => {
  const sets = [];
  const prefixes = [];
  const kv = {
    async set(key, value) { sets.push({ key, value }); },
    async getByPrefix(prefix) { prefixes.push(prefix); return []; },
  };
  const model = mockModel('stored');

  const chat = await dispatchAiRequest(baseOpts({
    path: 'chat',
    body: { message: 'hi', userId: 'victim-user' },
    model,
    kv,
  }));
  assert.equal(chat.status, 200);
  assert.ok(sets.every((entry) => entry.value.userId === 'user-1'));
  assert.ok(sets.every((entry) => entry.key.startsWith('conversation:user-1:')));
  assert.equal(JSON.stringify(sets).includes('victim-user'), false);

  const voice = await dispatchAiRequest(baseOpts({
    path: 'voice-command',
    body: { command: 'revenue', userId: 'victim-user' },
    model,
    kv,
  }));
  assert.equal(voice.status, 200);
  assert.deepEqual(prefixes, [
    'property:user-1:',
    'application:landlord:user-1:',
    'payment:user-1:',
  ]);
});

test('handler module and both function copies stay free of a live model client', () => {
  const root = new URL('../../supabase/functions/', import.meta.url);
  const handler = readFileSync(new URL('make-server-2071350e/ai_routes.mjs', root), 'utf8');
  const copy = readFileSync(new URL('server/ai_routes.mjs', root), 'utf8');
  const index = readFileSync(new URL('make-server-2071350e/index.ts', root), 'utf8');
  const indexCopy = readFileSync(new URL('server/index.tsx', root), 'utf8');

  assert.equal(handler, copy);
  assert.equal(index, indexCopy);
  assert.equal(handler.includes('ANTHROPIC'), false);
  assert.equal(handler.includes('Deno.env'), false);
  assert.equal(handler.includes('ai-screening'), false);
  assert.match(index, /for \(const name of AI_ROUTE_NAMES\)/);
  assert.equal(index.includes('app.post("/make-server-2071350e/ai/'), false);
  assert.match(index, /apiKey: Deno\.env\.get\('ANTHROPIC_API_KEY'\)/);
});
