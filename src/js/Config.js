'use strict'

import Detect from './helpers/detect'

const Detector = new Detect()

const Config = {
  daysEitherSide: 2,
  detector: Detector,
  showGUI: true,
  scene: {
    bgColor: 0x141414,
    fogDensity: 0.00030,
    antialias: false
  },
  camera: {
    fov: 70
  }
}

export default Config
