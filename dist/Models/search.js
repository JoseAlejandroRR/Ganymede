"use strict";

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// create instance of Schema
var mongoSchema = _mongoose.default.Schema; // create schema

var searchSchema = {
  'request': {},
  'products_data': [],
  'status': String,
  'created_at': {
    type: Date,
    default: Date.now
  }
};
module.exports = _mongoose.default.model('searchs', searchSchema);