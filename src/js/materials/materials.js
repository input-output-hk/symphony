import * as THREE from 'three'
import MerkleMaterial from './MerkleMaterial/MerkleMaterial'
import PointsMaterial from './PointsMaterial/PointsMaterial'

export default (textures, cubeTextures) => {
  const bgMap = new THREE.CubeTexture(cubeTextures)
  const bumpMap = new THREE.Texture(textures[0])
  const map = new THREE.Texture(textures[0])

  const metalnessMap = new THREE.Texture(textures[1])
  const roughnessMap = new THREE.Texture(textures[2])
  const alphaMap = new THREE.Texture(textures[3])

  alphaMap.wrapS = THREE.RepeatWrapping
  alphaMap.wrapT = THREE.RepeatWrapping

  map.needsUpdate = true
  alphaMap.needsUpdate = true
  bumpMap.needsUpdate = true
  bgMap.needsUpdate = true
  metalnessMap.needsUpdate = true
  roughnessMap.needsUpdate = true

  const blockMaterialBack = new THREE.MeshStandardMaterial({
    color: 0x7fa9fc,
    emissive: 0x000000,
    metalness: 0.7,
    roughness: 0.0,
    opacity: 1.0,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    envMap: bgMap,
    bumpMap,
    bumpScale: 0.2,
    alphaMap
  })

  const blockMaterialFront = new THREE.MeshStandardMaterial({
    color: 0x7fa9fc,
    emissive: 0x000000,
    metalness: 0.7,
    roughness: 0.0,
    opacity: 1.0,
    transparent: true,
    side: THREE.FrontSide,
    envMap: bgMap,
    bumpMap,
    bumpScale: 0.2,
    alphaMap
  })

  const blockMaterialOutline = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.5
  })

  const blockMaterialHighlight = new THREE.MeshStandardMaterial({
    color: 0xffcdbb,
    emissive: 0x333333,
    metalness: 0.7,
    roughness: 0.0,
    opacity: 1.0,
    transparent: true,
    side: THREE.DoubleSide,
    envMap: bgMap,
    bumpMap,
    bumpScale: 0.2,
    alphaMap
  })

  const merkleMaterial = new MerkleMaterial({
    color: 0xffffff,
    emissive: 0x555555,
    flatShading: true,
    metalness: 1.0,
    roughness: 0.76,
    opacity: 0.7,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    side: THREE.DoubleSide,
    envMap: bgMap
  })

  const pointsMaterial = new PointsMaterial({
    color: 0xfff493,
    size: 80.0,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 1.0,
    depthTest: false,
    depthWrite: false
  })

  return {bgMap, pointsMaterial, merkleMaterial, blockMaterialBack, blockMaterialFront, blockMaterialHighlight, blockMaterialOutline}
}
