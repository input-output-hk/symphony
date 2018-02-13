const glslify = require('glslify')
const THREE = require('three')

const fboHelper = require('../../helpers/fboHelper')
const difference = require('mout/array/difference')

exports.init = init
exports.createAllCaches = createAllCaches
exports.createCache = createCache
exports.changeNextIndex = changeNextIndex
exports.update = update

exports.needStoreAsTexture = 0

let curlCaches = exports.curlCaches = []
let cacheIndices = exports.cacheIndices = [0, 1]
let uniforms = exports.uniforms = {}

let _time = 0
let _sliceInfo
let _deltaTime

let _cacheMaterial
let _indices = [] // 0, 1, 2, 3

let VOXEL_SIZE = 64
let SLICE_SEGMENT_X = 8
let SLICE_SEGMENT_Y = 8

function init (count, curlSize, deltaTime, persistence) {
  count = count || 4
  curlSize = curlSize || 1
  deltaTime = deltaTime || 1
  persistence = persistence || 0.2

  exports.needStoreAsTexture = count
  _deltaTime = deltaTime

  _sliceInfo = new THREE.Vector4(
    SLICE_SEGMENT_X * SLICE_SEGMENT_Y,
    SLICE_SEGMENT_X,
    1.0 / SLICE_SEGMENT_X,
    1.0 / Math.floor((SLICE_SEGMENT_X * SLICE_SEGMENT_Y + SLICE_SEGMENT_X - 1.0) / SLICE_SEGMENT_X)
  )
  // 128 * 128 * (16 * 8) = 2048 * 1024
  // _sliceInfo = new THREE.Vector4(
  //   16 * 8,
  //   16,
  //   1 / 16,
  //   1 / Math.floor((16 * 8 + 16 - 1) / 16)
  // )

  _cacheMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_curlSize: {type: 'f', value: curlSize},
      u_noiseTime: {type: 'f', value: deltaTime},
      u_persistence: {type: 'f', value: persistence},
      u_sliceInfo: {type: 'v4', value: _sliceInfo}
    },
    vertexShader: fboHelper.vertexShader,
    fragmentShader: fboHelper.precisionPrefix + glslify('./curlToVolume.frag'),
    blending: THREE.NoBlending,
    transparent: false,
    depthWrite: false,
    depthTest: false
  })

  uniforms.u_curlTexture0 = {value: null}
  uniforms.u_curlTexture1 = {value: null}
  uniforms.u_curlTextureSliceInfo = {value: _sliceInfo}
  uniforms.u_curlTextureRatio = {value: 0}
}

function createAllCaches () {
  while (exports.needStoreAsTexture > 0) {
    createCache()
  }
}

function createCache () {
  if (exports.needStoreAsTexture > 0) {
    exports.needStoreAsTexture--
    _cacheMaterial.uniforms.u_noiseTime.value = curlCaches.length * _deltaTime

    var renderTarget = fboHelper.createRenderTarget(VOXEL_SIZE * SLICE_SEGMENT_X, VOXEL_SIZE * SLICE_SEGMENT_Y)
    fboHelper.render(_cacheMaterial, renderTarget)
    curlCaches.push(renderTarget)
    _indices.push(_indices.length)
  }
}

function changeNextIndex () {
  cacheIndices.shift()
  var arr = difference(_indices, cacheIndices)
  cacheIndices.push(arr[~~(Math.random() * arr.length)])
}

function update (dt) {
  if (_time + dt > _deltaTime) {
    _time = (_time + dt) % _deltaTime
    changeNextIndex()
  } else {
    _time += dt
  }
  uniforms.u_curlTexture0.value = curlCaches[cacheIndices[0]]
  uniforms.u_curlTexture1.value = curlCaches[cacheIndices[1]]
  uniforms.u_curlTextureRatio.value = _time / _deltaTime
}
