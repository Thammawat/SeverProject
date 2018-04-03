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
    passCenter: false,
    gulityState1: false,
    gulityState2: false,
    gulityState3: false,
    busLock: [{
        lat: {type : Float},
        lng: {type : Float}
    }],
    timeStamp: String,
    canCompute: Boolean,
});

var BusOnroad = mongoose.model('BusOnroad', busOnroadSchema);
module.exports = BusOnroad;