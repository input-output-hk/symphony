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

    firebase.initializeApp({
      apiKey: 'AIzaSyD92ewqzwYPP6L4-XmlU3LucH74n8Xa6tw',
      authDomain: 'orpheus-f3a39.firebaseapp.com',
      projectId: 'orpheus-f3a39'
    })

    this.firebaseDB = firebase.firestore()

    this.textureLoader = new THREE.TextureLoader()

    this.voronoi = new Voronoi()
    this.relaxIterations = 0
    this.groundSize = 200

    this.hashes = [
      '000000000000000000a3ccaa60d0f98276b24e0b0f4c145477805e4181325140',
      //'000000000000000074953313ca30236fafe09ebd7b990f69e31778cf54c33de6',
      //'00000000000000000043eaeb09b0d6b25e564068a130642fab809ed91e1acfcc',
      //'0000000000000587556425a377c751a40d61fe1156c2e6b16e844fdc38c252b7',
      //'00000000000000000088092c77b76f59f7294ef68b361a23c8827cc6bc3fe29f',
    ]

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.01)

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
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 500)
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
    light.castShadow = true
    light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
    light.shadow.bias = 0.002
    light.shadow.radius = 1
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048
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
          sites.push({x: Math.random(), y: Math.random()})
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
          'back.png',
        ]

        this.bgMap = new THREE.CubeTextureLoader().setPath('./assets/textures/skybox/').load(this.cubeUrls)
        this.bgMap.mapping = THREE.CubeRefractionMapping

        this.scene.background = this.bgMap

        let material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 1.0,
          roughness: 0.4,
          refractionRatio: 0.88,
          //opacity: 0.8,
          reflectivity: 1.0,
          //side: THREE.DoubleSide,
          //transparent: true,
          envMap: this.bgMap,
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

          let mesh = new THREE.Mesh(
            new THREE.ExtrudeBufferGeometry(
                shape,
                {
                  steps: 1,
                  bevelSegments: 1,
                  amount: extrudeAmount,
                  bevelEnabled: true,
                  bevelThickness: 5,
                  bevelSize: 1,
                }
            ),
            material
          )

          mesh.rotation.set(-Math.PI/2, 0.0, 0.0)
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

              return transactionValueA - transactionValueB

            })

            // store in cache
            let transactions = []
            block.tx.forEach((tx) => {
              let txObj = {
                value: tx.value
              }
              transactions.push(txObj)
            })

            this.firebaseDB.collection('blocks').doc(block.hash).set({
              hash: block.hash,
              height: block.height,
              prev_block: block.prev_block,
              n_tx: block.n_tx,
              tx: transactions
            })
            .then(function() {
              console.log("Document successfully written!");
            })
            .catch(function(error) {
              console.error("Error writing document: ", error);
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
