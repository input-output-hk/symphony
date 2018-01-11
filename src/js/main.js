'use strict'
import * as THREE from 'three'
import Stage from './Stage'
import MainScene from './scenes/MainScene'
import { imageLoader } from '../utils/loader'
import { getEarliestBlock, getLatestBlock } from './api/btc'

const orpheusApp = async function (params) {

  const bgMap = [
    'textures/px.png',
    'textures/nx.png',
    'textures/py.png',
    'textures/ny.png',
    'textures/pz.png',
    'textures/nz.png'
  ]

  const assets = {
    // map:'textures/Marble068_COL_1K.jpg',
    // metalnessMap:'textures/Marble068_REFL_1K.jpg',
    // roughnessMap:'textures/Marble068_GLOSS_1K.jpg',
    // glossMap:'textures/Marble068_GLOSS_1K.jpg',
    // normalMap:'textures/Marble068_NRM_1K.jpg',
    bumpMap:'textures/IceBlock008_OVERLAY_1K.jpg'
  }
    
  const earliestBlock = await getEarliestBlock()
  const latestBlock = await getLatestBlock()
  const earliestDate = new Date(latestBlock.time * 1000 )
  const latestDate = new Date(earliestBlock.time * 1000)

  const loader = imageLoader(params.path)
  const loadImage = image => loader.get(image).then(({data}) => data)
  const cubeMap = await Promise.all(bgMap.map(loadImage))
  const textures = await Promise.all(Object.values(assets).map(loadImage))
  const stage = new Stage()
  return new MainScene({...params, stage, cubeMap, textures, earliestDate, latestDate})
}

orpheusApp.canRun = window.WebGLRenderingContext !== null && window.Worker !== null

window.orpheusApp = orpheusApp
