const THREE = require('three')

// ported from https://github.com/keijiro/Klak/blob/master/Assets/Klak/Motion/BrownianMotion.cs

function BrownianMotion() {
  this.position = new THREE.Vector3()
  this.rotation = new THREE.Quaternion()

  this.enablePositionNoise = true
  this.enableRotationNoise = true

  this.positionFrequency = 0.0001
  this.rotationFrequency = 0.0002

  this.positionAmplitude = 0.1
  this.rotationAmplitude = 0.1

  this.positionScale = new THREE.Vector3(1, 1, 1)
  this.rotationScale = new THREE.Vector3(1, 1, 0)

  this.positionFractalLevel = 3
  this.rotationFractalLevel = 3

  this.times = new Float32Array(6)
  this.rehash()
}

module.exports = BrownianMotion
let _p = BrownianMotion.prototype
_p.rehash = rehash
_p.update = update

let _e = new THREE.Euler()
let _v = new THREE.Vector3()

const FBM_NORM = 1 / 0.75

function rehash() {
  for (var i = 0; i < 6; i++) {
    this.times[i] = Math.random() * -10000
  }
}

function update(dt) {
  dt = dt === undefined ? 1000 / 60 : dt

  if (this.enablePositionNoise) {
    for (var i = 0; i < 3; i++) {
      this.times[i] += this.positionFrequency * dt
    }

    _v.set(
      _fbm(this.times[0], this.positionFractalLevel),
      _fbm(this.times[1], this.positionFractalLevel),
      _fbm(this.times[2], this.positionFractalLevel)
    )

    _v.multiply(this.positionScale)
    _v.multiplyScalar(this.positionAmplitude * FBM_NORM)

    this.position.copy(_v)
  }

  if (this.enableRotationNoise) {
    for (var i = 0; i < 3; i++) {
      this.times[i + 3] += this.rotationFrequency * dt
    }

    _v.set(
      _fbm(this.times[3], this.rotationFractalLevel),
      _fbm(this.times[4], this.rotationFractalLevel),
      _fbm(this.times[5], this.rotationFractalLevel))

    _v.multiply(this.rotationScale)
    _v.multiplyScalar(this.rotationAmplitude * FBM_NORM)
    _e.set(_v.x, _v.y, _v.z)
    this.rotation.setFromEuler(_e)
  }
}

var _noise = new Simple1DNoise()

function Simple1DNoise() {
  var MAX_VERTICES = 256
  var MAX_VERTICES_MASK = MAX_VERTICES - 1
  var amplitude = 1
  var scale = 1

  var r = []

  for (var i = 0; i < MAX_VERTICES; ++i) {
    r.push(Math.random())
  }

  var getVal = function(x) {
    var scaledX = x * scale
    var xFloor = Math.floor(scaledX)
    var t = scaledX - xFloor
    var tRemapSmoothstep = t * t * (3 - 2 * t)

    // / Modulo using &
    var xMin = xFloor & MAX_VERTICES_MASK
    var xMax = (xMin + 1) & MAX_VERTICES_MASK

    var y = lerp(r[xMin], r[xMax], tRemapSmoothstep)

    return y * amplitude
  }

  /**
   * Linear interpolation function.
   * @param a The lower integer value
   * @param b The upper integer value
   * @param t The value between the two
   * @returns {number}
   */
  var lerp = function(a, b, t) {
    return a * (1 - t) + b * t
  }

  // return the API
  return {
    getVal: getVal,
    setAmplitude: function(newAmplitude) {
      amplitude = newAmplitude
    },
    setScale: function(newScale) {
      scale = newScale
    }
  }
};

function _fbm(x, octave) {
  var f = 0.0
  var w = 0.5
  for (var i = 0; i < octave; i++) {
    f += w * _noise.getVal(x)
    x *= 2.0
    w *= 0.5
  }
  return f
}
