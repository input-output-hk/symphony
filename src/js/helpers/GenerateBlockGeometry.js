import * as THREE from 'three'
import merkle from '../merkle-tree-gen'
import _ from 'lodash'

let seedrandom = require('seedrandom')

const merkleDefaults = { hashalgo: 'md5', hashlist: true }

export default class GenerateBlockGeometry {
  constructor (block, visualise = false) {
    const { n_tx } = block

    this.block = block

    let signatureAngle = 5.0 + (this.block.output % 85)
    signatureAngle = Math.ceil(signatureAngle / 5) * 5

    this.angle = signatureAngle // get unique structure for this block

    this.treeVertices = new Float32Array()

    this.X = new THREE.Vector3(1, 0, 0)
    this.Y = new THREE.Vector3(0, 1, 0)
    this.Z = new THREE.Vector3(0, 0, 1)

    this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
    this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
    this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
    this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
    this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
    this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
    this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

    this.treeGeo = new THREE.Geometry()

    // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
    const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

    let tree = merkle.fromArray({ array, ...merkleDefaults })

    const startingPosition = new THREE.Vector3(0, 0, 0)
    const direction = new THREE.Vector3(0, 1, 0)
    let pointData = this.build(tree, startingPosition, direction, visualise, [], [])

    let box = new THREE.Box3().setFromPoints(pointData.points)
    let boxDimensions = box.getSize()
    let boxCenter = box.getCenter()

    let returnData = {
      boxDimensions: boxDimensions,
      boxCenter: boxCenter,
      endPoints: pointData.endPoints
    }

    if (visualise) {
      let bufferTreeGeometry = new THREE.BufferGeometry()
      bufferTreeGeometry.fromGeometry(this.treeGeo)
      returnData.treeGeo = bufferTreeGeometry
    }

    return returnData
  }

  build (node, startingPosition, direction, visualise, points = [], endPoints = []) {
    let magnitude = ((node.level + 1) * 5)
    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    points.push(startPosition)
    points.push(endPosition)

    // endPoints.push(endPosition.clone())

    // add some randomness based on block network health
    let rng = seedrandom(this.block.hash + node.level)
    let random = rng()

    let randomness = ((random * 10000) - 5000) * this.block.feeToInputRatio

    this.angle += randomness

    if (visualise) {
      if (node.level === 0) {
        endPoints.push(endPosition.clone())
      }

      let path = new THREE.LineCurve3(startPosition, endPosition)
      let tubeGeo = new THREE.TubeGeometry(path, 1, magnitude / 20, 6, false)

      /* let tubeGeo = new THREE.TubeBufferGeometry(path, 1, magnitude / 20, 6, false)
      let tubePosArray = tubeGeo.attributes.position.array
      var newPosArray = new Float32Array(this.treeVertices.length + tubePosArray.length)
      newPosArray.set(this.treeVertices)
      newPosArray.set(tubePosArray, this.treeVertices.length)
      this.treeVertices = newPosArray */

      this.treeGeo.merge(tubeGeo, tubeGeo.matrix)
    } else {
      if (node.level === 1) {
        endPoints.push(endPosition.clone())
      }

      // stop here if we are just rendering the bounding box
      if (node.level === 0) {
        return {
          points: points
        }
      }
    }

    let i = 0
    for (var key in node.children) {
      if (node.children.hasOwnProperty(key)) {
        i++

        var childNode = node.children[key]

        if (childNode) {
          let angle = (Math.PI / 180) * this.angle
          let axis = this.Y
          let newDirection = direction.clone()

          if (i === 1) {
            newDirection.applyQuaternion(this.zPosRotation)
          } else {
            newDirection.applyQuaternion(this.zNegRotation)
          }

          newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, angle))

          this.build(childNode, endPosition, newDirection, visualise, points, endPoints)
        }
      }
    }

    return {
      points: points,
      endPoints: endPoints
    }
  }
}
