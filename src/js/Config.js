'use strict'

const Config = {
  daysEitherSide: 4,
  assetPath: 'static/assets/',
  showGUI: true,
  scene: {
    bgColor: 0x000022,
    shadowsOn: false,
    fogFar: 0.00040,
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
