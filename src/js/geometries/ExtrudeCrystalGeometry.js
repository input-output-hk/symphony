'use strict'

/**
 * Three.js ExtrudeGeometry with alterations specific to extruding crystal structures
 */

import * as THREE from 'three'

function ExtrudeCrystalGeometry(shapes, options) {

  THREE.Geometry.call(this)

  this.type = 'ExtrudeCrystalGeometry'

  this.parameters = {
    shapes: shapes,
    options: options
  }

  this.fromBufferGeometry(new ExtrudeCrystalBufferGeometry(shapes, options))
  this.mergeVertices()

}

ExtrudeCrystalGeometry.prototype = Object.create(THREE.Geometry.prototype)
ExtrudeCrystalGeometry.prototype.constructor = ExtrudeCrystalGeometry

function ExtrudeCrystalBufferGeometry(shapes, options) {

  if (typeof (shapes) === "undefined") {
    return
  }

  THREE.BufferGeometry.call(this)

  this.type = 'ExtrudeCrystalBufferGeometry'

  shapes = Array.isArray(shapes) ?
    shapes : [shapes]

  this.addShapeList(shapes, options)

  this.computeVertexNormals()

}

ExtrudeCrystalBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype)
ExtrudeCrystalBufferGeometry.prototype.constructor = ExtrudeCrystalBufferGeometry

ExtrudeCrystalBufferGeometry.prototype.getArrays = function () {

  let positionAttribute = this.getAttribute("position")
  let verticesArray = positionAttribute ?
    Array.prototype.slice.call(positionAttribute.array) : []

  let uvAttribute = this.getAttribute("uv")
  let uvarray = uvAttribute ?
    Array.prototype.slice.call(uvAttribute.array) : []

  let IndexAttribute = this.index
  let indicesArray = IndexAttribute ?
    Array.prototype.slice.call(IndexAttribute.array) : []

  return {
    position: verticesArray,
    uv: uvarray,
    index: indicesArray
  }

}

ExtrudeCrystalBufferGeometry.prototype.addShapeList = function (shapes, options) {

  let sl = shapes.length
  options.arrays = this.getArrays()

  for (let s = 0; s < sl; s++) {
    let shape = shapes[s]
    this.addShape(shape, options)
  }

  this.setIndex(options.arrays.index);
  this.addAttribute('position', new THREE.Float32BufferAttribute(options.arrays.position, 3))
  this.addAttribute('uv', new THREE.Float32BufferAttribute(options.arrays.uv, 2))

}

ExtrudeCrystalBufferGeometry.prototype.addShape = function (shape, options) {

  let arrays = options.arrays ?
    options.arrays :
    this.getArrays()

  let verticesArray = arrays.position
  let indicesArray = arrays.index
  let uvarray = arrays.uv

  let placeholder = []

  let amount = options.amount !== undefined ?
    options.amount :
    100

  let steps = options.steps !== undefined ?
    options.steps :
    1

  // Use default WorldUVGenerator if no UV generators are specified.
  let uvgen = options.UVGenerator !== undefined ?
    options.UVGenerator :
    ExtrudeCrystalGeometry.WorldUVGenerator

  let splineTube,
    binormal,
    normal,
    position2

  let scope = this

  let shapePoints = shape.extractPoints(12)

  let vertices = shapePoints.shape

  let reverse = !THREE.ShapeUtils.isClockWise(vertices)

  if (reverse) {
    vertices = vertices.reverse()
  }

  let contour = [] // vertices has all points but contour has only points of circumference
  for (let i = 0; i < vertices.length; i++) {
    contour.push(vertices[i])
  }

  // create new center vertex
  let totalX = 0
  let totalY = 0
  for (let i = 0; i < vertices.length; i++) {
    totalX += vertices[i].x
    totalY += vertices[i].y
  }

  let avgX = totalX / vertices.length
  let avgY = totalY / vertices.length

  // get center vector and add a bit of randomness to position
  let centerVector = new THREE.Vector2(avgX, avgY)

  vertices.push(centerVector)

  // triangulate faces
  let faces = []
  let centerVertexIndex = vertices.length - 1
  for (let i = 0; i < centerVertexIndex; i++) {
    let face = []
    if (i < centerVertexIndex - 1) {
      face.push(i)
      face.push(i + 1)
    } else {
      face.push(i)
      face.push(0)
    }
    face.push(centerVertexIndex)
    faces.push(face)
  }

  /* Vertices */

  let b,
    bs,
    t,
    z,
    vert,
    vlen = vertices.length,
    face,
    flen = faces.length

  // Back facing vertices
  for (let i = 0; i < vlen; i++) {
    vert = vertices[i]
    v(vert.x, vert.y, 0)
  }

  // Add stepped vertices...
  // Including front facing vertices

  let xOffset = Math.random()
  let yOffset = Math.random()

  for (let s = 1; s <= steps; s++) {

    for (let i = 0; i < vlen; i++) {

      vert = vertices[i]

      // offset top vertices
      //vert.x += xOffset * (amount * 0.1)
      //vert.y += yOffset * (amount * 0.1)

      //center vertex is always last, extrude separately
    //  if (i == vlen - 1) {

      //  v(vert.x, vert.y, (amount + amount / 2) / steps * s)

      //} else {

        //v(vert.x, vert.y, (amount + (Math.random() * amount * 0.2)) / steps * s)
        v(vert.x, vert.y, (amount) / steps * s)

     // }

    }

  }

  /* Faces */

  // Top and bottom faces
  buildLidFaces()

  // Side faces
  buildSideFaces()

  function buildLidFaces() {

    let start = verticesArray.length / 3;

    // Bottom faces
    for (let i = 0; i < flen; i++) {
      face = faces[i]
      f3(face[2], face[1], face[0], true)
    }

    // Top faces
    for (let i = 0; i < flen; i++) {
      face = faces[i]
      f3(face[0] + vlen * steps, face[1] + vlen * steps, face[2] + vlen * steps)
    }

    scope.addGroup(start, verticesArray.length / 3 - start, options.material !== undefined ?
      options.material :
      0)

  }

  // Create faces for the z-sides of the shape

  function buildSideFaces() {

    let start = verticesArray.length / 3
    let layeroffset = 0
    sidewalls(contour, layeroffset)
    layeroffset += contour.length

    scope.addGroup(start, verticesArray.length / 3 - start, options.extrudeMaterial !== undefined ?
      options.extrudeMaterial :
      1)

  }

  function sidewalls(contour, layeroffset) {

    let j, k

    let i = contour.length

    while (--i >= 0) {

      j = i
      k = i - 1
      if (k < 0) {
        k = contour.length - 1
      }

      let s = 0,
        sl = 1

      for (s = 0; s < sl; s++) {

        let slen1 = vlen * s
        let slen2 = vlen * (s + 1)

        let a = layeroffset + j + slen1,
          b = layeroffset + k + slen1,
          c = layeroffset + k + slen2,
          d = layeroffset + j + slen2

        f4(a, b, c, d, contour, s, sl, j, k)

      }

    }

  }

  function v(x, y, z) {
    placeholder.push(x)
    placeholder.push(y)
    placeholder.push(z)
  }

  function f3(a, b, c) {

    addVertex(a)
    addVertex(b)
    addVertex(c)

    let nextIndex = verticesArray.length / 3
    let uvs = uvgen.generateTopUV(scope, verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1)

    addUV(uvs[0])
    addUV(uvs[1])
    addUV(uvs[2])

  }

  function f4(a, b, c, d, wallContour, stepIndex, stepsLength, contourIndex1, contourIndex2) {

    addVertex(a)
    addVertex(b)
    addVertex(d)

    addVertex(b)
    addVertex(c)
    addVertex(d)

    let nextIndex = verticesArray.length / 3
    let uvs = uvgen.generateSideWallUV(scope, verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1)

    addUV(uvs[0])
    addUV(uvs[1])
    addUV(uvs[3])

    addUV(uvs[1])
    addUV(uvs[2])
    addUV(uvs[3])

  }

  function addVertex(index) {
    indicesArray.push(verticesArray.length / 3)
    verticesArray.push(placeholder[index * 3 + 0])
    verticesArray.push(placeholder[index * 3 + 1])
    verticesArray.push(placeholder[index * 3 + 2])
  }

  function addUV(vector2) {
    uvarray.push(vector2.x)
    uvarray.push(vector2.y)
  }

  if (!options.arrays) {
    this.setIndex(indicesArray)
    this.addAttribute('position', new THREE.Float32BufferAttribute(verticesArray, 3))
    this.addAttribute('uv', new THREE.Float32BufferAttribute(options.arrays.uv, 2))
  }

}

ExtrudeCrystalGeometry.WorldUVGenerator = {

  generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {

    let a_x = vertices[indexA * 3]
    let a_y = vertices[indexA * 3 + 1]
    let b_x = vertices[indexB * 3]
    let b_y = vertices[indexB * 3 + 1]
    let c_x = vertices[indexC * 3]
    let c_y = vertices[indexC * 3 + 1]

    return [
      new THREE.Vector2(a_x, a_y),
      new THREE.Vector2(b_x, b_y),
      new THREE.Vector2(c_x, c_y)
    ]

  },

  generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {

    let a_x = vertices[indexA * 3]
    let a_y = vertices[indexA * 3 + 1]
    let a_z = vertices[indexA * 3 + 2]
    let b_x = vertices[indexB * 3]
    let b_y = vertices[indexB * 3 + 1]
    let b_z = vertices[indexB * 3 + 2]
    let c_x = vertices[indexC * 3]
    let c_y = vertices[indexC * 3 + 1]
    let c_z = vertices[indexC * 3 + 2]
    let d_x = vertices[indexD * 3]
    let d_y = vertices[indexD * 3 + 1]
    let d_z = vertices[indexD * 3 + 2]

    if (Math.abs(a_y - b_y) < 0.01) {

      return [
        new THREE.Vector2(a_x, 1 - a_z),
        new THREE.Vector2(b_x, 1 - b_z),
        new THREE.Vector2(c_x, 1 - c_z),
        new THREE.Vector2(d_x, 1 - d_z)
      ]

    } else {

      return [
        new THREE.Vector2(a_y, 1 - a_z),
        new THREE.Vector2(c_y, 1 - c_z),
        new THREE.Vector2(b_y, 1 - b_z),
        new THREE.Vector2(d_y, 1 - d_z)
      ]

    }

  }
}

export {
  ExtrudeCrystalGeometry,
  ExtrudeCrystalBufferGeometry
}
