'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from './Config'
let Voronoi = require('voronoi')

const firebase = require('firebase')
require('firebase/firestore')

// blockchain api
let blockexplorer = require('blockchain.info/blockexplorer')

let glslify = require('glslify')
let OrbitControls = OrbitContructor(THREE)

////////////////////////////////////////////////////////////////////////////////

// !!! copied and pasted from THREE js core ///

function ExtrudeGeometry(shapes, options) {

  THREE.Geometry.call(this);

  this.type = 'ExtrudeGeometry'

  this.parameters = {
    shapes: shapes,
    options: options
  }

  this.fromBufferGeometry(new ExtrudeBufferGeometry(shapes, options))
  this.mergeVertices()

}

ExtrudeGeometry.prototype = Object.create(THREE.Geometry.prototype)
ExtrudeGeometry.prototype.constructor = ExtrudeGeometry

function ExtrudeBufferGeometry(shapes, options) {

  if (typeof(shapes) === "undefined") {
    return
  }

  THREE.BufferGeometry.call(this)

  this.type = 'ExtrudeBufferGeometry'

  shapes = Array.isArray(shapes)
    ? shapes
    : [shapes]

  this.addShapeList(shapes, options)

  this.computeVertexNormals()

}

ExtrudeBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype)
ExtrudeBufferGeometry.prototype.constructor = ExtrudeBufferGeometry

ExtrudeBufferGeometry.prototype.getArrays = function() {

  var positionAttribute = this.getAttribute("position")
  var verticesArray = positionAttribute
    ? Array.prototype.slice.call(positionAttribute.array)
    : []

  var uvAttribute = this.getAttribute("uv")
  var uvArray = uvAttribute
    ? Array.prototype.slice.call(uvAttribute.array)
    : []

  var IndexAttribute = this.index
  var indicesArray = IndexAttribute
    ? Array.prototype.slice.call(IndexAttribute.array)
    : []

  return {position: verticesArray, uv: uvArray, index: indicesArray}

}

ExtrudeBufferGeometry.prototype.addShapeList = function(shapes, options) {

  var sl = shapes.length
  options.arrays = this.getArrays()

  for (var s = 0; s < sl; s++) {

    var shape = shapes[s]
    this.addShape(shape, options)

  }

  this.setIndex(options.arrays.index);
  this.addAttribute('position', new THREE.Float32BufferAttribute(options.arrays.position, 3));
  this.addAttribute('uv', new THREE.Float32BufferAttribute(options.arrays.uv, 2));

};

ExtrudeBufferGeometry.prototype.addShape = function(shape, options) {

  var arrays = options.arrays
    ? options.arrays
    : this.getArrays()
  var verticesArray = arrays.position
  var indicesArray = arrays.index
  var uvArray = arrays.uv

  var placeholder = []

  var amount = options.amount !== undefined
    ? options.amount
    : 100

  var bevelThickness = options.bevelThickness !== undefined
    ? options.bevelThickness
    : 6; // 10

  var bevelSize = options.bevelSize !== undefined
    ? options.bevelSize
    : bevelThickness - 2 // 8

  var bevelSegments = options.bevelSegments !== undefined
    ? options.bevelSegments
    : 3

  var curveSegments = options.curveSegments !== undefined
    ? options.curveSegments
    : 12

  var steps = options.steps !== undefined
    ? options.steps
    : 1

  var extrudePath = options.extrudePath
  var extrudePts

  // Use default WorldUVGenerator if no UV generators are specified.
  var uvgen = options.UVGenerator !== undefined
    ? options.UVGenerator
    : ExtrudeGeometry.WorldUVGenerator

  var splineTube,
    binormal,
    normal,
    position2

  bevelSegments = 0
  bevelThickness = 0
  bevelSize = 0

  // Variables initialization

  var ahole,
    h,
    hl // looping of holes
  var scope = this

  var shapePoints = shape.extractPoints(curveSegments)

  var vertices = shapePoints.shape



  var reverse = !THREE.ShapeUtils.isClockWise(vertices)

  if (reverse) {
    vertices = vertices.reverse()
  }

  // create new vertice avg all all vertices
  var totalX = 0
  var totalY = 0
  for (var i = 0; i < vertices.length; i++) {
    totalX += vertices[i].x
    totalY += vertices[i].y
  }

  var avgX = totalX / vertices.length
  var avgY = totalY / vertices.length

	// get center vector and add a bit of randomness to position
  var centerVector = new THREE.Vector2(
		avgX + (Math.random() * 2) - 1,
		avgY + (Math.random() * 2) - 1
	)

  vertices.push(centerVector)

	// triangulate faces
	var faces = []
	var centerVertexIndex = vertices.length - 1
	for (var i = 0; i < centerVertexIndex; i++) {

		var face = []

		if (i < centerVertexIndex - 1) {
			face.push(i)
			face.push(i+1)
		} else {
			face.push(i)
			face.push(0)
		}

		face.push(centerVertexIndex)
		faces.push(face)

	}

  /* Vertices */

  var contour = vertices; // vertices has all points but contour has only points of circumference

  function scalePt2(pt, vec, size) {

    if (!vec)
      console.error("THREE.ExtrudeGeometry: vec does not exist")

    return vec.clone().multiplyScalar(size).add(pt)

  }

  var b,
    bs,
    t,
    z,
    vert,
    vlen = vertices.length,
    face,
    flen = faces.length

  // Find directions for point movement

  function getBevelVec(inPt, inPrev, inNext) {

    // computes for inPt the corresponding point inPt' on a new contour
    //   shifted by 1 unit (length of normalized vector) to the left
    // if we walk along contour clockwise, this new contour is outside the old one
    //
    // inPt' is the intersection of the two lines parallel to the two
    //  adjacent edges of inPt at a distance of 1 unit on the left side.

    var v_trans_x,
      v_trans_y,
      shrink_by // resulting translation vector for inPt

    // good reading for geometry algorithms (here: line-line intersection)
    // http://geomalgorithms.com/a05-_intersect-1.html

    var v_prev_x = inPt.x - inPrev.x,
      v_prev_y = inPt.y - inPrev.y

    var v_next_x = inNext.x - inPt.x,
      v_next_y = inNext.y - inPt.y

    var v_prev_lensq = (v_prev_x * v_prev_x + v_prev_y * v_prev_y)

    // check for collinear edges
    var collinear0 = (v_prev_x * v_next_y - v_prev_y * v_next_x)

    if (Math.abs(collinear0) > Number.EPSILON) {

      // not collinear

      // length of vectors for normalizing

      var v_prev_len = Math.sqrt(v_prev_lensq)
      var v_next_len = Math.sqrt(v_next_x * v_next_x + v_next_y * v_next_y)

      // shift adjacent points by unit vectors to the left

      var ptPrevShift_x = (inPrev.x - v_prev_y / v_prev_len)
      var ptPrevShift_y = (inPrev.y + v_prev_x / v_prev_len)

      var ptNextShift_x = (inNext.x - v_next_y / v_next_len)
      var ptNextShift_y = (inNext.y + v_next_x / v_next_len)

      // scaling factor for v_prev to intersection point

      var sf = ((ptNextShift_x - ptPrevShift_x) * v_next_y - (ptNextShift_y - ptPrevShift_y) * v_next_x) / (v_prev_x * v_next_y - v_prev_y * v_next_x)

      // vector from inPt to intersection point

      v_trans_x = (ptPrevShift_x + v_prev_x * sf - inPt.x)
      v_trans_y = (ptPrevShift_y + v_prev_y * sf - inPt.y)

      // Don't normalize!, otherwise sharp corners become ugly
      //  but prevent crazy spikes
      var v_trans_lensq = (v_trans_x * v_trans_x + v_trans_y * v_trans_y)
      if (v_trans_lensq <= 2) {

        return new THREE.Vector2(v_trans_x, v_trans_y)

      } else {

        shrink_by = Math.sqrt(v_trans_lensq / 2)

      }

    } else {

      // handle special case of collinear edges

      var direction_eq = false // assumes: opposite

      if (v_prev_x > Number.EPSILON) {

        if (v_next_x > Number.EPSILON) {

          direction_eq = true

        }

      } else {

        if (v_prev_x < -Number.EPSILON) {

          if (v_next_x < -Number.EPSILON) {

            direction_eq = true

          }

        } else {

          if (Math.sign(v_prev_y) === Math.sign(v_next_y)) {

            direction_eq = true

          }

        }

      }

      if (direction_eq) {

        // console.log("Warning: lines are a straight sequence")
        v_trans_x = -v_prev_y
        v_trans_y = v_prev_x
        shrink_by = Math.sqrt(v_prev_lensq)

      } else {

        // console.log("Warning: lines are a straight spike")
        v_trans_x = v_prev_x
        v_trans_y = v_prev_y
        shrink_by = Math.sqrt(v_prev_lensq / 2)

      }

    }

    return new THREE.Vector2(v_trans_x / shrink_by, v_trans_y / shrink_by)

  }

  var contourMovements = []

  for (var i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {

    if (j === il)
      j = 0

    if (k === il)
      k = 0

    //  (j)---(i)---(k)
    // console.log('i,j,k', i, j , k)

    contourMovements[i] = getBevelVec(contour[i], contour[j], contour[k])

  }

  var holesMovements = [],
    oneHoleMovements,
    verticesMovements = contourMovements.concat()


  bs = bevelSize

  // Back facing vertices

  for (i = 0; i < vlen; i++) {

    vert = vertices[i]

    v(vert.x, vert.y, 0)

  }

  // Add stepped vertices...
  // Including front facing vertices


	var xOffset = Math.random()
	var yOffset = Math.random()

  var s

  for (s = 1; s <= steps; s++) {

    for (i = 0; i < vlen; i++) {

      vert = vertices[i]

			// offset top vertices
			vert.x += xOffset * (amount * 0.1)
			vert.y += yOffset * (amount * 0.1)

			// center vertex is always last
			if (i == vlen - 1) {

				v(vert.x, vert.y, (amount * 1.2) / steps * s)

			} else {

				v(vert.x, vert.y, (amount + (Math.random() * amount * 0.05)) / steps * s)

			}

    }

  }

  /* Faces */

  // Top and bottom faces

  buildLidFaces()

  // Sides faces

  buildSideFaces()

  /////  Internal functions

  function buildLidFaces() {

    var start = verticesArray.length / 3;

    // Bottom faces
    for (i = 0; i < flen; i++) {
      face = faces[i]
      f3(face[2], face[1], face[0])
    }

    // Top faces
    for (i = 0; i < flen; i++) {
      face = faces[i]
      f3(face[0] + vlen * steps, face[1] + vlen * steps, face[2] + vlen * steps)
    }

    scope.addGroup(start, verticesArray.length / 3 - start, options.material !== undefined
      ? options.material
      : 0)

  }

  // Create faces for the z-sides of the shape

  function buildSideFaces() {

    var start = verticesArray.length / 3
    var layeroffset = 0
    sidewalls(contour, layeroffset)
    layeroffset += contour.length

    scope.addGroup(start, verticesArray.length / 3 - start, options.extrudeMaterial !== undefined
      ? options.extrudeMaterial
      : 1)

  }

  function sidewalls(contour, layeroffset) {

    var j, k

    i = contour.length

    while (--i >= 0) {

      j = i
      k = i - 1
      if (k < 0)
        k = contour.length - 1

      //console.log('b', i,j, i-1, k,vertices.length)

      var s = 0,
        sl = steps + bevelSegments * 2

      for (s = 0; s < sl; s++) {

        var slen1 = vlen * s
        var slen2 = vlen * (s + 1)

        var a = layeroffset + j + slen1,
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

    var nextIndex = verticesArray.length / 3
    var uvs = uvgen.generateTopUV(scope, verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1)

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

    var nextIndex = verticesArray.length / 3
    var uvs = uvgen.generateSideWallUV(scope, verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1)

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

    uvArray.push(vector2.x)
    uvArray.push(vector2.y)

  }

  if (!options.arrays) {

    this.setIndex(indicesArray)
    this.addAttribute('position', new THREE.Float32BufferAttribute(verticesArray, 3))
    this.addAttribute('uv', new THREE.Float32BufferAttribute(options.arrays.uv, 2))

  }

};

ExtrudeGeometry.WorldUVGenerator = {

  generateTopUV: function(geometry, vertices, indexA, indexB, indexC) {

    var a_x = vertices[indexA * 3]
    var a_y = vertices[indexA * 3 + 1]
    var b_x = vertices[indexB * 3]
    var b_y = vertices[indexB * 3 + 1]
    var c_x = vertices[indexC * 3]
    var c_y = vertices[indexC * 3 + 1]

    return [
      new THREE.Vector2(a_x, a_y),
      new THREE.Vector2(b_x, b_y),
      new THREE.Vector2(c_x, c_y)
    ];

  },

  generateSideWallUV: function(geometry, vertices, indexA, indexB, indexC, indexD) {

    var a_x = vertices[indexA * 3]
    var a_y = vertices[indexA * 3 + 1]
    var a_z = vertices[indexA * 3 + 2]
    var b_x = vertices[indexB * 3]
    var b_y = vertices[indexB * 3 + 1]
    var b_z = vertices[indexB * 3 + 2]
    var c_x = vertices[indexC * 3]
    var c_y = vertices[indexC * 3 + 1]
    var c_z = vertices[indexC * 3 + 2]
    var d_x = vertices[indexD * 3]
    var d_y = vertices[indexD * 3 + 1]
    var d_z = vertices[indexD * 3 + 2]

    if (Math.abs(a_y - b_y) < 0.01) {

      return [
        new THREE.Vector2(a_x, 1 - a_z),
        new THREE.Vector2(b_x, 1 - b_z),
        new THREE.Vector2(c_x, 1 - c_z),
        new THREE.Vector2(d_x, 1 - d_z)
      ];

    } else {

      return [
        new THREE.Vector2(a_y, 1 - a_z),
        new THREE.Vector2(c_y, 1 - c_z),
        new THREE.Vector2(b_y, 1 - b_z),
        new THREE.Vector2(d_y, 1 - d_z)
      ];

    }

  }
};

////////////////////////////////////////////////////////////////////////////////

export default class Scene {

  constructor() {

    // declare class lets
    this.camera
    this.scene
    this.renderer
    this.width
    this.height
    this.currentBlock
    this.diagram
    this.voronoi
    this.relaxIterations
    this.textureLoader
    this.bgMap
    this.firebaseDB

    firebase.initializeApp({apiKey: 'AIzaSyD92ewqzwYPP6L4-XmlU3LucH74n8Xa6tw', authDomain: 'orpheus-f3a39.firebaseapp.com', projectId: 'orpheus-f3a39'})

    this.firebaseDB = firebase.firestore()

    this.textureLoader = new THREE.TextureLoader()

    this.voronoi = new Voronoi()
    this.relaxIterations = 0
    this.groundSize = 400

    this.hashes = [
      //'000000000000000000a3ccaa60d0f98276b24e0b0f4c145477805e4181325140',
      //'000000000000000074953313ca30236fafe09ebd7b990f69e31778cf54c33de6',
      '00000000000000000043eaeb09b0d6b25e564068a130642fab809ed91e1acfcc',
      //'0000000000000587556425a377c751a40d61fe1156c2e6b16e844fdc38c252b7',
      //'00000000000000000088092c77b76f59f7294ef68b361a23c8827cc6bc3fe29f',
    ]

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.001)

    // renderer
    this.renderer = new THREE.WebGLRenderer({antialias: Config.scene.antialias})
    this.renderer.setClearColor(Config.scene.bgColor)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    document.body.appendChild(this.renderer.domElement)

    // camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 5000)
    this.camera.position.set(0.0, 20.0, 0.0)
    //this.camera.lookAt(-10.0, -20.0, 0.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 3500

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    // objects
    this.addLights()
    this.addObjects()

    // animation loop
    this.animate()

  }

  addLights(scene) {

    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xffffff)
    light.position.set(1000, 300, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      //light.shadow.bias = 0.0000001
      //light.shadow.radius = 0.1
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)

  }

  init() {}

  addObjects() {

    this.hashes.forEach(function(hash, hashIndex) {

      let offset = (this.groundSize * hashIndex) - this.groundSize / 2

      this.getBlock(hash).then(function(block) {

        this.currentBlock = block

        let pointCount = this.currentBlock.n_tx

        let sites = []
        for (let i = 0; i < pointCount; i++) {
          sites.push(
						{
							x: Math.random(),
							y: Math.random()
						}
					)
        }

        this.diagram = this.voronoi.compute(sites, {
          xl: 0,
          xr: 1,
          yt: 0,
          yb: 1
        })

        for (let i = 0; i < this.relaxIterations; i++) {
          this.relaxSites()
        }

        let group = new THREE.Group()
        this.scene.add(group)

        this.cubeUrls = [
          'right.png',
          'left.png',
          'top.png',
          'bot.png',
          'front.png',
          'back.png'
        ]

				this.bgMap = new THREE.CubeTextureLoader().setPath('./assets/textures/skybox/').load(this.cubeUrls)
        this.bgMap.mapping = THREE.CubeRefractionMapping

        this.scene.background = this.bgMap

        let material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1.0,
          roughness: 0.4,
          refractionRatio: 0.88,
          opacity: 0.8,
          reflectivity: 1.0,
          side: THREE.DoubleSide,
          transparent: true,
          envMap: this.bgMap
        })

        this.currentBlock.tx.forEach((tx, index) => {

          // convert from satoshis
          let btcValue = tx.value / 100000000

          let extrudeAmount = btcValue + 0.1

          // lookup cell
          let cell = this.diagram.cells[index]

          let points = []
          for (let i = 0; i < cell.halfedges.length; i++) {
            let start = cell.halfedges[i].getStartpoint()
            points.push(new THREE.Vector2(start.x, start.y).multiplyScalar(this.groundSize))
          }

          let shape = new THREE.Shape(points)

          let mesh = new THREE.Mesh(new ExtrudeBufferGeometry(shape, {
            steps: 1,
            amount: extrudeAmount
          }), material)

          mesh.rotation.set(-Math.PI / 2, 0.0, 0.0)
          mesh.position.set(offset, 0, this.groundSize / 2)

          mesh.castShadow = true
          mesh.receiveShadow = true

          group.add(mesh)

        })

      }.bind(this))

    }.bind(this))

  }

  getBlock(hash) {

    return new Promise((resolve, reject) => {

      // get from firebase
      let blockRef = this.firebaseDB.collection('blocks').doc(hash)

      blockRef.get().then(function(doc) {

        if (doc.exists) {

          resolve(doc.data())

        } else {

          console.log('grabbing data from API')

          // get from API
          blockexplorer.getBlock(hash).then(function(block) {

            // sort transactions by value ascending
            block.tx.sort(function(a, b) {

              let transactionValueA = 0
              a.out.forEach((output, index) => {
                transactionValueA += output.value
              })
              a.value = transactionValueA

              let transactionValueB = 0
              b.out.forEach((output, index) => {
                transactionValueB += output.value
              })
              b.value = transactionValueB

              // return transactionValueA - transactionValueB

            })

            // store in cache
            let transactions = []
            block.tx.forEach((tx) => {
              let txObj = {
                value: tx.value
              }
              transactions.push(txObj)
            })

            this.firebaseDB.collection('blocks').doc(block.hash).set({hash: block.hash, height: block.height, prev_block: block.prev_block, n_tx: block.n_tx, tx: transactions}).then(function() {
              console.log("Document successfully written!")
            }).catch(function(error) {
              console.error("Error writing document: ", error)
            })

						resolve(block)

          }.bind(this)).catch(function(error) {
            console.log('Error getting document:', error)
          })

        }

      }.bind(this)).catch(function(error) {
        console.log('Error getting document:', error)
      })

    })

  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }

  // Lloyds relaxation methods credit: http://www.raymondhill.net/voronoi/rhill-voronoi-demo5.html
  cellArea(cell) {

    let area = 0,
      halfedges = cell.halfedges,
      halfedgeIndex = halfedges.length,
      halfedge,
      startPoint,
      endPoint

    while (halfedgeIndex--) {
      halfedge = halfedges[halfedgeIndex]
      startPoint = halfedge.getStartpoint()
      endPoint = halfedge.getEndpoint()
      area += startPoint.x * endPoint.y
      area -= startPoint.y * endPoint.x
    }

    return area / 2

  }

  cellCentroid(cell) {

    let x = 0,
      y = 0,
      halfedges = cell.halfedges,
      halfedgeIndex = halfedges.length,
      halfedge,
      v,
      startPoint,
      endPoint

    while (halfedgeIndex--) {
      halfedge = halfedges[halfedgeIndex]
      startPoint = halfedge.getStartpoint()
      endPoint = halfedge.getEndpoint()
      let vector = startPoint.x * endPoint.y - endPoint.x * startPoint.y
      x += (startPoint.x + endPoint.x) * vector
      y += (startPoint.y + endPoint.y) * vector
    }

    v = this.cellArea(cell) * 6

    return {
      x: x / v,
      y: y / v
    }

  }

  relaxSites() {

    let cells = this.diagram.cells,
      cellIndex = cells.length,
      cell,
      site,
      sites = [],
      rn,
      dist

    let p = 1 / cellIndex * 0.1

    while (cellIndex--) {
      cell = cells[cellIndex]
      rn = Math.random()

      site = this.cellCentroid(cell)

      dist = new THREE.Vector2(site).distanceTo(new THREE.Vector2(cell.site))

      // don't relax too fast
      if (dist > 2) {
        site.x = (site.x + cell.site.x) / 2
        site.y = (site.y + cell.site.y) / 2
      }

      // probability of mytosis
      if (rn > (1 - p)) {
        dist /= 2
        sites.push({
          x: site.x + (site.x - cell.site.x) / dist,
          y: site.y + (site.y - cell.site.y) / dist
        })
      }

      sites.push(site)

    }

    this.diagram = this.voronoi.compute(sites, {
      xl: 0,
      xr: 1,
      yt: 0,
      yb: 1
    })

  }

}
