'use strict'

const admin = require('firebase-admin');
const functions = require('firebase-functions')
const apod = require('./apod.js')
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

function currentDateKey() {
    const today = new Date()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    const year = today.getUTCFullYear()

    return year + "-" + month + "-" + day
}

function pictureCollection(key) {
    return db.collection('apod').doc(key)
}

function fetchPictureFromDbOrApi(date, response) {
    console.log('Fetching apod picture from db for key: ' + date)
    pictureCollection(date).get().then(((snapshot) => {
        if (snapshot.exists) {
            const picture = snapshot.data()
            console.log('Fetched picture from db: ' + JSON.stringify(picture))
            response.status(200).send(picture)
        } else {
            fetchPictureFromApiAndCache(date, response)
        }
        return;
    }))
    .catch((error) => {
        console.log('Failed to fetch picture from db: ' + error)
        fetchPictureFromApiAndCache(date, response)
    })
}

function fetchPictureFromApiAndCache(date, response) {
    console.log('Fetching picture from api for key: ' + date)
    apod.fetchPictures(date, (picture, error) => {
        if (picture) {
            console.log('Fetched pic: ' + JSON.stringify(picture) + ' for date: ' + date)
            pictureCollection(date).set(picture)
            response.status(200).send(picture)          
        } else {
            console.log('Failed to fetch picture: ' + JSON.stringify(error))
            response.status(500).send(error)
        }          
    })
}

exports.fetchPicture = functions.https.onRequest((request, response) => {
    var date = request.query.date
    if (!date) { date = currentDateKey() }
    fetchPictureFromDbOrApi(date, response)    
})
