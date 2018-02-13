const express = require('express')
const router = express.Router()
const BusOnroad = require('../busOnroad')
const User = require('../user')
const fs = require('fs');
const blobStream = require('blob-stream');
var newroad = []

router.get('/', function (req, res) {
    User.find({}, function (err, data) {
        if (err) throw err;
        res.json({ 'user': data })
    })
})

module.exports = router
