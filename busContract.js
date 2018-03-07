const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Float = require('mongoose-float').loadType(mongoose, 13)

var busContractSchema = new Schema({
    busRoad: String,
    contract: [{
        contractWith: String,
        path: [{
            contractAt: Number,
            sequence: Number,
            nameTH: String,
        }]
    }]
});

var BusContract = mongoose.model('BusContract', busContractSchema);
module.exports = BusContract;