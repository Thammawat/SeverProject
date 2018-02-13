const express = require('express')
const router = express.Router()
const BusOnroad = require('../busOnroad')
const fs = require('fs');
const PDFDocument = require('./pdfkit-table');
const blobStream = require('blob-stream');
var newroad = []

router.get('/', function (req, res) {
    BusOnroad.find({}, function (err, bus) {
        if (err) throw err;
        res.json({ 'bus': bus })
    })
})

router.get('/blob', function (req, res) {
    var doc = new PDFDocument();
    var stream = doc.pipe(blobStream());
    const table0 = {
        headers: ['Word', 'Comment', 'Summary'],
        rows: [
            ['Apple', 'Not this one', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla viverra at ligula gravida ultrices. Fusce vitae pulvinar magna.'],
            ['Tire', 'Smells like funny', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla viverra at ligula gravida ultrices. Fusce vitae pulvinar magna.'],
        ],
    };

    doc.table(table0, {
        prepareHeader: () => doc.font('Helvetica-Bold'),
        prepareRow: (row, i) => doc.font('Helvetica').fontSize(12),
    });
    doc.end();
    stream.on('finish', function () {
        var url = stream.toBlobURL();
    });
})

module.exports = router
