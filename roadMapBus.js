const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)
// create a schema
var roadMapBusSchema = new Schema({
    busRoad: String,
    roadMap: [{
        index: Number,
        lat: {type : Float},
        lng: {type : Float}
    }]
});

// the schema is useless so far
// we need to create a model using it
var RoadMapBus = mongoose.model('RoadMapBus', roadMapBusSchema);

// make this available to our users in our Node applications
module.exports = RoadMapBus;