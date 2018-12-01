"use strict";

var _jwtSimple = _interopRequireDefault(require("jwt-simple"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({
      message: 'ACCESS_TOKEN_MISSING'
    });
  }

  try {
    var token = req.headers.authorization.split(' ')[1];

    var accessToken = _jwtSimple.default.decode(token, req.PRIVATE_KEY, true);

    if (accessToken.exp <= (0, _moment.default)().unix()) {
      return res.status(401).send({
        message: 'ACCESS_TOKEN_EXPIRED'
      });
    }
  } catch (err) {
    console.log('ACCESS ERROR: ' + err);
    return res.status(500).send({
      message: 'ACCESS_TOKEN_INVALID'
    });
  }

  next();
};