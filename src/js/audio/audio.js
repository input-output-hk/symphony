'use strict'

import * as THREE from 'three'
import Config from '../Config'
import Tone from 'tone'
import { map } from '../../utils/math'
import EventEmitter from 'eventemitter3'

export default class Audio extends EventEmitter {
  constructor (camera, path) {
    super()
    this.samplerLoaded = false
    this.camera = camera
    this.loops = []
    this.quantize = 16
    this.masterVol = 0 // db
    this.ambienceVol = -96 // db
    this.path = path
    this.ambiencePath = path + 'sounds/ambience/mining.mp3'
    this.bpm = 90
    this.isMuted = false
    this.context = null
    this.notes = {
      27.5000: 'A0',
      29.1352: 'A#0',
      30.8677: 'B0',
      32.7032: 'C1',
      34.6478: 'C#1',
      36.7081: 'D1',
      38.8909: 'D#1',
      41.2034: 'E1',
      43.6535: 'F1',
      46.2493: 'F#1',
      48.9994: 'G1',
      51.9131: 'G#1',
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

    this.presets = {

      'tiny': {
        'harmonicity': 2,
        'oscillator': {
          'type': 'amsine2',
          'modulationType': 'sine',
          'harmonicity': 1.01
        },
        'envelope': {
          'attack': 0.106,
          'decay': 4,
          'sustain': 5.04,
          'release': 20.2
        },
        'modulation': {
          'volume': 13,
          'type': 'amsine2',
          'modulationType': 'sine',
          'harmonicity': 12
        },
        'modulationEnvelope': {
          'attack': 2.006,
          'decay': 1.2,
          'sustain': 0.2,
          'release': 7.4
        }
      },

      'harmonics': {
        'harmonicity': 3.999,
        'oscillator': {
          'type': 'square'
        },
        'envelope': {
          'attack': 0.03,
          'decay': 3.3,
          'sustain': 0.7,
          'release': 10.8
        },
        'modulation': {
          'volume': 12,
          'type': 'square6'
        },
        'modulationEnvelope': {
          'attack': 2,
          'decay': 3,
          'sustain': 0.8,
          'release': 0.1
        }
      },

      'metallic_fizz': {
        'oscillator': {
          'type': 'pulse',
          'width': 0.8
        },
        'envelope': {
          'attack': 0.01,
          'decay': 0.05,
          'sustain': 0.2,
          'releaseCurve': 'bounce',
          'release': 0.4
        }
      },
      'koto': {
        'oscillator': {
          'partials': [1, 0, 2, 0, 3]
        },
        'envelope': {
          'attack': 0.001,
          'decay': 1.2,
          'sustain': 0,
          'release': 0.5
        }
      },
      'wind': {
        'portamento': 0.0,
        'oscillator': {
          'type': 'square4'
        },
        'envelope': {
          'attack': 2,
          'decay': 1,
          'sustain': 0.2,
          'release': 2
        }
      },
      'steel': {
        'oscillator': {
          'type': 'fatcustom',
          'partials': [
            0.2, 1, 0, 0.5, 0.1
          ],
          'spread': 40,
          'count': 3
        },
        'envelope': {
          'attack': 0.001,
          'decay': 1.6,
          'sustain': 0,
          'release': 10.6
        }
      },
      'marimba': {
        'oscillator': {
          'partials': [1, 0, 2, 0, 3]
        },
        'envelope': {
          'attack': 0.001,
          'decay': 1.2,
          'sustain': 0,
          'release': 10.2
        }

      },
      'custom': {
        'oscillator': {
          'type': 'custom',
          'partials': [1, 1, 1, 1]
        },
        'envelope': {
          'attack': 10.001,
          'decay': 10.00,
          'sustain': 10.01,
          'release': 30.0
        }
      },
      'drop': {
        'oscillator': {
          'type': 'pulse',
          'width': 0.8
        },
        'envelope': {
          'attack': 0.01,
          'decay': 0.05,
          'sustain': 0.2,
          'releaseCurve': 'bounce',
          'release': 0.4
        }
      },
      'eleccello': {
        'harmonicity': 3.01,
        'modulationIndex': 14,
        'oscillator': {
          'type': 'triangle'
        },
        'envelope': {
          'attack': 2.2,
          'decay': 3.3,
          'sustain': 3.1,
          'release': 10.2
        },
        'modulation': {
          'type': 'square'
        },
        'modulationEnvelope': {
          'attack': 0.01,
          'decay': 0.5,
          'sustain': 0.2,
          'release': 5.1
        }
      }
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

    // midi options
    this.initMIDIOptions()
    this.enableMIDI()
  }

  /**
   * Params specific to MIDI output
   */
  initMIDIOptions () {
    this.MIDIEnabled = false
    this.MIDIObject = null
    this.MIDIDevice = null
    this.noteReleaseTime = 0.5 // (seconds)
    this.MIDIChannel = '0'
    this.MIDIClockStarted = false
    this.MIDILoops = []
    this.MIDIDeviceDOMElementID = 'midiOut'
    this.MIDIChannelDOMElementID = 'midiChannel'
  }

  /**
   * Enable MIDI output
   */
  enableMIDI () {
    // check browser support for WebMIDI
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({
        sysex: false
      }).then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this))
    } else {
      alert('No MIDI support in your browser.')
    }
  }

  onMIDISuccess (MIDIObject) {
    this.MIDIObject = MIDIObject

    let MIDIOutputs = this.MIDIObject.outputs.values()

    let selectMIDIOut = document.getElementById(this.MIDIDeviceDOMElementID)
    selectMIDIOut.onchange = this.changeMIDIOut.bind(this)
    selectMIDIOut.disabled = false

    let selectMIDIChannel = document.getElementById(this.MIDIChannelDOMElementID)
    selectMIDIChannel.onchange = this.changeMIDIChannel.bind(this)

    // build dropdown of available devices
    let outputs = []
    for (let output = MIDIOutputs.next(); output && !output.done; output = MIDIOutputs.next()) {
      outputs.push(output.value)
      selectMIDIOut.appendChild(new Option(output.value.name, output.value.id, false, false))
    }
  }

  changeMIDIChannel (selectElement) {
    let channel = selectElement.target[selectElement.target.selectedIndex].value
    if (channel !== '') {
      this.MIDIChannel = channel
    }
  }

  changeMIDIOut (selectElement) {
    let id = selectElement.target[selectElement.target.selectedIndex].value

    if (id === '0') {
      this.setMIDIDisabled()
      return
    }

    if ((typeof this.MIDIObject.outputs === 'function')) {
      this.MIDIDevice = this.MIDIObject.outputs()[selectElement.target.selectedIndex]
    } else {
      this.MIDIDevice = this.MIDIObject.outputs.get(id)
    }

    this.setMIDIEnabled()
  }

  setMIDIDisabled () {
    this.MIDIEnabled = false

    // hide channel <select>
    let selectMIDIChannel = document.getElementById(this.MIDIChannelDOMElementID)
    selectMIDIChannel.classList.add('hide')
    selectMIDIChannel.disabled = true
  }

  setMIDIEnabled () {
    this.MIDIEnabled = true

    // show channel <select>
    let selectMIDIChannel = document.getElementById(this.MIDIChannelDOMElementID)
    selectMIDIChannel.classList.remove('hide')
    selectMIDIChannel.disabled = false
  }

  onMIDIFailure (error) {
    alert('No MIDI support in your browser.')
    document.getElementById('midiOut').appendChild(new Option('No Device Available', 0, false, false))
    console.log('No midi ' + error)
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

    this.resetMIDI()

    this.pointColors = []
  }

  resetMIDI () {
    let selectMIDIOut = document.getElementById(this.MIDIDeviceDOMElementID)
    if (selectMIDIOut) {
      selectMIDIOut.disabled = false
    }

    if (this.MIDILoops.length) {
      this.MIDIClockStarted = false
      this.MIDIClock.cancel()
      this.MIDIClock.dispose()
      this.MIDIDevice.send([0xFC]) // stop MIDI clock
      for (let index = 0; index < this.MIDILoops.length; index++) {
        const loop = this.MIDILoops[index]
        loop.cancel()
        loop.dispose()
      }
      this.MIDILoops = []
    }
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

      this.convolver = new Tone.Convolver(this.path + 'sounds/IR/r1_ortf.wav').fan(this.masterBus)
      this.convolver.set('wet', 0.25)

      this.freeverb = new Tone.Freeverb().fan(this.masterBus)
      this.freeverb.dampening.value = 20000
      this.freeverb.wet.value = 0.7
      this.freeverb.roomSize.value = 0.85

      Tone.Transport.bpm.value = this.bpm

      this.loadAmbience().then(() => {
        this.ambiencePlayer.start()
        Tone.Transport.start()
        resolve()
      })
    })
  }

  /**
   * Send MIDI clock messsage
   */
  sendMIDIClock () {
    if (!this.MIDIEnabled) {
      return
    }

    this.MIDIClock = new Tone.Loop(
      () => {
        // send MIDI clock start message once if not already running
        if (!this.MIDIClockStarted) {
          this.sendMIDIClockStart()
          this.MIDIClockStarted = true
        }
        this.MIDIDevice.send([0xF8])
      },
      '96n'
    ).start()
  }

  disableMIDIInteraction () {
    let selectMIDIOut = document.getElementById(this.MIDIDeviceDOMElementID)
    if (selectMIDIOut) {
      selectMIDIOut.disabled = true
    }
  }

  /**
   * Send MIDI clock start message
   */
  sendMIDIClockStart () {
    this.MIDIDevice.send([0xFA])
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

    // disable changing MIDI device while MIDI is playing so that clock stays in sync
    this.disableMIDIInteraction()

    this.samplerLoaded = true

    this.loopMap = []

    this.sampler = new Tone.PolySynth(3, Tone.AMSynth, this.presets['koto']).chain(this.convolver)
    // this.sampler = new Tone.PolySynth(6, Tone.AMSynth, this.presets['koto']).chain(this.freeverb)

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
      return a.time - b.time
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
      let isFirst = index === 0
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
              let diff = Math.abs((y * 2.0) - frequency)
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

        let rawVelocity = parseInt(map(transaction.weight, 0, 2000, 0, 127))
        if (rawVelocity > 127) {
          rawVelocity = 127
        }
        let velocity = rawVelocity.toString(16)

        let loop

        let timeLowRes = time.toFixed(1)
        let timeInt = parseInt(time)
        if (Config.detector.isMobile) {
          timeLowRes = timeInt
        }

        if (typeof this.loopMap[timeLowRes] === 'undefined') {
          loop = new Tone.Loop(
            (loopTime) => {
              if (isFirst && !this.MIDIClockStarted) {
                this.sendMIDIClock()
              }

              this.pointColors[xIndex] = weight
              this.pointColors[yIndex] = weight
              this.pointColors[zIndex] = weight

              setTimeout(() => {
                this.pointColors[xIndex] = 0
                this.pointColors[yIndex] = 0
                this.pointColors[zIndex] = 0
              }, this.noteReleaseTime * 1000)

              if (this.MIDIEnabled) {
                try {
                  let innerLoop = new Tone.Loop(function (time) {
                    let MIDINote = Tone.Frequency(note).toMidi()

                    // send MIDI note on
                    this.MIDIDevice.send(['0x9' + this.MIDIChannel, MIDINote, '0x' + velocity])

                    // send MIDI note off
                    setTimeout(() => {
                      this.MIDIDevice.send(['0x8' + this.MIDIChannel, MIDINote, 0x00])
                    }, loopTime + (this.noteReleaseTime * 1000))
                  }.bind(this), '1n').start('@' + this.quantize + 'n')
                  this.MIDILoops.push(innerLoop)
                  innerLoop.set('iterations', 1)
                } catch (error) {
                  console.log(error)
                }
              } else {
                this.sampler.triggerAttack(note, Tone.Time(loopTime).quantize(this.quantize + 'n'), weight)
              }
            },
            '1m'
          ).start(
            Tone.Transport.seconds + time
          )
        } else {
          loop = new Tone.Loop(
            () => {
              this.pointColors[xIndex] = weight
              this.pointColors[yIndex] = weight
              this.pointColors[zIndex] = weight
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
