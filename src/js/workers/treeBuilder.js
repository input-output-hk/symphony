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

      let geoData = new GenerateBlockGeometry(block, true)

      /* geo.computeBoundingBox()
      let boxSize = geo.boundingBox.getSize()
      let boxCenter = geo.boundingBox.getCenter()

      let boxGeo = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z)
      let boundingBoxMesh = new THREE.Mesh(boxGeo)

      boundingBoxMesh.translateX(boxCenter.x)
      boundingBoxMesh.translateY(boxCenter.y)
      boundingBoxMesh.translateZ(boxCenter.z)

      let mesh = new THREE.Mesh(geo, this.merkleMaterial)

      mesh.translateX(-boxCenter.x)
      mesh.translateY(-boxCenter.y)
      mesh.translateZ(-boxCenter.z)

      console.log(mesh) */

      let returnData = {
        vertices: geoData.treeGeo.vertices,
        faces: geoData.treeGeo.faces,
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
