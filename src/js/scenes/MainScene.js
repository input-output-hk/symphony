'use strict'

// libs
import * as THREE from 'three'
import { map } from '../../utils/math'
import moment from 'moment'

// Global config
import Config from '../Config'

// Audio
import Audio from '../audio/audio'

// API
import API from '../api/btc'

const DayBuilderWorker = require('worker-loader!../workers/dayBuilder.js')
const TreeBuilderWorker = require('worker-loader!../workers/treeBuilder.js')

const TWEEN = require('@tweenjs/tween.js')

export default class MainScene {
  constructor ({
      params = {}
    } = {}
  ) {
    this.params = params

    this.api = new API()

    this.stage = params.stage // reference to the stage

    this.currentDate = this.params.date

    this.initProperties() // class properties
    this.initState(this.params.date)
    this.addInteraction()

    this.audio = new Audio(this.stage.camera)

    this.audio.init().then(() => {
      this.addEvents()
      this.setupMaterials()
      this.loadBlocks() // load in new blocks via webworker
    })
  }

  loadBlocks () {
    if (window.Worker) {
      this.dayBuilderWorker = new DayBuilderWorker()
      this.dayBuilderWorker.addEventListener('message', this.addBlocksToStage.bind(this), false)

      const a = moment(this.currentDate).subtract(Config.daysToLoad, 'days').startOf('day').toDate()
      const b = moment(this.currentDate).endOf('day').toDate()

      this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0)

      const getDayInMs = time => moment(time).startOf('day').toDate().valueOf()

      this.api.getBlocksSince(a, b).then((blocks) => {
        const days = blocks.reduce((map, block) => {
          const dayMs = getDayInMs(block.time * 1000)
          if (map.has(dayMs)) {
            map.get(dayMs).push(block)
          } else {
            map.set(dayMs, [block])
          }
          return map
        }, new Map())

        let daysArray = []
        days.forEach((day, timeStamp) => {
          let dayData = {
            blocks: day,
            timeStamp: timeStamp
          }
          daysArray.push(dayData)
        })

        // sort by days desc
        daysArray.sort((a, b) => {
          return b.timeStamp - a.timeStamp
        })

        for (let dayIndex = 0; dayIndex < daysArray.length; dayIndex++) {
          const day = daysArray[dayIndex]
          this.dayBuilderWorker.postMessage(
            {
              cmd: 'build',
              blocks: day.blocks,
              dayIndex: dayIndex
            }
          )
        }
      })
    } else {
      console.log('Webworkers not supported. Sad')
    }
  }

  addBlocksToStage (e) {
    if (typeof e.data.sizes === 'undefined') {
      return
    }

    try {
      let workerData = e.data
      let sizes = workerData.sizes
      let blockCount = workerData.blockCount
      let dayIndex = workerData.dayIndex
      let blocks = workerData.blocks

      let group = new THREE.Group()
      this.state.dayGroups.push(group)
      this.stage.scene.add(group)
      this.blocksToAnimate = []

      for (let index = 0; index < sizes.length; index++) {
        const size = sizes[index]
        const block = blocks[index]

        if (
          size.x === 0 ||
          size.y === 0 ||
          size.z === 0
        ) {
          continue
        }

        let blockMesh = new THREE.Mesh(this.boxGeometry, this.crystalMaterial.clone())

        blockMesh.material.opacity = 0.0
        blockMesh.scale.set(size.x, size.y, size.z)

        // align all front faces
        blockMesh.translateZ(-(size.z / 2))

        let rotation = ((10 * Math.PI) / blockCount) * index
        blockMesh.rotation.z = rotation
        blockMesh.translateY(700 + (index))
        blockMesh.rotation.z += Math.PI / 2
        blockMesh.translateZ(-(index * 8))
        blockMesh.blockchainData = block

        group.add(blockMesh)

        if (typeof this.state.blocksToAnimate[index] === 'undefined') {
          this.state.blocksToAnimate[index] = []
        }
        this.state.blocksToAnimate[index].push(blockMesh)
      }

      group.translateZ(-(sizes.length * 8) * dayIndex)
    } catch (error) {
      console.log(error)
    }
  }

  initState (blocks, currentDate) {
    this.state = {
      focussed: false, // are we focussed on a block?
      blocks: blocks,
      currentDate: currentDate,
      dayGroups: [],
      currentBlock: null,
      currentBlockObject: null,
      view: 'day', // can be 'day' or 'block'
      dayPositions: [], // positions of days on z-axis
      days: [],
      currentDay: null, // which day is the camera closest to
      blocksToAnimate: []
    }
  }

  initProperties () {
    this.dayZOffset = -1300 // offset for each day on z-axis
    this.treeGroup = null
  }

  addInteraction () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = []
  }

  addEvents () {
    document.addEventListener('preUpdate', this.onUpdate.bind(this), false)
    document.addEventListener('cameraMove', this.onCameraMove.bind(this), false)

    this.selectBlock = new Event('selectBlock')

    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onKeyDown.bind(this), false)

    if (window.Worker) {
      this.treeBuilderWorker = new TreeBuilderWorker()
      this.treeBuilderWorker.addEventListener('message', this.addTreeToStage.bind(this), false)
    }
  }

  addTreeToStage (e) {
    if (typeof e.data.vertices === 'undefined') {
      return
    }

    let boxCenter = e.data.boxCenter
    let endNodes = e.data.endNodes
    let vertices = e.data.vertices

    this.treeGroup = new THREE.Group()
    this.stage.scene.add(this.treeGroup)

    let blockObjectPosition = this.state.currentBlockObject.getWorldPosition().clone()
    let rotation = this.state.currentBlockObject.getWorldRotation().clone()

    let treeGeo = new THREE.BufferGeometry()
    treeGeo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))

    let mesh = new THREE.Mesh(treeGeo, this.merkleMaterial)

    mesh.translateX(-boxCenter.x)
    mesh.translateY(-boxCenter.y)
    mesh.translateZ(-boxCenter.z)

    this.treeGroup.add(mesh)

    this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
    this.treeGroup.position.set(blockObjectPosition.x, blockObjectPosition.y, blockObjectPosition.z)

    let seen = []
    let reducedArray = []

    for (let index = 0; index < endNodes.length; index++) {
      const nodePos = endNodes[index]
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
    }

    this.audio.generateMerkleSound(reducedArray, blockObjectPosition)
  }

  onKeyDown (event) {
    let isEscape = false
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
      this.animateCamera(this.stage.defaultCameraPos, new THREE.Vector3(0.0, 0.0, 0.0), 3000)
      this.state.focussed = false
      this.isAnimating = false
    })
  }

  removeTrees () {
    this.audio.unloadSound()

    if (typeof this.treeGroup !== 'undefined') {
      this.stage.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    if (this.isAnimating) {
      return
    }

    this.raycaster.setFromCamera({x: this.stage.targetMousePos.x, y: this.stage.targetMousePos.y}, this.stage.camera)

    const BreakException = {}

    try {
      this.state.dayGroups.forEach((group) => {
        var intersects = this.raycaster.intersectObjects(group.children)
        if (intersects.length > 0) {
          if (intersects[0].object === this.state.currentBlockObject) {
            throw BreakException
          }
          this.state.view = 'block'
          this.removeTrees()
          this.isAnimating = true
          let blockObject = intersects[0].object
          this.animateBlockOut(this.state.currentBlockObject).then(() => {
            this.animateBlockIn(blockObject).then(() => {
              this.buildTree(blockObject)
              this.isAnimating = false
              document.dispatchEvent(this.selectBlock)
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

      this.stage.targetCameraLookAt.z = blockWorldPos.z
      this.stage.targetCameraPos.z = blockWorldPos.z + 400

      this.animateBlock(
        blockObject,
        blockPos,
        fromQuaternion,
        this.stage.targetCameraLookAt,
        toQuaternion,
        1000,
        true
      ).then(() => {
        resolve()
      })
    })
  }

  buildTree (blockObject) {
    let block = blockObject.blockchainData

    this.state.currentBlock = block

    this.removeTrees()

    this.treeBuilderWorker.postMessage(
      {
        cmd: 'build',
        block: block
      }
    )
  }

  animateCamera (target, lookAt, duration) {
    return new Promise((resolve, reject) => {
      if (this.isAnimating) {
        console.log('animating')
        return
      }
      this.isAnimating = true

      this.stage.targetCameraPos = target.clone()
      this.stage.targetCameraLookAt = lookAt.clone()

      // grab initial postion/rotation
      let fromPosition = new THREE.Vector3().copy(this.stage.camera.position)

      // reset original position and rotation
      this.stage.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)
    })
  }

  addDay (dayData, index) {
    console.log('add day ' + index)
    let group = new THREE.Group()

    this.state.dayGroups.push(group)

    let blocks = dayData.blocks

    this.state.days[index] = dayData

    let spiralPoints = []
    this.stage.scene.add(group)
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
    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath('/static/assets/textures/').load(this.cubeMapUrls)

    // this.stage.scene.background = this.bgMap

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

  checkMouseIntersection () {
    var vector = new THREE.Vector3(this.stage.targetMousePos.x, this.stage.targetMousePos.y, 0.5)
    vector.unproject(this.stage.camera)
    var ray = new THREE.Raycaster(this.stage.camera.position, vector.sub(this.stage.camera.position).normalize())

    this.state.dayGroups.forEach((group, dayIndex) => {
      let intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        this.state.focussed = true
        this.mouseStatic = false
        if (
          intersects[0].object !== this.intersected[dayIndex] &&
          intersects[0].object !== this.state.currentBlockObject
        ) {
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

  onCameraMove () {
    if (this.state.days.length > 0) {
      // which day are we closest to?
      let closest = Number.MAX_VALUE
      let closestDayIndex = 0
      this.state.dayPositions.forEach((pos, index) => {
        let dist = Math.abs(pos - this.stage.camera.position.z)
        if (dist < closest) {
          closest = dist
          closestDayIndex = index
        }
      })

      this.state.currentDay = this.state.days[closestDayIndex]
      this.state.hashRate = this.state.currentDay.hashRate
      this.state.audioFreqCutoff = map(this.state.hashRate, 0.0, 20000000.0, 50.0, 15000) // TODO: set upper bound to max hashrate from blockchain.info

      console.log(this.state.audioFreqCutoff)

      this.audio.setAmbienceFilterCutoff(this.state.audioFreqCutoff)
    }
  }

  animateTree () {
    if (this.state.view === 'block') {
      if (this.treeGroup) {
        this.state.currentBlockObject.rotation.y += 0.001
        this.treeGroup.rotation.y += 0.001
      }
    }
  }

  animateBlockOpacity () {
    if (this.state.dayGroups.length) {
      for (let dayIndex = 0; dayIndex < this.state.dayGroups.length; dayIndex++) {
        const dayGroup = this.state.dayGroups[dayIndex]
        for (let meshIndex = 0; meshIndex < dayGroup.children.length; meshIndex++) {
          const mesh = dayGroup.children[meshIndex]
          if (mesh.material.opacity < 0.5) {
            mesh.material.opacity += 0.25
            break
          }
        }
      }
    }
  }

  onUpdate () {
    TWEEN.update()
    this.checkMouseIntersection()
    this.animateTree()
    this.animateBlockOpacity()
  }
}
