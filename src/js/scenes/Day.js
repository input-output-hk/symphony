'use strict'

// libs
import * as THREE from 'three'
import Config from '../Config'
import { ConvexGeometry } from '../../../functions/ConvexGeometry'
import { getDay } from '../../data/btc'
import moment from 'moment'
import Audio from '../audio/audio'
import _ from 'lodash'
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6'
let merkle = require('../merkle-tree-gen')
const TWEEN = require('@tweenjs/tween.js')
const BrownianMotion = require('../motions/BrownianMotion')
import { oui } from 'ouioui'

export default class Day {
  constructor (blocks = [], currentDate = new Date()) {
    this.textureLoader = new THREE.TextureLoader()

    this.initState(blocks, currentDate)
    this.initRenderer()
    this.initCamera()
    this.initShaders()



    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const RGBShiftPass = new ShaderPass(this.RGBShiftShader)
    this.composer.addPass(RGBShiftPass)

    const FilmShaderPass = new ShaderPass(this.FilmShader)
    this.composer.addPass(FilmShaderPass)

    const VignettePass = new ShaderPass(this.VignetteShader)
    this.composer.addPass(VignettePass)

    const BrightnessContrastPass = new ShaderPass(this.BrightnessContrastShader)
    this.composer.addPass(BrightnessContrastPass)

    const HueSaturationPass = new ShaderPass(this.HueSaturationShader)
    HueSaturationPass.renderToScreen = true
    this.composer.addPass(HueSaturationPass)

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

  initShaders () {
    this.RGBShiftShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'amount': { value: 0.0005 },
        'angle': { value: 0.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float amount;',
        'uniform float angle;',
        'varying vec2 vUv;',
        'void main() {',
        'vec2 offset = amount * vec2( cos(angle), sin(angle));',
        'vec4 cr = texture2D(tDiffuse, vUv + offset);',
        'vec4 cga = texture2D(tDiffuse, vUv);',
        'vec4 cb = texture2D(tDiffuse, vUv - offset);',
        'gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);',
        '}'
      ].join('\n')
    }

    this.VignetteShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'offset': { value: 1.0 },
        'darkness': { value: 1.1 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float offset;',
        'uniform float darkness;',
        'uniform sampler2D tDiffuse;',
        'varying vec2 vUv;',
        'void main() {',
        // Eskil's vignette
        'vec4 texel = texture2D( tDiffuse, vUv );',
        'vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );',
        'gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );',
        /*
        // alternative version from glfx.js
        // this one makes more "dusty" look (as opposed to "burned")

        "vec4 color = texture2D( tDiffuse, vUv );",
        "float dist = distance( vUv, vec2( 0.5 ) );",
        "color.rgb *= smoothstep( 0.8, offset * 0.799, dist *( darkness + offset ) );",
        "gl_FragColor = color;",
        */
        '}'
      ].join('\n')
    }

    this.HueSaturationShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'hue': { value: 0 },
        'saturation': { value: 0.5 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float hue;',
        'uniform float saturation;',
        'varying vec2 vUv;',
        'void main() {',
        'gl_FragColor = texture2D( tDiffuse, vUv );',

        // hue
        'float angle = hue * 3.14159265;',
        'float s = sin(angle), c = cos(angle);',
        'vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;',
        'float len = length(gl_FragColor.rgb);',
        'gl_FragColor.rgb = vec3(',
        'dot(gl_FragColor.rgb, weights.xyz),',
        'dot(gl_FragColor.rgb, weights.zxy),',
        'dot(gl_FragColor.rgb, weights.yzx)',
        ');',

        // saturation
        'float average = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0;',
        'if (saturation > 0.0) {',
        'gl_FragColor.rgb += (average - gl_FragColor.rgb) * (1.0 - 1.0 / (1.001 - saturation));',
        '} else {',
        'gl_FragColor.rgb += (average - gl_FragColor.rgb) * (-saturation);',
        '}',

        '}'

      ].join('\n')

    }

    this.FilmShader = {

      uniforms: {

        'tDiffuse': { value: null },
        'time': { value: 0.0 },
        'nIntensity': { value: 0.1 },
        'sIntensity': { value: 0.0 },
        'sCount': { value: 4096 },
        'grayscale': { value: 0 }

      },

      vertexShader: [

        'varying vec2 vUv;',

        'void main() {',

        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}'

      ].join('\n'),

      fragmentShader: [

        '#include <common>',

          // control parameter
        'uniform float time;',

        'uniform bool grayscale;',

          // noise effect intensity value (0 = no effect, 1 = full effect)
        'uniform float nIntensity;',

          // scanlines effect intensity value (0 = no effect, 1 = full effect)
        'uniform float sIntensity;',

          // scanlines effect count value (0 = no effect, 4096 = full effect)
        'uniform float sCount;',

        'uniform sampler2D tDiffuse;',

        'varying vec2 vUv;',

        'void main() {',

            // sample the source
        'vec4 cTextureScreen = texture2D( tDiffuse, vUv );',

            // make some noise
        'float dx = rand( vUv + time );',

            // add noise
        'vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );',

            // get us a sine and cosine
        'vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );',

            // add scanlines
        'cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;',

            // interpolate between source and result by intensity
        'cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );',

            // convert to grayscale if desired
        'if( grayscale ) {',

        'cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );',

        '}',

        'gl_FragColor =  vec4( cResult, cTextureScreen.a );',

        '}'

      ].join('\n')

    }

    this.BrightnessContrastShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'brightness': { value: 0.0 },
        'contrast': { value: 0.1 }
      },

      vertexShader: [
        'varying vec2 vUv;',

        'void main() {',

        'vUv = uv;',

        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}'

      ].join('\n'),

      fragmentShader: [

        'uniform sampler2D tDiffuse;',
        'uniform float brightness;',
        'uniform float contrast;',

        'varying vec2 vUv;',

        'void main() {',

        'gl_FragColor = texture2D( tDiffuse, vUv );',

        'gl_FragColor.rgb += brightness;',

        'if (contrast > 0.0) {',
        'gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) / (1.0 - contrast) + 0.5;',
        '} else {',
        'gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (1.0 + contrast) + 0.5;',
        '}',

        '}'

      ].join('\n')

    }
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
      canvas: this.canvas,
      alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)
    this.renderer.autoClear = false
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false
  }

  initCamera () {
    this.defaultCameraPos = new THREE.Vector3(0.0, 0.0, 3000.0)

    this.cameraDriftLimitMax = {}
    this.cameraDriftLimitMax.x = 400.0
    this.cameraDriftLimitMax.y = 400.0
    this.cameraDriftLimitMin = {}
    this.cameraDriftLimitMin.x = -400.0
    this.cameraDriftLimitMin.y = -400.0
    this.cameraMoveStep = 200.0
    this.cameraLerpSpeed = 0.05

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

    oui({
      putSomeGUIShitHere: 'boom'
    })
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
    this.state.view = 'day'

    this.removeTrees()

    this.animateCamera(this.defaultCameraPos, new THREE.Vector3(0.0, 0.0, 0.0), 3000)

    this.state.focussed = false
    this.isAnimating = false
    this.toggleBlocks(true)

    if (this.state.currentBlockObject) {
     /* new TWEEN.Tween( this.state.currentBlockObject.material )
      .to( { opacity: this.crystalOpacity }, 1000 )
      .start() */
    }
  }

  removeTrees () {
    this.audio.unloadSound()

    if (typeof this.treeGroup !== 'undefined') {
      this.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    document.dispatchEvent(this.selectBlock)

    return

    // if (this.state.view === 'block') {
    // return
    // }

    this.raycaster.setFromCamera({x: this.targetMouseX, y: this.targetMouseY}, this.camera)

    this.state.dayGroups.forEach((group) => {
      var intersects = this.raycaster.intersectObjects(group.children)
      if (intersects.length > 0) {
        let blockObject = intersects[0].object

        this.state.currentBlockObject = blockObject

        let lookAtPos = blockObject.getWorldPosition().clone()

        let blockDir = blockObject.getWorldPosition().clone().normalize()
        // let newCamPos = blockObject.getWorldPosition().clone().add(blockDir.multiplyScalar(30))
        let newCamPos = blockObject.getWorldPosition().clone()
        newCamPos.z += 550.0

        this.animateCamera(newCamPos, lookAtPos, 3000).then(() => {
          this.buildSingleTree(blockObject)
        })
      }
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

  toggleBlocks (visibility) {
    /* this.state.dayGroups.forEach((group) => {
      group.visible = visibility
    }, this)
    this.state.lineGroups.forEach((group) => {
      group.visible = visibility
    }, this) */
  }

  buildSingleTree (blockObject) {
    let block = blockObject.blockchainData

    this.state.currentBlock = block

    this.angle = 5.0 + (block.output % 100)
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

    /*new TWEEN.Tween( blockObject.material )
    .to( { opacity: 0 }, 4000 )
    .onComplete(() => {
    })
    .start() */

    this.state.view = 'block'
    this.toggleBlocks(false)

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

        // Convex Hull
        let convexGeometry
        let blockMesh

        if (this.points.length > 3) {
          convexGeometry = new ConvexGeometry(this.points)
          convexGeometry.computeBoundingBox()
          let boxDimensions = convexGeometry.boundingBox.getSize()
          let boxCenter = convexGeometry.boundingBox.getCenter()

          let boundingBoxGeometry = new THREE.BoxBufferGeometry(boxDimensions.x, boxDimensions.y, boxDimensions.z)

          blockMesh = new THREE.Mesh(boundingBoxGeometry, this.crystalMaterial.clone())

          blockMesh.position.set(boxCenter.x, boxCenter.y, boxCenter.z)

          this.treeGroup.add(blockMesh)

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

          let mesh = new THREE.Mesh(this.treeMesh, this.merkleMaterial)
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

    /* let light = new THREE.SpotLight(0xeee6a5)
    light.position.set(100, 30, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light) */
  }

  addObjects () {
    this.addDay(this.state.blocks)
  }

  buildBlocks (blocks, index, group, spiralPoints) {
    return new Promise((resolve, reject) => {
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      // for (let blockIndex = 0; blockIndex < 1; blockIndex++) {
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
        this.angle = 5.0 + (block.output % 100)
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
              let boxCenter = convexGeometry.boundingBox.getCenter()

              let boundingBoxGeometry = new THREE.BoxBufferGeometry(boxDimensions.x * Math.random(), boxDimensions.y * Math.random(), boxDimensions.z * Math.random())
              // let boundingBoxGeometry = new THREE.BoxBufferGeometry(Math.random() * 500, Math.random() * 200, Math.random() * 300)

              blockMesh = new THREE.Mesh(boundingBoxGeometry, this.crystalMaterial.clone())
              blockMesh.position.set(boxCenter.x, boxCenter.y, boxCenter.z)

              blockMesh.blockchainData = block

              let rotation = ((10 * Math.PI) / blocks.length) * blockIndex
              blockMesh.rotation.z = rotation
              blockMesh.translateY(700 + (blockIndex * 4))

              blockMesh.rotation.x = Math.PI / 2
              blockMesh.rotation.y = rotation
              blockMesh.rotation.z = 0

              blockMesh.rotation.y += Math.PI / 2

              // add random rotation
              /* blockMesh.rotation.y = Math.random()
              blockMesh.rotation.x = Math.random()
              blockMesh.rotation.z = Math.random() */

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
      /* let material = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.0
      })

      let curve = new THREE.CatmullRomCurve3(spiralPoints)
      let points = curve.getPoints(2000)
      let geometry = new THREE.Geometry()
      geometry.vertices = points
      let line = new THREE.Line(geometry, material)
*/
      console.log(index)

      group.translateZ(-(index * 1000))
      // line.translateZ(-(index * 1000))

      // let lineGroup = new THREE.Group()
      // this.scene.add(lineGroup)

      // lineGroup.add(line)

      // this.state.lineGroups.push(lineGroup)

      this.removeTrees()
    })
  }

  build (node, startingPosition, direction, context, visualise) {
    let magnitude = node.level * 5

    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    this.points.push(startPosition)
    this.points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      let geometry = new THREE.TubeGeometry(path, 1, magnitude / 25, 6, false)
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
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.0,
      opacity: this.crystalOpacity,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap,
      depthTest: true,
      depthWrite: false
      // polygonOffset: true,
      // polygonOffsetFactor: -0.4
    })

    this.merkleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      opacity: 0.7,
      transparent: true,
      emissive: 0xffffff,
      metalness: 1.0,
      roughness: 0.5,
      envMap: this.bgMap
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
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
        if (intersects[0].object !== this.intersected[dayIndex]) {
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

  animateBlock () {
    // if (this.state.view === 'block') {
//      this.state.currentBlockObject.rotation.z += 0.002
  //    this.treeGroup.rotation.z += 0.002
    // }
  }

  loadDays () {
    // load in prev day?
    if (this.state.daysLoaded <= this.state.daysToLoad) {
      this.state.daysLoaded++
      this.loadPrevDay()
    }
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

    // if (
//      this.targetPos.x < this.cameraDriftLimitMax.x &&
  //    this.targetPos.y < this.cameraDriftLimitMax.y
    // ) {
    this.camPos.lerp(this.targetPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.camPos)
//    }

    this.lookAtPos.lerp(this.targetLookAt, this.cameraLerpSpeed)
  }

  render () {
    TWEEN.update()
    this.checkMouseIntersection()
    this.updateMouse()
    this.animateBlock()
    this.loadDays()

    this.smoothCameraMovement()
    this.ambientCameraMovement()

    this.composer.render()
    // this.renderer.render(this.scene, this.camera)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
