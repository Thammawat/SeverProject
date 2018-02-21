const express = require('express')
const router = express.Router()
const RoadMapBus = require('../roadMapBus')
var newroad = []

router.post('/', function (req, res) {
    var newRoadMapBus = RoadMapBus({
        busRoad: req.body.data.busRoad,
        roadMap: req.body.data.roadMap
    });

    // save the user
    newRoadMapBus.save(function (err) {
        if (err) throw err;
        console.log('save finish')
    });
    res.json({ 'test': req.body })
})

router.post('/updated', function (req, res) {
   
    RoadMapBus.find({ busRoad: req.body.data.busRoad }, function (err, data) {
        if (err) throw err;
         newroad = data[0].roadMap.concat(req.body.data.roadMap)
    }).then(() =>{
        RoadMapBus.findOneAndUpdate({ busRoad: req.body.data.busRoad },{roadMap: newroad}, function (err, data) {
            if (err) throw err;
            console.log('update finish')
                res.json({ 'result': 'update ok' })
        })
    })
})


module.exports = router
