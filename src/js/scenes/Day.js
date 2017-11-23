'use strict'

// libs
import * as THREE from 'three'
import Config from '../Config'
import { ConvexGeometry } from '../../../functions/ConvexGeometry'
import { getDay } from '../../data/btc'
import moment from 'moment'
import Audio from '../audio/audio'
import _ from 'lodash'
import EffectComposer, { RenderPass, ShaderPass } from 'three-effectcomposer-es6'
let merkle = require('../merkle-tree-gen')
const TWEEN = require('@tweenjs/tween.js')
const BrownianMotion = require('../motions/BrownianMotion')
// import { oui } from 'ouioui'

export default class Day {
  constructor (blocks = [], currentDate = new Date()) {
    this.textureLoader = new THREE.TextureLoader()

    this.initState(blocks, currentDate)
    this.initRenderer()
    this.initCamera()
    this.initShaders()

    this.composer = new EffectComposer(this.renderer)

    this.composer.setSize(window.innerWidth, window.innerHeight)

    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const RGBShiftPass = new ShaderPass(this.RGBShiftShader)
    this.composer.addPass(RGBShiftPass)

    const FilmShaderPass = new ShaderPass(this.FilmShader)
    this.composer.addPass(FilmShaderPass)

    const VignettePass = new ShaderPass(this.VignetteShader)
    this.composer.addPass(VignettePass)

    const BrightnessContrastPass = new ShaderPass(this.BrightnessContrastShader)
    this.composer.addPass(BrightnessContrastPass)

    const HueSaturationPass = new ShaderPass(this.HueSaturationShader)
    // HueSaturationPass.renderToScreen = true
    this.composer.addPass(HueSaturationPass)

    const FXAAPass = new ShaderPass(this.FXAAShader)
    FXAAPass.renderToScreen = true
    this.composer.addPass(FXAAPass)

    this.audio = new Audio(this.camera)

    this.audio.init().then(() => {
      this.addEvents()
      this.addLights()
      this.setupMaterials()
      this.addObjects()
      this.moveCamera()
      this.animate()
    })
  }

  initShaders () {
    this.FXAAShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2(1 / window.innerWidth, 1 / window.innerHeight) }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        '',
        'uniform sampler2D tDiffuse;',
        '',
        'uniform vec2 resolution;',
        '',
        'varying vec2 vUv;',
        '',
        '// FXAA 3.11 implementation by NVIDIA, ported to WebGL by Agost Biro (biro@archilogic.com)',
        '',
        '//----------------------------------------------------------------------------------',
        '// File:        es3-kepler\FXAA\assets\shaders/FXAA_DefaultES.frag',
        '// SDK Version: v3.00',
        '// Email:       gameworks@nvidia.com',
        '// Site:        http://developer.nvidia.com/',
        '//',
        '// Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved.',
        '//',
        '// Redistribution and use in source and binary forms, with or without',
        '// modification, are permitted provided that the following conditions',
        '// are met:',
        '//  * Redistributions of source code must retain the above copyright',
        '//    notice, this list of conditions and the following disclaimer.',
        '//  * Redistributions in binary form must reproduce the above copyright',
        '//    notice, this list of conditions and the following disclaimer in the',
        '//    documentation and/or other materials provided with the distribution.',
        '//  * Neither the name of NVIDIA CORPORATION nor the names of its',
        '//    contributors may be used to endorse or promote products derived',
        '//    from this software without specific prior written permission.',
        '//',
        "// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY",
        '// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE',
        '// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR',
        '// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR',
        '// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,',
        '// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,',
        '// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR',
        '// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY',
        '// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT',
        '// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE',
        '// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.',
        '//',
        '//----------------------------------------------------------------------------------',
        '',
        '#define FXAA_PC 1',
        '#define FXAA_GLSL_100 1',
        '#define FXAA_QUALITY_PRESET 12',
        '',
        '#define FXAA_GREEN_AS_LUMA 1',
        '',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_PC_CONSOLE',
        '    //',
        '    // The console algorithm for PC is included',
        '    // for developers targeting really low spec machines.',
        '    // Likely better to just run FXAA_PC, and use a really low preset.',
        '    //',
        '    #define FXAA_PC_CONSOLE 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_GLSL_120',
        '    #define FXAA_GLSL_120 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_GLSL_130',
        '    #define FXAA_GLSL_130 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_HLSL_3',
        '    #define FXAA_HLSL_3 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_HLSL_4',
        '    #define FXAA_HLSL_4 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_HLSL_5',
        '    #define FXAA_HLSL_5 0',
        '#endif',
        '/*==========================================================================*/',
        '#ifndef FXAA_GREEN_AS_LUMA',
        '    //',
        '    // For those using non-linear color,',
        '    // and either not able to get luma in alpha, or not wanting to,',
        '    // this enables FXAA to run using green as a proxy for luma.',
        '    // So with this enabled, no need to pack luma in alpha.',
        '    //',
        '    // This will turn off AA on anything which lacks some amount of green.',
        '    // Pure red and blue or combination of only R and B, will get no AA.',
        '    //',
        '    // Might want to lower the settings for both,',
        '    //    fxaaConsoleEdgeThresholdMin',
        '    //    fxaaQualityEdgeThresholdMin',
        '    // In order to insure AA does not get turned off on colors',
        '    // which contain a minor amount of green.',
        '    //',
        '    // 1 = On.',
        '    // 0 = Off.',
        '    //',
        '    #define FXAA_GREEN_AS_LUMA 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_EARLY_EXIT',
        '    //',
        "    // Controls algorithm's early exit path.",
        '    // On PS3 turning this ON adds 2 cycles to the shader.',
        '    // On 360 turning this OFF adds 10ths of a millisecond to the shader.',
        '    // Turning this off on console will result in a more blurry image.',
        '    // So this defaults to on.',
        '    //',
        '    // 1 = On.',
        '    // 0 = Off.',
        '    //',
        '    #define FXAA_EARLY_EXIT 1',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_DISCARD',
        '    //',
        '    // Only valid for PC OpenGL currently.',
        '    // Probably will not work when FXAA_GREEN_AS_LUMA = 1.',
        '    //',
        "    // 1 = Use discard on pixels which don't need AA.",
        '    //     For APIs which enable concurrent TEX+ROP from same surface.',
        "    // 0 = Return unchanged color on pixels which don't need AA.",
        '    //',
        '    #define FXAA_DISCARD 0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_FAST_PIXEL_OFFSET',
        '    //',
        '    // Used for GLSL 120 only.',
        '    //',
        '    // 1 = GL API supports fast pixel offsets',
        '    // 0 = do not use fast pixel offsets',
        '    //',
        '    #ifdef GL_EXT_gpu_shader4',
        '        #define FXAA_FAST_PIXEL_OFFSET 1',
        '    #endif',
        '    #ifdef GL_NV_gpu_shader5',
        '        #define FXAA_FAST_PIXEL_OFFSET 1',
        '    #endif',
        '    #ifdef GL_ARB_gpu_shader5',
        '        #define FXAA_FAST_PIXEL_OFFSET 1',
        '    #endif',
        '    #ifndef FXAA_FAST_PIXEL_OFFSET',
        '        #define FXAA_FAST_PIXEL_OFFSET 0',
        '    #endif',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#ifndef FXAA_GATHER4_ALPHA',
        '    //',
        '    // 1 = API supports gather4 on alpha channel.',
        '    // 0 = API does not support gather4 on alpha channel.',
        '    //',
        '    #if (FXAA_HLSL_5 == 1)',
        '        #define FXAA_GATHER4_ALPHA 1',
        '    #endif',
        '    #ifdef GL_ARB_gpu_shader5',
        '        #define FXAA_GATHER4_ALPHA 1',
        '    #endif',
        '    #ifdef GL_NV_gpu_shader5',
        '        #define FXAA_GATHER4_ALPHA 1',
        '    #endif',
        '    #ifndef FXAA_GATHER4_ALPHA',
        '        #define FXAA_GATHER4_ALPHA 0',
        '    #endif',
        '#endif',
        '',
        '',
        '/*============================================================================',
        '                        FXAA QUALITY - TUNING KNOBS',
        '------------------------------------------------------------------------------',
        'NOTE the other tuning knobs are now in the shader function inputs!',
        '============================================================================*/',
        '#ifndef FXAA_QUALITY_PRESET',
        '    //',
        '    // Choose the quality preset.',
        '    // This needs to be compiled into the shader as it effects code.',
        '    // Best option to include multiple presets is to',
        '    // in each shader define the preset, then include this file.',
        '    //',
        '    // OPTIONS',
        '    // -----------------------------------------------------------------------',
        '    // 10 to 15 - default medium dither (10=fastest, 15=highest quality)',
        '    // 20 to 29 - less dither, more expensive (20=fastest, 29=highest quality)',
        '    // 39       - no dither, very expensive',
        '    //',
        '    // NOTES',
        '    // -----------------------------------------------------------------------',
        '    // 12 = slightly faster then FXAA 3.9 and higher edge quality (default)',
        '    // 13 = about same speed as FXAA 3.9 and better than 12',
        '    // 23 = closest to FXAA 3.9 visually and performance wise',
        '    //  _ = the lowest digit is directly related to performance',
        '    // _  = the highest digit is directly related to style',
        '    //',
        '    #define FXAA_QUALITY_PRESET 12',
        '#endif',
        '',
        '',
        '/*============================================================================',
        '',
        '                           FXAA QUALITY - PRESETS',
        '',
        '============================================================================*/',
        '',
        '/*============================================================================',
        '                     FXAA QUALITY - MEDIUM DITHER PRESETS',
        '============================================================================*/',
        '#if (FXAA_QUALITY_PRESET == 10)',
        '    #define FXAA_QUALITY_PS 3',
        '    #define FXAA_QUALITY_P0 1.5',
        '    #define FXAA_QUALITY_P1 3.0',
        '    #define FXAA_QUALITY_P2 12.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 11)',
        '    #define FXAA_QUALITY_PS 4',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 3.0',
        '    #define FXAA_QUALITY_P3 12.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 12)',
        '    #define FXAA_QUALITY_PS 5',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 4.0',
        '    #define FXAA_QUALITY_P4 12.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 13)',
        '    #define FXAA_QUALITY_PS 6',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 4.0',
        '    #define FXAA_QUALITY_P5 12.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 14)',
        '    #define FXAA_QUALITY_PS 7',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 4.0',
        '    #define FXAA_QUALITY_P6 12.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 15)',
        '    #define FXAA_QUALITY_PS 8',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 4.0',
        '    #define FXAA_QUALITY_P7 12.0',
        '#endif',
        '',
        '/*============================================================================',
        '                     FXAA QUALITY - LOW DITHER PRESETS',
        '============================================================================*/',
        '#if (FXAA_QUALITY_PRESET == 20)',
        '    #define FXAA_QUALITY_PS 3',
        '    #define FXAA_QUALITY_P0 1.5',
        '    #define FXAA_QUALITY_P1 2.0',
        '    #define FXAA_QUALITY_P2 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 21)',
        '    #define FXAA_QUALITY_PS 4',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 22)',
        '    #define FXAA_QUALITY_PS 5',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 23)',
        '    #define FXAA_QUALITY_PS 6',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 24)',
        '    #define FXAA_QUALITY_PS 7',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 3.0',
        '    #define FXAA_QUALITY_P6 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 25)',
        '    #define FXAA_QUALITY_PS 8',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 4.0',
        '    #define FXAA_QUALITY_P7 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 26)',
        '    #define FXAA_QUALITY_PS 9',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 2.0',
        '    #define FXAA_QUALITY_P7 4.0',
        '    #define FXAA_QUALITY_P8 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 27)',
        '    #define FXAA_QUALITY_PS 10',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 2.0',
        '    #define FXAA_QUALITY_P7 2.0',
        '    #define FXAA_QUALITY_P8 4.0',
        '    #define FXAA_QUALITY_P9 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 28)',
        '    #define FXAA_QUALITY_PS 11',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 2.0',
        '    #define FXAA_QUALITY_P7 2.0',
        '    #define FXAA_QUALITY_P8 2.0',
        '    #define FXAA_QUALITY_P9 4.0',
        '    #define FXAA_QUALITY_P10 8.0',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_QUALITY_PRESET == 29)',
        '    #define FXAA_QUALITY_PS 12',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.5',
        '    #define FXAA_QUALITY_P2 2.0',
        '    #define FXAA_QUALITY_P3 2.0',
        '    #define FXAA_QUALITY_P4 2.0',
        '    #define FXAA_QUALITY_P5 2.0',
        '    #define FXAA_QUALITY_P6 2.0',
        '    #define FXAA_QUALITY_P7 2.0',
        '    #define FXAA_QUALITY_P8 2.0',
        '    #define FXAA_QUALITY_P9 2.0',
        '    #define FXAA_QUALITY_P10 4.0',
        '    #define FXAA_QUALITY_P11 8.0',
        '#endif',
        '',
        '/*============================================================================',
        '                     FXAA QUALITY - EXTREME QUALITY',
        '============================================================================*/',
        '#if (FXAA_QUALITY_PRESET == 39)',
        '    #define FXAA_QUALITY_PS 12',
        '    #define FXAA_QUALITY_P0 1.0',
        '    #define FXAA_QUALITY_P1 1.0',
        '    #define FXAA_QUALITY_P2 1.0',
        '    #define FXAA_QUALITY_P3 1.0',
        '    #define FXAA_QUALITY_P4 1.0',
        '    #define FXAA_QUALITY_P5 1.5',
        '    #define FXAA_QUALITY_P6 2.0',
        '    #define FXAA_QUALITY_P7 2.0',
        '    #define FXAA_QUALITY_P8 2.0',
        '    #define FXAA_QUALITY_P9 2.0',
        '    #define FXAA_QUALITY_P10 4.0',
        '    #define FXAA_QUALITY_P11 8.0',
        '#endif',
        '',
        '',
        '',
        '/*============================================================================',
        '',
        '                                API PORTING',
        '',
        '============================================================================*/',
        '#if (FXAA_GLSL_100 == 1) || (FXAA_GLSL_120 == 1) || (FXAA_GLSL_130 == 1)',
        '    #define FxaaBool bool',
        '    #define FxaaDiscard discard',
        '    #define FxaaFloat float',
        '    #define FxaaFloat2 vec2',
        '    #define FxaaFloat3 vec3',
        '    #define FxaaFloat4 vec4',
        '    #define FxaaHalf float',
        '    #define FxaaHalf2 vec2',
        '    #define FxaaHalf3 vec3',
        '    #define FxaaHalf4 vec4',
        '    #define FxaaInt2 ivec2',
        '    #define FxaaSat(x) clamp(x, 0.0, 1.0)',
        '    #define FxaaTex sampler2D',
        '#else',
        '    #define FxaaBool bool',
        '    #define FxaaDiscard clip(-1)',
        '    #define FxaaFloat float',
        '    #define FxaaFloat2 float2',
        '    #define FxaaFloat3 float3',
        '    #define FxaaFloat4 float4',
        '    #define FxaaHalf half',
        '    #define FxaaHalf2 half2',
        '    #define FxaaHalf3 half3',
        '    #define FxaaHalf4 half4',
        '    #define FxaaSat(x) saturate(x)',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_GLSL_100 == 1)',
        '  #define FxaaTexTop(t, p) texture2D(t, p, 0.0)',
        '  #define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r), 0.0)',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_GLSL_120 == 1)',
        '    // Requires,',
        '    //  #version 120',
        '    // And at least,',
        '    //  #extension GL_EXT_gpu_shader4 : enable',
        '    //  (or set FXAA_FAST_PIXEL_OFFSET 1 to work like DX9)',
        '    #define FxaaTexTop(t, p) texture2DLod(t, p, 0.0)',
        '    #if (FXAA_FAST_PIXEL_OFFSET == 1)',
        '        #define FxaaTexOff(t, p, o, r) texture2DLodOffset(t, p, 0.0, o)',
        '    #else',
        '        #define FxaaTexOff(t, p, o, r) texture2DLod(t, p + (o * r), 0.0)',
        '    #endif',
        '    #if (FXAA_GATHER4_ALPHA == 1)',
        '        // use #extension GL_ARB_gpu_shader5 : enable',
        '        #define FxaaTexAlpha4(t, p) textureGather(t, p, 3)',
        '        #define FxaaTexOffAlpha4(t, p, o) textureGatherOffset(t, p, o, 3)',
        '        #define FxaaTexGreen4(t, p) textureGather(t, p, 1)',
        '        #define FxaaTexOffGreen4(t, p, o) textureGatherOffset(t, p, o, 1)',
        '    #endif',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_GLSL_130 == 1)',
        '    // Requires "#version 130" or better',
        '    #define FxaaTexTop(t, p) textureLod(t, p, 0.0)',
        '    #define FxaaTexOff(t, p, o, r) textureLodOffset(t, p, 0.0, o)',
        '    #if (FXAA_GATHER4_ALPHA == 1)',
        '        // use #extension GL_ARB_gpu_shader5 : enable',
        '        #define FxaaTexAlpha4(t, p) textureGather(t, p, 3)',
        '        #define FxaaTexOffAlpha4(t, p, o) textureGatherOffset(t, p, o, 3)',
        '        #define FxaaTexGreen4(t, p) textureGather(t, p, 1)',
        '        #define FxaaTexOffGreen4(t, p, o) textureGatherOffset(t, p, o, 1)',
        '    #endif',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_HLSL_3 == 1)',
        '    #define FxaaInt2 float2',
        '    #define FxaaTex sampler2D',
        '    #define FxaaTexTop(t, p) tex2Dlod(t, float4(p, 0.0, 0.0))',
        '    #define FxaaTexOff(t, p, o, r) tex2Dlod(t, float4(p + (o * r), 0, 0))',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_HLSL_4 == 1)',
        '    #define FxaaInt2 int2',
        '    struct FxaaTex { SamplerState smpl; Texture2D tex; };',
        '    #define FxaaTexTop(t, p) t.tex.SampleLevel(t.smpl, p, 0.0)',
        '    #define FxaaTexOff(t, p, o, r) t.tex.SampleLevel(t.smpl, p, 0.0, o)',
        '#endif',
        '/*--------------------------------------------------------------------------*/',
        '#if (FXAA_HLSL_5 == 1)',
        '    #define FxaaInt2 int2',
        '    struct FxaaTex { SamplerState smpl; Texture2D tex; };',
        '    #define FxaaTexTop(t, p) t.tex.SampleLevel(t.smpl, p, 0.0)',
        '    #define FxaaTexOff(t, p, o, r) t.tex.SampleLevel(t.smpl, p, 0.0, o)',
        '    #define FxaaTexAlpha4(t, p) t.tex.GatherAlpha(t.smpl, p)',
        '    #define FxaaTexOffAlpha4(t, p, o) t.tex.GatherAlpha(t.smpl, p, o)',
        '    #define FxaaTexGreen4(t, p) t.tex.GatherGreen(t.smpl, p)',
        '    #define FxaaTexOffGreen4(t, p, o) t.tex.GatherGreen(t.smpl, p, o)',
        '#endif',
        '',
        '',
        '/*============================================================================',
        '                   GREEN AS LUMA OPTION SUPPORT FUNCTION',
        '============================================================================*/',
        '#if (FXAA_GREEN_AS_LUMA == 0)',
        '    FxaaFloat FxaaLuma(FxaaFloat4 rgba) { return rgba.w; }',
        '#else',
        '    FxaaFloat FxaaLuma(FxaaFloat4 rgba) { return rgba.y; }',
        '#endif',
        '',
        '',
        '',
        '',
        '/*============================================================================',
        '',
        '                             FXAA3 QUALITY - PC',
        '',
        '============================================================================*/',
        '#if (FXAA_PC == 1)',
        '/*--------------------------------------------------------------------------*/',
        'FxaaFloat4 FxaaPixelShader(',
        '    //',
        '    // Use noperspective interpolation here (turn off perspective interpolation).',
        '    // {xy} = center of pixel',
        '    FxaaFloat2 pos,',
        '    //',
        '    // Used only for FXAA Console, and not used on the 360 version.',
        '    // Use noperspective interpolation here (turn off perspective interpolation).',
        '    // {xy_} = upper left of pixel',
        '    // {_zw} = lower right of pixel',
        '    FxaaFloat4 fxaaConsolePosPos,',
        '    //',
        '    // Input color texture.',
        '    // {rgb_} = color in linear or perceptual color space',
        '    // if (FXAA_GREEN_AS_LUMA == 0)',
        '    //     {__a} = luma in perceptual color space (not linear)',
        '    FxaaTex tex,',
        '    //',
        '    // Only used on the optimized 360 version of FXAA Console.',
        '    // For everything but 360, just use the same input here as for "tex".',
        '    // For 360, same texture, just alias with a 2nd sampler.',
        '    // This sampler needs to have an exponent bias of -1.',
        '    FxaaTex fxaaConsole360TexExpBiasNegOne,',
        '    //',
        '    // Only used on the optimized 360 version of FXAA Console.',
        '    // For everything but 360, just use the same input here as for "tex".',
        '    // For 360, same texture, just alias with a 3nd sampler.',
        '    // This sampler needs to have an exponent bias of -2.',
        '    FxaaTex fxaaConsole360TexExpBiasNegTwo,',
        '    //',
        '    // Only used on FXAA Quality.',
        '    // This must be from a constant/uniform.',
        '    // {x_} = 1.0/screenWidthInPixels',
        '    // {_y} = 1.0/screenHeightInPixels',
        '    FxaaFloat2 fxaaQualityRcpFrame,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // This must be from a constant/uniform.',
        '    // This effects sub-pixel AA quality and inversely sharpness.',
        '    //   Where N ranges between,',
        '    //     N = 0.50 (default)',
        '    //     N = 0.33 (sharper)',
        '    // {x__} = -N/screenWidthInPixels',
        '    // {_y_} = -N/screenHeightInPixels',
        '    // {_z_} =  N/screenWidthInPixels',
        '    // {__w} =  N/screenHeightInPixels',
        '    FxaaFloat4 fxaaConsoleRcpFrameOpt,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // Not used on 360, but used on PS3 and PC.',
        '    // This must be from a constant/uniform.',
        '    // {x__} = -2.0/screenWidthInPixels',
        '    // {_y_} = -2.0/screenHeightInPixels',
        '    // {_z_} =  2.0/screenWidthInPixels',
        '    // {__w} =  2.0/screenHeightInPixels',
        '    FxaaFloat4 fxaaConsoleRcpFrameOpt2,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // Only used on 360 in place of fxaaConsoleRcpFrameOpt2.',
        '    // This must be from a constant/uniform.',
        '    // {x__} =  8.0/screenWidthInPixels',
        '    // {_y_} =  8.0/screenHeightInPixels',
        '    // {_z_} = -4.0/screenWidthInPixels',
        '    // {__w} = -4.0/screenHeightInPixels',
        '    FxaaFloat4 fxaaConsole360RcpFrameOpt2,',
        '    //',
        '    // Only used on FXAA Quality.',
        '    // This used to be the FXAA_QUALITY_SUBPIX define.',
        '    // It is here now to allow easier tuning.',
        '    // Choose the amount of sub-pixel aliasing removal.',
        '    // This can effect sharpness.',
        '    //   1.00 - upper limit (softer)',
        '    //   0.75 - default amount of filtering',
        '    //   0.50 - lower limit (sharper, less sub-pixel aliasing removal)',
        '    //   0.25 - almost off',
        '    //   0.00 - completely off',
        '    FxaaFloat fxaaQualitySubpix,',
        '    //',
        '    // Only used on FXAA Quality.',
        '    // This used to be the FXAA_QUALITY_EDGE_THRESHOLD define.',
        '    // It is here now to allow easier tuning.',
        '    // The minimum amount of local contrast required to apply algorithm.',
        '    //   0.333 - too little (faster)',
        '    //   0.250 - low quality',
        '    //   0.166 - default',
        '    //   0.125 - high quality',
        '    //   0.063 - overkill (slower)',
        '    FxaaFloat fxaaQualityEdgeThreshold,',
        '    //',
        '    // Only used on FXAA Quality.',
        '    // This used to be the FXAA_QUALITY_EDGE_THRESHOLD_MIN define.',
        '    // It is here now to allow easier tuning.',
        '    // Trims the algorithm from processing darks.',
        '    //   0.0833 - upper limit (default, the start of visible unfiltered edges)',
        '    //   0.0625 - high quality (faster)',
        '    //   0.0312 - visible limit (slower)',
        '    // Special notes when using FXAA_GREEN_AS_LUMA,',
        '    //   Likely want to set this to zero.',
        '    //   As colors that are mostly not-green',
        '    //   will appear very dark in the green channel!',
        '    //   Tune by looking at mostly non-green content,',
        '    //   then start at zero and increase until aliasing is a problem.',
        '    FxaaFloat fxaaQualityEdgeThresholdMin,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // This used to be the FXAA_CONSOLE_EDGE_SHARPNESS define.',
        '    // It is here now to allow easier tuning.',
        '    // This does not effect PS3, as this needs to be compiled in.',
        '    //   Use FXAA_CONSOLE_PS3_EDGE_SHARPNESS for PS3.',
        '    //   Due to the PS3 being ALU bound,',
        '    //   there are only three safe values here: 2 and 4 and 8.',
        '    //   These options use the shaders ability to a free *|/ by 2|4|8.',
        '    // For all other platforms can be a non-power of two.',
        '    //   8.0 is sharper (default!!!)',
        '    //   4.0 is softer',
        '    //   2.0 is really soft (good only for vector graphics inputs)',
        '    FxaaFloat fxaaConsoleEdgeSharpness,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // This used to be the FXAA_CONSOLE_EDGE_THRESHOLD define.',
        '    // It is here now to allow easier tuning.',
        '    // This does not effect PS3, as this needs to be compiled in.',
        '    //   Use FXAA_CONSOLE_PS3_EDGE_THRESHOLD for PS3.',
        '    //   Due to the PS3 being ALU bound,',
        '    //   there are only two safe values here: 1/4 and 1/8.',
        '    //   These options use the shaders ability to a free *|/ by 2|4|8.',
        '    // The console setting has a different mapping than the quality setting.',
        '    // Other platforms can use other values.',
        '    //   0.125 leaves less aliasing, but is softer (default!!!)',
        '    //   0.25 leaves more aliasing, and is sharper',
        '    FxaaFloat fxaaConsoleEdgeThreshold,',
        '    //',
        '    // Only used on FXAA Console.',
        '    // This used to be the FXAA_CONSOLE_EDGE_THRESHOLD_MIN define.',
        '    // It is here now to allow easier tuning.',
        '    // Trims the algorithm from processing darks.',
        '    // The console setting has a different mapping than the quality setting.',
        '    // This only applies when FXAA_EARLY_EXIT is 1.',
        '    // This does not apply to PS3,',
        '    // PS3 was simplified to avoid more shader instructions.',
        '    //   0.06 - faster but more aliasing in darks',
        '    //   0.05 - default',
        '    //   0.04 - slower and less aliasing in darks',
        '    // Special notes when using FXAA_GREEN_AS_LUMA,',
        '    //   Likely want to set this to zero.',
        '    //   As colors that are mostly not-green',
        '    //   will appear very dark in the green channel!',
        '    //   Tune by looking at mostly non-green content,',
        '    //   then start at zero and increase until aliasing is a problem.',
        '    FxaaFloat fxaaConsoleEdgeThresholdMin,',
        '    //',
        '    // Extra constants for 360 FXAA Console only.',
        '    // Use zeros or anything else for other platforms.',
        '    // These must be in physical constant registers and NOT immedates.',
        '    // Immedates will result in compiler un-optimizing.',
        '    // {xyzw} = float4(1.0, -1.0, 0.25, -0.25)',
        '    FxaaFloat4 fxaaConsole360ConstDir',
        ') {',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat2 posM;',
        '    posM.x = pos.x;',
        '    posM.y = pos.y;',
        '    #if (FXAA_GATHER4_ALPHA == 1)',
        '        #if (FXAA_DISCARD == 0)',
        '            FxaaFloat4 rgbyM = FxaaTexTop(tex, posM);',
        '            #if (FXAA_GREEN_AS_LUMA == 0)',
        '                #define lumaM rgbyM.w',
        '            #else',
        '                #define lumaM rgbyM.y',
        '            #endif',
        '        #endif',
        '        #if (FXAA_GREEN_AS_LUMA == 0)',
        '            FxaaFloat4 luma4A = FxaaTexAlpha4(tex, posM);',
        '            FxaaFloat4 luma4B = FxaaTexOffAlpha4(tex, posM, FxaaInt2(-1, -1));',
        '        #else',
        '            FxaaFloat4 luma4A = FxaaTexGreen4(tex, posM);',
        '            FxaaFloat4 luma4B = FxaaTexOffGreen4(tex, posM, FxaaInt2(-1, -1));',
        '        #endif',
        '        #if (FXAA_DISCARD == 1)',
        '            #define lumaM luma4A.w',
        '        #endif',
        '        #define lumaE luma4A.z',
        '        #define lumaS luma4A.x',
        '        #define lumaSE luma4A.y',
        '        #define lumaNW luma4B.w',
        '        #define lumaN luma4B.z',
        '        #define lumaW luma4B.x',
        '    #else',
        '        FxaaFloat4 rgbyM = FxaaTexTop(tex, posM);',
        '        #if (FXAA_GREEN_AS_LUMA == 0)',
        '            #define lumaM rgbyM.w',
        '        #else',
        '            #define lumaM rgbyM.y',
        '        #endif',
        '        #if (FXAA_GLSL_100 == 1)',
        '          FxaaFloat lumaS = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2( 0.0, 1.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2( 1.0, 0.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaN = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2( 0.0,-1.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0, 0.0), fxaaQualityRcpFrame.xy));',
        '        #else',
        '          FxaaFloat lumaS = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2( 0, 1), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2( 1, 0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaN = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2( 0,-1), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 0), fxaaQualityRcpFrame.xy));',
        '        #endif',
        '    #endif',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat maxSM = max(lumaS, lumaM);',
        '    FxaaFloat minSM = min(lumaS, lumaM);',
        '    FxaaFloat maxESM = max(lumaE, maxSM);',
        '    FxaaFloat minESM = min(lumaE, minSM);',
        '    FxaaFloat maxWN = max(lumaN, lumaW);',
        '    FxaaFloat minWN = min(lumaN, lumaW);',
        '    FxaaFloat rangeMax = max(maxWN, maxESM);',
        '    FxaaFloat rangeMin = min(minWN, minESM);',
        '    FxaaFloat rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;',
        '    FxaaFloat range = rangeMax - rangeMin;',
        '    FxaaFloat rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);',
        '    FxaaBool earlyExit = range < rangeMaxClamped;',
        '/*--------------------------------------------------------------------------*/',
        '    if(earlyExit)',
        '        #if (FXAA_DISCARD == 1)',
        '            FxaaDiscard;',
        '        #else',
        '            return rgbyM;',
        '        #endif',
        '/*--------------------------------------------------------------------------*/',
        '    #if (FXAA_GATHER4_ALPHA == 0)',
        '        #if (FXAA_GLSL_100 == 1)',
        '          FxaaFloat lumaNW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0,-1.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaSE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2( 1.0, 1.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2( 1.0,-1.0), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0, 1.0), fxaaQualityRcpFrame.xy));',
        '        #else',
        '          FxaaFloat lumaNW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1,-1), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaSE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2( 1, 1), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2( 1,-1), fxaaQualityRcpFrame.xy));',
        '          FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 1), fxaaQualityRcpFrame.xy));',
        '        #endif',
        '    #else',
        '        FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(1, -1), fxaaQualityRcpFrame.xy));',
        '        FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 1), fxaaQualityRcpFrame.xy));',
        '    #endif',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat lumaNS = lumaN + lumaS;',
        '    FxaaFloat lumaWE = lumaW + lumaE;',
        '    FxaaFloat subpixRcpRange = 1.0/range;',
        '    FxaaFloat subpixNSWE = lumaNS + lumaWE;',
        '    FxaaFloat edgeHorz1 = (-2.0 * lumaM) + lumaNS;',
        '    FxaaFloat edgeVert1 = (-2.0 * lumaM) + lumaWE;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat lumaNESE = lumaNE + lumaSE;',
        '    FxaaFloat lumaNWNE = lumaNW + lumaNE;',
        '    FxaaFloat edgeHorz2 = (-2.0 * lumaE) + lumaNESE;',
        '    FxaaFloat edgeVert2 = (-2.0 * lumaN) + lumaNWNE;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat lumaNWSW = lumaNW + lumaSW;',
        '    FxaaFloat lumaSWSE = lumaSW + lumaSE;',
        '    FxaaFloat edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);',
        '    FxaaFloat edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);',
        '    FxaaFloat edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;',
        '    FxaaFloat edgeVert3 = (-2.0 * lumaS) + lumaSWSE;',
        '    FxaaFloat edgeHorz = abs(edgeHorz3) + edgeHorz4;',
        '    FxaaFloat edgeVert = abs(edgeVert3) + edgeVert4;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat subpixNWSWNESE = lumaNWSW + lumaNESE;',
        '    FxaaFloat lengthSign = fxaaQualityRcpFrame.x;',
        '    FxaaBool horzSpan = edgeHorz >= edgeVert;',
        '    FxaaFloat subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;',
        '/*--------------------------------------------------------------------------*/',
        '    if(!horzSpan) lumaN = lumaW;',
        '    if(!horzSpan) lumaS = lumaE;',
        '    if(horzSpan) lengthSign = fxaaQualityRcpFrame.y;',
        '    FxaaFloat subpixB = (subpixA * (1.0/12.0)) - lumaM;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat gradientN = lumaN - lumaM;',
        '    FxaaFloat gradientS = lumaS - lumaM;',
        '    FxaaFloat lumaNN = lumaN + lumaM;',
        '    FxaaFloat lumaSS = lumaS + lumaM;',
        '    FxaaBool pairN = abs(gradientN) >= abs(gradientS);',
        '    FxaaFloat gradient = max(abs(gradientN), abs(gradientS));',
        '    if(pairN) lengthSign = -lengthSign;',
        '    FxaaFloat subpixC = FxaaSat(abs(subpixB) * subpixRcpRange);',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat2 posB;',
        '    posB.x = posM.x;',
        '    posB.y = posM.y;',
        '    FxaaFloat2 offNP;',
        '    offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;',
        '    offNP.y = ( horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;',
        '    if(!horzSpan) posB.x += lengthSign * 0.5;',
        '    if( horzSpan) posB.y += lengthSign * 0.5;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat2 posN;',
        '    posN.x = posB.x - offNP.x * FXAA_QUALITY_P0;',
        '    posN.y = posB.y - offNP.y * FXAA_QUALITY_P0;',
        '    FxaaFloat2 posP;',
        '    posP.x = posB.x + offNP.x * FXAA_QUALITY_P0;',
        '    posP.y = posB.y + offNP.y * FXAA_QUALITY_P0;',
        '    FxaaFloat subpixD = ((-2.0)*subpixC) + 3.0;',
        '    FxaaFloat lumaEndN = FxaaLuma(FxaaTexTop(tex, posN));',
        '    FxaaFloat subpixE = subpixC * subpixC;',
        '    FxaaFloat lumaEndP = FxaaLuma(FxaaTexTop(tex, posP));',
        '/*--------------------------------------------------------------------------*/',
        '    if(!pairN) lumaNN = lumaSS;',
        '    FxaaFloat gradientScaled = gradient * 1.0/4.0;',
        '    FxaaFloat lumaMM = lumaM - lumaNN * 0.5;',
        '    FxaaFloat subpixF = subpixD * subpixE;',
        '    FxaaBool lumaMLTZero = lumaMM < 0.0;',
        '/*--------------------------------------------------------------------------*/',
        '    lumaEndN -= lumaNN * 0.5;',
        '    lumaEndP -= lumaNN * 0.5;',
        '    FxaaBool doneN = abs(lumaEndN) >= gradientScaled;',
        '    FxaaBool doneP = abs(lumaEndP) >= gradientScaled;',
        '    if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P1;',
        '    if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P1;',
        '    FxaaBool doneNP = (!doneN) || (!doneP);',
        '    if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P1;',
        '    if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P1;',
        '/*--------------------------------------------------------------------------*/',
        '    if(doneNP) {',
        '        if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '        if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '        doneN = abs(lumaEndN) >= gradientScaled;',
        '        doneP = abs(lumaEndP) >= gradientScaled;',
        '        if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P2;',
        '        if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P2;',
        '        doneNP = (!doneN) || (!doneP);',
        '        if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P2;',
        '        if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P2;',
        '/*--------------------------------------------------------------------------*/',
        '        #if (FXAA_QUALITY_PS > 3)',
        '        if(doneNP) {',
        '            if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '            if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '            if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '            if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '            doneN = abs(lumaEndN) >= gradientScaled;',
        '            doneP = abs(lumaEndP) >= gradientScaled;',
        '            if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P3;',
        '            if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P3;',
        '            doneNP = (!doneN) || (!doneP);',
        '            if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P3;',
        '            if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P3;',
        '/*--------------------------------------------------------------------------*/',
        '            #if (FXAA_QUALITY_PS > 4)',
        '            if(doneNP) {',
        '                if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                doneN = abs(lumaEndN) >= gradientScaled;',
        '                doneP = abs(lumaEndP) >= gradientScaled;',
        '                if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P4;',
        '                if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P4;',
        '                doneNP = (!doneN) || (!doneP);',
        '                if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P4;',
        '                if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P4;',
        '/*--------------------------------------------------------------------------*/',
        '                #if (FXAA_QUALITY_PS > 5)',
        '                if(doneNP) {',
        '                    if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                    if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                    if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                    if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                    doneN = abs(lumaEndN) >= gradientScaled;',
        '                    doneP = abs(lumaEndP) >= gradientScaled;',
        '                    if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P5;',
        '                    if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P5;',
        '                    doneNP = (!doneN) || (!doneP);',
        '                    if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P5;',
        '                    if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P5;',
        '/*--------------------------------------------------------------------------*/',
        '                    #if (FXAA_QUALITY_PS > 6)',
        '                    if(doneNP) {',
        '                        if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                        if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                        doneN = abs(lumaEndN) >= gradientScaled;',
        '                        doneP = abs(lumaEndP) >= gradientScaled;',
        '                        if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P6;',
        '                        if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P6;',
        '                        doneNP = (!doneN) || (!doneP);',
        '                        if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P6;',
        '                        if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P6;',
        '/*--------------------------------------------------------------------------*/',
        '                        #if (FXAA_QUALITY_PS > 7)',
        '                        if(doneNP) {',
        '                            if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                            if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                            if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                            if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                            doneN = abs(lumaEndN) >= gradientScaled;',
        '                            doneP = abs(lumaEndP) >= gradientScaled;',
        '                            if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P7;',
        '                            if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P7;',
        '                            doneNP = (!doneN) || (!doneP);',
        '                            if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P7;',
        '                            if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P7;',
        '/*--------------------------------------------------------------------------*/',
        '    #if (FXAA_QUALITY_PS > 8)',
        '    if(doneNP) {',
        '        if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '        if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '        doneN = abs(lumaEndN) >= gradientScaled;',
        '        doneP = abs(lumaEndP) >= gradientScaled;',
        '        if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P8;',
        '        if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P8;',
        '        doneNP = (!doneN) || (!doneP);',
        '        if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P8;',
        '        if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P8;',
        '/*--------------------------------------------------------------------------*/',
        '        #if (FXAA_QUALITY_PS > 9)',
        '        if(doneNP) {',
        '            if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '            if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '            if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '            if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '            doneN = abs(lumaEndN) >= gradientScaled;',
        '            doneP = abs(lumaEndP) >= gradientScaled;',
        '            if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P9;',
        '            if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P9;',
        '            doneNP = (!doneN) || (!doneP);',
        '            if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P9;',
        '            if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P9;',
        '/*--------------------------------------------------------------------------*/',
        '            #if (FXAA_QUALITY_PS > 10)',
        '            if(doneNP) {',
        '                if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                doneN = abs(lumaEndN) >= gradientScaled;',
        '                doneP = abs(lumaEndP) >= gradientScaled;',
        '                if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P10;',
        '                if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P10;',
        '                doneNP = (!doneN) || (!doneP);',
        '                if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P10;',
        '                if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P10;',
        '/*--------------------------------------------------------------------------*/',
        '                #if (FXAA_QUALITY_PS > 11)',
        '                if(doneNP) {',
        '                    if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                    if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                    if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                    if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                    doneN = abs(lumaEndN) >= gradientScaled;',
        '                    doneP = abs(lumaEndP) >= gradientScaled;',
        '                    if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P11;',
        '                    if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P11;',
        '                    doneNP = (!doneN) || (!doneP);',
        '                    if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P11;',
        '                    if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P11;',
        '/*--------------------------------------------------------------------------*/',
        '                    #if (FXAA_QUALITY_PS > 12)',
        '                    if(doneNP) {',
        '                        if(!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));',
        '                        if(!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));',
        '                        if(!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;',
        '                        if(!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;',
        '                        doneN = abs(lumaEndN) >= gradientScaled;',
        '                        doneP = abs(lumaEndP) >= gradientScaled;',
        '                        if(!doneN) posN.x -= offNP.x * FXAA_QUALITY_P12;',
        '                        if(!doneN) posN.y -= offNP.y * FXAA_QUALITY_P12;',
        '                        doneNP = (!doneN) || (!doneP);',
        '                        if(!doneP) posP.x += offNP.x * FXAA_QUALITY_P12;',
        '                        if(!doneP) posP.y += offNP.y * FXAA_QUALITY_P12;',
        '/*--------------------------------------------------------------------------*/',
        '                    }',
        '                    #endif',
        '/*--------------------------------------------------------------------------*/',
        '                }',
        '                #endif',
        '/*--------------------------------------------------------------------------*/',
        '            }',
        '            #endif',
        '/*--------------------------------------------------------------------------*/',
        '        }',
        '        #endif',
        '/*--------------------------------------------------------------------------*/',
        '    }',
        '    #endif',
        '/*--------------------------------------------------------------------------*/',
        '                        }',
        '                        #endif',
        '/*--------------------------------------------------------------------------*/',
        '                    }',
        '                    #endif',
        '/*--------------------------------------------------------------------------*/',
        '                }',
        '                #endif',
        '/*--------------------------------------------------------------------------*/',
        '            }',
        '            #endif',
        '/*--------------------------------------------------------------------------*/',
        '        }',
        '        #endif',
        '/*--------------------------------------------------------------------------*/',
        '    }',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat dstN = posM.x - posN.x;',
        '    FxaaFloat dstP = posP.x - posM.x;',
        '    if(!horzSpan) dstN = posM.y - posN.y;',
        '    if(!horzSpan) dstP = posP.y - posM.y;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaBool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;',
        '    FxaaFloat spanLength = (dstP + dstN);',
        '    FxaaBool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;',
        '    FxaaFloat spanLengthRcp = 1.0/spanLength;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaBool directionN = dstN < dstP;',
        '    FxaaFloat dst = min(dstN, dstP);',
        '    FxaaBool goodSpan = directionN ? goodSpanN : goodSpanP;',
        '    FxaaFloat subpixG = subpixF * subpixF;',
        '    FxaaFloat pixelOffset = (dst * (-spanLengthRcp)) + 0.5;',
        '    FxaaFloat subpixH = subpixG * fxaaQualitySubpix;',
        '/*--------------------------------------------------------------------------*/',
        '    FxaaFloat pixelOffsetGood = goodSpan ? pixelOffset : 0.0;',
        '    FxaaFloat pixelOffsetSubpix = max(pixelOffsetGood, subpixH);',
        '    if(!horzSpan) posM.x += pixelOffsetSubpix * lengthSign;',
        '    if( horzSpan) posM.y += pixelOffsetSubpix * lengthSign;',
        '    #if (FXAA_DISCARD == 1)',
        '        return FxaaTexTop(tex, posM);',
        '    #else',
        '        return FxaaFloat4(FxaaTexTop(tex, posM).xyz, lumaM);',
        '    #endif',
        '}',
        '/*==========================================================================*/',
        '#endif',
        '',
        'void main() {',
        '  gl_FragColor = FxaaPixelShader(',
        '    vUv,',
        '    vec4(0.0),',
        '    tDiffuse,',
        '    tDiffuse,',
        '    tDiffuse,',
        '    resolution,',
        '    vec4(0.0),',
        '    vec4(0.0),',
        '    vec4(0.0),',
        '    0.75,',
        '    0.166,',
        '    0.0833,',
        '    0.0,',
        '    0.0,',
        '    0.0,',
        '    vec4(0.0)',
        '  );',
        '',
        '  // TODO avoid querying texture twice for same texel',
        '  gl_FragColor.a = texture2D(tDiffuse, vUv).a;',
        '}'
      ].join('\n')

    }

    this.RGBShiftShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'amount': { value: 0.0005 },
        'angle': { value: 0.0 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float amount;',
        'uniform float angle;',
        'varying vec2 vUv;',
        'void main() {',
        'vec2 offset = amount * vec2( cos(angle), sin(angle));',
        'vec4 cr = texture2D(tDiffuse, vUv + offset);',
        'vec4 cga = texture2D(tDiffuse, vUv);',
        'vec4 cb = texture2D(tDiffuse, vUv - offset);',
        'gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);',
        '}'
      ].join('\n')
    }

    this.VignetteShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'offset': { value: 1.2 },
        'darkness': { value: 1.2 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float offset;',
        'uniform float darkness;',
        'uniform sampler2D tDiffuse;',
        'varying vec2 vUv;',
        'void main() {',
        // Eskil's vignette
        'vec4 texel = texture2D( tDiffuse, vUv );',
        'vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );',
        'gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );',
        /*
        // alternative version from glfx.js
        // this one makes more "dusty" look (as opposed to "burned")

        "vec4 color = texture2D( tDiffuse, vUv );",
        "float dist = distance( vUv, vec2( 0.5 ) );",
        "color.rgb *= smoothstep( 0.8, offset * 0.799, dist *( darkness + offset ) );",
        "gl_FragColor = color;",
        */
        '}'
      ].join('\n')
    }

    this.HueSaturationShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'hue': { value: 0 },
        'saturation': { value: 0.5 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float hue;',
        'uniform float saturation;',
        'varying vec2 vUv;',
        'void main() {',
        'gl_FragColor = texture2D( tDiffuse, vUv );',

        // hue
        'float angle = hue * 3.14159265;',
        'float s = sin(angle), c = cos(angle);',
        'vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;',
        'float len = length(gl_FragColor.rgb);',
        'gl_FragColor.rgb = vec3(',
        'dot(gl_FragColor.rgb, weights.xyz),',
        'dot(gl_FragColor.rgb, weights.zxy),',
        'dot(gl_FragColor.rgb, weights.yzx)',
        ');',

        // saturation
        'float average = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0;',
        'if (saturation > 0.0) {',
        'gl_FragColor.rgb += (average - gl_FragColor.rgb) * (1.0 - 1.0 / (1.001 - saturation));',
        '} else {',
        'gl_FragColor.rgb += (average - gl_FragColor.rgb) * (-saturation);',
        '}',

        '}'

      ].join('\n')

    }

    this.FilmShader = {

      uniforms: {

        'tDiffuse': { value: null },
        'time': { value: 0.0 },
        'nIntensity': { value: 0.05 },
        'sIntensity': { value: 0.0 },
        'sCount': { value: 0 },
        'grayscale': { value: 0 }

      },

      vertexShader: [

        'varying vec2 vUv;',

        'void main() {',

        'vUv = uv;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}'

      ].join('\n'),

      fragmentShader: [

        '#include <common>',

          // control parameter
        'uniform float time;',

        'uniform bool grayscale;',

          // noise effect intensity value (0 = no effect, 1 = full effect)
        'uniform float nIntensity;',

          // scanlines effect intensity value (0 = no effect, 1 = full effect)
        'uniform float sIntensity;',

          // scanlines effect count value (0 = no effect, 4096 = full effect)
        'uniform float sCount;',

        'uniform sampler2D tDiffuse;',

        'varying vec2 vUv;',

        'void main() {',

        // sample the source
        'vec4 cTextureScreen = texture2D( tDiffuse, vUv );',

        // make some noise
        'float dx = rand( vUv + time );',

        // add noise
        'vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx, 0.0, 1.0 );',

        // get us a sine and cosine
        'vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );',

        // add scanlines
        'cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;',

        // interpolate between source and result by intensity
        'cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );',

        // convert to grayscale if desired
        'if( grayscale ) {',

        'cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );',

        '}',

        'gl_FragColor =  vec4( cResult, cTextureScreen.a );',

        '}'

      ].join('\n')

    }

    this.BrightnessContrastShader = {
      uniforms: {
        'tDiffuse': { value: null },
        'brightness': { value: 0.0 },
        'contrast': { value: 0.1 }
      },

      vertexShader: [
        'varying vec2 vUv;',

        'void main() {',

        'vUv = uv;',

        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}'

      ].join('\n'),

      fragmentShader: [

        'uniform sampler2D tDiffuse;',
        'uniform float brightness;',
        'uniform float contrast;',

        'varying vec2 vUv;',

        'void main() {',

        'gl_FragColor = texture2D( tDiffuse, vUv );',

        'gl_FragColor.rgb += brightness;',

        'if (contrast > 0.0) {',
        'gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) / (1.0 - contrast) + 0.5;',
        '} else {',
        'gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (1.0 + contrast) + 0.5;',
        '}',

        '}'

      ].join('\n')

    }
  }

  initState (blocks, currentDate) {
    this.state = {}
    this.state.focussed = false // are we focussed on a block?
    this.state.blocks = blocks
    this.state.currentDate = currentDate
    this.state.dayGroups = []
    this.state.lineGroups = []
    this.state.currentBlock = null
    this.state.currentBlockObject = null
    this.state.view = 'day' // can be 'day' or 'block'
  }

  initRenderer () {
    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.00015)
    this.scene.background = new THREE.Color(Config.scene.bgColor)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas,
      alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)
    this.renderer.autoClear = false
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false
  }

  initCamera () {
    this.defaultCameraPos = new THREE.Vector3(0.0, 0.0, 1600.0)

    this.cameraDriftLimitMax = {}
    this.cameraDriftLimitMax.x = 150.0
    this.cameraDriftLimitMax.y = 150.0
    this.cameraDriftLimitMin = {}
    this.cameraDriftLimitMin.x = -150.0
    this.cameraDriftLimitMin.y = -150.0
    this.cameraMoveStep = 100.0
    this.cameraLerpSpeed = 0.01

    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z)
    this.camera.updateMatrixWorld()

    this.camPos = this.camera.position.clone()
    this.targetPos = this.camPos.clone()
    this.lookAtPos = new THREE.Vector3(0, 0, 0)
    this.targetLookAt = new THREE.Vector3(0, 0, 0)

    this.camera.lookAt(this.lookAtPos)
    let toRotation = new THREE.Euler().copy(this.camera.rotation)
    this.fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    this.toQuaternion = new THREE.Quaternion().setFromEuler(toRotation)
    this.moveQuaternion = new THREE.Quaternion()

    window.camera = this.camera

    this.brownianMotionCamera = new BrownianMotion()

    this.cameraMoveEvent = new Event('cameraMove')

    /** oui({
      putSomeGUIShitHere: 'boom'
    }) */
  }

  addEvents () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = []
    this.mousePos = new THREE.Vector2()

    this.mouseStatic = true
    this.mouseMoveTimeout = null

    this.mouseX = 0
    this.mouseY = 0
    this.targetMouseX = 0
    this.targetMouseY = 0

    this.isAnimating = false

    this.selectBlock = new Event('selectBlock')

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    document.addEventListener('mousewheel', this.onDocumentMouseWheel.bind(this), false)
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onkeydown.bind(this), false)
  }

  onDocumentMouseWheel (event) {
    event.preventDefault()
    if (event.wheelDeltaY > 0) {
      this.targetPos.z -= this.cameraMoveStep
      this.targetLookAt.z -= this.cameraMoveStep
    } else {
      this.targetPos.z += this.cameraMoveStep
      this.targetLookAt.z += this.cameraMoveStep
    }
  }

  onkeydown (event) {
    var isEscape = false
    if ('key' in event) {
      isEscape = (event.key === 'Escape' || event.key === 'Esc')
    } else {
      isEscape = (event.keyCode === 27)
    }
    if (isEscape) {
      this.resetDayView()
    }
  }

  resetDayView () {
    this.removeTrees()

    this.animateBlockOut(this.state.currentBlockObject).then(() => {
      this.state.view = 'day'
      this.animateCamera(this.defaultCameraPos, new THREE.Vector3(0.0, 0.0, 0.0), 3000)
      this.state.focussed = false
      this.isAnimating = false
    })
  }

  removeTrees () {
    this.audio.unloadSound()

    if (typeof this.treeGroup !== 'undefined') {
      this.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    if (this.isAnimating) {
      return
    }

    document.dispatchEvent(this.selectBlock)

    this.raycaster.setFromCamera({x: this.targetMouseX, y: this.targetMouseY}, this.camera)

    const BreakException = {}

    try {
      this.state.dayGroups.forEach((group) => {
        var intersects = this.raycaster.intersectObjects(group.children)
        if (intersects.length > 0) {
          this.isAnimating = true
          let blockObject = intersects[0].object
          this.removeTrees()
          this.animateBlockOut(this.state.currentBlockObject).then(() => {
            this.animateBlockIn(blockObject).then(() => {
              this.buildSingleTree(blockObject)
              this.isAnimating = false
            })
          })
          throw BreakException
        }
      })
    } catch (error) {
      // ¯\_(ツ)_/¯
    }
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      let tweenVars = {
        blockPosX: fromPos.x,
        blockPosY: fromPos.y,
        time: 0
      }

      new TWEEN.Tween(tweenVars)
        .to(
        {
          blockPosX: toPos.x,
          blockPosY: toPos.y,
          time: 1
        },
          duration
        )
        .onUpdate(function () {
          blockObject.position.x = tweenVars.blockPosX
          blockObject.position.y = tweenVars.blockPosY

          // slerp to target rotation
          THREE.Quaternion.slerp(fromQuaternion, toQuaternion, moveQuaternion, tweenVars.time)
          blockObject.quaternion.set(moveQuaternion.x, moveQuaternion.y, moveQuaternion.z, moveQuaternion.w)
        })
        .easing(this.easing)
        .onComplete(function () {
          resolve()
        })
        .start()
    })
  }

  animateBlockOut (blockObject) {
    return new Promise((resolve, reject) => {
      if (blockObject) {
        let fromPos = blockObject.position.clone()
        let toPos = blockObject.initialPosition.clone()

        let targetRotation = blockObject.initialRotation.clone()
        let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
        let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

        this.animateBlock(
          blockObject,
          fromPos,
          fromQuaternion,
          toPos,
          toQuaternion,
          500
        ).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  animateBlockIn (blockObject) {
    return new Promise((resolve, reject) => {
      this.state.currentBlockObject = blockObject

      let blockPos = blockObject.position.clone()

      let targetRotation = new THREE.Euler(0.0, 0.0, 0.0)
      let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
      let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

      blockObject.initialPosition = blockObject.position.clone()
      blockObject.initialRotation = blockObject.rotation.clone()

      // focus camera on block
      let blockWorldPos = blockObject.getWorldPosition()
      this.targetLookAt.z = blockWorldPos.z
      this.targetPos.z = blockWorldPos.z + 400

      this.animateBlock(
        blockObject,
        blockPos,
        fromQuaternion,
        this.targetLookAt,
        toQuaternion,
        1000,
        true
      ).then(() => {
        resolve()
      })
    })
  }

  movetoBlock (hash) {
    let foundBlock = false
    this.state.dayGroups.forEach((group) => {
      group.children.forEach((blockObject) => {
        if (blockObject.blockchainData.hash === hash) {
          foundBlock = true
          this.state.currentBlockObject = blockObject
          let lookAtPos = blockObject.getWorldPosition().clone()
          let newCamPos = blockObject.getWorldPosition().clone()
          newCamPos.z += 450.0
          this.animateCamera(newCamPos, lookAtPos, 3000).then(() => {
            this.buildSingleTree(blockObject)
          })
        }
      })
    })

    if (!foundBlock) {
      this.resetDayView()
    }
  }

  buildSingleTree (blockObject) {
    let block = blockObject.blockchainData

    this.state.currentBlock = block

    this.angle = 5.0 + (block.output % 170)
    // this.angle = 90.0 + block.feeToValueRatio

    this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
    this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
    this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
    this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
    this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
    this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
    this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

    let sortedTree

    blockObject.updateMatrixWorld()

    let blockObjectPosition = blockObject.getWorldPosition().clone()
    let rotation = blockObject.getWorldRotation().clone()

    this.state.view = 'block'

    this.removeTrees()

    this.treeGroup = new THREE.Group()

    this.treeMesh = new THREE.Geometry()
    // this.treeGroup.add(this.treeMesh)
    this.scene.add(this.treeGroup)

    // create an array of ints the same size as the number of transactions in this block
    let tx = []
    for (let index = 0; index < block.n_tx; index++) {
      tx.push(index.toString())
    }

    var args = {
      array: tx,
      hashalgo: 'md5',
      hashlist: true
    }
    merkle.fromArray(args, function (err, tree) {
      if (!err) {
        for (var key in tree) {
          if (tree.hasOwnProperty(key)) {
            var element = tree[key]
            if (element.type === 'root' || element.type === 'node') {
              tree[key].children = {}
              tree[key].children[element.left] = tree[element.left]
              tree[key].children[element.right] = tree[element.right]
              if (element.type === 'root') {
                sortedTree = element
              }
            }
          }
        }

        this.points = []

        let startingPosition = new THREE.Vector3(0, 0, 0)
        let direction = new THREE.Vector3(0, 1, 0)

        this.state.currentBlock.endNodes = []

        this.build(sortedTree, startingPosition, direction, this, true)

        if (this.points.length > 3) {
          let seen = []
          let reducedArray = []
          this.state.currentBlock.endNodes.forEach((nodePos, index) => {
            let position = {
              x: Math.ceil(nodePos.x / 10) * 10,
              y: Math.ceil(nodePos.y / 10) * 10,
              z: Math.ceil(nodePos.z / 10) * 10
            }

            let key = JSON.stringify(position)

            if (seen.indexOf(key) === -1) {
              seen.push(key)
              nodePos.y = Math.abs(nodePos.y) * 10
              reducedArray.push(nodePos)
            }
          })

          this.audio.generateMerkleSound(reducedArray, blockObjectPosition)

          this.treeMesh.computeBoundingBox()
          let boxSize = this.treeMesh.boundingBox.getSize()
          let boxCenter = this.treeMesh.boundingBox.getCenter()

          let boxGeo = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z)
          let boundingBoxMesh = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial(0xff0000))

          boundingBoxMesh.translateX(boxCenter.x)
          boundingBoxMesh.translateY(boxCenter.y)
          boundingBoxMesh.translateZ(boxCenter.z)

          let mesh = new THREE.Mesh(this.treeMesh, this.merkleMaterial)

          mesh.translateX(-boxCenter.x)
          mesh.translateY(-boxCenter.y)
          mesh.translateZ(-boxCenter.z)

          this.treeGroup.add(mesh)

          this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
          this.treeGroup.position.set(blockObjectPosition.x, blockObjectPosition.y, blockObjectPosition.z)
        }
      }
    }.bind(this))
  }

  animateCamera (target, lookAt, duration) {
    return new Promise((resolve, reject) => {
      if (this.isAnimating) {
        console.log('animating')
        return
      }
      this.isAnimating = true

      this.targetPos = target.clone()
      this.targetLookAt = lookAt.clone()

      // grab initial postion/rotation
      let fromPosition = new THREE.Vector3().copy(this.camera.position)

      // reset original position and rotation
      this.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)

      var tweenVars = { time: 0 }

      this.transitionDuration = duration || 2000
      this.easing = TWEEN.Easing.Quartic.InOut

      new TWEEN.Tween(tweenVars)
      .to({time: 1}, this.transitionDuration)
      .onUpdate(function () {
        this.moveCamera(tweenVars.time)
      }.bind(this))
      .easing(this.easing)
      .onComplete(function () {
        this.isAnimating = false

        resolve()
      }.bind(this))
      .start()
    })
  }

  moveCamera (time) {
    this.camPos.lerp(this.targetPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.camPos)
    this.lookAtPos.lerp(this.targetLookAt, this.cameraLerpSpeed)
  }

  onDocumentMouseMove (event) {
    var rect = this.renderer.domElement.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top
    this.targetMouseX = x / window.innerWidth * 2 - 1
    this.targetMouseY = 1 - y / window.innerHeight * 2

    this.mouseStatic = false

    clearTimeout(this.mouseMoveTimeout)
    this.mouseMoveTimeout = setTimeout(
      () => {
        this.mouseStatic = true
      },
      600
    )
  }

  addLights (scene) {
    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)
  }

  addObjects () {
    this.addDay(this.state.blocks)
  }

  buildBlocks (blocks, index, group, spiralPoints) {
    return new Promise((resolve, reject) => {
      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        let block = blocks[blockIndex]

        blocks[blockIndex].index = blockIndex

     //   getTransactionsForBlock(block.hash).then((transactions) => {
       /*   let totalFees = 0
          let totalInput = 0

          transactions.forEach((tx, key) => {
            if (key !== 0) { // ignore coinbase transactions
              totalInput += tx.input
              totalFees += (tx.input - tx.output)
            }
          }) */

          // blocks[blockIndex].feeToValueRatio = totalFees / totalInput
        blocks[blockIndex].feeToValueRatio = 0.01

          // TODO: set this from network health value
        this.angle = 5.0 + (block.output % 170)
        // this.angle = 90.0 + blocks[blockIndex].feeToValueRatio

        // create an array of ints the same size as the number of transactions in this block
        let tx = []
        for (let index = 0; index < block.n_tx; index++) {
          tx.push(index.toString())
        }

        let sortedTree

        this.X = new THREE.Vector3(1, 0, 0)
        this.Y = new THREE.Vector3(0, 1, 0)
        this.Z = new THREE.Vector3(0, 0, 1)

        this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
        this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
        this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
        this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
        this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
        this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
        this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

        var args = {
          array: tx,
          hashalgo: 'md5',
          hashlist: true
        }

        merkle.fromArray(args, function (err, tree) {
          if (!err) {
            this.totalLevels = tree.levels
            for (var key in tree) {
              if (tree.hasOwnProperty(key)) {
                var element = tree[key]
                if (element.type === 'root' || element.type === 'node') {
                  tree[key].children = {}
                  tree[key].children[element.left] = tree[element.left]
                  tree[key].children[element.right] = tree[element.right]
                  if (element.type === 'root') {
                    sortedTree = element
                  }
                }
              }
            }

            this.points = []

            let startingPosition = new THREE.Vector3(0, 0, 0)
            let direction = new THREE.Vector3(0, 1, 0)

            this.build(sortedTree, startingPosition, direction, this)

            // Convex Hull
            let convexGeometry
            let blockMesh

            if (this.points.length > 3) {
              convexGeometry = new ConvexGeometry(this.points)
              convexGeometry.computeBoundingBox()
              let boxDimensions = convexGeometry.boundingBox.getSize()

              let boundingBoxGeometry = new THREE.BoxBufferGeometry(boxDimensions.x, boxDimensions.y, boxDimensions.z)

              blockMesh = new THREE.Mesh(boundingBoxGeometry, this.crystalMaterial.clone())

              // align all front faces
              blockMesh.translateZ(-(boxDimensions.z / 2))

              blockMesh.blockchainData = block

              let rotation = ((10 * Math.PI) / blocks.length) * blockIndex
              blockMesh.rotation.z = rotation
              blockMesh.translateY(700 + (blockIndex))
              blockMesh.rotation.z += Math.PI / 2
              blockMesh.translateZ(blockIndex * 8)

              group.add(blockMesh)

              spiralPoints.push(blockMesh.position)
            }
          }
        }.bind(this))
       // })
      }

      resolve()
    })
  }

  addDay (blocks, index) {
    console.log('add day: ' + index)
    let group = new THREE.Group()

    this.state.dayGroups.push(group)

    let spiralPoints = []
    this.scene.add(group)

    this.buildBlocks(blocks, index, group, spiralPoints).then(() => {
      console.log(index)
      group.translateZ(-(index * 1300))
      this.removeTrees()
    })
  }

  build (node, startingPosition, direction, context, visualise) {
    let magnitude = (node.level * 5)

    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    this.points.push(startPosition)
    this.points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      let geometry = new THREE.TubeGeometry(path, 1, 0.5, 6, false)
      this.treeMesh.merge(geometry, geometry.matrix)
    }

    let i = 0
    for (var key in node.children) {
      if (node.children.hasOwnProperty(key)) {
        i++

        var childNode = node.children[key]

        if (childNode) {
          if (typeof childNode.children !== 'undefined') {
            let newDirection

            let yaxis
            let yangle

            if (i === 1) {
              newDirection = direction.clone().applyQuaternion(this.xPosRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            } else {
              newDirection = direction.clone().applyQuaternion(this.xNegRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            }

            this.build(childNode, endPosition, newDirection, context, visualise)
          } else {
            // no child nodes
            if (this.state.currentBlock) {
              this.state.currentBlock.endNodes.push(
                {
                  x: endPosition.x,
                  y: endPosition.y,
                  z: endPosition.z
                }
              )
            }
          }
        }
      }
    }
  }

  setupMaterials () {
    this.crystalOpacity = 0.7

    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath('/static/assets/textures/').load(this.cubeMapUrls)

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      metalness: 0.7,
      roughness: 0.0,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })

    this.merkleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      flatShading: true,
      metalness: 0.5,
      roughness: 0.4,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
    this.FXAAShader.uniforms.resolution.value = new THREE.Vector2(1 / window.innerWidth, 1 / window.innerHeight)
  }

  checkMouseIntersection () {
    var vector = new THREE.Vector3(this.targetMouseX, this.targetMouseY, 0.5)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

    this.state.dayGroups.forEach((group, dayIndex) => {
      let intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        this.state.focussed = true
        this.mouseStatic = false
        if (intersects[0].object !== this.intersected[dayIndex]) {
          if (this.intersected[dayIndex]) {
            this.intersected[dayIndex].material.color.setHex(this.intersected[dayIndex].currentHex)
          }
          this.intersected[dayIndex] = intersects[0].object
          this.intersected[dayIndex].currentHex = this.intersected[dayIndex].material.color.getHex()
          this.intersected[dayIndex].material.color.setHex(0xffffff)
        }
      } else {
        this.state.focussed = false
        if (this.intersected[dayIndex]) {
          this.intersected[dayIndex].material.color.setHex(this.intersected[dayIndex].currentHex)
        }
        this.intersected[dayIndex] = null
      }
    }, this)
  }

  updateMouse () {
    this.mousePos.lerp(new THREE.Vector2(this.targetMouseX, this.targetMouseY), this.cameraLerpSpeed)
  }

  ambientCameraMovement () {
    this.camera.lookAt(this.lookAtPos)
    this.targetPos.x += this.mousePos.x
    this.targetPos.y += this.mousePos.y
    document.dispatchEvent(this.cameraMoveEvent)
  }

  smoothCameraMovement () {
    if (this.targetPos.x > this.cameraDriftLimitMax.x) {
      this.targetPos.x = this.cameraDriftLimitMax.x - 1
    }
    if (this.targetPos.y > this.cameraDriftLimitMax.y) {
      this.targetPos.y = this.cameraDriftLimitMax.y - 1
    }
    if (this.targetPos.x < this.cameraDriftLimitMin.x) {
      this.targetPos.x = this.cameraDriftLimitMin.x + 1
    }
    if (this.targetPos.y < this.cameraDriftLimitMin.y) {
      this.targetPos.y = this.cameraDriftLimitMin.y + 1
    }

    this.camPos.lerp(this.targetPos, this.cameraLerpSpeed)
    this.camera.position.copy(this.camPos)

    this.lookAtPos.lerp(this.targetLookAt, this.cameraLerpSpeed)
  }

  render () {
    TWEEN.update()
    this.checkMouseIntersection()
    this.updateMouse()
    this.smoothCameraMovement()
    this.ambientCameraMovement()
    this.composer.render()
    if (this.state.view === 'block') {
      this.state.currentBlockObject.rotation.y += 0.001
      this.treeGroup.rotation.y += 0.001
    }
    // this.renderer.render(this.scene, this.camera)
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
