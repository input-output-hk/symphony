const hashalgo = 'md5'
const merkle = require('merkle-tree-gen')
import * as THREE from 'three'

const DEG2RAD = Math.PI / 180
const angle = 90.0 * DEG2RAD
const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

const xPosRotation = new THREE.Quaternion().setFromAxisAngle(X, angle)
const xNegRotation = new THREE.Quaternion().setFromAxisAngle(X, -angle)
const yPosRotation = new THREE.Quaternion().setFromAxisAngle(Y, angle)
const yNegRotation = new THREE.Quaternion().setFromAxisAngle(Y, -angle)
const yReverseRotation = new THREE.Quaternion().setFromAxisAngle(Y, DEG2RAD * 180)
const zPosRotation = new THREE.Quaternion().setFromAxisAngle(Z, angle)
const zNegRotation = new THREE.Quaternion().setFromAxisAngle(Z, -angle)

const build = (node, startingPosition, direction, points = [], angle = 90) => {
  let magnitude = node.level
  let startPosition = startingPosition.clone()
  let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

  points.push(startPosition)
  points.push(endPosition)

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
            newDirection = direction.clone().applyQuaternion(xPosRotation)
            yaxis = direction.multiply(Y).normalize()
            yangle = (Math.PI / 180) * angle
            newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
          } else {
            newDirection = direction.clone().applyQuaternion(xNegRotation)
            yaxis = direction.multiply(Y).normalize()
            yangle = (Math.PI / 180) * angle
            newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
          }

          build(childNode, endPosition, newDirection, points, angle)
        }
      }
    }
  }

  return points
}

export default (array, cb = _ => _) => {
  let sortedTree

  merkle.fromArray({array, hashalgo}, function (err, tree) {
    let points = []

    if (!err) {
      console.log('Root hash: ' + tree.root)

      for (var key in tree) {
        if (tree.hasOwnProperty(key)) {
          var element = tree[key]
          if (element.type === 'root' || element.type === 'node') {
            tree[key].children = {}
            tree[key].children[element.left] = tree[element.left]
            tree[key].children[element.right] = tree[element.right]
            if (element.type === 'root') {
              sortedTree = element
            }
          }
        }
      }

      let startingPosition = new THREE.Vector3(0, 0, 0)
      let direction = new THREE.Vector3(0, 1, 0)
      build(sortedTree, startingPosition, direction, points)
    }
    cb(points)
  })
}
