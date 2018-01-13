'use strict'

import Detect from './helpers/detect'

const Detector = new Detect()

const Config = {
  detector: Detector,
  daysEitherSide: 4,
  showGUI: true,
  scene: {
    bgColor: 0x26263c,
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
