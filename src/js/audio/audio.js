'use strict'

import Config from '../Config'
import Tone from 'tone'
import { map } from '../../utils/math'
import EventEmitter from 'eventemitter3'

const MAX_HASH_RATE = 35000000 // maximum hash rate

export default class Audio extends EventEmitter {
  constructor (camera, path) {
    super()
    this.samplerLoaded = false
    this.camera = camera
    this.loops = []
    this.quantize = 16
    this.masterVol = 0 // db
    this.samplerVol = 0 // db
    this.ambienceVol = -18 // db
    this.path = path
    this.ambiencePath = path + 'sounds/ambience/mining.mp3'
    this.bpm = 80
    this.isMuted = false
    this.context = null
    this.notes = {
      /* 27.5000: 'A0',
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
      51.9131: 'G#1', */
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

    this.preset = {
      'harmonicity': 0.0,
      'oscillator': {
        'partials': [1, 0, 2, 0, 3, 0, 4]
      },
      'envelope': {
        'attack': 0.001,
        'decay': 1.0,
        'sustain': 0.0,
        'release': 0.001
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
    this.noteReleaseTime = 0.25 // (seconds)
    this.MIDIChannel = '0'
    this.MIDIClockStarted = false
    this.MIDINotes = []
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
      console.log('Your browser doesn\'t support WebMIDI.')
    }
  }

  onMIDISuccess (MIDIObject) {
    this.MIDIObject = MIDIObject

    let MIDIOutputs = this.MIDIObject.outputs.values()

    let selectMIDIOut = document.getElementById(this.MIDIDeviceDOMElementID)
    if (selectMIDIOut === null) {
      return
    }
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
    })
  }

  setAmbienceFilterCutoff (hashRate) {
    let audioFreqCutoff = map(hashRate, 0.0, MAX_HASH_RATE, 50.0, 15000.0)
    if (audioFreqCutoff > 15000) {
      audioFreqCutoff = 15000
    }
    console.log('Hash Rate Freq Cutoff: ' + audioFreqCutoff)
    this.ambienceFilter.set('frequency', audioFreqCutoff)
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

    this.ambiencePlayer.start()
    this.ambienceBus.volume.linearRampToValueAtTime(this.ambienceVol, Tone.now())

    this.pointColors = []
  }

  resetMIDI () {
    let selectMIDIOut = document.getElementById(this.MIDIDeviceDOMElementID)
    if (selectMIDIOut) {
      selectMIDIOut.disabled = false
    }

    if (this.MIDINotes.length) {
      this.MIDIClockStarted = false
      this.MIDIClock.cancel()
      this.MIDIClock.dispose()
      this.MIDIDevice.send([0xFC]) // stop MIDI clock
      for (let index = 0; index < this.MIDINotes.length; index++) {
        const note = this.MIDINotes[index]
        note.stop()
        note.cancel()
        note.dispose()
      }
      this.MIDINotes = []
    }
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
      this.samplerBus = new Tone.Volume(this.samplerVol).toMaster()
      this.ambienceBus = new Tone.Volume(this.ambienceVol).chain(this.masterBus)

      this.convolver = new Tone.Convolver(this.path + 'sounds/IR/r1_ortf.mp3').fan(this.masterBus)
      this.convolver.set('wet', 0.25)

      this.freeverb = new Tone.Freeverb().fan(this.masterBus)
      this.freeverb.dampening.value = 20000
      this.freeverb.wet.value = 0.7
      this.freeverb.roomSize.value = 0.85

      Tone.Transport.bpm.value = this.bpm

      this.loadSampler()

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
    }).chain(this.samplerBus)
  }

  generateSound (
    positionsArray,
    blockObjectPosition,
    block,
    pointsMaterial,
    pointsMesh
  ) {
    Tone.Transport.stop()

    if (this.synth) {
      this.synth.releaseAll()
      this.synth.dispose()
      this.synth = null
    }

    // webaudio in chrome is much more performant so allow it to use more voices
    if (Config.detector.isChrome) {
      this.synth = new Tone.PolySynth(12, Tone.AMSynth, this.preset).chain(this.convolver)
    } else {
      this.synth = new Tone.PolySynth(6, Tone.AMSynth, this.preset).chain(this.convolver)
    }

    // disable changing MIDI device while MIDI is playing so that clock stays in sync
    this.disableMIDIInteraction()

    let harmonicity = Math.round(map(block.feeToInputRatio, 0.00001, 0.001, 0, 40))
    let detune = map(block.feeToInputRatio, 0.00001, 0.001, 0, -2000)

    this.synth.set('harmonicity', harmonicity)
    this.synth.set('detune', detune)

    this.ambienceBus.volume.linearRampToValueAtTime(-96, Tone.now() + 2)
    setTimeout(() => {
      this.ambiencePlayer.stop()
    }, 2000)

    this.loopMap = []

    this.pointsMaterial = pointsMaterial

    let minTime = Number.MAX_SAFE_INTEGER
    let maxTime = 0

    let minOutput = Number.MAX_SAFE_INTEGER
    let maxOutput = 0

    for (let index = 0; index < block.transactions.length; index++) {
      const transaction = block.transactions[index]
      minTime = Math.min(transaction.time, minTime)
      maxTime = Math.max(transaction.time, maxTime)
      minOutput = Math.min(transaction.output, minOutput)
      maxOutput = Math.max(transaction.output, maxOutput)
    }

    minOutput = Math.log(minOutput + 1.0)
    maxOutput = Math.log(maxOutput + 1.0)

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

    const startSeconds = JSON.parse(JSON.stringify(Tone.Transport.seconds))

    let noteMap = []

    for (let index = 0; index < positionsArray.length / 3; index++) {
      const transaction = block.transactions[index]

      if (typeof transaction === 'undefined') {
        continue
      }

      let time = map(transaction.time, minTime, maxTime, 0, 30) + 1.0
      let timeLowRes = time.toFixed(1)
      let timeInt = parseInt(time)
      if (Config.detector.isMobile) {
        timeLowRes = timeInt
      }

      let txSize = map(transaction.size, 0, 1000, 0, 1)
      if (txSize > 1.0) {
        txSize = 1.0
      }

      let loop

      let quantizedTime = Tone.Time(startSeconds + time).quantize(this.quantize + 'n')
      let startTime = Tone.Time(startSeconds + time)

      if (typeof this.loopMap[timeLowRes] === 'undefined') {
        let isFirst = index === 0
        let xIndex = index * 3
        let yIndex = index * 3 + 1
        let zIndex = index * 3 + 2

        /**
           * Map transaction time to new range
           */
        if (typeof block.transactions[index] !== 'undefined') {
          // filter out notes not in mode
          let filteredNotes = {}
          for (const frequency in this.notes) {
            if (this.notes.hasOwnProperty(frequency)) {
              const note = this.notes[frequency]
              const noteName = note.replace(/[0-9]/g, '')
              if (this.mode.indexOf(noteName) !== -1) { // filter out notes not in mode
                filteredNotes[frequency] = note
              }
            }
          }

          let pitchIndex = Math.floor(map(Math.log(transaction.output + 1.0), minOutput, maxOutput, Object.keys(filteredNotes).length, 0))

          let note

          let i = 0
          for (const frequency in filteredNotes) {
            if (filteredNotes.hasOwnProperty(frequency)) {
              if (pitchIndex === i) {
                note = filteredNotes[frequency]
                break
              }
              i++
            }
          }

          if (typeof note === 'undefined') {
            continue
          }

          // don't play the same note at the same time
          if (typeof noteMap[startTime] === 'undefined') {
            noteMap[startTime] = []
          }
          noteMap[startTime].push(note)

          let rawVelocity = parseInt(map(transaction.size, 0, 1000, 0, 127))
          if (rawVelocity > 127) {
            rawVelocity = 127
          }
          let velocity = rawVelocity.toString(16)

          loop = new Tone.Loop(
            (loopTime) => {
              if (isFirst && !this.MIDIClockStarted) {
                this.sendMIDIClock()
              }

              Tone.Draw.schedule(function () {
                this.pointColors[xIndex] = txSize
                this.pointColors[yIndex] = txSize
                this.pointColors[zIndex] = txSize

                setTimeout(() => {
                  this.pointColors[xIndex] = 0
                  this.pointColors[yIndex] = 0
                  this.pointColors[zIndex] = 0
                }, this.noteReleaseTime * 1000)
              }.bind(this), loopTime)

              if (this.MIDIEnabled) {
                try {
                  let playMIDINote = new Tone.Event(function (time) {
                    let MIDINote = Tone.Frequency(note).toMidi()

                    // send MIDI note on
                    this.MIDIDevice.send(['0x9' + this.MIDIChannel, MIDINote, '0x' + velocity])

                    // send MIDI note off
                    setTimeout(() => {
                      this.MIDIDevice.send(['0x8' + this.MIDIChannel, MIDINote, 0x00])
                    }, loopTime + (this.noteReleaseTime * 1000))
                  }.bind(this)).start()

                  this.MIDINotes.push(playMIDINote)
                } catch (error) {
                  console.log(error)
                }
              } else {
                this.synth.triggerAttack(
                  note,
                  '@16n',
                  txSize
                )
                this.synth.triggerRelease(
                  note,
                  '+8n'
                )
              }
            },
            '1m'
          ).start(
            startTime
          )
        } else {
          loop = new Tone.Loop(
            (loopTime) => {
              Tone.Draw.schedule(function () {
                this.pointColors[xIndex] = txSize
                this.pointColors[yIndex] = txSize
                this.pointColors[zIndex] = txSize
                setTimeout(() => {
                  this.pointColors[xIndex] = 0
                  this.pointColors[yIndex] = 0
                  this.pointColors[zIndex] = 0
                }, 500)
              }.bind(this), loopTime)
            },
            '1m'
          ).start(startSeconds + time)
        }

        loop.set('iterations', 4)
        this.loops.push(loop)
        this.loopMap[timeLowRes] = true
      }
    }

    Tone.Transport.start('+0.5')
  }
}
