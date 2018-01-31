'use strict'

import * as THREE from 'three'
import Config from '../Config'
import Tone from 'tone'
import _ from 'lodash'
import { map } from '../../utils/math'
import EventEmitter from 'eventemitter3'

export default class Audio extends EventEmitter {
  constructor (camera, path) {
    super()
    this.samplerLoaded = false
    this.camera = camera
    this.loops = []
    this.quantize = 32
    this.masterVol = -16 // db
    this.ambienceVol = -12 // db
    this.path = path
    this.ambiencePath = path + 'sounds/ambience/mining.mp3'
    this.bpm = 45
    this.isMuted = false
    this.context = null
    this.notes = {
    //  27.5000: 'A0',
    //  29.1352: 'A#0',
    //  30.8677: 'B0',
    //  32.7032: 'C1',
    //  34.6478: 'C#1',
    //  36.7081: 'D1',
    //  38.8909: 'D#1',
    //  41.2034: 'E1',
    //  43.6535: 'F1',
    //  46.2493: 'F#1',
    //  48.9994: 'G1',
    //  51.9131: 'G#1',
      55.000: 'A1',
      58.2705: 'A#1',
      61.7354: 'B1',
      65.4064: 'C2',
      69.2957: 'C#2',
      73.4162: 'D2',
      77.7817: 'D#2',
      82.4069: 'E2',
      87.3071: 'F2',
      92.4986: 'F#2',
      97.9989: 'G2',
      103.826: 'G#2',
      110.000: 'A2',
      116.541: 'A#2',
      123.471: 'B2',
      130.813: 'C3',
      138.591: 'C#3',
      146.832: 'D3',
      155.563: 'D#3',
      164.814: 'E3',
      174.614: 'F3',
      184.997: 'F#3',
      195.998: 'G3',
      207.652: 'G#3',
      220.000: 'A3',
      233.082: 'A#3',
      246.942: 'B3',
      261.626: 'C4',
      277.183: 'C#4',
      293.665: 'D4',
      311.127: 'D#4',
      329.628: 'E4',
      349.228: 'F4',
      369.994: 'F#4',
      391.995: 'G4',
      415.305: 'G#4',
      440.000: 'A4',
      466.164: 'A#4',
      493.883: 'B4',
      523.251: 'C5',
      554.365: 'C#5',
      587.330: 'D5',
      622.254: 'D#5',
      659.255: 'E5',
      698.456: 'F5',
      739.989: 'F#5',
      783.991: 'G5',
      830.609: 'G#5',
      880.000: 'A5',
      932.328: 'A#5',
      987.767: 'B5',
      1046.50: 'C6'
    }

    this.pointColors = []

    this.modes = {
      'ionian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'B',
        'C'
      ],
      'dorian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'phrygian': [
        'C',
        'C#',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'lydian': [
        'C',
        'D',
        'E',
        'F#',
        'G',
        'A',
        'B',
        'C'
      ],
      'mixolydian': [
        'C',
        'D',
        'E',
        'F',
        'G',
        'A',
        'A#',
        'C'
      ],
      'aeolian': [
        'C',
        'D',
        'D#',
        'F',
        'G',
        'G#',
        'A#',
        'C'
      ],
      'locrian': [
        'C',
        'C#',
        'D#',
        'F',
        'F#',
        'G#',
        'A#',
        'C'
      ]
    }

    this.audioLoader = new THREE.AudioLoader()
  }

  loadAmbience () {
    return new Promise((resolve, reject) => {
      this.ambienceFilter = new Tone.Filter({
        type: 'lowpass',
        Q: 5
      }).chain(this.ambienceBus)

      this.ambiencePlayer = new Tone.Player({
        'url': this.ambiencePath,
        'loop': true,
        onload: (player) => {
          this.context = player.context
          this.emit('bgAudioLoaded')
          resolve()
        }
      }).chain(this.ambienceFilter)

      this.ambienceBus.volume.linearRampToValueAtTime(this.ambienceVol, 20)
    })
  }

  setAmbienceFilterCutoff (value) {
    this.ambienceFilter.set('frequency', value)
  }

  unloadSound () {
    if (this.loops.length) {
      for (let index = 0; index < this.loops.length; index++) {
        const loop = this.loops[index]
        loop.cancel()
        loop.dispose()
      }
      this.loops = []
    }
    this.pointColors = []
  }

  preloadNotes () {
    return new Promise((resolve, reject) => {
      let loadCount = 0
      let self = this
      resolve()
      /* _.forIn(this.notes, (note, key) => {
        this.audioLoader.load(
          // resource URL
          path + 'sounds/kalimba/' + note.replace('#', 'S') + '.mp3',
          // Function when resource is loaded
          function (audioBuffer) {
            loadCount++
            if (loadCount === Object.keys(self.notes).length) {
              resolve()
            }
          }
        )
      }) */
    })
  }

  preloadAmbience () {
    return new Promise((resolve, reject) => {
      resolve()
     /* this.audioLoader.load(
        this.ambiencePath,
        function (audioBuffer) {
          resolve()
        }
      ) */
    })
  }

  preload () {
    return new Promise((resolve, reject) => {
      this.preloadNotes().then(() => {
        this.preloadAmbience().then(() => {
          console.log('sound loaded')
          resolve()
        })
      })
    })
  }

  muteAudio () {
    this.isMuted = true
    this.masterBus.set('mute', true)
  }

  unMuteAudio () {
    this.isMuted = false
    this.masterBus.set('mute', false)
  }

  init () {
    return new Promise((resolve, reject) => {
      this.masterBus = new Tone.Volume(this.masterVol).toMaster()
      this.ambienceBus = new Tone.Volume(-96).chain(this.masterBus)

      /* this.convolver = new Tone.Convolver(path + 'sounds/IR/r1_ortf.wav')
      this.convolver.set('wet', 1.0) */

      // this.pingPong = new Tone.PingPongDelay('16n', 0.85)

      Tone.Transport.bpm.value = this.bpm

      /* Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)

      document.addEventListener('cameraMove', function () {
        Tone.Listener.setPosition(this.camera.position.x, this.camera.position.y, this.camera.position.z)
      }.bind(this), false) */

      /* let cameraForwardVector = new THREE.Vector3()
      let quaternion = new THREE.Quaternion()
      cameraForwardVector.set(0, 0, -1).applyQuaternion(quaternion)

      Tone.Listener.setOrientation(cameraForwardVector.x, cameraForwardVector.y, cameraForwardVector.z, this.camera.up.x, this.camera.up.y, this.camera.up.z) */

      // this.preload().then(() => {
      this.loadAmbience().then(() => {
        this.ambiencePlayer.start()
        Tone.Transport.start()
        resolve()
      })
      // })
    })
  }

  loadSampler () {
    this.sampler = new Tone.Sampler({
      'A1': this.path + 'sounds/kalimba/A1.mp3',
      'A#1': this.path + 'sounds/kalimba/AS1.mp3',
      'B1': this.path + 'sounds/kalimba/B1.mp3',
      'C1': this.path + 'sounds/kalimba/C1.mp3',
      'C#1': this.path + 'sounds/kalimba/CS1.mp3',
      'D1': this.path + 'sounds/kalimba/D1.mp3',
      'D#1': this.path + 'sounds/kalimba/DS1.mp3',
      'E1': this.path + 'sounds/kalimba/E1.mp3',
      'F1': this.path + 'sounds/kalimba/F1.mp3',
      'F#1': this.path + 'sounds/kalimba/FS1.mp3',
      'G1': this.path + 'sounds/kalimba/G1.mp3',
      'G#1': this.path + 'sounds/kalimba/GS1.mp3',
      'A2': this.path + 'sounds/kalimba/A2.mp3',
      'A#2': this.path + 'sounds/kalimba/AS2.mp3',
      'B2': this.path + 'sounds/kalimba/B2.mp3',
      'C2': this.path + 'sounds/kalimba/C2.mp3',
      'C#2': this.path + 'sounds/kalimba/CS2.mp3',
      'D2': this.path + 'sounds/kalimba/D2.mp3',
      'D#2': this.path + 'sounds/kalimba/DS2.mp3',
      'E2': this.path + 'sounds/kalimba/E2.mp3',
      'F2': this.path + 'sounds/kalimba/F2.mp3',
      'F#2': this.path + 'sounds/kalimba/FS2.mp3',
      'G2': this.path + 'sounds/kalimba/G2.mp3',
      'G#2': this.path + 'sounds/kalimba/GS2.mp3',
      'A3': this.path + 'sounds/kalimba/A3.mp3',
      'A#3': this.path + 'sounds/kalimba/AS3.mp3',
      'B3': this.path + 'sounds/kalimba/B3.mp3',
      'C3': this.path + 'sounds/kalimba/C3.mp3',
      'C#3': this.path + 'sounds/kalimba/CS3.mp3',
      'D3': this.path + 'sounds/kalimba/D3.mp3',
      'D#3': this.path + 'sounds/kalimba/DS3.mp3',
      'E3': this.path + 'sounds/kalimba/E3.mp3',
      'F3': this.path + 'sounds/kalimba/F3.mp3',
      'F#3': this.path + 'sounds/kalimba/FS3.mp3',
      'G3': this.path + 'sounds/kalimba/G3.mp3',
      'G#3': this.path + 'sounds/kalimba/GS3.mp3'
    }).chain(this.masterBus)
  }

  generateMerkleSound (positionsArray, blockObjectPosition, block, pointsMaterial, pointsMesh) {
    if (!this.samplerLoaded) {
      this.loadSampler()
    }

    Tone.Transport.start()

    this.samplerLoaded = true

    this.loopMap = []

    this.black = new THREE.Color(0x000000)
    this.white = new THREE.Color(0xffffff)

    this.pointsMaterial = pointsMaterial

    let minTime = Number.MAX_SAFE_INTEGER
    let maxTime = 0

    for (let index = 0; index < block.transactions.length; index++) {
      const transaction = block.transactions[index]
      minTime = Math.min(transaction.time, minTime)
      maxTime = Math.max(transaction.time, maxTime)
    }

    block.transactions.sort((a, b) => {
      return a.time > b.time
    })

    this.pointColors = positionsArray.map(_ => 0)

    // compute number from hash
    let total = 0
    for (let i = 0; i < block.hash.length; i++) {
      // convert from base 16
      total += parseInt(block.hash[i], 16)
    }

    // set unique mode for this block hash
    let modeIndex = total % Object.keys(this.modes).length
    this.mode = this.modes[Object.keys(this.modes)[modeIndex]]

    for (let index = 0; index < positionsArray.length / 3; index++) {
      let xIndex = index * 3
      let yIndex = index * 3 + 1
      let zIndex = index * 3 + 2

      let y = positionsArray[yIndex]

      /**
       * Map transaction time to new range
       */
      if (typeof block.transactions[index] !== 'undefined') {
        const transaction = block.transactions[index]
        let time = map(transaction.time, minTime, maxTime, 0, 30) + 1.0

        // get closest note
        let minDiff = Number.MAX_SAFE_INTEGER
        let note = 'C1'

        for (var frequency in this.notes) {
          if (this.notes.hasOwnProperty(frequency)) {
            let noteName = this.notes[frequency].replace(/[0-9]/g, '')
            if (this.mode.indexOf(noteName) !== -1) { // filter out notes not in mode
              let diff = Math.abs((y * 1.5) - frequency)
              if (diff < minDiff) {
                minDiff = diff
                note = this.notes[frequency]
              }
            }
          }
        }

        let weight = map(transaction.weight, 0, 2000, 0, 1)

        if (weight > 2.0) {
          weight = 2.0
        }

        let that = this
        let loop

        let timeLowRes = time.toFixed(1)
        if (Config.detector.isMobile) {
          timeLowRes = parseInt(timeLowRes)
        }

        if (typeof this.loopMap[timeLowRes] === 'undefined') {
          loop = new Tone.Loop(
            () => {
              this.pointColors[xIndex] = 1
              this.pointColors[yIndex] = 1
              this.pointColors[zIndex] = 1
              setTimeout(() => {
                this.pointColors[xIndex] = 0
                this.pointColors[yIndex] = 0
                this.pointColors[zIndex] = 0
              }, 500)
              try {
                this.sampler.triggerAttack(note, '@' + that.quantize + 'n', weight)
              } catch (error) {
                console.log(error)
              }
            },
            '1m'
          ).start(Tone.Transport.seconds + time)
        } else {
          loop = new Tone.Loop(
            () => {
              this.pointColors[xIndex] = 1
              this.pointColors[yIndex] = 1
              this.pointColors[zIndex] = 1
              setTimeout(() => {
                this.pointColors[xIndex] = 0
                this.pointColors[yIndex] = 0
                this.pointColors[zIndex] = 0
              }, 500)
            },
            '1m'
          ).start(Tone.Transport.seconds + time)
        }
        loop.set('iterations', 8)
        // loop.set('humanize', '64n')
        this.loops.push(loop)
        this.loopMap[timeLowRes] = true
      }
    }
  }
}
