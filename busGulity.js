const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)

var busGulitySchema = new Schema({
    busRoad: String,
    busID: String,
    type: String,
    cycleOnRoad: Number,
    state: Number,
    created_at: Date,
    timeStamp:String,
    lat: { type: Float },
    lng: { type: Float },
    busLock:[{
        lat: {type : Float},
        lng: {type : Float}
    }],
    overDriveOtherBus:{ busID:{ type : String, default:'null'},lat:{type: Float, default:0},lng:{type: Float, default:0} }
});

var BusGulity = mongoose.model('BusGulity', busGulitySchema);
module.exports = BusGulity;