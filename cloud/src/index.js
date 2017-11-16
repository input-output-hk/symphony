import 'babel-polyfill'
import { checkForNewBlocks } from './populate'
const functions = require('firebase-functions')

const THREE = require('three')
const { ConvexBufferGeometry } = require('./ConvexGeometry')
const cors = require('cors')({origin: true})

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
    res.status(200).json(geom.toJSON())
  })
})

exports.checkForNewBlocks = functions.https.onRequest((req, res) => {
  checkForNewBlocks().then(blockresponse => res.status(200).send(blockresponse))
})
