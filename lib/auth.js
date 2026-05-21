const jwt = require('jsonwebtoken');

// Cookie de auth sempre com a configuração mais restritiva:
// - prefixo __Secure- exige cookie marcado como Secure
// - Secure exige HTTPS (browsers permitem em localhost/127.0.0.1 como exceção)
// - SameSite=Strict bloqueia envio cross-site (proteção contra CSRF)
// - HttpOnly impede leitura via JS (proteção contra XSS)
// - path=/ explícito para o clearCookie casar com o set
const COOKIE_NAME = '__Secure-gym_token';
const TOKEN_TTL = '8h';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  // Os browsers rejeitam o "delete cookie" se as flags Secure/SameSite não
  // baterem com o cookie original — em especial cookies com prefixo __Secure-.
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    path: '/',
  });
}

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
