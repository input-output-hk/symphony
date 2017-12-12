'use strict'

import * as THREE from 'three'

// Geometry
import GenerateBlockGeometry from '../helpers/GenerateBlockGeometry'

self.addEventListener('message', function (e) {
  let data = e.data
  switch (data.cmd) {
    case 'build':
      console.log('building merkle tree...')
      let block = data.block

      let feeToInputRatio = 0
      if (block.fee && block.input) {
        feeToInputRatio = block.fee / block.input
      }
      block.feeToInputRatio = feeToInputRatio

      let geoData = new GenerateBlockGeometry(block, true)

      let returnData = {
        // vertices: geoData.treeVertices,
        vertices: geoData.treeGeo.attributes.position.array,
        boxDimensions: geoData.boxDimensions,
        boxCenter: geoData.boxCenter,
        block: block,
        endNodes: geoData.endNodes
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
