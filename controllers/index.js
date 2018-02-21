const express = require('express')
const router = express.Router()

router.use('/roadMap',require('./roadMap'))
router.use('/busOnroad',require('./busOnroad'))
router.use('/user',require('./user'))
module.exports = router