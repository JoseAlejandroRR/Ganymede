"use strict";

var _Auth = _interopRequireDefault(require("./Auth"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var validURL = function validURL(req, res, next) {
  var url = req.body.callbackUrl || null;
  var valid = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);

  if (valid === null || url === null) {
    return res.status(500).send({
      message: 'field callbackUrl is an invalid URL'
    });
  }

  next();
};

exports.Authentication = _Auth.default;
exports.ValidURL = validURL;