const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)
// create a schema
var busStopSequenceSchema = new Schema({
    busRoad: String,
    sequence: [Number]
});

// the schema is useless so far
// we need to create a model using it
var BusStopSequence = mongoose.model('BusStopSequence', busStopSequenceSchema);

// make this available to our users in our Node applications
module.exports = BusStopSequence;