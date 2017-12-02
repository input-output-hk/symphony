'use strict'

import * as THREE from 'three'

// Geometry
import GenerateBlockGeometry from '../helpers/GenerateBlockGeometry'

self.addEventListener('message', function (e) {
  let data = e.data
  switch (data.cmd) {
    case 'build':
      console.log('building merkle trees...')
      let blocks = data.blocks

      let returnData = {
        sizes: [],
        blockCount: blocks.length,
        dayIndex: data.dayIndex,
        blocks: data.blocks,
        timeStamp: data.timeStamp
      }

      for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index]
        let blockGeoData = new GenerateBlockGeometry(block)
        returnData.sizes.push(blockGeoData.boxDimensions)
      }

      self.postMessage(returnData)
      break
    case 'stop':
      self.postMessage('WORKER STOPPED')
      self.close()
      break
    default:
      self.postMessage('Unknown command')
  }

  self.postMessage(e.data)
}, false)
