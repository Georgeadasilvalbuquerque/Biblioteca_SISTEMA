const HttpError = require("../utils/httpError");

function notFoundHandler(_req, res) {
  res.status(404).json({
    error: {
      message: "Rota nao encontrada"
    }
  });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details
      }
    });
  }

  if (err && err.code === "P2002") {
    return res.status(409).json({
      error: {
        message: "Registro duplicado",
        details: err.meta
      }
    });
  }

  if (err && err.code === "P2025") {
    return res.status(404).json({
      error: {
        message: "Registro nao encontrado"
      }
    });
  }

  if (err && err.code === "P2003") {
    return res.status(409).json({
      error: {
        message: "Operacao bloqueada por relacionamento existente",
        details: err.meta
      }
    });
  }

  console.error(err);

  return res.status(500).json({
    error: {
      message: "Erro interno do servidor"
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
