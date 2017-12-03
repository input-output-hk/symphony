import * as THREE from 'three'
import merkle from '../merkle-tree-gen'

const DEG2RAD = Math.PI / 180

const merkleDefaults = { hashalgo: 'md5', hashlist: true }

export default class GenerateBlockGeometry {
  constructor (block, visualise = false) {
    const { output, n_tx } = block

    this.angle = 5.0 + (block.output % 120)

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

    this.endNodes = []

    // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
    const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

    let tree = merkle.fromArray({ array, ...merkleDefaults })

    const startingPosition = new THREE.Vector3(0, 0, 0)
    const direction = new THREE.Vector3(0, 1, 0)
    const points = this.build(tree, startingPosition, direction, visualise)

    let box = new THREE.Box3().setFromPoints(points)
    let boxDimensions = box.getSize()
    let boxCenter = box.getCenter()

    let returnData = {
      boxDimensions: boxDimensions,
      boxCenter: boxCenter,
      endNodes: this.endNodes
    }

    if (visualise) {
      let bufferTreeGeometry = new THREE.BufferGeometry()
      bufferTreeGeometry.fromGeometry(this.treeGeo)
      returnData.treeGeo = bufferTreeGeometry
    }

    return returnData
  }

  build (node, startingPosition, direction, visualise, points = []) {
    let magnitude = (node.level * 5)
    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    points.push(startPosition)
    points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      let geometry = new THREE.TubeGeometry(path, 1, magnitude / 20, 3, false)
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

            let yaxis
            let yangle

            if (i === 1) {
              newDirection = direction.clone().applyQuaternion(this.xPosRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            } else {
              newDirection = direction.clone().applyQuaternion(this.xNegRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            }

            this.build(childNode, endPosition, newDirection, visualise, points)
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
