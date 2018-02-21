const express = require('express')
const router = express.Router()
const User = require('../user')
const fs = require('fs');
const bcrypt = require('bcrypt');

router.get('/', function (req, res) {
    User.find({}, function (err, data) {
        if (err) throw err;
        res.json({ 'user': data })
    })
})

router.get('/adduser', function (req, res) {
    var newUser = User({
        firstName: 'Helllooooo',
        lastName: 'haaaawaeae',
        Username: 'dsfsdfsdfds',
        Password: 'fdgidfpogifdpogid',
        reportAccession: true,
        memberAccession: true,
    });
    newUser.save(function (err) {
        if (err) throw err;
        res.json({ 'result': 'User has Created' })
    });
})

router.post('/login', function (req, res) {
    User.findOne({ Username: req.body.data.Username }, function (err, user) {
        if (err) throw err;
        res.json({ 'result': bcrypt.compareSync(req.body.data.Password, user.Password) })
    });
})
module.exports = router
