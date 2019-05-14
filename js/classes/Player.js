export default class Player {
	constructor() {
		this.geometry = new THREE.BoxGeometry(1, 0.2, 3)
		this.material = new THREE.MeshBasicMaterial({ color: 0x883333 })
		this.mesh = new Physijs.BoxMesh(heroGeometry, heroMaterial)

		this.mesh.castShadow = true
		this.mesh.receiveShadow = false
		this.mesh.position.y = 1
		this.mesh.position.x = 2
		this.mesh.rotation.x = 2
		this.mesh.__dirtyPosition = true
	}
}
