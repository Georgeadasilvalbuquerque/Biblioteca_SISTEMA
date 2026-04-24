const HttpError = require("../utils/httpError");

function validate(schemas) {
  return function validateMiddleware(req, _res, next) {
    try {
      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body);
        req.body = parsedBody;
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.assign(req.params, parsedParams);
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery);
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
