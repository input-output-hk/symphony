'use strict'

// 3rd party libs
import * as THREE from 'three'

import {EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SMAAPass} from './postprocessing/EffectComposer'

import FXAAShader from './shaders/FXAA'
import HueSaturationShader from './shaders/HueSaturation'
import RGBShiftShader from './shaders/RGBShift'
import VignetteShader from './shaders/Vignette'
import FilmShader from './shaders/Film'
import BrightnessContrastShader from './shaders/BrightnessContrast'

// import * as fboHelper from './helpers/fboHelper'
// import EffectComposer2 from './EffectComposer'

// Global config
import Config from './Config'

/**
 * Container for everything concerned with rendering the scene
 */
export default class Stage {
  constructor () {
    this.init()
  }

  /**
   * Bootstrap
   */
  init () {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initPost()
    this.addLights()
    this.addEvents()
    this.resize(300, 150)
    this.animate()
  }

  initPost () {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.VignettePass = new ShaderPass(VignetteShader)
    this.composer.addPass(this.VignettePass)

    this.BrightnessContrastPass = new ShaderPass(BrightnessContrastShader)
    this.composer.addPass(this.BrightnessContrastPass)

    this.HueSaturationPass = new ShaderPass(HueSaturationShader)
    this.composer.addPass(this.HueSaturationPass)

    /* this.FXAAPass = new ShaderPass(FXAAShader)
    // this.FXAAPass.renderToScreen = true
    this.composer.addPass(this.FXAAPass) */

   // this.RGBShiftPass = new ShaderPass(RGBShiftShader)
    // this.RGBShiftPass.renderToScreen = true
 //   this.composer.addPass(this.RGBShiftPass)

    this.SMAAPass = new SMAAPass(window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio())
    this.SMAAPass.renderToScreen = true
    this.composer.addPass(this.SMAAPass)

    /* this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.3, 0.915) // 1.0, 9, 0.5, 512);
    this.bloomPass.renderToScreen = true
    this.composer.addPass(this.bloomPass) */

    /* this.FilmShaderPass = new ShaderPass(FilmShader)
    this.FilmShaderPass.renderToScreen = true
    this.composer.addPass(this.FilmShaderPass) */
  }

  /**
   * Create container scene
   */
  initScene () {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, Config.scene.fogFar)
    this.scene.background = new THREE.Color(Config.scene.bgColor)
  }

  /**
   * Set up stage camera with defaults
   */
  initCamera () {
    // initial position of camera in the scene
    this.defaultCameraPos = new THREE.Vector3(0.0, 0.0, 2500.0)

    // xy bounds of the ambient camera movement
    this.cameraDriftLimitMax = {
      x: 100.0,
      y: 100.0
    }
    this.cameraDriftLimitMin = {
      x: -100.0,
      y: -100.0
    }

    this.cameraMoveStep = 200.0 // how much to move the camera forward on z-axis
    this.cameraLerpSpeed = 0.03 // speed of camera lerp

    // scene camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, window.innerWidth / window.innerHeight, 1, 5000)
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z)
    this.camera.updateMatrixWorld()

    this.cameraPos = this.camera.position.clone() // current camera position
    this.targetCameraPos = this.cameraPos.clone() // target camera position

    this.cameraLookAtPos = new THREE.Vector3(0, 0, 0) // current camera lookat
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0) // target camera lookat
    this.camera.lookAt(this.cameraLookAtPos)

    // set initial camera rotations
    this.cameraFromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    let cameraToRotation = new THREE.Euler().copy(this.camera.rotation)
    this.cameraToQuaternion = new THREE.Quaternion().setFromEuler(cameraToRotation)
    this.cameraMoveQuaternion = new THREE.Quaternion()
  }

  /**
   * Set up default stage renderer
   */
  initRenderer () {
    this.canvas = document.getElementById('stage')

    this.canvas.style.touchAction = 'none'

    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas
      // alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.autoClear = true
    // this.renderer.sortObjects = false

    // fboHelper.init(this.renderer)
    this.composer = new EffectComposer(this.renderer)
  }

  /**
   * Stage events
   */
  addEvents () {
    // scene
    this.preUpdate = new Event('preUpdate') // event fired at start of update
    this.postUpdate = new Event('postUpdate') // event fired at end of udpate

    // camera
    this.cameraMoveEvent = new Event('cameraMove') // event fired when camera is moved

    // current mouse position
    this.mousePos = new THREE.Vector2()

    // target mouse position
    this.targetMousePos = new THREE.Vector2()

    // event fired when mouse is moved
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)

    // function _getTouchBound (fn) {
    //   return function (evt) {
    //     fn.call(this, evt.changedTouches[0] || evt.touches[0])
    //   }
    // }
    // document.addEventListener('touchmove', _getTouchBound(this.onDocumentMouseMove))
    this.canvas.addEventListener('touchmove', evt => {
      evt.preventDefault()
      this.onDocumentMouseMove(evt.changedTouches[0] || evt.touches[0])
    })
  }

  /**
   * Add lights to the stage
   */
  addLights () {
    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)

    this.pointLight = new THREE.PointLight(0xffffff, 5, 5000, 3)
    this.scene.add(this.pointLight)
  }

  /**
   * Window resize
   */
  resize (w, h) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()

    // this.FXAAPass.material.uniforms.resolution.value = new THREE.Vector2(1 / w, 1 / h)

    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
  }

  /**
   * Set target mouse position
   */
  onDocumentMouseMove (event) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    this.targetMousePos.x = x / window.innerWidth * 2 - 1
    this.targetMousePos.y = 1 - y / window.innerHeight * 2
  }

  /**
   * Lerp current mouse position to target position
   */
  updateMouse () {
    this.mousePos.lerp(new THREE.Vector2(this.targetMousePos.x, this.targetMousePos.y), this.cameraLerpSpeed)
  }

  /**
   * Move camera based on mouse position
   */
  cameraFollowMouse () {
    document.dispatchEvent(this.cameraMoveEvent)

    this.camera.lookAt(this.cameraLookAtPos)
    this.targetCameraPos.x += this.mousePos.x
    this.targetCameraPos.y += this.mousePos.y

    if (this.targetCameraPos.x > this.cameraDriftLimitMax.x) {
      this.targetCameraPos.x = this.cameraDriftLimitMax.x - 1
    }
    if (this.targetCameraPos.y > this.cameraDriftLimitMax.y) {
      this.targetCameraPos.y = this.cameraDriftLimitMax.y - 1
    }
    if (this.targetCameraPos.x < this.cameraDriftLimitMin.x) {
      this.targetCameraPos.x = this.cameraDriftLimitMin.x + 1
    }
    if (this.targetCameraPos.y < this.cameraDriftLimitMin.y) {
      this.targetCameraPos.y = this.cameraDriftLimitMin.y + 1
    }

    // lerp camera posiiton to target
    this.cameraPos.lerp(this.targetCameraPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.cameraPos)

    // constantly look at target
    this.cameraLookAtPos.lerp(this.targetCameraLookAt, this.cameraLerpSpeed)
  }

  /**
   * Called each animation frame
   */
  update () {
    document.dispatchEvent(this.preUpdate)

    this.updateMouse()
    this.cameraFollowMouse()

    this.render()

    // this.dispatchEvent(this.postUpdate)
  }

  render () {
    this.composer.render()
    // this.renderer.render(this.scene, this.camera)
  }

  /**
   * Animation loop
   */
  animate () {
    this.reqID = requestAnimationFrame(this.animate.bind(this))
    this.update()
  }
}
