import * as THREE from 'three'
import MerkleMaterial from './MerkleMaterial/MerkleMaterial'
import PointsMaterial from './PointsMaterial/PointsMaterial'
import BlockMaterial from './BlockMaterial/BlockMaterial'

export default ({ bumpMap }, cubeTextures ) => {
  const bgMap = cubeTextures
  bgMap.needsUpdate = true

  const blockMaterialBack = new BlockMaterial({
    color: 0xeeeeee,
    emissive: 0x000000,
    metalness: 0.9,
    roughness: 0.2,
    opacity: 0.5,
    transparent: true,
    depthWrite: false,
    // depthTest: false,
    side: THREE.BackSide,
    envMap: bgMap,
    bumpMap,
    bumpScale: 0.03
  })

  const blockMaterialFront = new BlockMaterial({
    color: 0xeeeeee,
    emissive: 0x330000,
    metalness: 0.9,
    roughness: 0.2,
    opacity: 0.5,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide,
    envMap: bgMap,
    bumpMap,
    bumpScale: 0.03
  })

  const blockMaterialOutline = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.5
  })

  const blockMaterialHighlight = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    metalness: 0.9,
    roughness: 0.2,
    opacity: 0.5,
    transparent: true,
    side: THREE.DoubleSide
  })

  const merkleMaterial = new MerkleMaterial({
    color: 0xffffff,
    emissive: 0x444444,
    flatShading: true,
    metalness: 0.8,
    roughness: 0.3,
    opacity: 0.3,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    side: THREE.DoubleSide,
    envMap: bgMap
  })

  const pointsMaterial = new PointsMaterial({
    color: 0xfff900,
    size: 100.0,
    // alphaTest: 0.0001,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 1.0,
    depthTest: false,
    depthWrite: false
    // vertexColors: THREE.VertexColors
  })

  return { bgMap, pointsMaterial, merkleMaterial, blockMaterialBack, blockMaterialFront, blockMaterialHighlight, blockMaterialOutline}
}