'use strict'
import * as THREE from 'three'
import Stage from './Stage'
import MainScene from './scenes/MainScene'

const orpheusApp = function(params = {}) {
  const stage = new Stage()
  return new MainScene({...params, stage})
}

orpheusApp.checkWebGLSupport = _ => window.WebGLRenderingContext 
orpheusApp.preload = _ => orpheusApp.textureLoader = new THREE.TextureLoader() 

window.orpheusApp = orpheusApp

 
