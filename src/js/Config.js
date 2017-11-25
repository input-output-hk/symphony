'use strict'

const Config = {
  assetPath: '/static/assets/',
  daysToLoad: 2,
  debug: {
    orbitControls: false
  },
  scene: {
    bgColor: 0x000022,
    shadowsOn: false,
    antialias: true
  },
  postProcessing: {
    effectDownscaleDivisor: 1
  },
  camera: {
    fov: 80
  }
}

export default Config
