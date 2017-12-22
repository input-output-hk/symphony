'use strict'

// 3rd party libs
import * as THREE from 'three'

// Global config
import Config from './Config'

// Stage
import Stage from './Stage'

// Scenes
import MainScene from './scenes/MainScene'

/**
 * Handles building the scene
 */
export default class SceneManager {
  constructor () { }

  checkWebGLSupport () {
    return window.WebGLRenderingContext
  }

  init (params = {}) {
    this.stage = new Stage()
    params.stage = this.stage

    this.scene = new MainScene({params: params})
  }

  preload () {
    this.textureLoader = new THREE.TextureLoader()
  }

  webGLNotSupported () {
    alert('Your browser does not support WebGL')
  }
}
