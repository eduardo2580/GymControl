const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'gym_token';
const TOKEN_TTL = '8h';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) { res.clearCookie(COOKIE_NAME); }

function signToken(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: TOKEN_TTL });
}

function makeAuthenticate(secret) {
  return function authenticate(req, _res, next) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();
    try { req.user = jwt.verify(token, secret); }
    catch (_e) { /* invalid → anonymous */ }
    next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acesso negado' });
    next();
  };
}

module.exports = {
  COOKIE_NAME,
  TOKEN_TTL,
  setAuthCookie,
  clearAuthCookie,
  signToken,
  makeAuthenticate,
  requireAuth,
  requireRole,
};
