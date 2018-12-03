"use strict";

require("@babel/polyfill");

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _mongoose = _interopRequireWildcard(require("mongoose"));

var _axios = _interopRequireDefault(require("axios"));

var _jwtSimple = _interopRequireDefault(require("jwt-simple"));

var _moment = _interopRequireDefault(require("moment"));

var _log4js = _interopRequireDefault(require("log4js"));

var _Middlewares = _interopRequireDefault(require("./Middlewares"));

var _search = _interopRequireDefault(require("./Models/search"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
var SERVICE_EXTERNAL_HOST = process.env.SERVICE_EXTERNAL_HOST;
var PER_PAGE = parseInt(process.env.PER_PAGE); // logic

//const middlewares = require('./Middlewares')
//const modelSearch = require('./Models/search')
// settings
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

var app = (0, _express.default)();
app.use(_bodyParser.default.json({
  limit: '20mb',
  extended: true
}));
app.use(_bodyParser.default.urlencoded({
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
    iat: (0, _moment.default)().unix(),
    exp: (0, _moment.default)().add(60, 'minutes').unix()
  };

  var token = _jwtSimple.default.encode(accessToken, PRIVATE_KEY);

  logger.info('ACCESS_TOKEN_CREATED', req.body);
  res.send({
    'accessToken': token
  });
}); //route for request new search

app.get('/api/product/search-orders', _Middlewares.default.Authentication, function (req, res) {
  var results = {};
  var response = null;
  var page = !isNaN(req.query.page) ? parseInt(req.query.page) : 0;

  _search.default.find({}).limit(PER_PAGE).skip(PER_PAGE * page).exec(function (err, data) {
    _search.default.countDocuments().exec(function (error, count) {
      if (err) {
        response = {
          'error': true,
          'message': 'Error fetching data by: ' + err
        };
        logger.error('QUERY_DOCUMENTS_ERROR', err);
      } else if (error) {
        response = {
          'error': true,
          'message': 'Error count document by: ' + error
        };
        logger.error('COUNT_DOCUMENTS_ERROR', error);
      } else {
        response = {
          page: page,
          pagesTotal: Math.ceil(count / PER_PAGE),
          resultsTotal: count,
          results: data
        };
        logger.info('QUERY_DOCUMENTS_EXCECUTE', response);
      }

      res.json(response);
    });
  });
}); // route for get all documents

app.post('/api/product/search', _Middlewares.default.Authentication, _Middlewares.default.ValidURL, function (req, res) {
  var requestBody = req.body;
  var searchObj = new _search.default();
  searchObj.request = requestBody;
  searchObj.status = 'received';
  searchObj.products_data = [];
  searchObj.created_at = new Date();
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
                  'Content-Type': 'application/json'
                }
              };
              logger.info('SEND_SEARCH_JOB', SERVICE_EXTERNAL_HOST, bodyData);
              _context2.next = 8;
              return _axios.default.post(SERVICE_EXTERNAL_HOST, bodyData, axiosConfig).then(
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
                logger.error('ERROR calling SERVICE_EXTERNAL for:', err.response.data, err.code, err.syscall, err.adresss + ':' + err.port);
                console.log('ERROR calling SERVICE_EXTERNAL for: ' + err.response);
                res.send({
                  error: true,
                  message: "EXTERNAL_SERVER_".concat(err.syscall.toUpperCase())
                });
                return null;
              });

            case 8:
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

app.get('/api/product/search-order/:id', _Middlewares.default.Authentication, function (req, res) {
  var response = null;

  _search.default.findById(req.params.id, function (err, data) {
    if (err) {
      response = {
        'error': true,
        'message': 'Error fetching data by: ' + err
      };
      logger.debug('Error fetching data by:', response.message);
    } else {
      response = data;
    }

    res.json(response);
  });
}); // route for update a document

app.put('/api/product/search-order/:id', _Middlewares.default.Authentication,
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(req, res) {
    var requestBody, response;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            requestBody = req.body;
            response = null;

            _search.default.findById(req.params.id,
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
                            'error': true,
                            'message': 'Error fetching data'
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
                                          'error': err
                                        };
                                      } else {
                                        logger.info('SEARCH_OBJECT_UPDATED', obj, requestBody);
                                        response = obj;
                                        axiosConfig = {
                                          headers: {
                                            'Content-Type': 'application/json'
                                          }
                                        };

                                        _axios.default.post(obj.request.callbackUrl, {
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

                                      res.json(response);

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

          case 3:
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
  var response = null;
  var page = !isNaN(req.query.page) ? parseInt(req.query.page) : 0;
  var query = {
    products_data: {
      $elemMatch: {
        category: req.params.category_id
      }
    }
  };

  _search.default.find(query).limit(PER_PAGE).skip(PER_PAGE * page).exec(function (err, data) {
    _search.default.find(query).countDocuments().exec(function (error, count) {
      if (err) {
        response = {
          'error': true,
          'message': 'Error fetching data by: ' + err
        };
        logger.error('QUERY_DOCUMENTS_ERROR', err);
      } else if (error) {
        response = {
          'error': true,
          'message': 'Error count document by: ' + error
        };
        logger.error('COUNT_DOCUMENTS_ERROR', error);
      } else {
        response = {
          page: page,
          pagesTotal: Math.ceil(count / PER_PAGE),
          resultsTotal: count,
          results: data
        };
        logger.info('QUERY_DOCUMENTS_EXCECUTE', response);
      }

      res.json(response);
    });
  });
}); // connection with mongo database server

_mongoose.default.connect(connectionString, {
  useNewUrlParser: true
}, function (err) {
  app.listen(app.get('port'), function () {
    console.log('Express corriendo en http://localhost:' + PORT);
  });
});