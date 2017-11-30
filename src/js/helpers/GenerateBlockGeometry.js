import * as THREE from 'three'
import merkle from '../merkle-tree-gen'

const DEG2RAD = Math.PI / 180
const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

const xPosRotation = new THREE.Quaternion()
const xNegRotation = new THREE.Quaternion()
const yPosRotation = new THREE.Quaternion()
const yNegRotation = new THREE.Quaternion()
const yReverseRotation = new THREE.Quaternion()
const zPosRotation = new THREE.Quaternion()
const zNegRotation = new THREE.Quaternion()

const merkleDefaults = { hashalgo: 'md5', hashlist: true }

const tmpQuat = new THREE.Quaternion()

export default class GenerateBlockGeometry {
  constructor (block, visualise = false) {
    const { output, n_tx } = block
    const angle = DEG2RAD * 5.0 + (output % 170)

    xPosRotation.setFromAxisAngle(X, angle)
    xNegRotation.setFromAxisAngle(X, -angle)
    yPosRotation.setFromAxisAngle(Y, angle)
    yNegRotation.setFromAxisAngle(Y, -angle)
    yReverseRotation.setFromAxisAngle(Y, DEG2RAD * 180)
    zPosRotation.setFromAxisAngle(Z, angle)
    zNegRotation.setFromAxisAngle(Z, -angle)

    this.treeGeo = new THREE.Geometry()

    this.endNodes = []

    // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
    const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

    let tree = merkle.fromArray({ array, ...merkleDefaults })

    const startingPosition = new THREE.Vector3(0, 0, 0)
    const direction = new THREE.Vector3(0, 1, 0)
    const points = this.build(tree, startingPosition, direction, visualise, angle)

    let box = new THREE.Box3().setFromPoints(points)
    let boxDimensions = box.getSize()
    let boxCenter = box.getCenter()

    let returnData = {
      boxDimensions: boxDimensions,
      boxCenter: boxCenter,
      treeGeo: this.treeGeo,
      endNodes: this.endNodes
    }

    return returnData
  }

  build (node, startingPosition, direction, visualise, angle, points = []) {
    let magnitude = (node.level * 5)
  // let points = []
    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    points.push(startPosition)
    points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      let geometry = new THREE.TubeGeometry(path, 1, 0.5, 6, false)
      this.treeGeo.merge(geometry, geometry.matrix)
    }

    let i = 0
    for (var key in node.children) {
      if (node.children.hasOwnProperty(key)) {
        i++

        var childNode = node.children[key]

        if (childNode) {
          if (typeof childNode.children !== 'undefined') {
            let newDirection

            if (i === 1) {
              newDirection = direction.clone().applyQuaternion(xPosRotation)
            } else {
              newDirection = direction.clone().applyQuaternion(xNegRotation)
            }

            let yaxis = direction.multiply(Y).normalize()
            let yangle = DEG2RAD * angle
            newDirection.applyQuaternion(tmpQuat.setFromAxisAngle(yaxis, yangle))

            this.build(childNode, endPosition, newDirection, visualise, angle, points)
          } else {
            // no child nodes
            this.endNodes.push(
              {
                x: endPosition.x,
                y: endPosition.y,
                z: endPosition.z
              }
             )
          }
        }
      }
    }

    return points
  }
}
