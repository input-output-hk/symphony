'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'
import {
   ConvexGeometry
} from '../../../functions/ConvexGeometry'
import loader from '../../utils/loader'
import Tone from 'tone'
import { getDay } from '../../data/btc'
import format from '../../utils/dateformat'
import moment from 'moment'
let OrbitControls = OrbitContructor(THREE)
let merkle = require('../merkle-tree-gen')
const TWEEN = require('@tweenjs/tween.js')
const BrownianMotion = require('../motions/BrownianMotion')

export default class Day {
  constructor (blocks, currentDate) {
    this.blocks = blocks
    this.currentDate = currentDate

    this.daysLoaded = 1
    this.daysToLoad = 4 // how many days to load in the future?

    this.panners = []

    this.defaultCameraPosition = new THREE.Vector3()
    this.defaultCameraRotation = new THREE.Quaternion()

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

    this.cameraMoveEvent = new Event('cameraMove')

    this.assetsDir = '/static/assets/'

    this.currentBlock = null
    this.currentBlockObject = null
    this.crystalOpacity = 0.5

    this.view = 'day' // can be 'day' or 'block'

    this.brownianMotionCamera = new BrownianMotion()

    this.mouseStatic = true
    this.mouseMoveTimeout = null

    this.mouseX = 0
    this.mouseY = 0
    this.targetMouseX = 0
    this.targetMouseY = 0

    // keep track of each of the block within a day
    this.dayGroups = []
    this.lineGroups = []

    this.textureLoader = new THREE.TextureLoader()

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.00015)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas,
      alpha: true
    })

    this.isAnimating = false

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)

    this.renderer.autoClear = false

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    // camera
    this.initialCameraPos = new THREE.Vector3(0.0, 0.0, 2300.0)

    this.defaultCameraPosition = new THREE.Vector3()
    this.defaultCameraRotation = new THREE.Quaternion()

    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z)
    this.camera.updateMatrixWorld()

    this.camPos = this.camera.position.clone()
    this.targetPos = this.camPos.clone()
    this.origin = new THREE.Vector3(0, 0, 0)
    this.lookAtPos = new THREE.Vector3(0, 0, 0)
    this.targetLookAt = new THREE.Vector3(0, 0, 0)

    this.camera.lookAt(this.lookAtPos)
    let toRotation = new THREE.Euler().copy(this.camera.rotation)
    this.fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    this.toQuaternion = new THREE.Quaternion().setFromEuler(toRotation)
    this.moveQuaternion = new THREE.Quaternion()
    //this.camera.quaternion.set(this.moveQuaternion)

    this.defaultCameraPosition.copy(this.camera.position)
    this.defaultCameraRotation.copy(this.camera.quaternion)

    // are we focussed on a block?
    this.focussed = false

    window.camera = this.camera

    // controls
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    //this.controls.minDistance = 0
    //this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    this.setupSound().then(() => {

      /*
        Temp loading mechanism
      */
    // loader.get('convexHull')
    //   .then(({ data }) => {

        //  this.templateGeometry = new THREE.BufferGeometryLoader().parse(data)
          this.addEvents()

          // objects
          this.addLights()
          this.setupMaterials()
          this.addObjects()

          this.moveCamera()

          // animation loop
          this.animate()
  //     })
    })

  }

  loadSound () {
    Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)

    document.addEventListener('cameraMove', function () {
      Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    }.bind(this), false)

    /*this.controls.addEventListener('change', function () {
      Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
    }.bind(this))*/

    let cameraForwardVector = new THREE.Vector3()
    let quaternion = new THREE.Quaternion()
    cameraForwardVector.set(0, 0, -1).applyQuaternion(quaternion)

    Tone.Listener.setOrientation(cameraForwardVector.x, cameraForwardVector.y, cameraForwardVector.z, this.camera.up.x, this.camera.up.y, this.camera.up.z)

    return new Promise((resolve, reject) => {
      resolve()
    })
  }

  setupSound () {

    return new Promise((resolve, reject) => {
      this.bpm = 120

      this.masterVol = new Tone.Volume(0).toMaster()

      this.convolver = new Tone.Convolver(this.assetsDir + 'sounds/IR/r1_ortf.wav')
      this.convolver.set('wet', 1.0)

      this.pingPong = new Tone.PingPongDelay('16n', 0.85)

      Tone.Transport.bpm.value = this.bpm

      this.loadSound().then(() => {
        console.log('sound loaded!')
        Tone.Transport.start()
        resolve()
      })
    })
  }

  addEvents () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
    this.mousePos = new THREE.Vector2()


    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onkeydown.bind(this), false)
  }

  onkeydown (event) {
    var isEscape = false
    if ('key' in event) {
      isEscape = (event.key === 'Escape' || event.key === 'Esc')
    } else {
      isEscape = (event.keyCode === 27)
    }
    if (isEscape) {
      this.resetDayView()
    }
  }

  resetDayView () {
    this.view = 'day'

    this.removeTrees()

    this.animateCamera(this.initialCameraPos, new THREE.Vector3(0.0, 0.0, 0.0), 3000)

    this.focussed = false
    this.isAnimating = false
    this.toggleBlocks(true)

    if (this.currentBlockObject) {
     /* new TWEEN.Tween( this.currentBlockObject.material )
      .to( { opacity: this.crystalOpacity }, 1000 )
      .start()*/
    }
  }

  removeTrees () {
    this.panners.forEach((panner) => {
      panner.dispose()
    })

    this.panners = []

    if (typeof this.treeGroup !== 'undefined') {
      this.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    if (this.view === 'block') {
      return
    }

    this.raycaster.setFromCamera({x: this.targetMouseX, y: this.targetMouseY}, this.camera)

    this.dayGroups.forEach((group) => {
      var intersects = this.raycaster.intersectObjects(group.children)
      if (intersects.length > 0) {

        let blockObject = intersects[0].object

        this.currentBlockObject = blockObject

        let lookAtPos = blockObject.getWorldPosition().clone()

        let blockDir = blockObject.getWorldPosition().clone().normalize()
        //let newCamPos = blockObject.getWorldPosition().clone().add(blockDir.multiplyScalar(30))
        let newCamPos = blockObject.getWorldPosition().clone()
        newCamPos.z += 150.0

        this.animateCamera(newCamPos, lookAtPos, 3000).then(() => {
          this.buildSingleTree(blockObject)
        })

      }
    })
  }

  toggleBlocks (visibility) {
    /*this.dayGroups.forEach((group) => {
      group.visible = visibility
    }, this)

    this.lineGroups.forEach((group) => {
      group.visible = visibility
    }, this)*/
  }

  buildSingleTree (blockObject) {

    let block = blockObject.blockchainData
    
    this.currentBlock = block

    this.angle = 25.0 + (block.output % 100)

    this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
    this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
    this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
    this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
    this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
    this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
    this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

    let sortedTree

    let position = blockObject.getWorldPosition().clone()
    let rotation = blockObject.getWorldRotation().clone()
    
    /*new TWEEN.Tween( blockObject.material )
    .to( { opacity: 0 }, 4000 )
    .onComplete(() => {
    })
    .start()*/

    this.view = 'block'
    this.toggleBlocks(false)
      
    this.removeTrees()
    this.treeGroup = new THREE.Group()
    this.treeGroup.position.set(position.x, position.y, position.z)
    this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
    this.scene.add(this.treeGroup)

    // create an array of ints the same size as the number of transactions in this block
    let tx = []
    for (let index = 0; index < block.n_tx; index++) {
      tx.push(index.toString())
    }

    var args = {
      array: tx,
      hashalgo: 'md5',
      hashlist: true
    }
    // console.time('merkle')
    merkle.fromArray(args, function (err, tree) {
      if (!err) {
        // console.log('Root hash: ' + tree.root)

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

        this.points = []

        let startingPosition = new THREE.Vector3(0, 0, 0)
        let direction = new THREE.Vector3(0, 1, 0)

        this.currentBlock.endNodes = []

        this.build(sortedTree, startingPosition, direction, this, true)

        let seen = []
        let reducedArray = []
        this.currentBlock.endNodes.forEach((nodePos, index) => {

          let position = {
            x: Math.ceil(nodePos.x / 10) * 10,
            y: Math.ceil(nodePos.y / 10) * 10,
            z: Math.ceil(nodePos.z / 10) * 10
          }

          let key = JSON.stringify(position)

          if (seen.indexOf(key) === -1) {
            seen.push(key)
            nodePos.y = Math.abs(nodePos.y) * 10
            reducedArray.push(nodePos)
          }

        })

        let noteTotal = 40
        let noteCount = 0

        reducedArray.forEach((point) => {
          noteCount++
          if (noteCount < noteTotal) {

            let pointVector = new THREE.Vector3(point.x, point.y, point.z)
            let offsetPosition = pointVector.add(position.clone())

            // add positional audio
            let panner = new Tone.Panner3D().chain(this.masterVol)
            panner.refDistance = 1000
            //panner.rolloffFactor = 50
            panner.setPosition(offsetPosition.x, offsetPosition.y, offsetPosition.z)

            this.panners.push(panner)

            // get closest note
            let minDiff = Number.MAX_SAFE_INTEGER
            let note = 'C1'

            let mode = this.modes.locrian
            for (var frequency in this.notes) {
              if (this.notes.hasOwnProperty(frequency)) {
                let noteName = this.notes[frequency].replace(/[0-9]/g, '')
                if (mode.indexOf(noteName) !== -1) { // filter out notes not in mode
                  let diff = Math.abs(point.y - frequency)
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
                sampler.triggerAttack(note, '@16n', 1.0)
              }, '1m').start(Math.random() * 100)
            })

            sampler.fan(panner)

          }
        })

      }
    }.bind(this))
    // console.timeEnd('merkle')
  }

  animateCamera (target, lookAt, duration) {

    return new Promise((resolve, reject) => {

      if (this.isAnimating) {
        console.log('animating')
        return
      }
      this.isAnimating = true

      this.targetPos = target.clone()
      this.targetLookAt = lookAt.clone()

      // grab initial postion/rotation
      let fromPosition = new THREE.Vector3().copy(this.camera.position)

      this.camera.position.set(this.targetPos.x, this.targetPos.y, this.targetPos.z)

      // reset original position and rotation
      this.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)

      var tweenVars = { time: 0 }

      this.transitionDuration = duration ? duration : 2000
      this.easing = TWEEN.Easing.Quartic.InOut

      new TWEEN.Tween(tweenVars)
      .to({time: 1}, this.transitionDuration)
      .onUpdate(function () {
        this.moveCamera(tweenVars.time)
      }.bind(this))
      .easing(this.easing)
      .onComplete(function () {
        this.isAnimating = false

        resolve()

      }.bind(this))
      .start()

    })

  }

  moveCamera (time) {
    this.camPos.lerp(this.targetPos, 0.05)
    this.camera.position.copy(this.camPos)
    this.lookAtPos.lerp(this.targetLookAt, 0.05)
  }

  onDocumentMouseMove (event) {
    var rect = this.renderer.domElement.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    this.targetMouseX = x / window.innerWidth * 2 - 1
    this.targetMouseY = 1 - y / window.innerHeight * 2

    this.mouseStatic = false

    clearTimeout(this.mouseMoveTimeout)
    this.mouseMoveTimeout = setTimeout(
      () => {
        this.mouseStatic = true
      },
      600
    )
  }

  addLights (scene) {
    let ambLight = new THREE.AmbientLight(0xf1d0c5)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xeee6a5)
    light.position.set(100, 30, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)
  }

  loadPrevDay() {

    this.nextDay = moment(this.currentDate).add(this.daysLoaded, 'days').format('YYYY-MM-DD'),

    getDay(moment(this.nextDay).toDate(), this.daysLoaded)
      .then(({ blocks, fee, date, input, output, index }) => {
        this.addDay(blocks, index)
      })
  }

  addObjects () {
    this.addDay(this.blocks, this.daysLoaded)
    document.getElementById('loading').style.display = 'none'
  }

  addDay (blocks, index) {
    console.log('add day' + index)
    let group = new THREE.Group()

    this.dayGroups.push(group)

    let spiralPoints = []
    this.scene.add(group)

    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      let block = blocks[blockIndex]

      // TODO: set this from network health value
      this.angle = 25.0 + (block.output % 100)

      // create an array of ints the same size as the number of transactions in this block
      let tx = []
      for (let index = 0; index < block.n_tx; index++) {
        tx.push(index.toString())
      }

      let sortedTree

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

      var args = {
        array: tx,
        hashalgo: 'md5',
        hashlist: true
      }

      merkle.fromArray(args, function (err, tree) {
        if (!err) {
          this.totalLevels = tree.levels
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

          this.points = []

          let startingPosition = new THREE.Vector3(0, 0, 0)
          let direction = new THREE.Vector3(0, 1, 0)

          this.build(sortedTree, startingPosition, direction, this)

          // Convex Hull
          if (this.points.length > 3) {
            // console.time('convex')
            let CVgeometry = new ConvexGeometry(this.points)
            // console.timeEnd('convex')
            //let CVmesh = new THREE.Mesh(this.templateGeometry, this.crystalMaterial.clone())
            let CVmesh = new THREE.Mesh(CVgeometry, this.crystalMaterial.clone())

            CVmesh.blockchainData = block

            let rotation = ((10 * Math.PI) / blocks.length) * blockIndex
            CVmesh.rotation.z = rotation
            CVmesh.translateY(700 + (blockIndex * 4))

            CVmesh.rotation.z = 0
            CVmesh.rotation.x = Math.PI / 2
            CVmesh.rotation.y = rotation
            //CVmesh.translateY(blockIndex * 5)

            // add random rotation
            /*CVmesh.rotation.y = Math.random()
            CVmesh.rotation.x = Math.random()
            CVmesh.rotation.z = Math.random()*/

            group.add(CVmesh)

            spiralPoints.push(CVmesh.position)
          }
        }
      }.bind(this))

    }

    let material = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    })

    let curve = new THREE.CatmullRomCurve3(spiralPoints)
    let points = curve.getPoints(spiralPoints.length * 100)
    let geometry = new THREE.Geometry()
    geometry.vertices = points
    let line = new THREE.Line(geometry, material)

    group.translateZ(-(index * 1000))
    line.translateZ(-(index * 1000))

    let lineGroup = new THREE.Group()
    this.scene.add(lineGroup)

    lineGroup.add(line)

    this.lineGroups.push(lineGroup)
 // }

  }

  build (node, startingPosition, direction, context, visualise) {
    let magnitude = node.level

    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    this.points.push(startPosition)
    this.points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)

      var geometry = new THREE.TubeBufferGeometry(path, 1, (magnitude / 25), 6, false)
      var mesh = new THREE.Mesh(geometry, this.merkleMaterial.clone())

      this.treeGroup.add(mesh)
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

            this.build(childNode, endPosition, newDirection, context, visualise)
          } else {
            // no child nodes
            if (this.currentBlock) {
              this.currentBlock.endNodes.push(
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
    }
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

    this.bgMap = new THREE.CubeTextureLoader().setPath('/static/assets/textures/').load(this.cubeMapUrls)

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: this.crystalOpacity,
      side: THREE.DoubleSide,
      transparent: true,
      envMap: this.bgMap
    })

    this.merkleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 1.0,
      side: THREE.DoubleSide,
      transparent: false,
      envMap: this.bgMap,
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

    TWEEN.update()

    var vector = new THREE.Vector3(this.targetMouseX, this.targetMouseY, 0.5)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

    this.dayGroups.forEach((group) => {
      var intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        this.focussed = true
        this.mouseStatic = false
        if (intersects[0].object !== this.intersected) {
          if (this.intersected) {
            this.intersected.material.color.setHex(this.intersected.currentHex)
          }
          this.intersected = intersects[0].object
          this.intersected.currentHex = this.intersected.material.color.getHex()
          this.intersected.material.color.setHex(0xffffff)
        }
      } else {
        this.focussed = false
        if (this.intersected) {
          this.intersected.material.color.setHex(this.intersected.currentHex)
        }
        this.intersected = null
      }
    }, this)

    this.mousePos.x += (this.targetMouseX - this.mousePos.x) * 0.002
    this.mousePos.y += (this.targetMouseY - this.mousePos.y) * 0.002

    if (this.view === 'day') {

      let euler = new THREE.Euler(this.mousePos.y * 0.2, -this.mousePos.x * 0.2, 0)
      let quat = (new THREE.Quaternion).setFromEuler(euler)

      this.camera.lookAt(this.lookAtPos)

      this.camera.position.x += -this.mousePos.x
      this.camera.position.y += -0.3 - this.mousePos.y
      this.camera.position.z += this.mousePos.y
      this.camera.quaternion.premultiply(quat)

      document.dispatchEvent(this.cameraMoveEvent)
    }

    this.scene.updateMatrixWorld(true)

    /*if (this.mouseStatic && !this.focussed) {
      this.dayGroups.forEach((group) => {
        group.rotation.y -= 0.0002
      })
      this.lineGroups.forEach((group) => {
        group.rotation.y -= 0.0002
      })
    }*/

    if (this.view === 'block') {
      this.currentBlockObject.rotation.z += 0.002
      //this.currentBlockObject.rotation.y += 0.002
      //this.currentBlockObject.rotation.z += 0.002

      this.treeGroup.rotation.z += 0.002
      //this.treeGroup.rotation.y += 0.002
      //this.treeGroup.rotation.z += 0.002
    }

    // load in prev day?
    if (this.daysLoaded <= this.daysToLoad) {
      this.daysLoaded++
      this.loadPrevDay()
    }

    this.renderer.render(this.scene, this.camera)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
