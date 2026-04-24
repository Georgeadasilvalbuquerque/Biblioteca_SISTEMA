const { verifyToken } = require('../lib/jwt');
const HttpError = require('../utils/httpError');

function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token de autenticacao ausente"));
  }

  const token = header.substring(7).trim();
  if (!token) {
    return next(new HttpError(401, "Token invalido"));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch (err) {
    return next(new HttpError(401, "Token expirado ou invalido"));
  }
}

function authorize(...allowedRoles) {
  return function authorizationMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new HttpError(401, "Nao autenticado"));
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, "Acesso negado para este recurso"));
    }
    return next();
  };
}

module.exports = {
  authenticate,
  authorize
};
