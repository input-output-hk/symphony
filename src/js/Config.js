'use strict'

const Config = {
  assetPath: '/static/assets/',
  debug: {
    orbitControls: false
  },
  scene: {
    bgColor: 0xFFFFFF,
    shadowsOn: false,
    antialias: true
  },
  postProcessing: {
    effectDownscaleDivisor: 2
  },
  camera: {
    fov: 45
  }
}

export default Config
