"use strict";

var _express = require("express");

var _bodyParser = require("body-parser");

var _mongoose = require("mongoose");

var _axios = require("axios");

var _jwtSimple = require("jwt-simple");

var _moment = require("moment");

var _log4js = _interopRequireDefault(require("log4js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/*const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jwt-simple');
const moment = require('moment');
const log4js = require('log4js');*/
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
} // vars


var connectionString = process.env.CONNECTION_STRING_DB;
var PRIVATE_KEY = process.env.PRIVATE_KEY;
var ACCESS_USER = process.env.ACCESS_USER;
var ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
var HOST = process.env.HOST;
var PORT = process.env.PORT;
var ENDPOINT_SERVICE = HOST + ':' + PORT;
var SERVICE_EXTERNAL_HOST = process.env.SERVICE_EXTERNAL_HOST; // logic

var middlewares = require('./Middlewares');

var modelSearch = require('./Models/search'); // settings


_log4js.default.configure({
  appenders: {
    express: {
      type: 'file',
      filename: process.env.LOG_FILE
    }
  },
  categories: {
    default: {
      appenders: ['express'],
      level: 'debug'
    }
  }
});

var logger = _log4js.default.getLogger('express');

var app = (0, _express.express)();
app.use(_bodyParser.bodyParser.json({
  limit: '20mb',
  extended: true
}));
app.use(_bodyParser.bodyParser.urlencoded({
  limit: '20mb',
  extended: true
}));
app.set('port', PORT); // middelware for keep the PRIVATE_KEY

app.use(function (req, res, next) {
  req.PRIVATE_KEY = PRIVATE_KEY;
  next();
}); // root

app.get('/', function (req, res) {
  res.send('Working');
}); //route get access token

app.post('/api/auth', function (req, res) {
  var bodyRequest = req.body;

  if (bodyRequest.user == null || bodyRequest.password == null) {
    logger.info('FIELDS_MISSING', req.body);
    return res.send({
      messgae: 'FIELDS_MISSING'
    }).status(500);
  }

  if (bodyRequest.user != ACCESS_USER || bodyRequest.password != ACCESS_PASSWORD) {
    logger.info('CREDENTIALS_INVALID', req.body);
    return res.send({
      messgae: 'CREDENTIALS_INVALID'
    }).status(401);
  }

  var accessToken = {
    iat: (0, _moment.moment)().unix(),
    exp: (0, _moment.moment)().add(60, "minutes").unix()
  };

  var token = _jwtSimple.jwt.encode(accessToken, PRIVATE_KEY);

  logger.info('ACCESS_TOKEN_CREATED', req.body);
  res.send({
    'accessToken': token
  });
}); //route for request new search

app.get('/api/product/search-orders', middlewares.Authentication, function (req, res) {
  var results = {};
  modelSearch.find({}, function (err, data) {
    if (err) {
      response = {
        "error": true,
        "message": "Error fetching data by: " + err
      };
      logger.debug('ACCESS_TOKEN_CREATED', response.message);
    } else {
      response = data;
    }

    res.json(response);
  });
}); // route for get all documents

app.post('/api/product/search', middlewares.Authentication, middlewares.ValidURL, function (req, res) {
  var requestBody = req.body;
  var searchObj = new modelSearch();
  searchObj.request = requestBody;
  searchObj.status = 'received';
  searchObj.products_data = [];
  searchObj.save().then(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(searchObj) {
      var bodyData, axiosConfig;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              logger.info('SEARCH_CREATED', searchObj);
              requestBody.id = searchObj._id;
              bodyData = JSON.stringify(requestBody);
              console.log(requestBody);
              axiosConfig = {
                headers: {
                  "Content-Type": "application/json"
                }
              };
              _context2.next = 7;
              return _axios.axios.post(SERVICE_EXTERNAL_HOST, bodyData, axiosConfig).then(
              /*#__PURE__*/
              function () {
                var _ref2 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(response) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (response.data.success == true) {
                            searchObj.status = 'processing';
                            searchObj.save();
                            logger.info('SEARCH_IN_PROCESS', searchObj);
                          }

                          res.send(searchObj);

                        case 2:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, this);
                }));

                return function (_x2) {
                  return _ref2.apply(this, arguments);
                };
              }()).catch(function (err) {
                logger.error('ERROR calling SERVICE_EXTERNAL for:', err.code, err.syscall, err.adresss + ':' + err.port);
                console.log('ERROR calling SERVICE_EXTERNAL for: ' + err.response);
                res.send({
                  error: true,
                  message: "EXTERNAL_SERVER_".concat(err.syscall.toUpperCase())
                });
                return null;
              });

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }()).catch(function (err) {
    logger.error('ERROR:', err);
    console.log('ERROR CATCH: ' + err);
  });
}); // route for get a document data

app.get('/api/product/search-order/:id', middlewares.Authentication, function (req, res) {
  var results = {};
  modelSearch.findById(req.params.id, function (err, data) {
    if (err) {
      response = {
        "error": true,
        "message": "Error fetching data by: " + err
      };
      logger.debug('Error fetching data by:', response.message);
    } else {
      response = data;
    }

    res.json(response);
  });
}); // route for update a document

app.put('/api/product/search-order/:id', middlewares.Authentication,
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(req, res) {
    var requestBody;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            requestBody = req.body;
            modelSearch.findById(req.params.id,
            /*#__PURE__*/
            function () {
              var _ref4 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee5(err, obj) {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (err) {
                          response = {
                            "error": true,
                            "message": "Error fetching data"
                          };
                          logger.debug('Error fetching data by:', response.message);
                        } else {
                          obj.status = 'fulfilled';
                          obj.products_data = requestBody;
                          obj.save(
                          /*#__PURE__*/
                          function () {
                            var _ref5 = _asyncToGenerator(
                            /*#__PURE__*/
                            regeneratorRuntime.mark(function _callee4(err) {
                              var axiosConfig;
                              return regeneratorRuntime.wrap(function _callee4$(_context4) {
                                while (1) {
                                  switch (_context4.prev = _context4.next) {
                                    case 0:
                                      if (err) {
                                        logger.error('ERROR_SEARCH_UPDATE', obj, requestBody, err);
                                        response = {
                                          "error": err
                                        };
                                      } else {
                                        logger.info('SEARCH_OBJECT_UPDATED', obj, requestBody);
                                        response = {
                                          "success": true
                                        };
                                        console.log(response);
                                        axiosConfig = {
                                          headers: {
                                            "Content-Type": "application/json"
                                          }
                                        };

                                        _axios.axios.post(obj.request.callbackUrl, {
                                          url: ENDPOINT_SERVICE + '/api/product/search-order/' + obj._id
                                        }, axiosConfig).then(
                                        /*#__PURE__*/
                                        function () {
                                          var _ref6 = _asyncToGenerator(
                                          /*#__PURE__*/
                                          regeneratorRuntime.mark(function _callee3(response) {
                                            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                                              while (1) {
                                                switch (_context3.prev = _context3.next) {
                                                  case 0:
                                                    logger.info('CALLBACK_END', obj.request.callbackUrl, obj);
                                                    console.log('CALLBACK SEND');

                                                  case 2:
                                                  case "end":
                                                    return _context3.stop();
                                                }
                                              }
                                            }, _callee3, this);
                                          }));

                                          return function (_x8) {
                                            return _ref6.apply(this, arguments);
                                          };
                                        }()).catch(function (err) {
                                          logger.error('Error fetching data by:', response.message);
                                          console.log('ERROR calling SERVICE_EXTERNAL for: ' + err);
                                        });
                                      }

                                      res.send(obj);

                                    case 2:
                                    case "end":
                                      return _context4.stop();
                                  }
                                }
                              }, _callee4, this);
                            }));

                            return function (_x7) {
                              return _ref5.apply(this, arguments);
                            };
                          }());
                        }

                      case 1:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, this);
              }));

              return function (_x5, _x6) {
                return _ref4.apply(this, arguments);
              };
            }());

          case 2:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}()); // route for get documents with a category specific

app.get('/api/product/category/:category_id', function (req, res) {
  var results = {};
  modelSearch.find({
    products_data: {
      $elemMatch: {
        category: req.params.category_id
      }
    }
  }, function (err, data) {
    if (err) {
      response = {
        "error": true,
        "message": "Error fetching data by: " + err
      };
      logger.error('ERROR_SEARCH_UPDATE', response.message);
    } else {
      response = data;
    }

    res.json(response);
  });
}); // connection with mongo database server

_mongoose.mongoose.connect(connectionString, {
  useNewUrlParser: true
}, function (err) {
  app.listen(app.get('port'), function () {
    console.log('Express corriendo en http://localhost:3000');
  });
});