'use strict'

// Geometry
import GenerateBlockGeometry from '../geometry/GenerateBlockGeometry'

self.addEventListener('message', function (e) {
  let data = e.data
  switch (data.cmd) {
    case 'build':
      let blocks = data.blocks

      let returnData = {
        blockCount: blocks.length,
        dayIndex: data.dayIndex,
        blocks: data.blocks,
        timeStamp: data.timeStamp,
        focusOnBlock: data.focusOnBlock
      }

      for (let index = 0; index < blocks.length; index++) {
        let block = blocks[index]

        let feeToInputRatio = 0
        if (block.fee && block.input) {
          feeToInputRatio = block.fee / block.input
        }
        block.feeToInputRatio = feeToInputRatio

        let { size } = GenerateBlockGeometry(block)

        returnData.blocks[index].feeToInputRatio = feeToInputRatio
        returnData.blocks[index].size = size
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
}, false)
