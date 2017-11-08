'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from './Config'

import {
  ExtrudeCrystalGeometry,
  ExtrudeCrystalBufferGeometry
} from './geometries/ExtrudeCrystalGeometry'

import {
  ConvexGeometry
} from './geometries/ConvexGeometry'

let glslify = require('glslify')
let OrbitControls = OrbitContructor(THREE)

let blockexplorer = require('blockchain.info/blockexplorer')

var merkle = require('merkle-tree-gen')

export default class Scene {
  constructor() {
    // declare class lets
    this.camera
    this.scene
    this.renderer
    this.width
    this.height
    this.currentBlock
    this.diagram
    this.relaxIterations
    this.textureLoader
    this.bgMap

    this.textureLoader = new THREE.TextureLoader()

    this.hashes = [
      '00000000000000000020665ca90c97a1138268211e0f1891dd669e480d692602',
      '000000000000000018a9a6c39806292529a401918ec55e078306b35884814b7c',
      '000000000000000000a3ccaa60d0f98276b24e0b0f4c145477805e4181325140',
      // '000000000000000074953313ca30236fafe09ebd7b990f69e31778cf54c33de6',
      //'00000000000000000043eaeb09b0d6b25e564068a130642fab809ed91e1acfcc',
       //'0000000000000587556425a377c751a40d61fe1156c2e6b16e844fdc38c252b7',
      // '00000000000000000088092c77b76f59f7294ef68b361a23c8827cc6bc3fe29f',
    ]

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.00001)

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias
    })
    this.renderer.setClearColor(Config.scene.bgColor)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    document.body.appendChild(this.renderer.domElement)

    // camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 5000)
    this.camera.position.set(0.0, 0.0, 10.0)
    //this.camera.lookAt(-10.0, -20.0, 0.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 35000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    this.assetsDir = 'assets/'

    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath(this.assetsDir + 'textures/').load(this.cubeMapUrls)
    // this.bgMap.mapping = THREE.CubeRefractionMapping

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 1.0,
      side: THREE.DoubleSide,
      transparent: false,
      envMap: this.bgMap,
      shading: THREE.FlatShading
      // wireframe: true,
    })

    // objects
    this.addLights()
    this.addObjects()

    // animation loop
    this.animate()
  }

  addLights(scene) {
    let ambLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xffffff)
    light.position.set(1000, 300, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      //light.shadow.bias = 0.0000001
      //light.shadow.radius = 0.1
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)

  }

  addObjects() {






    this.hashes.forEach(function (hash, hashIndex) {
      this.getBlock(hash).then(function (block) {
        this.currentBlock = block

        let hashes = []
        this.currentBlock.tx.forEach((tx) => {
          hashes.push(tx.hash)
        })

        var args = {
          array: hashes,
          hashalgo: 'sha256',
          hashlist: true
        }

        const X = new THREE.Vector3(1, 0, 0)
        const Y = new THREE.Vector3(0, 1, 0)
        const Z = new THREE.Vector3(0, 0, 1)

        let angle = 90.0

        let xPosRotation = new THREE.Quaternion().setFromAxisAngle(X, (Math.PI / 180) * angle)
        let xNegRotation = new THREE.Quaternion().setFromAxisAngle(X, (Math.PI / 180) * -angle)
        let yPosRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * angle)
        let yNegRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * -angle)
        let yReverseRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * 180)
        let zPosRotation = new THREE.Quaternion().setFromAxisAngle(Z, (Math.PI / 180) * angle)
        let zNegRotation = new THREE.Quaternion().setFromAxisAngle(Z, (Math.PI / 180) * -angle)

        merkle.fromArray(args, function (err, tree) {
          if (!err) {
            console.log('Root hash: ' + tree.root)
            console.log('Number of leaves: ' + tree.leaves)
            console.log('Number of levels: ' + tree.levels)

            //console.log(tree)

            let sortedTree

            let maxValue = 0
            let minValue = Number.MAX_SAFE_INTEGER

            // add transaction values to tree
            for (var key in tree) {
              if (tree.hasOwnProperty(key)) {
                if (tree[key].type === 'leaf') {
                  this.currentBlock.tx.forEach((tx, index) => {
                    if (tx.hash === key) {

                      let value = Math.log(tx.value + 1.0)

                      maxValue = Math.max(maxValue, value)
                      minValue = Math.min(minValue, value)

                      tree[key].value = value
                    }
                  })
                }
              }
            }

            //let nodes = []
            for (var key in tree) {
              if (tree.hasOwnProperty(key)) {
                var element = tree[key]
                if (element.type === 'root' || element.type === 'node') {

                  tree[key].children = {}
                  tree[key].children[element.left] = tree[element.left]
                  tree[key].children[element.right] = tree[element.right]

                  //nodes.push(tree[key])

                  if (element.type === 'root') {
                    sortedTree = element
                  }
                }
              }
            }

            function avgValues(parentHash) {

              //let parentHash = tree[key].parent
              let parentNode = tree[parentHash]

              if (typeof parentNode.children !== 'undefined') {


                let values = []
                let children = parentNode.children

                for (var hash in children) {
                  if (children.hasOwnProperty(hash)) {
                    values.push(children[hash].value)
                  }
                }

                if (values.length > 1) {
                  let avg = Math.abs(values[1] - values[0])
                  parentNode.value = avg
                } else {
                  parentNode.value = values[0]
                }

              }

            }

            /*for (var level = 0; level < tree.levels; level++) {
              for (var key in tree) {
                if (tree.hasOwnProperty(key)) {
                  if (tree[key].level === level) {
                    avgValues(tree[key].parent)
                  }
                }
              }
            }*/

            let points = []

            //console.log(tree)

            let treeGroup = new THREE.Group()

            this.scene.add(treeGroup)

            function scale(value, min, max) {
              return (value - min) / (max - min)
            }

            function build(node, startingPosition, direction, context) {
              //buildCalled++

              let magnitude = node.level
              //let magnitude = 2

              let hue = Math.abs(scale(node.value, minValue, maxValue) * 360)

              //let colour = new THREE.Color('hsl(' + hue + ', 100%, 50%)')

              let startPosition = startingPosition.clone()
              let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))
             // var tdirection = endPosition.clone().sub(startPosition).normalize()


              points.push(startPosition)
              points.push(endPosition)

              let path = new THREE.LineCurve3(startPosition, endPosition)

              var geometry = new THREE.TubeBufferGeometry(path, 1, 0.1, 6, false)
              var material = new THREE.MeshBasicMaterial({
                color: 0x00ff00
              })
              var mesh = new THREE.Mesh(geometry, context.crystalMaterial)
              //treeGroup.add(mesh)



              /*var arrow = new THREE.ArrowHelper(tdirection, startPosition, startPosition.distanceTo(endPosition), colour)
              treeGroup.add(mesh)*/

              let i = 0
              for (var key in node.children) {
                if (node.children.hasOwnProperty(key)) {
                  i++

                  var childNode = node.children[key]

                  if (childNode) {
                    if (typeof childNode.children !== 'undefined') {
                      let newDirection


                      if (i === 1) {

                        newDirection = direction.clone().applyQuaternion(xPosRotation)

                        var yaxis = direction.multiply(Y).normalize()
                        let yangle = (Math.PI / 180) * angle
                        let quaternion = new THREE.Quaternion().setFromAxisAngle(yaxis, yangle)
                        newDirection.applyQuaternion(quaternion)

                      } else {
                        newDirection = direction.clone().applyQuaternion(xNegRotation)

                        var yaxis = direction.multiply(Y).normalize()
                        let yangle = (Math.PI / 180) * angle
                        let quaternion = new THREE.Quaternion().setFromAxisAngle(yaxis, yangle)
                        newDirection.applyQuaternion(quaternion)

                      }

                      //console.log(newDirection)

                      build(childNode, endPosition, newDirection, context)
                    }
                  }
                }
              }
            }

            let startingPosition = new THREE.Vector3(0, 0, 0)
            let direction = new THREE.Vector3(0, 1, 0)

            //console.log(sortedTree)

            build(sortedTree, startingPosition, direction, this)

            //console.log(points)

            // Convex Hull
            var CVgeometry = new ConvexGeometry(points)
            var CVmaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              wireframe: true,
              opacity: 0.3,
              transparent: true
            })
            var CVmesh = new THREE.Mesh(CVgeometry, CVmaterial)

            //CVmesh.center()

            CVmesh.scale.set(1.1, 1.1, 1.1)

            this.scene.add(CVmesh)




          }
        }.bind(this))

        this.cubeUrls = [
          'right.png',
          'left.png',
          'top.png',
          'bot.png',
          'front.png',
          'back.png'
        ]

        this.bgMap = new THREE.CubeTextureLoader().setPath('./assets/textures/skybox/').load(this.cubeUrls)
        this.bgMap.mapping = THREE.CubeRefractionMapping

        let material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.5,
          wireframe: true,
          roughness: 0.9,
          refractionRatio: 0.88,
          //opacity: 0.8,
          //reflectivity: 1.0,
          //side: THREE.DoubleSide,
          //transparent: true,
          envMap: this.bgMap
        })




        let buildTreeCount = 0
        let buildTreeIterations = 8
        let pointArray = []

        function buildTreeRoot(context) {
          pointArray[buildTreeCount] = []

          let magnitude = 10 / 1

          let direction = new THREE.Vector3(0, 1, 0)
          let startPosition = new THREE.Vector3(0, 0, 0)

          let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

          var tdirection = endPosition.clone().sub(startPosition).normalize()
          var arrow = new THREE.ArrowHelper(tdirection, startPosition, startPosition.distanceTo(endPosition), 0xCC0000)
          treeGroup.add(arrow)

          pointArray[buildTreeCount].push({
            'direction': direction.clone(),
            'startPosition': endPosition.clone()
          })
        }

        function buildTree(context) {
          buildTreeCount++

          if (buildTreeCount < buildTreeIterations) {
            let magnitude = 10 / buildTreeCount

            pointArray[buildTreeCount] = []

            for (var index = 0; index < pointArray[buildTreeCount - 1].length; index++) {

              let pointData = pointArray[buildTreeCount - 1][index]

              // left
              let direction = pointData.direction.clone().applyQuaternion(xPosRotation)

              let startPosition = pointData.startPosition.clone()
              let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))
              var tdirection = endPosition.clone().sub(startPosition).normalize()
              var arrow = new THREE.ArrowHelper(tdirection, startPosition, startPosition.distanceTo(endPosition), 0xCC0000)
              treeGroup.add(arrow)

              pointArray[buildTreeCount].push({
                'direction': direction.clone(),
                'startPosition': endPosition.clone()
              })

              // right
              let direction2 = pointData.direction.clone().applyQuaternion(xNegRotation)

              let startPosition2 = pointData.startPosition.clone()
              let endPosition2 = startPosition2.clone().add(direction2.clone().multiplyScalar(magnitude))
              var tdirection2 = endPosition2.clone().sub(startPosition2).normalize()
              var arrow2 = new THREE.ArrowHelper(tdirection2, startPosition2, startPosition2.distanceTo(endPosition2), 0xCC0000)
              treeGroup.add(arrow2)

              pointArray[buildTreeCount].push({
                'direction': direction2.clone(),
                'startPosition': endPosition2.clone()
              })
            }

            buildTree(context)
          }
        }

        //buildTreeRoot(this)
        //buildTree(this)

        // console.log(pointArray)
      }.bind(this))
    }.bind(this))
  }

  getBlock(hash) {
    return new Promise((resolve, reject) => {

      //resolve()

      // get from firebase
      // let blockRef = this.firebaseDB.collection('blocks').doc(hash)

      //blockRef.get().then(function (doc) {
      // if (doc.exists) {
      if (false) {
        resolve(doc.data())
      } else {
        console.log('grabbing data from API')

        // get from API
        blockexplorer.getBlock(hash).then(function (block) {
          console.log(block)

          // sort transactions by value ascending
          block.tx.sort(function (a, b) {
            let transactionValueA = 0
            a.out.forEach((output, index) => {
              transactionValueA += output.value
            })
            a.value = transactionValueA

            let transactionValueB = 0
            b.out.forEach((output, index) => {
              transactionValueB += output.value
            })
            b.value = transactionValueB

            //return a.tx_index - b.tx_index
            //return a.time - b.time1

          })

          // store in cache
          /* let transactions = []
           block.tx.forEach((tx) => {

             let txObj = tx

             txObj.value = tx.value

             /*let txObj = {
               value: tx.value
             }

             transactions.push(txObj)
           })*/

          //this.firebaseDB.collection('blocks').doc(block.hash).set({hash: block.hash, height: block.height, prev_block: block.prev_block, n_tx: block.n_tx, tx: transactions}).then(function() {
          /*this.firebaseDB.collection('blocks').doc(block.hash).set(block).then(function () {
            console.log("Document successfully written!")
          }).catch(function (error) {
            console.error("Error writing document: ", error)
          })*/

          resolve(block)

        }.bind(this)).catch(function (error) {
          console.log('Error getting document:', error)
        })

      }

      /* }.bind(this)).catch(function (error) {
         console.log('Error getting document:', error)
       })*/

    })

  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }

  // Lloyds relaxation methods credit: http://www.raymondhill.net/voronoi/rhill-voronoi-demo5.html
  cellArea(cell) {

    let area = 0,
      halfedges = cell.halfedges,
      halfedgeIndex = halfedges.length,
      halfedge,
      startPoint,
      endPoint

    while (halfedgeIndex--) {
      halfedge = halfedges[halfedgeIndex]
      startPoint = halfedge.getStartpoint()
      endPoint = halfedge.getEndpoint()
      area += startPoint.x * endPoint.y
      area -= startPoint.y * endPoint.x
    }

    return area / 2

  }

  cellCentroid(cell) {

    let x = 0,
      y = 0,
      halfedges = cell.halfedges,
      halfedgeIndex = halfedges.length,
      halfedge,
      v,
      startPoint,
      endPoint

    while (halfedgeIndex--) {
      halfedge = halfedges[halfedgeIndex]
      startPoint = halfedge.getStartpoint()
      endPoint = halfedge.getEndpoint()
      let vector = startPoint.x * endPoint.y - endPoint.x * startPoint.y
      x += (startPoint.x + endPoint.x) * vector
      y += (startPoint.y + endPoint.y) * vector
    }

    v = this.cellArea(cell) * 6

    return {
      x: x / v,
      y: y / v
    }

  }

  relaxSites() {

    let cells = this.diagram.cells,
      cellIndex = cells.length,
      cell,
      site,
      sites = [],
      rn,
      dist

    let p = 1 / cellIndex * 0.1

    while (cellIndex--) {
      cell = cells[cellIndex]
      rn = Math.random()

      site = this.cellCentroid(cell)

      dist = new THREE.Vector2(site).distanceTo(new THREE.Vector2(cell.site))

      // don't relax too fast
      if (dist > 2) {
        site.x = (site.x + cell.site.x) / 2
        site.y = (site.y + cell.site.y) / 2
      }

      // probability of mytosis
      if (rn > (1 - p)) {
        dist /= 2
        sites.push({
          x: site.x + (site.x - cell.site.x) / dist,
          y: site.y + (site.y - cell.site.y) / dist
        })
      }

      sites.push(site)

    }

    this.diagram = this.voronoi.compute(sites, {
      xl: 0,
      xr: 1,
      yt: 0,
      yb: 1
    })

  }

}