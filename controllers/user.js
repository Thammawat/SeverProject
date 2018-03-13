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
        firstname: 'Helllooooo',
        lastname: 'haaaawaeae',
        username: 'test',
        password: 'test1234',
        status: 'admin',
    });
    newUser.save(function (err) {
        if (err) throw err;
        res.json({ 'result': 'User has Created' })
    });
})

router.post('/login', function (req, res) {
    User.findOne({ username: req.body.data.username }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ 'result': 'Invalid username or password' })
        } else {
            if (bcrypt.compareSync(req.body.data.password, user.password)) {
                bcrypt.genSalt(10, function (err, salt) {
                    if (err) return next(err);
                    // hash the password using our new salt
                    bcrypt.hash(user.username, salt, function (err, hash) {
                        if (err) return next(err);
                        res.json({ 'result': hash })
                    });
                });
            }
            else {
                res.json({ 'result': 'Invalid username or password' })
            }
        }
    });

})
module.exports = router
