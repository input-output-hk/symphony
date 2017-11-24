'use strict'

// libs
import * as THREE from 'three'
import Config from '../Config'
import { ConvexGeometry } from '../../../functions/ConvexGeometry'
import Audio from '../audio/audio'
import _ from 'lodash'
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6'
import FXAAShader from '../shaders/FXAA'
import HueSaturationShader from '../shaders/HueSaturation'
import RGBShiftShader from '../shaders/RGBShift'
import VignetteShader from '../shaders/Vignette'
import FilmShader from '../shaders/Film'
import BrightnessContrastShader from '../shaders/BrightnessContrast'
let merkle = require('../merkle-tree-gen')
const TWEEN = require('@tweenjs/tween.js')
const BrownianMotion = require('../motions/BrownianMotion')

export default class Day {
  constructor (blocks = [], currentDate = new Date()) {
    this.textureLoader = new THREE.TextureLoader()

    this.initState(blocks, currentDate)
    this.initRenderer()
    this.initCamera()

    this.composer = new EffectComposer(this.renderer)

    this.composer.setSize(window.innerWidth, window.innerHeight)

    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    this.RGBShiftPass = new ShaderPass(RGBShiftShader)
    this.composer.addPass(this.RGBShiftPass)

    this.FilmShaderPass = new ShaderPass(FilmShader)
    this.composer.addPass(this.FilmShaderPass)

    this.VignettePass = new ShaderPass(VignetteShader)
    this.composer.addPass(this.VignettePass)

    this.BrightnessContrastPass = new ShaderPass(BrightnessContrastShader)
    this.composer.addPass(this.BrightnessContrastPass)

    this.HueSaturationPass = new ShaderPass(HueSaturationShader)
    this.composer.addPass(this.HueSaturationPass)

    this.FXAAPass = new ShaderPass(FXAAShader)
    this.FXAAPass.renderToScreen = true
    this.composer.addPass(this.FXAAPass)

    this.audio = new Audio(this.camera)

    this.audio.init().then(() => {
      this.addEvents()
      this.addLights()
      this.setupMaterials()
      this.addObjects()
      this.moveCamera()
      this.animate()
    })
  }

  initState (blocks, currentDate) {
    this.state = {}
    this.state.focussed = false // are we focussed on a block?
    this.state.blocks = blocks
    this.state.currentDate = currentDate
    this.state.dayGroups = []
    this.state.lineGroups = []
    this.state.currentBlock = null
    this.state.currentBlockObject = null
    this.state.view = 'day' // can be 'day' or 'block'
  }

  initRenderer () {
    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.00015)
    this.scene.background = new THREE.Color(Config.scene.bgColor)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas
      // alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)
    this.renderer.autoClear = false
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false
  }

  initCamera () {
    this.defaultCameraPos = new THREE.Vector3(0.0, 0.0, 1600.0)

    this.cameraDriftLimitMax = {}
    this.cameraDriftLimitMax.x = 150.0
    this.cameraDriftLimitMax.y = 150.0
    this.cameraDriftLimitMin = {}
    this.cameraDriftLimitMin.x = -150.0
    this.cameraDriftLimitMin.y = -150.0
    this.cameraMoveStep = 100.0
    this.cameraLerpSpeed = 0.01

    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z)
    this.camera.updateMatrixWorld()

    this.camPos = this.camera.position.clone()
    this.targetPos = this.camPos.clone()
    this.lookAtPos = new THREE.Vector3(0, 0, 0)
    this.targetLookAt = new THREE.Vector3(0, 0, 0)

    this.camera.lookAt(this.lookAtPos)
    let toRotation = new THREE.Euler().copy(this.camera.rotation)
    this.fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    this.toQuaternion = new THREE.Quaternion().setFromEuler(toRotation)
    this.moveQuaternion = new THREE.Quaternion()

    window.camera = this.camera

    this.brownianMotionCamera = new BrownianMotion()

    this.cameraMoveEvent = new Event('cameraMove')

    /** oui({
      putSomeGUIShitHere: 'boom'
    }) */
  }

  addEvents () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = []
    this.mousePos = new THREE.Vector2()

    this.mouseStatic = true
    this.mouseMoveTimeout = null

    this.mouseX = 0
    this.mouseY = 0
    this.targetMouseX = 0
    this.targetMouseY = 0

    this.isAnimating = false

    this.selectBlock = new Event('selectBlock')

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    document.addEventListener('mousewheel', this.onDocumentMouseWheel.bind(this), false)
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onkeydown.bind(this), false)
  }

  onDocumentMouseWheel (event) {
    event.preventDefault()
    if (event.wheelDeltaY > 0) {
      this.targetPos.z -= this.cameraMoveStep
      this.targetLookAt.z -= this.cameraMoveStep
    } else {
      this.targetPos.z += this.cameraMoveStep
      this.targetLookAt.z += this.cameraMoveStep
    }
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
    this.removeTrees()

    this.animateBlockOut(this.state.currentBlockObject).then(() => {
      this.state.view = 'day'
      this.animateCamera(this.defaultCameraPos, new THREE.Vector3(0.0, 0.0, 0.0), 3000)
      this.state.focussed = false
      this.isAnimating = false
    })
  }

  removeTrees () {
    this.audio.unloadSound()

    if (typeof this.treeGroup !== 'undefined') {
      this.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    if (this.isAnimating) {
      return
    }

    document.dispatchEvent(this.selectBlock)

    this.raycaster.setFromCamera({x: this.targetMouseX, y: this.targetMouseY}, this.camera)

    const BreakException = {}

    try {
      this.state.dayGroups.forEach((group) => {
        var intersects = this.raycaster.intersectObjects(group.children)
        if (intersects.length > 0) {
          if (intersects[0].object === this.state.currentBlockObject) {
            throw BreakException
          }
          this.isAnimating = true
          let blockObject = intersects[0].object
          this.removeTrees()
          this.animateBlockOut(this.state.currentBlockObject).then(() => {
            this.animateBlockIn(blockObject).then(() => {
              this.buildSingleTree(blockObject)
              this.isAnimating = false
            })
          })
          throw BreakException
        }
      })
    } catch (error) {
      // ¯\_(ツ)_/¯
    }
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      let tweenVars = {
        blockPosX: fromPos.x,
        blockPosY: fromPos.y,
        time: 0
      }

      new TWEEN.Tween(tweenVars)
        .to(
        {
          blockPosX: toPos.x,
          blockPosY: toPos.y,
          time: 1
        },
          duration
        )
        .onUpdate(function () {
          blockObject.position.x = tweenVars.blockPosX
          blockObject.position.y = tweenVars.blockPosY

          // slerp to target rotation
          THREE.Quaternion.slerp(fromQuaternion, toQuaternion, moveQuaternion, tweenVars.time)
          blockObject.quaternion.set(moveQuaternion.x, moveQuaternion.y, moveQuaternion.z, moveQuaternion.w)
        })
        .easing(this.easing)
        .onComplete(function () {
          resolve()
        })
        .start()
    })
  }

  animateBlockOut (blockObject) {
    return new Promise((resolve, reject) => {
      if (blockObject) {
        let fromPos = blockObject.position.clone()
        let toPos = blockObject.initialPosition.clone()

        let targetRotation = blockObject.initialRotation.clone()
        let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
        let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

        this.animateBlock(
          blockObject,
          fromPos,
          fromQuaternion,
          toPos,
          toQuaternion,
          500
        ).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  animateBlockIn (blockObject) {
    return new Promise((resolve, reject) => {
      this.state.currentBlockObject = blockObject

      let blockPos = blockObject.position.clone()

      let targetRotation = new THREE.Euler(0.0, 0.0, 0.0)
      let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
      let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

      blockObject.initialPosition = blockObject.position.clone()
      blockObject.initialRotation = blockObject.rotation.clone()

      // focus camera on block
      let blockWorldPos = blockObject.getWorldPosition()
      this.targetLookAt.z = blockWorldPos.z
      this.targetPos.z = blockWorldPos.z + 400

      this.animateBlock(
        blockObject,
        blockPos,
        fromQuaternion,
        this.targetLookAt,
        toQuaternion,
        1000,
        true
      ).then(() => {
        resolve()
      })
    })
  }

  movetoBlock (hash) {
    let foundBlock = false
    this.state.dayGroups.forEach((group) => {
      group.children.forEach((blockObject) => {
        if (blockObject.blockchainData.hash === hash) {
          foundBlock = true
          this.state.currentBlockObject = blockObject
          let lookAtPos = blockObject.getWorldPosition().clone()
          let newCamPos = blockObject.getWorldPosition().clone()
          newCamPos.z += 450.0
          this.animateCamera(newCamPos, lookAtPos, 3000).then(() => {
            this.buildSingleTree(blockObject)
          })
        }
      })
    })

    if (!foundBlock) {
      this.resetDayView()
    }
  }

  buildSingleTree (blockObject) {
    let block = blockObject.blockchainData

    this.state.currentBlock = block

    this.angle = 5.0 + (block.output % 170)
    // this.angle = 90.0 + block.feeToValueRatio

    this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
    this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
    this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
    this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
    this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
    this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
    this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

    let sortedTree

    blockObject.updateMatrixWorld()

    let blockObjectPosition = blockObject.getWorldPosition().clone()
    let rotation = blockObject.getWorldRotation().clone()

    this.state.view = 'block'

    this.removeTrees()

    this.treeGroup = new THREE.Group()

    this.treeMesh = new THREE.Geometry()
    // this.treeGroup.add(this.treeMesh)
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
    merkle.fromArray(args, function (err, tree) {
      if (!err) {
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

        this.state.currentBlock.endNodes = []

        this.build(sortedTree, startingPosition, direction, this, true)

        if (this.points.length > 3) {
          let seen = []
          let reducedArray = []
          this.state.currentBlock.endNodes.forEach((nodePos, index) => {
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

          this.audio.generateMerkleSound(reducedArray, blockObjectPosition)

          this.treeMesh.computeBoundingBox()
          let boxSize = this.treeMesh.boundingBox.getSize()
          let boxCenter = this.treeMesh.boundingBox.getCenter()

          let boxGeo = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z)
          let boundingBoxMesh = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial(0xff0000))

          boundingBoxMesh.translateX(boxCenter.x)
          boundingBoxMesh.translateY(boxCenter.y)
          boundingBoxMesh.translateZ(boxCenter.z)

          let mesh = new THREE.Mesh(this.treeMesh, this.merkleMaterial)

          mesh.translateX(-boxCenter.x)
          mesh.translateY(-boxCenter.y)
          mesh.translateZ(-boxCenter.z)

          this.treeGroup.add(mesh)

          this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
          this.treeGroup.position.set(blockObjectPosition.x, blockObjectPosition.y, blockObjectPosition.z)
        }
      }
    }.bind(this))
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

      // reset original position and rotation
      this.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)

      var tweenVars = { time: 0 }

      this.transitionDuration = duration || 2000
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
    this.camPos.lerp(this.targetPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.camPos)
    this.lookAtPos.lerp(this.targetLookAt, this.cameraLerpSpeed)
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
    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)
  }

  addObjects () {
    this.addDay(this.state.blocks)
  }

  buildBlocks (blocks, index, group, spiralPoints) {
    return new Promise((resolve, reject) => {
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        let block = blocks[blockIndex]

        blocks[blockIndex].index = blockIndex

     //   getTransactionsForBlock(block.hash).then((transactions) => {
       /*   let totalFees = 0
          let totalInput = 0

          transactions.forEach((tx, key) => {
            if (key !== 0) { // ignore coinbase transactions
              totalInput += tx.input
              totalFees += (tx.input - tx.output)
            }
          }) */

          // blocks[blockIndex].feeToValueRatio = totalFees / totalInput
        blocks[blockIndex].feeToValueRatio = 0.01

          // TODO: set this from network health value
        this.angle = 5.0 + (block.output % 170)
        // this.angle = 90.0 + blocks[blockIndex].feeToValueRatio

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
            let convexGeometry
            let blockMesh

            if (this.points.length > 3) {
              convexGeometry = new ConvexGeometry(this.points)
              convexGeometry.computeBoundingBox()
              let boxDimensions = convexGeometry.boundingBox.getSize()

              let boundingBoxGeometry = new THREE.BoxBufferGeometry(boxDimensions.x, boxDimensions.y, boxDimensions.z)

              blockMesh = new THREE.Mesh(boundingBoxGeometry, this.crystalMaterial.clone())

              // align all front faces
              blockMesh.translateZ(-(boxDimensions.z / 2))

              blockMesh.blockchainData = block

              let rotation = ((10 * Math.PI) / blocks.length) * blockIndex
              blockMesh.rotation.z = rotation
              blockMesh.translateY(700 + (blockIndex))
              blockMesh.rotation.z += Math.PI / 2
              blockMesh.translateZ(blockIndex * 8)

              group.add(blockMesh)

              spiralPoints.push(blockMesh.position)
            }
          }
        }.bind(this))
       // })
      }

      resolve()
    })
  }

  addDay (blocks, index) {
    console.log('add day: ' + index)
    let group = new THREE.Group()

    this.state.dayGroups.push(group)

    let spiralPoints = []
    this.scene.add(group)

    this.buildBlocks(blocks, index, group, spiralPoints).then(() => {
      console.log(index)
      group.translateZ(-(index * 1300))
      this.removeTrees()
    })
  }

  build (node, startingPosition, direction, context, visualise) {
    let magnitude = (node.level * 5)

    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    this.points.push(startPosition)
    this.points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      let geometry = new THREE.TubeGeometry(path, 1, 0.5, 6, false)
      this.treeMesh.merge(geometry, geometry.matrix)
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
            if (this.state.currentBlock) {
              this.state.currentBlock.endNodes.push(
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
    this.crystalOpacity = 0.7

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
      color: 0xaaaaaa,
      metalness: 0.7,
      roughness: 0.0,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })

    this.merkleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      metalness: 0.5,
      roughness: 0.4,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
    this.FXAAPass.uniforms.resolution.value = new THREE.Vector2(1 / window.innerWidth, 1 / window.innerHeight)
  }

  checkMouseIntersection () {
    var vector = new THREE.Vector3(this.targetMouseX, this.targetMouseY, 0.5)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

    this.state.dayGroups.forEach((group, dayIndex) => {
      let intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        this.state.focussed = true
        this.mouseStatic = false
        if (
          intersects[0].object !== this.intersected[dayIndex] &&
          intersects[0].object !== this.state.currentBlockObject
        ) {
          if (this.intersected[dayIndex]) {
            this.intersected[dayIndex].material.color.setHex(this.intersected[dayIndex].currentHex)
          }
          this.intersected[dayIndex] = intersects[0].object
          this.intersected[dayIndex].currentHex = this.intersected[dayIndex].material.color.getHex()
          this.intersected[dayIndex].material.color.setHex(0xffffff)
        }
      } else {
        this.state.focussed = false
        if (this.intersected[dayIndex]) {
          this.intersected[dayIndex].material.color.setHex(this.intersected[dayIndex].currentHex)
        }
        this.intersected[dayIndex] = null
      }
    }, this)
  }

  updateMouse () {
    this.mousePos.lerp(new THREE.Vector2(this.targetMouseX, this.targetMouseY), this.cameraLerpSpeed)
  }

  ambientCameraMovement () {
    this.camera.lookAt(this.lookAtPos)
    this.targetPos.x += this.mousePos.x
    this.targetPos.y += this.mousePos.y
    document.dispatchEvent(this.cameraMoveEvent)
  }

  smoothCameraMovement () {
    if (this.targetPos.x > this.cameraDriftLimitMax.x) {
      this.targetPos.x = this.cameraDriftLimitMax.x - 1
    }
    if (this.targetPos.y > this.cameraDriftLimitMax.y) {
      this.targetPos.y = this.cameraDriftLimitMax.y - 1
    }
    if (this.targetPos.x < this.cameraDriftLimitMin.x) {
      this.targetPos.x = this.cameraDriftLimitMin.x + 1
    }
    if (this.targetPos.y < this.cameraDriftLimitMin.y) {
      this.targetPos.y = this.cameraDriftLimitMin.y + 1
    }

    this.camPos.lerp(this.targetPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.camPos)

    this.audio.setAmbienceFilterCutoff(Math.abs(this.camPos.z))

    this.lookAtPos.lerp(this.targetLookAt, this.cameraLerpSpeed)
  }

  render () {
    TWEEN.update()
    this.checkMouseIntersection()
    this.updateMouse()
    this.smoothCameraMovement()
    this.ambientCameraMovement()
    this.composer.render()
    if (this.state.view === 'block') {
      this.state.currentBlockObject.rotation.y += 0.001
      this.treeGroup.rotation.y += 0.001
    }
    // this.renderer.render(this.scene, this.camera)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
