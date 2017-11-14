// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const THREE = require('three')
const functions = require('firebase-functions')
const { ConvexBufferGeometry } = require('./ConvexGeometry')
const cors = require('cors')({origin: true})
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

let points = []
let N = 100
while (N-- > 0) {
  points.push(new THREE.Vector3(
    Math.random() * 20 - 10,
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  ))
}

// Grab the text parameter.
exports.convexHull = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const geom = new ConvexBufferGeometry(points)
    res.setHeader('Content-Type', 'application/json')
    // res.setHeader('Access-Control-Allow-Origin', "*")
    res.status(200).send(JSON.stringify(geom.toJSON()))
  })
})
