import mongoose from 'mongoose'

// create instance of Schema
var mongoSchema =   mongoose.Schema;

// create schema
var searchSchema  = {
	'request': {},
    'products_data' : [],
    'status': String,
    'created_at': { type: Date, default: Date.now }
}
// create model if not exists.
module.exports = mongoose.model('searchs',searchSchema);