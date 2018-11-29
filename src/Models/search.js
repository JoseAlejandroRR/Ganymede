var mongoose    =   require("mongoose");

// create instance of Schema
var mongoSchema =   mongoose.Schema;
// create schema
var searchSchema  = {
	"request": {},
    "products_data" : [],
    "status": String,
};
// create model if not exists.
module.exports = mongoose.model('searchs',searchSchema);