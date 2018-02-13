import 'babel-polyfill'
import { checkForNewBlocks } from './populate'
import merkle from './merkle-tree'
const functions = require('firebase-functions')
import { getBlock } from './db'
// const THREE = require('three')
const { ConvexBufferGeometry } = require('./ConvexGeometry')
const cors = require('cors')({origin: true})

merkle([1, 2, 3, 4], console.log)
//
// let points = []
// let N = 100
// while (N-- > 0) {
//   points.push(new THREE.Vector3(
//     Math.random() * 20 - 10,
//     Math.random() * 20 - 10,
//     Math.random() * 20 - 10
//   ))
// }
//
const getMerkleTree = async (hash, cb) => {
  const {n_tx} = await getBlock(hash)
  const data = new Array(n_tx).fill(0).map((v, i) => i)
  merkle(data, tree => cb(tree))
}

// Grab the text parameter.
exports.convexHull = functions.https.onRequest((req, res) => {
  cors(req, res, _ => {
    const hash = req.query.hash
    getMerkleTree(hash, tree => {
      const geom = new ConvexBufferGeometry(tree)
      res.setHeader('Content-Type', 'application/json')
      res.status(200).json(geom.toJSON())
    })
  })
})

exports.checkForNewBlocks = functions.https.onRequest((req, res) => {
  checkForNewBlocks().then(blockresponse => res.status(200).send(blockresponse))
})

exports.merkleTree = functions.https.onRequest((req, res) => {
  cors(req, res, _ => {
    const hash = req.query.hash
    getMerkleTree(hash, tree => res.status(200).json(tree))
  })
})
