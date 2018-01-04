'use strict'
import * as THREE from 'three'
import Stage from './Stage'
import MainScene from './scenes/MainScene'


const orpheusApp = {}
orpheusApp.checkWebGLSupport = _ => window.WebGLRenderingContext 
orpheusApp.init = (params = {}) => {
  orpheusApp.stage = new Stage()
  params.stage = orpheusApp.stage
  orpheusApp.scene = new MainScene({params})
}

orpheusApp.preload = _ => orpheusApp.textureLoader = new THREE.TextureLoader() 
window.orpheusApp = orpheusApp


 
