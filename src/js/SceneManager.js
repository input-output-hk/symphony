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
  constructor ({
      params = {}
    } = {}
  ) {
    this.init(params)
  }

  checkWebGLSupport () {
    this.webGLSupport = false

    if (window.WebGLRenderingContext) {
      this.webGLSupport = true
    }
  }

  init (params) {
    this.checkWebGLSupport()

    if (!this.webGLSupport) {
      this.webGLNotSupported()
    }

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
