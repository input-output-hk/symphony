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
    this.masterVol = -21 // db
    this.ambienceVol = 0 // db
    this.path = path
    this.ambiencePath = path + 'sounds/ambience/mining.mp3'
    this.bpm = 50
    this.isMuted = false
    this.context = null
    this.notes = {
      55.000: 'A1',
      58.270: 'A#1',
      61.735: 'B1',
      65.406: 'C1',
      69.296: 'C#1',
      73.416: 'D1',
      77.782: 'D#1',
      82.407: 'E1',
      87.307: 'F1',
      92.499: 'F#1',
      97.999: 'G1',
      103.826: 'G#1',
      110.000: 'A2',
      116.541: 'A#2',
      123.471: 'B2',
      130.813: 'C2',
      138.591: 'C#2',
      146.832: 'D2',
      155.563: 'D#2',
      164.814: 'E2',
      174.614: 'F2',
      184.997: 'F#2',
      195.998: 'G2',
      207.652: 'G#2',
      220.000: 'A3',
      233.082: 'A#3',
      246.942: 'B3',
      261.626: 'C3',
      277.183: 'C#3',
      293.665: 'D3',
      311.127: 'D#3',
      329.628: 'E3',
      349.228: 'F3',
      369.994: 'F#3',
      391.995: 'G3',
      415.305: 'G#3',
      440.000: 'A4',
      466.164: 'A#4',
      493.883: 'B4',
      523.251: 'C4'
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

    for (let index = 0; index < positionsArray.length / 3; index++) {
      let xIndex = index * 3
      let yIndex = index * 3 + 1
      let zIndex = index * 3 + 2

      let x = positionsArray[xIndex]
      let y = positionsArray[yIndex]
      let z = positionsArray[zIndex]

      /**
       * Map transaction time to new range
       */
      if (typeof block.transactions[index] !== 'undefined') {
        const transaction = block.transactions[index]
        let time = map(transaction.time, minTime, maxTime, 0, 30) + 1.0

        // get closest note
        let minDiff = Number.MAX_SAFE_INTEGER
        let note = 'C1'

        let mode = this.modes.aeolian
        for (var frequency in this.notes) {
          if (this.notes.hasOwnProperty(frequency)) {
            let noteName = this.notes[frequency].replace(/[0-9]/g, '')
            if (mode.indexOf(noteName) !== -1) { // filter out notes not in mode
              let diff = Math.abs((y * 4.0) - frequency)
              if (diff < minDiff) {
                minDiff = diff
                note = this.notes[frequency]
              }
            }
          }
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
                this.sampler.triggerAttack(note, '@' + that.quantize + 'n', 1.0)
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
