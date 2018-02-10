const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// create a schema
var roadSchema = new Schema({
    name: String,
    fullname: String,
    currentCycleOnRoad: Number,
    busStopSequence: { type: Schema.Types.ObjectId, ref: 'BusStopSequence' },
    roadMapBus: { type: Schema.Types.ObjectId, ref: 'RoadMapBus' },
  });
  
  // the schema is useless so far
  // we need to create a model using it
  var Road = mongoose.model('Road', roadSchema);
  
  // make this available to our users in our Node applications
  module.exports = Road;