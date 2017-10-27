'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'

import {
  ExtrudeCrystalBufferGeometry
} from '../geometries/ExtrudeCrystalGeometry'
import {
  ConvexGeometry
} from '../geometries/ConvexGeometry'

import TSNE from '../helpers/tsne'
import Tone from 'tone'

let OrbitControls = OrbitContructor(THREE)

export default class Block {
  constructor (block) {
    this.currentBlock = block

    this.assetsDir = '/static/assets/'

    this.textureLoader = new THREE.TextureLoader()

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.000001)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas,
      alpha: true
    })
    this.renderer.setClearColor(Config.scene.bgColor, 0.0)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    // camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(0.0, 5.0, 15.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    // objects
    this.addLights()
    this.addObjects()

    // sound
    this.setupSound()
    
    // animation loop
    this.animate()
  }
  
  loadSound () {

    return new Promise((resolve, reject) => {

      this.sampler = new Tone.Sampler({
        'C3': this.assetsDir + 'sounds/1.wav',
        'D#3': this.assetsDir + 'sounds/2.wav'
      }, function () {
  
        resolve()
  
      }).chain(this.pingPong, this.convolver, this.masterVol)

    })

  }

  setupSound () {

    this.bpm = 120

    this.masterVol = new Tone.Volume(-6).toMaster()

    this.convolver = new Tone.Convolver(this.assetsDir + 'sounds/IR/r1_ortf.wav')
    this.convolver.set('wet', 1.0)

    this.pingPong = new Tone.PingPongDelay('16n', 0.85)

    Tone.Transport.bpm.value = this.bpm

    this.loadSound().then(() => {

      new Tone.Loop((time) => {

        this.sampler.triggerAttack('C3', '@1n')
        this.sampler.triggerAttack('D#3', '@2n')
        this.sampler.triggerAttack('D#4', '@8n')
        this.sampler.triggerAttack('C2', '@1m')

      }, '1m').start(0)

      Tone.Transport.start()

    })

  }


  addLights (scene) {
    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xffffff)
    light.position.set(10000, 300, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)
  }

  addObjects () {
    this.pointCount = this.currentBlock.n_tx

    console.log('Block contains ' + this.pointCount + ' transactions')

    this.runTSNE()

    // add coords from TSNE to array
    let sites = []
    for (let i = 0; i < this.pointCount; i++) {
      let coords = this.TSNESolution[i]
      sites.push({
        x: coords[0],
        y: coords[1],
        z: coords[2]
      })
    }

    this.group = new THREE.Group()
    this.scene.add(this.group)

    // convert points to three js vectors for convex hull
    let v3Points = []
    for (var i = 0; i < sites.length; i++) {
      let point = sites[i]
      v3Points.push(new THREE.Vector3(point.x, point.y, point.z))
    }

    // if (Config.scene.showConvexHull) {
    //      this.addConvexHull(v3Points)
    // }

    this.setupMaterials()

    this.currentBlock.tx.forEach((tx, index) => {
      // convert from satoshis
      let btcValue = tx.output / 100000000

      let extrudeAmount = Math.log(btcValue + 1.5)

      // lookup cell
      let centroid = sites[index]

      let centroidVector = new THREE.Vector2(centroid.x, centroid.y)

      let closest = Number.MAX_SAFE_INTEGER

      for (var i = 0; i < sites.length; i++) {
        let site = new THREE.Vector2(sites[i].x, sites[i].y)
        let distance = site.distanceTo(centroidVector)

        if (distance > 0) {
          closest = Math.min(distance, closest)
        }
      }

      let shapePoints = []
      let totalPoints = 6

      for (let i = 0; i < totalPoints; i++) {
        let sideLength = closest / 50
        sideLength = Math.min(sideLength, 0.003)
        let angle = i / totalPoints * Math.PI * 2
        shapePoints.push(
          new THREE.Vector2(
            Math.cos(angle) * sideLength,
            Math.sin(angle) * sideLength
          ).multiplyScalar(100)
        )
      }

      let shape = new THREE.Shape(shapePoints)

      let mesh = new THREE.Mesh(new ExtrudeCrystalBufferGeometry(shape, {
        steps: 1,
        amount: extrudeAmount / 20
      }), this.crystalMaterial)

      mesh.position.set(centroid.x, centroid.y, centroid.z)

      mesh.castShadow = true
      mesh.receiveShadow = true

      let crystal = new THREE.Group()

      crystal.add(mesh)

      // crudely copy and flip todo: change this
      let rotated = mesh.clone()
      rotated.rotation.y = Math.PI
      crystal.add(rotated)

      this.group.add(crystal)
    })

    this.group.rotation.x = -Math.PI / 2
  }

  runTSNE () {
    switch (this.pointCount) {
      case this.pointCount < 100:
        this.tsneIterations = 2
        break

      case this.pointCount < 50:
        this.tsneIterations = 1
        break

      default:
        this.tsneIterations = 30
    }

    let TSNEOptions = {}
    TSNEOptions.epsilon = 100
    TSNEOptions.perplexity = 30 // roughly how many neighbours each point influences

    TSNEOptions.dim = 3 // dimensionality of the embedding

    let tsne = new TSNE(TSNEOptions)

    let transactionData = []
    for (var i = 0; i < this.currentBlock.tx.length; i++) {
      transactionData.push(
        [
          this.currentBlock.tx[i].output,
          this.currentBlock.tx[i].time,
          this.currentBlock.tx[i].size,
          this.currentBlock.tx[i].weight
        ]
      )
    }

    tsne.initDataRaw(transactionData)

    for (var k = 1; k <= this.tsneIterations; k++) {
      tsne.step()
      console.log('Completed TSNE step ' + k + ' of ' + this.tsneIterations)
    }

    this.TSNESolution = tsne.getSolution()
  }

  addConvexHull (points) {
    // Convex Hull
    var CVgeometry = new ConvexGeometry(points)
    var CVmaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.05,
      transparent: true
    })
    var CVmesh = new THREE.Mesh(CVgeometry, CVmaterial)

    CVmesh.rotation.set(0.0, Math.PI, Math.PI)

    this.scene.add(CVmesh)
  }

  setupMaterials () {
    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath(this.assetsDir + 'textures/').load(this.cubeMapUrls)
    // this.bgMap.mapping = THREE.CubeRefractionMapping

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 1.0,
      side: THREE.DoubleSide,
      transparent: false,
      envMap: this.bgMap
      // wireframe: true,
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render () {
    this.group.rotation.z += 0.0005

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
