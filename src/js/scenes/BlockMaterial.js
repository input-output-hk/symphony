new THREE.MeshPhysicalMaterial({
      color: 0xb66d6d,
      emissive: 0xd9d59b,
      metalness: 0.33,
      roughness: 1,
      opacity: 0.47,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap,
      envMapIntensity: 2.3,
      // bumpMap,
      // bumpScale: 0.03,
      roughnessMap,
      metalnessMap,
      normalMap,
      premultipliedAlpha: true
      // map
    })

export default class BlockMaterial extends THREE.ShaderMaterial {

    constructor(params){
        super({
            color: 0xb66d6d,
            emissive: 0xd9d59b,
            metalness: 0.33,
            roughness: 1,
            opacity: 0.47,
            transparent: true,
            side: THREE.DoubleSide,
            envMap: this.bgMap,
            envMapIntensity: 2.3,
            // bumpMap,
            // bumpScale: 0.03,
            roughnessMap,
            metalnessMap,
            normalMap,
            premultipliedAlpha: true,
            
            ...params,

        })
    }

}
