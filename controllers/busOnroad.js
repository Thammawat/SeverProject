const express = require('express')
const router = express.Router()
const BusOnroad = require('../busOnroad')
var newroad = []

router.get('/', function (req, res) {
    BusOnroad .find({}, function (err, bus) {
        if (err) throw err;
        res.json({ 'bus': bus })
    })
})

module.exports = router
