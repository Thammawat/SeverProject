const express = require('express')
const router = express.Router()

router.use('/roadMap',require('./roadMap'))
module.exports = router