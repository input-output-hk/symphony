import * as THREE from 'three'
import merkle from '../merkle-tree-gen'
import _ from 'lodash'

let seedrandom = require('seedrandom')

const path = new THREE.LineCurve3()
const tmpVec3 = new THREE.Vector3()
const tmpVec3_2 = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()
const DEG2RAD = Math.PI / 180

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)
const UP = new THREE.Vector3(0, 1, 0)

const xPosRotation = new THREE.Quaternion()
const xNegRotation = new THREE.Quaternion()
const yPosRotation = new THREE.Quaternion()
const yNegRotation = new THREE.Quaternion()
const yReverseRotation = new THREE.Quaternion()
const zPosRotation = new THREE.Quaternion()
const zNegRotation = new THREE.Quaternion()

// const build = childNode, endPosition, newDirection, visualise, hash, feeToInputRatio, geo, angle, points, endPoints)
// const build = sortedTree, startingPosition, direction, visualise, hash, feeToInputRatio, treeGeo, angle, feeToInputRatio, points, endPoints)
const build = (node, startingPosition, direction, visualise, hash, feeToInputRatio, geo, angle, points = [], endPoints = []) => {
  let magnitude = ((node.level + 1) * 5)
  let startPosition = startingPosition.clone()
  let endPosition = startPosition.clone().add(tmpVec3.copy(direction).multiplyScalar(magnitude))

  points.push(startPosition)
  points.push(endPosition)

  // endPoints.push(endPosition.clone())

  // add some randomness based on block network health
  let rng = seedrandom(hash + node.level)
  let random = rng.quick()

  let randomness = ((random * 10000) - 5000) * feeToInputRatio

  angle += randomness

  // if (visualise) {
  //   if (node.level === 0) {
  //     endPoints.push(endPosition.clone())
  //   }

  //   path.v1.copy(startPosition)
  //   path.v2.copy(endPosition)
  //   // const path = new THREE.LineCurve3(startingPosition, endPosition)

  //   let tubeGeo = new THREE.TubeGeometry(path, 1, magnitude / 20, 6, false)

  //   /* let tubeGeo = new THREE.TubeBufferGeometry(path, 1, magnitude / 20, 6, false)
  //   let tubePosArray = tubeGeo.attributes.position.array
  //   var newPosArray = new Float32Array(this.treeVertices.length + tubePosArray.length)
  //   newPosArray.set(this.treeVertices)
  //   newPosArray.set(tubePosArray, this.treeVertices.length)
  //   this.treeVertices = newPosArray */

  //   geo.merge(tubeGeo, tubeGeo.matrix)

  // } else {

    if (node.level === 1) {
      endPoints.push(endPosition.clone())
    }

    // stop here if we are just rendering the bounding box
    if (node.level === 0) {
      return /*{
        points: points
      }*/
    }

  // }

  let i = 0
  // let i = node.children.length
  const axis = Y
  let newDirection
  // debugger
  // while( i-- > 0 )
  for (var key in node.children) {
    // if (node.children.hasOwnProperty(key)) {
      i++

      var childNode = node.children[key]

      if (childNode) {
        // let angle = DEG2RAD * angle
        // let axis = Y
        newDirection = tmpVec3_2.copy(direction)

        if (i === 1) {
          newDirection.applyQuaternion(zPosRotation)
        } else {
          newDirection.applyQuaternion(zNegRotation)
        }

        newDirection.applyQuaternion(tmpQuat.setFromAxisAngle(axis, DEG2RAD * angle))

        build(childNode, endPosition, newDirection, visualise, hash, feeToInputRatio, geo, angle, points, endPoints)
      }
    // }

  }

  // return {
  //   points: points,
  //   endPoints: endPoints
  // }
}

export default ({ n_tx, output, hash, feeToInputRatio }, visualise = false) =>  {
  // const { n_tx } = block

  // const block = block

  let signatureAngle = 5.0 + (output % 85)
  signatureAngle = Math.ceil(signatureAngle / 5) * 5

  const angle = signatureAngle // get unique structure for this block

  // const treeVertices = new Float32Array()

  xPosRotation.setFromAxisAngle(X, DEG2RAD * angle)
  xNegRotation.setFromAxisAngle(X, DEG2RAD * -angle)
  yPosRotation.setFromAxisAngle(Y, DEG2RAD * angle)
  yNegRotation.setFromAxisAngle(Y, DEG2RAD * -angle)
  yReverseRotation.setFromAxisAngle(Y, DEG2RAD * 180)
  zPosRotation.setFromAxisAngle(Z, DEG2RAD * angle)
  zNegRotation.setFromAxisAngle(Z, DEG2RAD * -angle)

  const treeGeo = new THREE.Geometry()

  // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
  const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

  let { tree, sortedTree } = merkle.fromArray({ array })
  

  tree[0].direction = new THREE.Vector3(0, 1, 0)
  tree[0].startPosition = new THREE.Vector3(0, 0, 0)
  tree[0].angle = angle
  const direction = UP
  const axis = Y
  const points = []
  const endPoints = []

  let magnitude, endPosition

  let levels = tree[0].level
  const seeded = new Array(levels).fill(0).map(v => seedrandom(hash + v))
  
  const N = tree.length
  let i = 0
  let node
  while(i< N ){
    node = tree[i++]
  // tree.forEach(node => {

    if( node.parent ){

      node.startPosition = node.parent.endPosition
      
      // add some randomness based on block network health
      let rng = seeded[node.level]//seedrandom(hash + node.level)
      let random = rng.quick()
      let randomness = ((random * 10000) - 5000) * feeToInputRatio

      magnitude = ((node.level + 1) * 5)
      node.angle = node.parent.angle + randomness

      direction.set(0, 1, 0)
      const isLeft = node.parent.children.left === node
      direction.applyQuaternion(isLeft ? zPosRotation : zNegRotation )      
      direction.applyQuaternion(tmpQuat.setFromAxisAngle(axis, DEG2RAD * node.angle))
      direction.multiplyScalar(magnitude)
 
    }

    // startPosition = startingPosition.clone()
    node.endPosition = node.startPosition.clone().add(direction)
    // node.startPosition = startPosition.clone()
    // node.endPosition = endPosition

    // if( node.parent ){
    //   node.startPosition.add( node.parent.startPosition )
    //   node.endPosition.add( node.parent.endPosition )
    // }
    points.push(node.startPosition)
    points.push(node.endPosition)

    if (node.level === 1) {
      endPoints.push(node.endPosition.clone())
    }

  }

  // const startingPosition = new THREE.Vector3(0, 0, 0)
  // const direction = new THREE.Vector3(0, 1, 0)

  // let endPoints = []
  // let points = []
  // debugger
  // build(sortedTree, startingPosition, direction, visualise, hash, feeToInputRatio, treeGeo, angle, points, endPoints)

  let box = new THREE.Box3().setFromPoints(points)
  let boxDimensions = box.getSize()
  let boxCenter = box.getCenter()

  let returnData = { boxDimensions, boxCenter, endPoints }

  if (visualise) {
    let bufferTreeGeometry = new THREE.BufferGeometry()
    bufferTreeGeometry.fromGeometry(treeGeo)
    returnData.treeGeo = bufferTreeGeometry
  }

  return returnData

}