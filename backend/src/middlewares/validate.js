const HttpError = require("../utils/httpError");

function validate(schemas) {
  return function validateMiddleware(req, _res, next) {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      return next();
    } catch (err) {
      if (err && err.issues) {
        return next(
          new HttpError(
            400,
            "Dados invalidos",
            err.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message
            }))
          )
        );
      }
      return next(err);
    }
  };
}

module.exports = validate;
