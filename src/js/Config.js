'use strict'

const Config = {
  canvas: null,
  assetPath: './assets/',
  itemDataListPath: './assets/list.json',
  showStats: true,
  debug: {
    displayShadowMap: false,
    orbitControls: false
  },
  scene: {
    bgColor: 0x000000,
    shadowsOn: false,
    antialias: true,
    showConvexHull: false
  },
  postProcessing: {
    effectDownscaleDivisor: 2
  },
  camera: {
    fov: 60,
    autoMove: true
  }
}

export default Config
