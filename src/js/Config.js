'use strict'

import Detect from './helpers/detect'

const Detector = new Detect()

const Config = {
  daysEitherSide: 2,
  detector: Detector,
  showGUI: true,
  scene: {
    bgColor: 0x26263c,
    fogFar: 0.00040,
    antialias: false
  },
  camera: {
    fov: 80
  }
}

export default Config
