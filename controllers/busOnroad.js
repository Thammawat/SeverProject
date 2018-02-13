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

router.post('/addUser', function (req, res) {
    var newUser = User({
        name: 'BBFL',
        username: 'BADBOYYYYYYYY',
        password: 'password',
        admin: true
    });

    // save the user
    newUser.save(function (err) {
        if (err) throw err;
        res.json({ 'text':'user has created' })
    });
})

module.exports = router
