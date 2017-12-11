import * as THREE from 'three'
import CopyShader from './CopyShader'

/**
 * @author alteredq / http://alteredqualia.com/
 */

 /**
 * @author alteredq / http://alteredqualia.com/
 */

const EffectComposer = function (renderer, renderTarget) {
  this.renderer = renderer

  if (renderTarget === undefined) {
    var parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false
    }

    var size = renderer.getDrawingBufferSize()
    renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, parameters)
    renderTarget.texture.name = 'EffectComposer.rt1'
  }

  this.renderTarget1 = renderTarget
  this.renderTarget2 = renderTarget.clone()
  this.renderTarget2.texture.name = 'EffectComposer.rt2'

  this.writeBuffer = this.renderTarget1
  this.readBuffer = this.renderTarget2

  this.passes = []

      // dependencies

  if (CopyShader === undefined) {
    console.error('THREE.EffectComposer relies on THREE.CopyShader')
  }

  if (ShaderPass === undefined) {
    console.error('THREE.EffectComposer relies on THREE.ShaderPass')
  }

  this.copyPass = new ShaderPass(CopyShader)
}

Object.assign(EffectComposer.prototype, {

  swapBuffers: function () {
    var tmp = this.readBuffer
    this.readBuffer = this.writeBuffer
    this.writeBuffer = tmp
  },

  addPass: function (pass) {
    this.passes.push(pass)

    var size = this.renderer.getDrawingBufferSize()
    pass.setSize(size.width, size.height)
  },

  insertPass: function (pass, index) {
    this.passes.splice(index, 0, pass)
  },

  render: function (delta) {
    var maskActive = false

    var pass, i, il = this.passes.length

    for (i = 0; i < il; i++) {
      pass = this.passes[ i ]

      if (pass.enabled === false) continue

      pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive)

      if (pass.needsSwap) {
        if (maskActive) {
          var context = this.renderer.context

          context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff)

          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta)

          context.stencilFunc(context.EQUAL, 1, 0xffffffff)
        }

        this.swapBuffers()
      }

      if (THREE.MaskPass !== undefined) {
        if (pass instanceof THREE.MaskPass) {
          maskActive = true
        } else if (pass instanceof THREE.ClearMaskPass) {
          maskActive = false
        }
      }
    }
  },

  reset: function (renderTarget) {
    if (renderTarget === undefined) {
      var size = this.renderer.getDrawingBufferSize()

      renderTarget = this.renderTarget1.clone()
      renderTarget.setSize(size.width, size.height)
    }

    this.renderTarget1.dispose()
    this.renderTarget2.dispose()
    this.renderTarget1 = renderTarget
    this.renderTarget2 = renderTarget.clone()

    this.writeBuffer = this.renderTarget1
    this.readBuffer = this.renderTarget2
  },

  setSize: function (width, height) {
    this.renderTarget1.setSize(width, height)
    this.renderTarget2.setSize(width, height)

    for (var i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(width, height)
    }
  }

})

const Pass = function () {
      // if set to true, the pass is processed by the composer
  this.enabled = true

      // if set to true, the pass indicates to swap read and write buffer after rendering
  this.needsSwap = true

      // if set to true, the pass clears its buffer before rendering
  this.clear = false

      // if set to true, the result of the pass is rendered to screen
  this.renderToScreen = false
}

Object.assign(Pass.prototype, {

  setSize: function (width, height) {},

  render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {
    console.error('THREE.Pass: .render() must be implemented in derived pass.')
  }

})

const ShaderPass = function (shader, textureID) {
  Pass.call(this)

  this.textureID = (textureID !== undefined) ? textureID : 'tDiffuse'

  if (shader instanceof THREE.ShaderMaterial) {
    this.uniforms = shader.uniforms

    this.material = shader
  } else if (shader) {
    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms)

    this.material = new THREE.ShaderMaterial({

      defines: shader.defines || {},
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader

    })
  }

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  this.scene = new THREE.Scene()

  this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null)
  this.quad.frustumCulled = false // Avoid getting clipped
  this.scene.add(this.quad)
}

ShaderPass.prototype = Object.assign(Object.create(Pass.prototype), {

  constructor: ShaderPass,

  render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {
    if (this.uniforms[ this.textureID ]) {
      this.uniforms[ this.textureID ].value = readBuffer.texture
    }

    this.quad.material = this.material

    if (this.renderToScreen) {
      renderer.render(this.scene, this.camera)
    } else {
      renderer.render(this.scene, this.camera, writeBuffer, this.clear)
    }
  }

})

/**
 * @author alteredq / http://alteredqualia.com/
 */

const RenderPass = function (scene, camera, overrideMaterial, clearColor, clearAlpha) {
  Pass.call(this)

  this.scene = scene
  this.camera = camera

  this.overrideMaterial = overrideMaterial

  this.clearColor = clearColor
  this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0

  this.clear = true
  this.clearDepth = false
  this.needsSwap = false
}

RenderPass.prototype = Object.assign(Object.create(Pass.prototype), {

  constructor: RenderPass,

  render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {
    var oldAutoClear = renderer.autoClear
    renderer.autoClear = false

    this.scene.overrideMaterial = this.overrideMaterial

    var oldClearColor, oldClearAlpha

    if (this.clearColor) {
      oldClearColor = renderer.getClearColor().getHex()
      oldClearAlpha = renderer.getClearAlpha()

      renderer.setClearColor(this.clearColor, this.clearAlpha)
    }

    if (this.clearDepth) {
      renderer.clearDepth()
    }

    renderer.render(this.scene, this.camera, this.renderToScreen ? null : readBuffer, this.clear)

    if (this.clearColor) {
      renderer.setClearColor(oldClearColor, oldClearAlpha)
    }

    this.scene.overrideMaterial = null
    renderer.autoClear = oldAutoClear
  }

})

export {EffectComposer, ShaderPass, Pass, RenderPass}
