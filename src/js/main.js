'use strict'
import * as THREE from 'three'
import Stage from './Stage'
import MainScene from './scenes/MainScene'
import axios from 'axios'

const orpheusApp = async function (params) {
  const stage = new Stage()

  const imageLoader = axios.create({
    baseURL: params.path,
    responseType: 'blob',
    transformResponse: blob => {
      const image = new Image()
      image.crossOrigin = 'Anonymous'
      image.src = URL.createObjectURL( blob )
      return image

    }
  })

  const bgMap = [
    'textures/px.png',
    'textures/nx.png',
    'textures/py.png',
    'textures/ny.png',
    'textures/pz.png',
    'textures/nz.png'
  ]

  const cubeMap = await Promise.all(bgMap.map(image => imageLoader.get(image).then(({data}) => data)))

  return new MainScene({...params, stage, cubeMap})
}

const textures = {

  map:'textures/Marble068_COL_1K.jpg',
  metalnessMap:'textures/Marble068_REFL_1K.jpg',
  roughnessMap:'textures/Marble068_GLOSS_1K.jpg',
  glossMap:'textures/Marble068_GLOSS_1K.jpg',
  normalMap:'textures/Marble068_NRM_1K.jpg',
  bumpMap:'textures/IceBlock008_OVERLAY_1K.jpg',
  bgMap:[
    'textures/px.png',
    'textures/nx.png',
    'textures/py.png',
    'textures/ny.png',
    'textures/pz.png',
    'textures/nz.png'
  ]
}




orpheusApp.canRun = window.WebGLRenderingContext !== null && window.Worker !== null
// orpheusApp.preload = _ => orpheusApp.textureLoader = new THREE.TextureLoader()

window.orpheusApp = orpheusApp
