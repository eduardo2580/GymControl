const {
  signToken, makeAuthenticate, requireAuth, requireRole, setAuthCookie, clearAuthCookie, COOKIE_NAME,
} = require('../lib/auth');

function mockReq(cookies = {}, user) { return { cookies, user }; }
function mockRes() {
  const res = {
    statusCode: 200, body: null, cookies: {}, cleared: [],
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    cookie(name, val, opts) { this.cookies[name] = { val, opts }; return this; },
    clearCookie(name) { this.cleared.push(name); return this; },
  };
  return res;
}

describe('signToken + makeAuthenticate', () => {
  const secret = 'test-secret-for-jest';

  test('signed token round-trips through authenticate', () => {
    const token = signToken({ id: 1, role: 'Admin' }, secret);
    const auth = makeAuthenticate(secret);
    const req = mockReq({ [COOKIE_NAME]: token });
    const res = mockRes();
    auth(req, res, () => {});
    expect(req.user.id).toBe(1);
    expect(req.user.role).toBe('Admin');
  });

  test('invalid token leaves req.user undefined (anonymous)', () => {
    const auth = makeAuthenticate(secret);
    const req = mockReq({ [COOKIE_NAME]: 'garbage' });
    const res = mockRes();
    auth(req, res, () => {});
    expect(req.user).toBeUndefined();
  });

  test('token signed with another secret is rejected', () => {
    const token = signToken({ id: 1 }, 'other');
    const auth = makeAuthenticate(secret);
    const req = mockReq({ [COOKIE_NAME]: token });
    auth(req, mockRes(), () => {});
    expect(req.user).toBeUndefined();
  });

  test('no cookie → no user, no error', () => {
    const auth = makeAuthenticate(secret);
    const req = mockReq();
    let called = false;
    auth(req, mockRes(), () => { called = true; });
    expect(called).toBe(true);
    expect(req.user).toBeUndefined();
  });
});

describe('requireAuth', () => {
  test('401 when no user', () => {
    const res = mockRes();
    let nextCalled = false;
    requireAuth(mockReq(), res, () => { nextCalled = true; });
    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  test('calls next when user present', () => {
    let called = false;
    requireAuth(mockReq({}, { id: 1, role: 'Admin' }), mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });
});

describe('requireRole', () => {
  test('401 when not authenticated', () => {
    const res = mockRes();
    requireRole('Admin')(mockReq(), res, () => {});
    expect(res.statusCode).toBe(401);
  });

  test('403 for wrong role', () => {
    const res = mockRes();
    requireRole('Admin')(mockReq({}, { role: 'Aluno' }), res, () => {});
    expect(res.statusCode).toBe(403);
  });

  test('allows when role matches', () => {
    let called = false;
    requireRole('Admin', 'Professor')(mockReq({}, { role: 'Professor' }), mockRes(),
      () => { called = true; });
    expect(called).toBe(true);
  });
});

describe('cookie helpers', () => {
  test('setAuthCookie sets COOKIE_NAME with httpOnly', () => {
    const res = mockRes();
    setAuthCookie(res, 'abc');
    expect(res.cookies[COOKIE_NAME].val).toBe('abc');
    expect(res.cookies[COOKIE_NAME].opts.httpOnly).toBe(true);
    expect(res.cookies[COOKIE_NAME].opts.sameSite).toBe('strict');
  });

  test('clearAuthCookie clears COOKIE_NAME', () => {
    const res = mockRes();
    clearAuthCookie(res);
    expect(res.cleared).toContain(COOKIE_NAME);
  });
});
