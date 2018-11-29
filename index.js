//imports

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jwt-simple');
const moment = require('moment');
const log4js = require('log4js');


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// vars

const connectionString = process.env.CONNECTION_STRING_DB;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ACCESS_USER = process.env.ACCESS_USER;
const ACCESS_PASSWORD =  process.env.ACCESS_PASSWORD;
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const ENDPOINT_SERVICE = HOST+':'+PORT;
const SERVICE_EXTERNAL_HOST =   process.env.SERVICE_EXTERNAL_HOST;


// logic

var middlewares = require('./src/Middlewares');
var modelSearch  = require('./src/Models/search');


// settings

log4js.configure({
    appenders: {
      express: { type: 'file', filename: process.env.LOG_FILE }
    },
    categories: {
      default: { appenders: [ 'express' ], level: 'debug' }
    }
});

const logger = log4js.getLogger('express');

var app = express();
app.use(bodyParser.json({limit: '20mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}))

app.set('port', PORT);


// middelware for keep the PRIVATE_KEY

app.use((req, res, next) => {
    req.PRIVATE_KEY = PRIVATE_KEY;
    next();
});


// root

app.get('/',  function(req, res) {
    res.send('Working');
});

//route get access token

app.post('/api/auth', (req, res) => {
    bodyRequest = req.body;
    if (bodyRequest.user == null || bodyRequest.password == null) {
        logger.info('FIELDS_MISSING',req.body);
        return res.send({messgae: 'FIELDS_MISSING'}).status(500);
    }

    if(bodyRequest.user != ACCESS_USER || bodyRequest.password != ACCESS_PASSWORD) {
        logger.info('CREDENTIALS_INVALID',req.body);
        return res.send({messgae: 'CREDENTIALS_INVALID'}).status(401);
    }

    var accessToken = {
        iat: moment().unix(),
        exp: moment().add(60, "minutes").unix(),
    };
    const token = jwt.encode(accessToken, PRIVATE_KEY);
    logger.info('ACCESS_TOKEN_CREATED',req.body);
    res.send({'accessToken': token});
});


//route for request new search

app.get('/api/product/search-orders', middlewares.Authentication, (req, res) => {
    var results = {};
    modelSearch.find({},function(err,data){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data by: "+err};
            logger.debug('ACCESS_TOKEN_CREATED', response.message);
        } else {
            response = data;
        }
        res.json(response);
    });
});


// route for get all documents

app.post('/api/product/search', middlewares.Authentication, middlewares.ValidURL, function(req, res) {
    var requestBody = req.body;
    var searchObj = new modelSearch();
    searchObj.request = requestBody;
    searchObj.status = 'received';
    searchObj.products_data = [];
   
    searchObj.save().then(async (searchObj) => {
        logger.info('SEARCH_CREATED', searchObj);
        requestBody.id = searchObj._id;
        let bodyData = JSON.stringify(requestBody);
        console.log(requestBody)
        
        const axiosConfig = {
            headers: {
                "Content-Type": "application/json",
            }
        };
        
        await axios.post(SERVICE_EXTERNAL_HOST, bodyData, axiosConfig)
        .then(async (response) => {
            if (response.data.success==true) {
                searchObj.status = 'processing';
                searchObj.save();
                logger.info('SEARCH_IN_PROCESS', searchObj);
            }
            res.send(searchObj);
        }).catch((err) => {
            logger.error('ERROR calling SERVICE_EXTERNAL for:',err.code, err.syscall, err.adresss+':'+err.port);
            console.log('ERROR calling SERVICE_EXTERNAL for: '+err.response);
            res.send({ error: true, message: `EXTERNAL_SERVER_${ err.syscall.toUpperCase() }`});
            return null;
        });
    }).catch((err) => {
        logger.error('ERROR:',err);
        console.log('ERROR CATCH: '+err);
    });

});


// route for get a document data

app.get('/api/product/search-order/:id', middlewares.Authentication, (req, res) => {
    var results = {};
    modelSearch.findById(req.params.id,function(err,data){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data by: "+err};
            logger.debug('Error fetching data by:', response.message);
        } else {
            response = data;
        }
        res.json(response);
    });
});


// route for update a document

app.put('/api/product/search-order/:id', middlewares.Authentication,async function(req, res) {
    var requestBody = req.body;
    modelSearch.findById(req.params.id,async function(err,obj){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data"};
            logger.debug('Error fetching data by:', response.message);
        } else {
            obj.status = 'fulfilled';
            obj.products_data = requestBody;
            obj.save(async err => {
                if (err) {
                    logger.error('ERROR_SEARCH_UPDATE', obj, requestBody, err);
                    response = {"error" : err};
                } else {
                    logger.info('SEARCH_OBJECT_UPDATED', obj, requestBody);
                    response = {"success" : true};
                    console.log(response);
                    const axiosConfig = {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    };
                    axios.post(obj.request.callbackUrl, {url:ENDPOINT_SERVICE+'/api/product/search-order/'+obj._id}, axiosConfig)
                    .then(async (response) => {
                        logger.info('CALLBACK_END',obj.request.callbackUrl, obj);
                        console.log('CALLBACK SEND');
                    }).catch((err) => {
                        logger.error('Error fetching data by:', response.message);
                        console.log('ERROR calling SERVICE_EXTERNAL for: '+err);
                    });
                }
                res.send(obj);
            });
        }
    });
});


// route for get documents with a category specific

app.get('/api/product/category/:category_id', (req, res) => {
    var results = {};
    modelSearch.find( { products_data: { $elemMatch: { category: req.params.category_id } } },function(err,data){
        if(err) {
            response = {"error" : true,"message" : "Error fetching data by: "+err};
            logger.error('ERROR_SEARCH_UPDATE', response.message);
        } else {
            response = data;
        }
        res.json(response);
    });
});


// connection with mongo database server

mongoose.connect(connectionString,{ useNewUrlParser: true }, function(err) {
    app.listen(app.get('port'), function(){
    	console.log('Express corriendo en http://localhost:3000');
    });
});
