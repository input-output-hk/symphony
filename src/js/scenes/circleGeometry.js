import * as THREE from 'three'
const circleMat = new THREE.LineBasicMaterial({
  color: 0xffffff
})

const circleMatOuter = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5
})
let font
const fontLoader = new THREE.FontLoader()

export const CIRCLE_OFFSET = -840.0

export default function AddText (path, displayDate, circle){
  let circleGroup = new THREE.Group()
  let circleGeometry = new THREE.CircleGeometry(900, 128)
  circleGeometry.vertices.shift()
  let circleMesh = new THREE.LineLoop(circleGeometry, circleMat)
  circleGroup.add(circleMesh)

  let circleGeometryOuter = new THREE.CircleGeometry(920, 128)
  circleGeometryOuter.vertices.shift()
  let circleMeshOuter = new THREE.LineLoop(circleGeometryOuter, circleMatOuter)
  circleGroup.add(circleMeshOuter)

  const addText = function () {
    let textGeometry = new THREE.TextGeometry(displayDate, {
      font: font,
      size: 30,
      height: 1,
      curveSegments: 12,
      bevelEnabled: false
    })

    let textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    })

    let textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.x = CIRCLE_OFFSET
    circleGroup.add(textMesh)
  }.bind(this)

  if(font) addText()
  else {
    fontLoader.load(path + 'fonts/helvetiker_regular.typeface.json', f => {
      font = f
      addText()
    })
  }
  return circleGroup
}