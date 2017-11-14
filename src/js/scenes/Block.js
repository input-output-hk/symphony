'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'

import {
  ExtrudeCrystalBufferGeometry
} from '../geometries/ExtrudeCrystalGeometry'
// import {
//   ConvexGeometry
// } from '../geometries/ConvexGeometry'

import TSNE from '../helpers/tsne'
import Tone from 'tone'

let OrbitControls = OrbitContructor(THREE)

export default class Block {
  constructor (block) {
    this.currentBlock = block

    this.notes = {
      55.000: 'A1',
      58.270: 'A#1',
      61.735: 'B1',
      65.406: 'C1',
      69.296: 'C#1',
      73.416: 'D1',
      77.782: 'D#1',
      82.407: 'E1',
      87.307: 'F1',
      92.499: 'F#1',
      97.999: 'G1',
      103.826: 'G#1',
      110.000: 'A2',
      116.541: 'A#2',
      123.471: 'B2',
      130.813: 'C2',
      138.591: 'C#2',
      146.832: 'D2',
      155.563: 'D#2',
      164.814: 'E2',
      174.614: 'F2',
      184.997: 'F#2',
      195.998: 'G2',
      207.652: 'G#2',
      220.000: 'A3',
      233.082: 'A#3',
      246.942: 'B3',
      261.626: 'C3',
      277.183: 'C#3',
      293.665: 'D3',
      311.127: 'D#3',
      329.628: 'E3',
      349.228: 'F3',
      369.994: 'F#3',
      391.995: 'G3',
      415.305: 'G#3',
      440.000: 'A3',
      466.164: 'A#3',
      493.883: 'B3',
      523.251: 'C4',
      554.365: 'C#4',
      587.330: 'D4',
      622.254: 'D#4',
      659.255: 'E4',
      698.456: 'F4',
      739.989: 'F#4',
      783.991: 'G4',
      830.609: 'G#4'
    }

    this.loading = true

    this.modes = {
      'ionian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'B',
        'C'
      ],
      'dorian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'phrygian': [
        'C',
        'C#',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'lydian': [
        'C',
        'D',
        'E',
        'F#',
        'G',
        'A',
        'B',
        'C'
      ],
      'mixolydian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'aeolian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'locrian': [
        'C',
        'C#',
        'D#',
        'F',
        'F#',
        'G#',
        'A#',
        'C'
      ]
    }

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

    this.camera.position.set(0.0, 0.0, 5.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    this.addLights()

    // sound
    this.setupSound().then(() => {
      // objects
      this.addObjects()

      // animation loop
      this.animate()
    })
  }

  loadSound () {
    Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    this.controls.addEventListener('change', function () {
      Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    }.bind(this))

    let cameraForwardVector = new THREE.Vector3()
    let quaternion = new THREE.Quaternion()
    cameraForwardVector.set(0, 0, -1).applyQuaternion(quaternion)

    Tone.Listener.setOrientation(cameraForwardVector.x, cameraForwardVector.y, cameraForwardVector.z, this.camera.up.x, this.camera.up.y, this.camera.up.z)

    return new Promise((resolve, reject) => {
      resolve()

      /* this.sampler = new Tone.Sampler({
         'C3': this.assetsDir + 'sounds/1.wav',
         'D#3': this.assetsDir + 'sounds/2.wav'
       }, function (sampler) {
         resolve(sampler)
       //}).chain(this.pingPong, this.convolver, this.masterVol)
       })*/

    })
  }

  setupSound () {

    return new Promise((resolve, reject) => {
      this.bpm = 120

      this.masterVol = new Tone.Volume(-24).toMaster()

      this.convolver = new Tone.Convolver(this.assetsDir + 'sounds/IR/r1_ortf.wav')
      this.convolver.set('wet', 1.0)

      this.pingPong = new Tone.PingPongDelay('16n', 0.85)

      Tone.Transport.bpm.value = this.bpm

      this.loadSound().then(() => {
        console.log('sound loaded')

        resolve()

        Tone.Transport.start()
      })
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

    let maxZ = 0
    let minZ = Number.MAX_SAFE_INTEGER

    // add coords from TSNE to array
    let sites = []
    let zValues = []
    for (let i = 0; i < this.pointCount; i++) {

      let coords = this.TSNESolution[i]

      maxZ = Math.max(coords[2], maxZ)
      minZ = Math.min(coords[2], minZ)

      zValues.push(coords[2])

      sites.push({
        x: coords[0],
        y: coords[1],
        z: coords[2]
      })
    }

    Array.prototype.scaleBetween = function (scaledMin, scaledMax) {
      var max = Math.max.apply(Math, this)
      var min = Math.min.apply(Math, this)
      return this.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin)
    }

    zValues = zValues.scaleBetween(55.000, 523.251)

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

    let noteTotal = 40
    let noteCount = 0

    this.currentBlock.tx.forEach((tx, index) => {
      // convert from satoshis
      let btcValue = tx.output / 100000000

      let extrudeAmount = Math.log(btcValue + 1.5)

      // lookup cell
      let centroid = sites[index]

      let zValue = zValues[index]

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

      let sideLength

      for (let i = 0; i < totalPoints; i++) {
        sideLength = closest / 200
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

      if (sideLength > 0.0005) {
        noteCount++

        if (noteCount < noteTotal) {
          // add positional audio
          let panner = new Tone.Panner3D().chain(this.masterVol)
          panner.refDistance = 6
          panner.rolloffFactor = 50
          panner.setPosition(centroid.x, centroid.y, centroid.z)

          // get closest note

          let minDiff = Number.MAX_SAFE_INTEGER
          let note = 'C1'

          // filter out notes not in mode

          let mode = this.modes.locrian

          for (var frequency in this.notes) {
            if (this.notes.hasOwnProperty(frequency)) {
              let noteName = this.notes[frequency].replace(/[0-9]/g, '')

              if (mode.indexOf(noteName) !== -1) {
                let diff = Math.abs(zValue - frequency)
                if (diff < minDiff) {
                  minDiff = diff
                  note = this.notes[frequency]
                }
              }
            }
          }


          let fileName = this.assetsDir + 'sounds/kalimba/' + note.replace('#', 'S') + '.mp3'

          let sampler = new Tone.Sampler({
            [note]: fileName
          }, function () {
            new Tone.Loop((time) => {
              sampler.triggerAttack(note, '@16n', extrudeAmount)
            }, '1m').start(Math.random() * 100)
          })

          sampler.fan(panner)

          crystal.panner = panner
        }
      }
    })

    document.getElementById('loading').style.display = 'none'

    this.group.rotation.x = -Math.PI / 2
  }

  runTSNE () {
    if (this.pointCount < 50) {
      this.tsneIterations = 1
    } else if (this.pointCount < 200) {
      this.tsneIterations = 5
    } else if (this.pointCount < 500) {
      this.tsneIterations = 10
    } else if (this.pointCount < 1000) {
      this.tsneIterations = 20
    } else {
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
    this.group.rotation.z += 0.005

    this.group.children.forEach((crystal, index) => {
      if (typeof crystal.panner !== 'undefined') {
        var vector = new THREE.Vector3()
        vector.setFromMatrixPosition(crystal.children[0].matrixWorld)
        crystal.panner.setPosition(vector.x, vector.y, vector.z)
        // console.log('setpos')
      }
    })

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }


  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
