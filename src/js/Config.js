'use strict'

const Config = {
  assetPath: '/static/assets/',
  debug: {
    orbitControls: false
  },
  scene: {
    bgColor: 0x000022,
    shadowsOn: false,
    fogFar: 0.00030,
    antialias: true
  },
  postProcessing: {
    effectDownscaleDivisor: 2
  },
  camera: {
    fov: 80
  }
}

export default Config
