import * as THREE from 'three'
import merkle from '../merkle-tree-gen'
// import _ from 'lodash'
import { merge as mergeBufferGeometry } from './BufferGeometryUtils'

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

export default ({ n_tx, output, hash, feeToInputRatio }, visualise = false) =>  {
  // const { n_tx } = block

  // const block = block

  const treeGeo = new THREE.Geometry()

  let signatureAngle = 5.0 + (output % 85)
  signatureAngle = Math.ceil(signatureAngle / 5) * 5

  let angle = signatureAngle // get unique structure for this block

  const path = new THREE.LineCurve3()

  // const treeVertices = new Float32Array()

  xPosRotation.setFromAxisAngle(X, DEG2RAD * angle)
  xNegRotation.setFromAxisAngle(X, DEG2RAD * -angle)
  yPosRotation.setFromAxisAngle(Y, DEG2RAD * angle)
  yNegRotation.setFromAxisAngle(Y, DEG2RAD * -angle)
  yReverseRotation.setFromAxisAngle(Y, DEG2RAD * 180)
  zPosRotation.setFromAxisAngle(Z, DEG2RAD * angle)
  zNegRotation.setFromAxisAngle(Z, DEG2RAD * -angle)

  // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
  const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

  let { tree, sortedTree } = merkle.fromArray({ array })
  let baseAngle = 0

  tree[0].direction = new THREE.Vector3(0, 1, 0)
  tree[0].startPosition = new THREE.Vector3(0, 0, 0)
  // tree[0].angle = angle
  const direction = new THREE.Vector3(UP)
  const axis = Y
  const geos = []
  const points = []
  const endPoints = []

  const min = new THREE.Vector3()
  const max = new THREE.Vector3()

  // console.log(feeToInputRatio)

  let magnitude, endPosition

  let levels = tree[0].level
  const seeded = new Array(levels).fill(0).map(v => seedrandom(hash + v))
  
  const N = tree.length
  let i = 0
  let node
  while(i < N ){
    node = tree[i++]
    direction.copy(UP)
    if( node.parent ){

      node.startPosition = node.parent.endPosition
      
      // add some randomness based on block network health
      let rng = seeded[node.level]//seedrandom(hash + node.level)
      // let rng = seedrandom(hash + node.level)
      let random = rng.quick()
      let randomness = ((random * 10000) - 5000) * feeToInputRatio

      baseAngle += randomness
      // angle += randomness

      direction.copy(node.parent.endPosition).sub(node.parent.startPosition)
      const isLeft = node.parent.children.left === node
      // console.log( isLeft )
      direction.applyQuaternion(isLeft ? zPosRotation : zNegRotation )      
      direction.applyQuaternion(tmpQuat.setFromAxisAngle(axis, DEG2RAD * baseAngle))
      
    }

    magnitude = ((node.level + 1) * 5)
    direction.normalize().multiplyScalar(magnitude)
    node.endPosition = node.startPosition.clone().add(direction)

    // Get the bounds
    max.max(node.endPosition)
    min.min(node.endPosition)
    points.push(node.endPosition.clone())
    points.push(node.startPosition.clone())

    if(visualise) {
      if (node.level === 0) {
        endPoints.push(node.endPosition.x, node.endPosition.y, node.endPosition.z)
      }
      path.v1.copy(node.startPosition)
      path.v2.copy(node.endPosition)
      // debugger
      // geos.push( new THREE.TubeBufferGeometry(path, 1, magnitude / 20, 6, false))
      const tubeGeo = new THREE.TubeGeometry(path, 1, magnitude / 20, 6, false)
      
      treeGeo.merge(tubeGeo)
      // debugger;
    }

    if (node.level === 1) {
      endPoints.push(node.endPosition.x, node.endPosition.y, node.endPosition.z)
    }

  }

  // const startingPosition = new THREE.Vector3(0, 0, 0)
  // const direction = new THREE.Vector3(0, 1, 0)

  // let endPoints = []
  // let points = []
  // debugger
  // build(sortedTree, startingPosition, direction, visualise, hash, feeToInputRatio, treeGeo, angle, points, endPoints)

  let box = new THREE.Box3().setFromPoints(points)
  let size = /*new THREE.Vector3().subVectors( max, min )//*/box.getSize()
  let boxCenter = box.getCenter()//new THREE.Vector3().addVectors( min, max ).multiplyScalar( 0.5 )
  const offset = new THREE.Vector3().sub(min).sub(size.clone().multiplyScalar(0.5))
  // const baseGeo = new THREE.BufferGeometry()
  // const baseGeo = new THREE.Geometry()
  // baseGeo.setIndex( [] );
  // baseGeo.addAttribute( 'position', new THREE.Float32BufferAttribute( [], 3 ) );
  // baseGeo.addAttribute( 'normal', new THREE.Float32BufferAttribute( [], 3 ) );
  // baseGeo.addAttribute( 'uv', new THREE.Float32BufferAttribute( [], 2 ) );


  // const treeGeo = geos.reduce((a, b) => a.merge(, baseGeo)
  
  // if(visualise){
    
    // const positions = geos.reduce((arr, {attributes}) => arr.concat(Array.from(attributes.position.array)), [])
    // const normal = geos.reduce((arr, {attributes}) => arr.concat(Array.from(attributes.normal.array)), [])
    // const uv = geos.reduce((arr, {attributes}) => arr.concat(Array.from(attributes.uv.array)), [])  
    
  // }

  const treeBuffer = new THREE.BufferGeometry()
  if (visualise) {
    // let bufferTreeGeometry = new THREE.BufferGeometry()
    treeBuffer.fromGeometry(treeGeo)
    // treeBuffer = bufferTreeGeometry
  }

  return { size, offset, boxCenter:min/*:new THREE.Vector3(size.clone().multiplyScalar(0.5)).add(min)*/, endPoints, treeGeo: treeBuffer }

  

  // return returnData

}