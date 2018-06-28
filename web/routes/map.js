var express = require('express');
var router = express.Router();

var app = require('../app');

const mongodb = require('mongodb');
const MONGO_URL = 'mongodb://localhost:27017';
const mongoClient = mongodb.MongoClient;

let database;

mongoClient.connect(MONGO_URL, function (err, db) {
    if (err) throw err;
    console.log('connected to: ' + MONGO_URL);
    database = db.db('vehicle-db');
});

/* GET home page. */
router.get('/', function (req, res, next) {
    let collection = database.collection('path_collection');
    collection.find({}).toArray(function (err, result) {
        if (err) throw err;
        res.render('map', {
            title: 'Vehicle Route Map', google_map_api_key: 'AIzaSyDwM-5CCT2zChSxr1kBQ79OW70A2D374DY',
            routes: JSON.stringify(result)
        });
    });
});

module.exports = router;
