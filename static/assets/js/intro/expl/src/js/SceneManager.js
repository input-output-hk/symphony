'use strict'

// 3rd party libs
import * as THREE from 'three'

// Stage
import Stage from './Stage'

// Scenes
import MainScene from './scenes/MainScene'

/**
 * Handles building the scene
 */
export default class SceneManager {
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
