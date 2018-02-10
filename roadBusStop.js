const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)
// create a schema
var roadBusStopSchema = new Schema({
    busRoad: String,
    busStop: [{
        sequence: Number,
        index: Number,
        nameTH: String,
        nameEG: String,
        detail: String,
        lat: {type : Float},
        lng: {type : Float}
    }]
});

// the schema is useless so far
// we need to create a model using it
var RoadBusStop = mongoose.model('RoadBusStop', roadBusStopSchema);

// make this available to our users in our Node applications
module.exports = RoadBusStop;