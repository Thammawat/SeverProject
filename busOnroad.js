const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)

var busOnroadSchema = new Schema({
    busRoad: String,
    busID: String,
    speed: { type: Float },
    lat: { type: Float },
    lng: { type: Float },
    cycleOnRoad: Number,
    currentOnRoad: Number,
    currentBusStop: Number,
});

var BusOnroad = mongoose.model('BusOnroad', busOnroadSchema);
module.exports = BusOnroad;