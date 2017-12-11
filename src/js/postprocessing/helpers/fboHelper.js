const THREE = require('three')
const glslify = require('glslify')
export let renderer
let _scene
let _camera
let _quad
let _color

export let precisionPrefix
export let renderTargetFloatType
export let vertexShader

export let planeGeometry
export let colorMaterial
export let copyMaterial
export let multiColorMaterials = []
export let multiCopyMaterials = []

export function init (refRenderer, refRenderTargetFloatType) {
  if (renderer) return

  renderer = refRenderer

  renderTargetFloatType = refRenderTargetFloatType === undefined ? THREE.FloatType : refRenderTargetFloatType

  precisionPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n'
  // precisionPrefix = 'precision mediump float;\n'

  _scene = new THREE.Scene()
  _camera = new THREE.Camera()
  _camera.position.z = 1

  vertexShader = precisionPrefix + glslify('../glsl/quad.vert')

  _color = new THREE.Color()
  colorMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_color: { type: 'v4', value: new THREE.Vector4() }
    },
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    vertexShader: vertexShader,
    fragmentShader: precisionPrefix + glslify('../glsl/quadColor.frag')
  })

  copyMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undefined }
    },
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    vertexShader: vertexShader,
    fragmentShader: precisionPrefix + glslify('../glsl/quad.frag')
  })

  planeGeometry = new THREE.PlaneBufferGeometry(2, 2)
  _quad = new THREE.Mesh(planeGeometry, copyMaterial)
  _quad.frustumCulled = false
  _scene.add(_quad)
}

export function copy (texture, renderTarget, forceClear) {
  let material = copyMaterial
  if (texture.length && texture.length > 1) {
    let count = texture.length
    if (count < 2) console.error('please use copy() instead')
    material = multiCopyMaterials[count]
    if (!material) {
      material = new THREE.RawShaderMaterial({
        uniforms: {},
        depthTest: false,
        depthWrite: false,
        vertexShader: copyMaterial.vertexShader,
        fragmentShader: copyMaterial.fragmentShader,
        extensions: {
          drawBuffers: true
        },
        defines: {
          TEXTURE_COUNT: count
        }
      })
      for (let i = 0; i < count; i++) {
        material.uniforms['u_texture' + i] = {type: 't', value: undefined}
      }
    }
    for (let i = 0; i < count; i++) {
      material.uniforms['u_texture' + i].value = texture[i]
    }
  } else {
    copyMaterial.uniforms.u_texture.value = texture
  }
  render(material, renderTarget, forceClear)
}

export function renderColor (color, alpha, renderTarget, forceClear) {
  let material = colorMaterial
  if (color.length && color.length > 1) {
    let count = color.length
    if (count < 2) console.error('please use copy() instead')
    material = multiCopyMaterials[count]
    if (!material) {
      material = new THREE.RawShaderMaterial({
        uniforms: {},
        depthTest: false,
        depthWrite: false,
        vertexShader: copyMaterial.vertexShader,
        fragmentShader: copyMaterial.fragmentShader,
        extensions: {
          drawBuffers: true
        },
        defines: {
          TEXTURE_COUNT: count
        }
      })
      for (let i = 0; i < count; i++) {
        material.uniforms['u_color' + i] = {type: 'v4', value: new THREE.Vector4()}
      }
    }
    for (let i = 0; i < count; i++) {
      _color.set(color[i])
      material.uniforms['u_color' + i].value.set(_color.r, _color.g, _color.b, alpha[i])
    }
  } else {
    _color.set(color)
    colorMaterial.uniforms.u_color.value.set(_color.r, _color.g, _color.b, alpha)
  }
  render(material, renderTarget, forceClear)
}

export function renderGeometry (geometry, material, renderTarget, forceClear) {
  _quad.geometry = geometry
  render(material, renderTarget, forceClear)
  _quad.geometry = planeGeometry
}

export function renderObject (obj, renderTarget, forceClear) {
  _quad.visible = false
  _scene.add(obj)
  if (renderTarget) {
    renderer.render(_scene, _camera, renderTarget, forceClear)
  } else {
    renderer.render(_scene, _camera, undefined, forceClear)
  }
  _scene.remove(obj)
  _quad.visible = true
}

export function render (material, renderTarget, forceClear) {
  _quad.material = material
  // if (renderTarget) {
    renderer.render(_scene, _camera, renderTarget, forceClear)
  // } else {
  //   renderer.render(_scene, _camera, undefined, forceClear)
  // }
}

export function resizeRenderTarget (renderTarget, width, height) {
  width = (width | 0) || 1
  height = (height | 0) || 1
  if ((width !== renderTarget.width) || (height !== renderTarget.height)) {
    renderTarget.setSize(width, height)
  }
}

export function createRenderTarget (width, height, format, type, minFilter, magFilter) {
  var renderTarget = new THREE.WebGLRenderTarget(width || 1, height || 1, {
    format: format || THREE.RGBFormat,
    type: type || THREE.UnsignedByteType,
    minFilter: minFilter || THREE.LinearFilter,
    magFilter: magFilter || THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false
  })

  renderTarget.texture.generateMipMaps = false

  return renderTarget
}

// export function createMultiRenderTarget (count, width, height, format, type, minFilter, magFilter) {
//   var renderTarget = new THREE.WebGLMultiRenderTarget(width || 1, height || 1, {
//     format: format || THREE.RGBFormat,
//     type: type || THREE.UnsignedByteType,
//     minFilter: minFilter || THREE.LinearFilter,
//     magFilter: magFilter || THREE.LinearFilter,
//     depthBuffer: false,
//     stencilBuffer: false
//   })

//   renderTarget.texture.generateMipMaps = false
//   for (var i = 1; i < count; i++) {
//     renderTarget.attachments.push(renderTarget.texture.clone())
//   }

//   return renderTarget
// }

export function getColorState () {
  return {
    autoClearColor: renderer.autoClearColor,
    autoClearStencil: renderer.autoClearStencil,
    autoClearDepth: renderer.autoClearDepth,
    clearColor: renderer.getClearColor().getHex(),
    clearAlpha: renderer.getClearAlpha()
  }
}

export function setColorState (state) {
  renderer.setClearColor(state.clearColor, state.clearAlpha)
  renderer.autoClearColor = state.autoClearColor
  renderer.autoClearStencil = state.autoClearStencil
  renderer.autoClearDepth = state.autoClearDepth
}
