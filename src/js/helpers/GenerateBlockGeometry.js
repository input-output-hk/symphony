import * as THREE from 'three'
import merkle from '../merkle-tree-gen'
import seedrandom from 'seedrandom'

const tmpQuat = new THREE.Quaternion()
const DEG2RAD = Math.PI / 180

const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

const zPosRotation = new THREE.Quaternion()
const zNegRotation = new THREE.Quaternion()

export default ({ n_tx, output, hash, feeToInputRatio }, visualise = false) => {
  const treeGeo = new THREE.Geometry()

  // get unique structure for this block
  let angle = 5.0 + (output % 85)

  const path = new THREE.LineCurve3()

  zPosRotation.setFromAxisAngle(Z, DEG2RAD * angle)
  zNegRotation.setFromAxisAngle(Z, DEG2RAD * -angle)

  // Generate an incremental array of `n_tx` length [0, 1, 2, 3, 4, ...n_tx]
  const array = new Array(n_tx).fill(0).map((v, i) => i.toString())

  let { tree } = merkle.fromArray({ array })
  let baseAngle = 0

  tree[0].direction = new THREE.Vector3(0, 1, 0)
  tree[0].startPosition = new THREE.Vector3(0, 0, 0)

  const direction = new THREE.Vector3(Y)
  const axis = Y
  const endPoints = []
  const min = new THREE.Vector3()
  const max = new THREE.Vector3()

  let magnitude

  let levels = tree[0].level
  const seeded = new Array(levels).fill(0).map(v => seedrandom(hash + v))

  const N = tree.length
  let i = 0
  let node
  while (i < N) {
    node = tree[i++]
    direction.copy(Y)
    if (node.parent) {
      node.startPosition = node.parent.endPosition

      // add some randomness based on block network health
      let rng = seeded[node.level]

      let random = rng.quick()
      let randomness = ((random * 10000) - 5000) * feeToInputRatio

      baseAngle += randomness

      direction.copy(node.parent.endPosition).sub(node.parent.startPosition)
      const isLeft = node.parent.children.left === node

      direction.applyQuaternion(isLeft ? zPosRotation : zNegRotation)
      direction.applyQuaternion(tmpQuat.setFromAxisAngle(axis, DEG2RAD * baseAngle))
    }

    magnitude = (node.level + 1) * 5
    direction.normalize().multiplyScalar(magnitude)
    node.endPosition = node.startPosition.clone().add(direction)

    // Get the bounds
    max.max(node.endPosition)
    min.min(node.endPosition)

    if (visualise) {
      if (node.level === 0) {
        endPoints.push(node.endPosition.x, node.endPosition.y, node.endPosition.z)
      }
      path.v1 = node.startPosition.clone()
      path.v2 = node.endPosition.clone()

      const tubeGeo = new THREE.TubeGeometry(path, 1, magnitude / 20, 6, false)

      treeGeo.merge(tubeGeo)
    }
  }

  let size = new THREE.Vector3().subVectors(max, min)

  const offset = new THREE.Vector3().sub(min).sub(size.clone().multiplyScalar(0.5))

  const treeBuffer = new THREE.BufferGeometry()
  if (visualise) {
    treeBuffer.fromGeometry(treeGeo)
  }

  return { size, offset, boxCenter: min, endPoints, treeGeo: treeBuffer }
}
