'use strict'
import * as THREE from 'three'
import Stage from './Stage'
import MainScene from './scenes/MainScene'
import { imageLoader } from '../utils/loader'



const orpheusApp = async function (params) {

  const bgMap = [
    'textures/px.png',
    'textures/nx.png',
    'textures/py.png',
    'textures/ny.png',
    'textures/pz.png',
    'textures/nz.png'
  ]

  const loader = imageLoader(params.path)
  const loadImage = image => loader.get(image).then(({data}) => data)
  const cubeMap = await Promise.all(bgMap.map(loadImage))
  const stage = new Stage()
  return new MainScene({...params, stage, cubeMap})
}

orpheusApp.canRun = window.WebGLRenderingContext !== null && window.Worker !== null
// orpheusApp.preload = _ => orpheusApp.textureLoader = new THREE.TextureLoader()

window.orpheusApp = orpheusApp
