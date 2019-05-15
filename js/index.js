import Physijs from './physi.js'
import OrbitControls from './controls/OrbitControls.js'
import GLTFLoader from './GLTFLoader.js'
import * as THREE from 'https://unpkg.com/three@0.104.0/build/three.module.js'

class Player extends THREE.Object3D {
	constructor(y, x, rotationX) {
		super()
		this.geometry = new THREE.BoxGeometry(1, 0.2, 3)
		this.material = new THREE.MeshBasicMaterial({ color: 0x883333 })
		this.mesh = new Physijs.BoxMesh(this.geometry, this.heroMaterial)

		this.mesh.castShadow = true
		this.mesh.receiveShadow = false
		this.mesh.position.y = y
		this.mesh.position.x = x
		this.mesh.rotation.x = rotationX
		this.mesh.__dirtyPosition = true
	}
	addTo(scene) {
		scene.add(this.mesh)
	}

	updatePosition() {}
}

class Tree extends THREE.Object3D {
	constructor(x, y, z) {
		super()
		this.geo = new THREE.Geometry()

		this.level1 = new THREE.ConeGeometry(1.5, 2, 4)
		this.level1.faces.forEach(f => f.color.set(0x00ff00))
		this.level1.translate(0, 4, 0)
		this.geo.merge(this.level1)

		this.level2 = new THREE.ConeGeometry(2, 2, 4)
		this.level2.faces.forEach(f => f.color.set(0x00ff00))
		this.level2.translate(0, 3, 0)
		this.geo.merge(this.level2)

		this.level3 = new THREE.ConeGeometry(3, 2, 4)
		this.level3.faces.forEach(f => f.color.set(0x00ff00))
		this.level3.translate(0, 2, 0)
		this.geo.merge(this.level3)

		this.trunk = new THREE.CylinderGeometry(0.5, 0.5, 2)
		this.trunk.faces.forEach(f => f.color.set(0xbb6600))
		this.trunk.translate(0, 0, 0)
		this.geo.merge(this.trunk)

		this.group = new THREE.Mesh(
			this.geo,
			new THREE.MeshLambertMaterial({
				vertexColors: THREE.VertexColors
			})
		)
		this.group.position.x = x
		this.group.position.y = y
		this.group.position.z = z

		return this.group
	}
}

class Camera extends THREE.PerspectiveCamera {
	constructor(fov, aspect, near, far) {
		super(fov, aspect, near, far)

		// this.distanceToPlayer = 15;
		this.distanceToPlayer = 10
		this.position.set(0, 20, 60)
		this.zoom = 10
		this.position.y = 40
		this.rotateX(1.2)
	}

	update() {
		this.position.z = hero.mesh.position.z + 20
		this.position.y = hero.mesh.position.y + 20
		this.position.x = hero.mesh.position.x
	}
}

// Physijs.scripts.worker = 'js/physijs_worker.js'
Physijs.scripts.ammo =
	'https://chandlerprall.github.io/Physijs/examples/js/ammo.js'
var blob = new Blob([document.querySelector('#physijs_worker').textContent])
Physijs.scripts.worker = window.URL.createObjectURL(blob)

let sceneWidth
let sceneHeight
let camera
let scene
let renderer
let dom
let hero
let sun
let ground
let orbitControl
let tree
let trees = []
let emoji

let groundWidth = 50

init()
function init() {
	// set up the scene
	createScene()

	//call game loop
	update()
}

const loader = new GLTFLoader()
loader.load('../assets/Thonker.glb', function(gltf) {
	const emoji = gltf.scenes[0].children[0]
	emoji.position.y = 3
	scene.add(gltf.scene)
})

function createScene() {
	scene = new Physijs.Scene()
	scene.setGravity(new THREE.Vector3(0, -10, 0))
	scene.fog = new THREE.FogExp2(0xf0fff0, 0.005)
	camera = new Camera(35, window.innerWidth / window.innerHeight, 0.1, 1000)

	renderer = new THREE.WebGLRenderer({ alpha: true })
	renderer.setClearColor(0x000000, 0)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	hero = new Player(1, 2, 2)

	hero.addTo(scene)

	tree = new Tree()
	scene.add(tree)
	tree.position.z = -400
	console.log(tree)

	const texture = new THREE.TextureLoader().load('../assets/slope.jpg')
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.set(10, 1000)

	const planeMaterial = Physijs.createMaterial(
		new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
		0.1,
		1 // low restitution
	)

	ground = new Physijs.BoxMesh(
		new THREE.PlaneGeometry(groundWidth, 10000),
		planeMaterial,
		0
	)
	ground.receiveShadow = true
	ground.castShadow = false

	ground.rotateX(-Math.PI / 2 - 10)
	scene.add(ground)

	sun = new THREE.PointLight(0xffffff, 1, 0)
	sun.position.set(10, 60, 10)
	sun.castShadow = true
	scene.add(sun)
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = groundWidth
	sun.shadow.mapSize.height = 1000
	sun.shadow.camera.near = 0.5
	sun.shadow.camera.far = 1000

	orbitControl = new OrbitControls(camera, renderer.domElement) //helper to rotate around in scene
	orbitControl.update()
	orbitControl.addEventListener('change', render)
	orbitControl.enableZoom = false

	// var helper = new THREE.CameraHelper(sun.shadow.camera)
	// scene.add(helper) // enable to see the light cone

	window.addEventListener('resize', onWindowResize, false) //resize callback
}

function update() {
	trees.push(
		new Tree(
			hero.mesh.position.x + 5,
			hero.mesh.position.y + 2,
			hero.mesh.position.z
		)
	)
	for (let i = 0; i < trees.length; i++) {
		scene.add(trees[i])
	}

	camera.update()
	setTimeout(() => {
		requestAnimationFrame(update) //request next update
	}, 1000 / 30)
	render()
}
function render() {
	scene.simulate()
	renderer.render(scene, camera) //draw
}
function onWindowResize() {
	//resize & align
	sceneHeight = window.innerHeight
	sceneWidth = window.innerWidth
	renderer.setSize(sceneWidth, sceneHeight)
	camera.aspect = sceneWidth / sceneHeight
	camera.updateProjectionMatrix()
}

function handleKeyDown(keyEvent) {
	// sets wheel motors; configureAngularMotor params are:
	//   1) which_motor (as numbers matched to axes: 0 = x, 1 = y, 2 = z)
	//   2) low_limit (lower limit of the motor)
	//   3) high_limit (upper limit of the motor)
	//   4) velocity (target velocity)
	//   5) max_force (maximum force the motor can apply)
	switch (keyEvent.keyCode) {
		// BUS 1
		// pivots wheels for steering
		case 65:
		case 37: // "a" key or left arrow key (turn left)
			hero.position.x = hero.position.x - 0.5
			hero.rotation.y = hero.rotation.y - 0.05
			hero.__dirtyPosition = true
			hero.__dirtyRotation = true
			break
		case 68:
		case 39: // "d" key  or right arrow key (turn right)
			hero.position.x = hero.position.x + 0.5
			hero.rotation.y = hero.rotation.y + 0.05
			hero.__dirtyPosition = true
			hero.__dirtyRotation = true
			break
		case 32:
			hero.position.y = hero.position.y + 2
			hero.__dirtyPosition = true
	}
}
document.onkeydown = handleKeyDown
