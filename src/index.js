//imports

import express from 'express'
import bodyParser from 'body-parser'
import mongoose, { model } from 'mongoose'
import axios from 'axios'
import jwt from 'jwt-simple'
import moment from 'moment'
import log4js from 'log4js'


if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// vars

const connectionString = process.env.CONNECTION_STRING_DB
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ACCESS_USER = process.env.ACCESS_USER
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD
const HOST = process.env.HOST
const PORT = process.env.PORT
const ENDPOINT_SERVICE = HOST + ':' + PORT
const SERVICE_EXTERNAL_HOST = process.env.SERVICE_EXTERNAL_HOST
const PER_PAGE = parseInt(process.env.PER_PAGE)


// logic

import middlewares from './Middlewares'
import modelSearch from './Models/search'
//const middlewares = require('./Middlewares')
//const modelSearch = require('./Models/search')


// settings

log4js.configure({
  appenders: {
    express: { type: 'file', filename: process.env.LOG_FILE }
  },
  categories: {
    default: { appenders: ['express'], level: 'debug' }
  }
})

const logger = log4js.getLogger('express')

const app = express()
app.use(bodyParser.json({ limit: '20mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }))

app.set('port', PORT)


// middelware for keep the PRIVATE_KEY

app.use((req, res, next) => {
  req.PRIVATE_KEY = PRIVATE_KEY
  next()
})


// root

app.get('/', function (req, res) {
  res.send('Working')
})

//route get access token

app.post('/api/auth', (req, res) => {
  const bodyRequest = req.body
  if (bodyRequest.user == null || bodyRequest.password == null) {
    logger.info('FIELDS_MISSING', req.body)
    return res.send({ messgae: 'FIELDS_MISSING' }).status(500)
  }

  if (bodyRequest.user != ACCESS_USER || bodyRequest.password != ACCESS_PASSWORD) {
    logger.info('CREDENTIALS_INVALID', req.body)
    return res.send({ messgae: 'CREDENTIALS_INVALID' }).status(401)
  }

  const accessToken = {
    iat: moment().unix(),
    exp: moment().add(60, 'minutes').unix(),
  }
  const token = jwt.encode(accessToken, PRIVATE_KEY)
  logger.info('ACCESS_TOKEN_CREATED', req.body)
  res.send({ 'accessToken': token })
})


//route for request new search

app.get('/api/product/search-orders', middlewares.Authentication, (req, res) => {
  const results = {}
  let response = null
  const page = !isNaN(req.query.page)
    ? parseInt(req.query.page)
    : 0

  modelSearch
    .find({})
    .limit(PER_PAGE)
    .skip(PER_PAGE * page)
    .exec((err, data) => {
      modelSearch.countDocuments().exec( (error, count) => {
        if (err) {
          response = { 'error': true, 'message': 'Error fetching data by: ' + err }
          logger.error('QUERY_DOCUMENTS_ERROR', err)
        } else if (error) {
          response = { 'error': true, 'message': 'Error count document by: ' + error }
          logger.error('COUNT_DOCUMENTS_ERROR', error)
        } else {
          response = {
            page: page,
            pagesTotal: Math.ceil(count / PER_PAGE),
            resultsTotal: count,
            results: data
          }
          logger.info('QUERY_DOCUMENTS_EXCECUTE', response)
        }
        res.json(response)
      })
    })
})


// route for get all documents

app.post('/api/product/search', middlewares.Authentication, middlewares.ValidURL, function (req, res) {
  const requestBody = req.body
  let searchObj = new modelSearch()
  searchObj.request = requestBody
  searchObj.status = 'received'
  searchObj.products_data = []

  searchObj.save().then(async (searchObj) => {
    logger.info('SEARCH_CREATED', searchObj)
    requestBody.id = searchObj._id
    let bodyData = JSON.stringify(requestBody)
    console.log(requestBody)

    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
      }
    }

    await axios.post(SERVICE_EXTERNAL_HOST, bodyData, axiosConfig)
      .then(async (response) => {
        if (response.data.success == true) {
          searchObj.status = 'processing'
          searchObj.save()
          logger.info('SEARCH_IN_PROCESS', searchObj)
        }
        res.send(searchObj)
      }).catch((err) => {
        logger.error('ERROR calling SERVICE_EXTERNAL for:', err.code, err.syscall, err.adresss + ':' + err.port)
        console.log('ERROR calling SERVICE_EXTERNAL for: ' + err.response)
        res.send({ error: true, message: `EXTERNAL_SERVER_${err.syscall.toUpperCase()}` })
        return null
      })
  }).catch((err) => {
    logger.error('ERROR:', err)
    console.log('ERROR CATCH: ' + err)
  })

})


// route for get a document data

app.get('/api/product/search-order/:id', middlewares.Authentication, (req, res) => {
  var results = {}
  modelSearch.findById(req.params.id, function (err, data) {
    if (err) {
      response = { 'error': true, 'message': 'Error fetching data by: ' + err }
      logger.debug('Error fetching data by:', response.message)
    } else {
      response = data
    }
    res.json(response)
  })
})


// route for update a document

app.put('/api/product/search-order/:id', middlewares.Authentication, async function (req, res) {
  var requestBody = req.body
  modelSearch.findById(req.params.id, async function (err, obj) {
    if (err) {
      response = { 'error': true, 'message': 'Error fetching data' }
      logger.debug('Error fetching data by:', response.message)
    } else {
      obj.status = 'fulfilled'
      obj.products_data = requestBody
      obj.save(async err => {
        if (err) {
          logger.error('ERROR_SEARCH_UPDATE', obj, requestBody, err)
          response = { 'error': err }
        } else {
          logger.info('SEARCH_OBJECT_UPDATED', obj, requestBody)
          response = { 'success': true }
          const axiosConfig = {
            headers: {
              'Content-Type': 'application/json',
            },
          }
          axios.post(obj.request.callbackUrl, { url: ENDPOINT_SERVICE + '/api/product/search-order/' + obj._id }, axiosConfig)
            .then(async (response) => {
              logger.info('CALLBACK_END', obj.request.callbackUrl, obj)
              console.log('CALLBACK SEND')
            }).catch((err) => {
              logger.error('Error fetching data by:', response.message)
              console.log('ERROR calling SERVICE_EXTERNAL for: ' + err)
            })
        }
        res.send(obj)
      })
    }
  })
})


// route for get documents with a category specific

app.get('/api/product/category/:category_id', (req, res) => {
  var results = {}
  modelSearch.find({ products_data: { $elemMatch: { category: req.params.category_id } } }, function (err, data) {
    if (err) {
      response = { 'error': true, 'message': 'Error fetching data by: ' + err }
      logger.error('ERROR_SEARCH_UPDATE', response.message)
    } else {
      response = data
    }
    res.json(response)
  })
})


// connection with mongo database server

mongoose.connect(connectionString, { useNewUrlParser: true }, function (err) {
  app.listen(app.get('port'), () => {
    console.log('Express corriendo en http://localhost:3000')
  })
})
