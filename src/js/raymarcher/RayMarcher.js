'use strict'

import * as THREE from 'three'
import Config from '../Config'

export default class RayMarcher {
  constructor (params) {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.loaded = false
    this.effectDownscaleDivisor = Config.postProcessing.effectDownscaleDivisor

    this.tmpMatrix = new THREE.Matrix4()

    // scene setup
    this.scene = new THREE.Scene()
    this.camera = params.camera

    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: params.canvas
    })

    this.renderer.setSize(this.width, this.height)
    // this.renderer.setPixelRatio(window.devicePixelRatio)
    this.domElement = this.renderer.domElement

    // geometry setup
    this.quadGeometry = new THREE.PlaneBufferGeometry(2, 2)
    this.quad = new THREE.Mesh(this.quadGeometry, null)
    this.scene.add(this.quad)

    // this.setSize(this.width, this.height)

    return this
  }

  setFragmentShader (params) {
    this.startTime = Date.now()

    /* let boxes = [
      {
        position: [0.0, 0.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
        scale: [100.0, 100.0, 100.0]
      }
    ] */

    let boxes = params.boxes
    let boxSDF = 'float dist = 10000.0; '
    for (let index = 0; index < boxes.length; index++) {
      const box = boxes[index]
      boxSDF += ` fBox(p + vec3(${parseFloat(box.position[0])}, ${parseFloat(box.position[1])}, ${parseFloat(box.position[2])}), vec3(${parseFloat(box.scale[0])}, ${parseFloat(box.scale[1])}, ${parseFloat(box.scale[2])}), dist); `
    }

    console.log(boxSDF)

    this.quad.material = this.material = new THREE.RawShaderMaterial({

      uniforms: {
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(this.width, this.height)
        },
        invProjMat: {
          type: 'm4',
          value: new THREE.Matrix4()
        }
      },
      vertexShader: `
      
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      attribute vec3 position;

      void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }
      
      `,
      fragmentShader: `

      precision lowp float;

      #define DELTA 0.1
      #define RAY_COUNT 3
      #define RAY_LENGTH_MAX 5000.0
      #define RAY_STEP_MAX 50
      #define LIGHT vec3 (1.0, 1.0, -1.0)
      #define REFRACT_FACTOR 0.6
      #define REFRACT_INDEX 1.6
      #define AMBIENT 0.2
      #define SPECULAR_POWER 3.0
      #define SPECULAR_INTENSITY 0.5
      #define FADE_POWER 1.0
      #define M_PI 3.1415926535897932384626433832795
      #define GLOW_FACTOR 0.5
      #define LUMINOSITY_FACTOR 2.0
      #define PI 3.1415926535897932384626433832795
      #define TAU (2*PI)
      #define PHI (sqrt(5)*0.5 + 0.5)

      uniform vec2 resolution;
      uniform mat4 invProjMat;

      uniform float scales[100];

      vec3 k;

      float opU(float d1, float d2) {
        return (d1 <= d2) ? d1 : d2;
      }

      float vmax(vec3 v) {
        return max(max(v.x, v.y), v.z);
      }

      vec2 squareFrame(vec2 screenSize) {
        vec2 position = 2.0 * (gl_FragCoord.xy / screenSize.xy) - 1.0;
        return position;
      }

      mat3 mRotate (in vec3 angle) {
        float c = cos (angle.x);
        float s = sin (angle.x);
        mat3 rx = mat3 (1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
      
        c = cos (angle.y);
        s = sin (angle.y);
        mat3 ry = mat3 (c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
      
        c = cos (angle.z);
        s = sin (angle.z);
        mat3 rz = mat3 (c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
      
        return rz * ry * rx;
      }

      vec3 BB;
      vec3 P;

      void fBox( vec3 p, vec3 b, inout float dist)
      {
        vec3 box = abs(p) - b;
        float d = vmax(box);
        if (d < dist) {
          BB = box;
          P = p;
          dist = d;
        }

      }

      /*float fBox(vec3 p, vec3 b) {
        return vmax(abs(p) - b);
      }*/

      float pModInterval1(inout float p, float size, float start, float stop) {
        float halfsize = size*0.5;
        float c = floor((p + halfsize)/size);
        p = mod(p+halfsize, size) - halfsize;
        if (c > stop) {
          p += size*(c - stop);
          c = stop;
        }
        if (c <start) {
          p += size*(c - start);
          c = start;
        }
        return c;
      }

      // Repeat around the origin by a fixed angle.
      // For easier use, num of repetitions is use to specify the angle.
      float pModPolar(inout vec2 p, float repetitions) {
        float angle = 2.0*PI/repetitions;
        float a = atan(p.y, p.x) + angle/2.0;
        float r = length(p);
        float c = floor(a/angle);
        a = mod(a,angle) - angle/2.0;
        p = vec2(cos(a), sin(a))*r;
        // For an odd number of repetitions, fix cell index of the cell in -x direction
        // (cell index would be e.g. -5 and 5 in the two halves of the cell):
        if (abs(c) >= (repetitions/2.0)) c = abs(c);
        return c;
      }

      float getDistance (in vec3 p) {

        /*p.z += 1.0;

        float c = pModPolar(p.xy, 30.0);
        p -= vec3(10.0, 0.0, 0.0);
        p.z += floor(p.xy / 30.0).x;
        return fBox(p, vec3(0.5, 0.5, 0.5));*/

        ${boxSDF}

        return dist;

      }
      
      vec3 getFragmentColor (in vec3 origin, in vec3 direction) {
        vec3 lightDirection = normalize (LIGHT);
        vec2 delta = vec2 (DELTA, 0.0);
      
        vec3 fragColor = vec3 (0.0, 0.0, 0.0);
        float intensity = 1.0;
      
        float distanceFactor = 1.0;
        float refractionRatio = 1.0 / REFRACT_INDEX;
        float rayStepCount = 0.0;
        for (int rayIndex = 0; rayIndex < RAY_COUNT; ++rayIndex) {
      
          // Ray marching
          float dist = RAY_LENGTH_MAX;
          float rayLength = 0.0;
          for (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {
            dist = distanceFactor * getDistance (origin);
            float distMin = max (dist, DELTA);
            rayLength += distMin;
            if (dist < 0.0 || rayLength > RAY_LENGTH_MAX) {
              break;
            }
            origin += direction * distMin;
            ++rayStepCount;
          }
      
          // Check whether we hit something
          vec3 backColor = vec3 (0.0, 0.0, 0.1 + 0.2 * max (0.0, dot (-direction, lightDirection)));
          if (dist >= 0.0) {
            fragColor = fragColor * (1.0 - intensity) + backColor * intensity;
            break;
          }

          // Get the normal
         /* vec3 normal = normalize (distanceFactor * vec3 (
            getDistance (origin + delta.xyy) - getDistance (origin - delta.xyy),
            getDistance (origin + delta.yxy) - getDistance (origin - delta.yxy),
            getDistance (origin + delta.yyx) - getDistance (origin - delta.yyx)));*/

          float maxAxis = vmax(BB);
            
          vec3 N;

          if (maxAxis == BB.x) {
            N = normalize( vec3(P.z, 0.0, 0.0) );
          }
          if (maxAxis == BB.y) {
            N = normalize( vec3(0.0, P.y, 0.0) );
          } 
          if (maxAxis == BB.z) {
            N = normalize( vec3(0.0, 0.0, P.z) );
          }

          vec3 normal = normalize(distanceFactor * N);

          // Basic lighting
        /*  vec3 reflection = reflect (direction, normal);
          if (distanceFactor > 0.0) {
            float relfectionDiffuse = max (0.0, dot (normal, lightDirection));
            float relfectionSpecular = pow (max (0.0, dot (reflection, lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;
            float fade = pow (1.0 - rayLength / RAY_LENGTH_MAX, FADE_POWER);
      
            vec3 localColor = max (sin (k * k), 0.01);
            localColor = (AMBIENT + relfectionDiffuse) * localColor + relfectionSpecular;
            localColor = mix (backColor, localColor, fade);
      
            fragColor = fragColor * (1.0 - intensity) + localColor * intensity;
            intensity *= REFRACT_FACTOR;
          }*/
      
          // Next ray...
          vec3 refraction = refract (direction, normal, refractionRatio);
          if (dot (refraction, refraction) < DELTA) {
 //           direction = reflection;
   //         origin += direction * DELTA * 2.0;
          }
         else {
            direction = refraction;
            distanceFactor = -distanceFactor;
            refractionRatio = 1.0 / refractionRatio;
          }
        }
      
        // Return the fragment color
        return fragColor * LUMINOSITY_FACTOR + GLOW_FACTOR * rayStepCount / float (RAY_STEP_MAX * RAY_COUNT);
      }

      void main() {

        vec2 screenPos = squareFrame( resolution );

        vec4 rayOrigin = invProjMat * vec4(vec3(screenPos.xy, 0.0), 1.0);
        rayOrigin.xyz /= rayOrigin.w;

        // float maxDistance = 1000.0
        // maxDistance += step(0.0, -maxDistance);
        // vec4 rayEndPosition = invProjMat * vec4(vec3(screenPos.xy, maxDistance * 2.0 - 1.0), 1.0);
        // vec4 rayEndPosition = invProjMat * vec4(vec3(screenPos.xy, -1000.0), 1.0);
        vec4 rayEndPosition = invProjMat * vec4(vec3(screenPos.xy, 1.0), 1.0);
        rayEndPosition.xyz /= rayEndPosition.w;

        vec3 direction = normalize(rayEndPosition.xyz - rayOrigin.xyz);

        vec3 color = getFragmentColor(rayOrigin.xyz, direction);

        gl_FragColor = vec4(color, 1.0);
      }
      `
      // defines: {
        // RAY_COUNT: 10,
        // MAX_DISTANCE: 3
      // }
    })

    this.quad.material.transparent = true
    this.quad.material.blending = THREE.CustomBlending
    this.quad.material.blendSrc = THREE.OneFactor
    this.quad.material.blendDst = THREE.OneFactor
    this.quad.material.blendEquation = THREE.AddEquation
    this.quad.material.blendSrcAlpha = THREE.OneFactor
    this.quad.material.blendDstAlpha = THREE.ZeroFactor
    this.quad.material.blendEquationAlpha = THREE.AddEquation

    this.update()

    this.loaded = true
  }

  setSize (width, height) {
    this.width = width
    this.height = height

    this.renderer.setSize(width, height)

    if (this.material != null) {
      this.material.uniforms.resolution.value.x = width
      this.material.uniforms.resolution.value.y = height
      // this.material.uniforms.aspect.value = width / height
    }
  }

  update () {
    if (this.material == null) {
      return
    }

    // pass camera position to shader
    let projectionMatrixInverse = new THREE.Matrix4()
    projectionMatrixInverse.getInverse(this.camera.projectionMatrix)
    this.material.uniforms.invProjMat.value.multiplyMatrices(this.camera.matrixWorld, projectionMatrixInverse)

    // this.material.uniforms.uTime.value = (Date.now() - this.startTime) * 0.0003
  }
}
