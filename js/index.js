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

		this.mesh.addEventListener(
			'collision',
			(other_object, linear_velocity, angular_velocity) => {
				if (other_object.name === 'tree') {
					console.log('aj')
				}
			}
		)
	}
	addTo(scene) {
		scene.add(this.mesh)
	}

	updatePosition() {}
}

class Ending extends THREE.Object3D {
	constructor(x, y, z) {
		super()
		this.geo = new THREE.Geometry()

		this.trunk = new THREE.CylinderGeometry(100, 100, 2)
		this.trunk.faces.forEach(f => f.color.set(0x00ff00))
		this.trunk.translate(0, 0, 0)
		this.geo.merge(this.trunk)

		this.group = new Physijs.CylinderMesh(
			this.geo,
			new THREE.MeshLambertMaterial({
				vertexColors: THREE.VertexColors
			}),
			0
		)
		this.group.position.x = x
		this.group.position.y = y
		this.group.position.z = z
		// this.group.rotation.x = -19.4w
		this.group.name = 'finish'

		return this.group
	}
}

class Tree extends THREE.Object3D {
	constructor(x, y, z) {
		super()
		this.geo = new THREE.Geometry()

		this.level1 = new THREE.ConeGeometry(1.5, 2, 4)
		this.level1.faces.forEach(f => f.color.set(0xF5F5FD))
		this.level1.translate(0, 5, 0)
		this.geo.merge(this.level1)

		this.level2 = new THREE.ConeGeometry(2, 2, 4)
		this.level2.faces.forEach(f => f.color.set(0xA9ADFF))
		this.level2.translate(0, 4, 0)
		this.geo.merge(this.level2)

		this.level3 = new THREE.ConeGeometry(3, 2, 4)

		this.level3.faces.forEach(f => f.color.set(0x7079FC))
		this.level3.translate(0, 3, 0)
		this.geo.merge(this.level3)

		this.trunk = new THREE.CylinderGeometry(0.5, 0.5, 4)
		this.trunk.faces.forEach(f => f.color.set(0x7079FC))
		this.trunk.translate(0, 0, 0)
		this.geo.merge(this.trunk)

		this.group = new Physijs.CylinderMesh(
			this.geo,
			new THREE.MeshLambertMaterial({
				vertexColors: THREE.VertexColors
			}),
			0
		)
		this.group.position.x = x
		this.group.position.y = y
		this.group.position.z = z
		this.group.rotation.x = -19.4
		this.group.name = 'tree'
		// this.group.receiveShadow = true
		// this.group.castShadow = true

		return this.group
	}
}

class Camera extends THREE.PerspectiveCamera {
	constructor(fov, aspect, near, far) {
		super(fov, aspect, near, far)

		// this.distanceToPlayer = 15;
		this.finished = false
		this.distanceToPlayer = 20
		this.position.set(0, 20, 60)
		this.zoom = 10
		this.position.y = 40
		this.rotateX(1.2)
	}

	update() {
		if(!this.finished){
			this.position.z = hero.mesh.position.z + this.distanceToPlayer
			this.position.y = hero.mesh.position.y + this.distanceToPlayer
			this.position.x = hero.mesh.position.x
		} else {
			this.position.x = finish.position.x
			this.position.y = finish.position.y + 20
			this.position.z = finish.position.z
			this.lookAt(hero.mesh)
		}
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
let isTurning = false
let isGrounded = true
let isFinished = false
let groundWidth = 50
let finish
let isStarted = false
let cancel

document.addEventListener('click', e => {
	if(!isStarted){
		isStarted = true
		init()

		cancel = setInterval(incrementSeconds, 1000);
	}
})

function init() {
	// set up the scene
	createScene()

	spawnTrees()

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
	hero.mesh.setCcdMotionThreshold(1)

	hero.mesh.addEventListener( 'collision', function( other_object, linear_velocity, angular_velocity ) {
	    if(other_object.name == "ground"){
	      isGrounded = true
	    }

	    if(other_object.name == "finish"){
	      console.log("finished!")
	      isFinished = true
				document.querySelector('.finish-screen').classList.remove('hidden')

				document.querySelector('.seconds-counter').classList.add('finished-timer')
				clearInterval(cancel)

				// setTimeout(()=>{
				// 	location.reload()
				// }, 4000)
	    }
	});

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
		new THREE.BoxGeometry(groundWidth, 10000),
		planeMaterial,
		0
	)
	ground.receiveShadow = true
	ground.castShadow = true

	ground.rotateX(-Math.PI / 2 - 10)
	scene.add(ground)

  const b = (getCosFromDegrees(32.957795) * -10000)/2
  console.log(`value b is : ${b}`)
  finish = new Ending(0, getTanFromDegrees(32.957795) * b, b)
  finish.rotateX(-3.4)


  console.log(finish.position)
  scene.add(finish)

	sun = new THREE.PointLight(0xffffff, 1, 0)
	sun.position.set(50, 50, 50)
	sun.castShadow = true
	scene.add(sun)
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = groundWidth
	sun.shadow.mapSize.height = (getCosFromDegrees(32.957795) * -10000)/2
	sun.shadow.camera.near = 0.5
	sun.shadow.camera.far = 1000

	orbitControl = new OrbitControls(camera, renderer.domElement) //helper to rotate around in scene
	orbitControl.update()
	orbitControl.addEventListener('change', render)
	orbitControl.enableZoom = false

	var helper = new THREE.CameraHelper(sun.shadow.camera)
	scene.add(helper) // enable to see the light cone

	window.addEventListener('resize', onWindowResize, false) //resize callback
}

function generateRandomNumber(multiplier) {
	return Math.ceil(Math.random() * multiplier)
}

function getTanFromDegrees(degrees) {
	return Math.tan((degrees * Math.PI) / 180)
}

function getCosFromDegrees(degrees) {
	return Math.cos((degrees * Math.PI) / 180)
}

function getSinFromDegrees(degrees) {
	return Math.sin((degrees * Math.PI) / 180)
}

for (let i = 0; i < 100; i++) {
	let x = i % 2 === 0 ? generateRandomNumber(25) : generateRandomNumber(-25)
	let z = generateRandomNumber((getCosFromDegrees(32.957795) * -10000)/2)
	let y = getTanFromDegrees(32.957795) * z + 1.5
	trees.push(new Tree(x, y, z))
}

function spawnTrees() {
	for (let i = 0; i < trees.length; i++) {
		scene.add(trees[i])
	}
}

var seconds = 0;
var el = document.querySelector('.seconds-counter');

function incrementSeconds() {
    seconds += 1;
    el.innerText = seconds+"s";
}

function update() {
	// console.log(hero.mesh.position)
	// console.log(ground._physijs.rotation)
	camera.update()
	setTimeout(() => {
		requestAnimationFrame(update) //request next update
	}, 1000 / 30)
	render()
}
function render() {

  if(isFinished){
		hero.mesh.setLinearVelocity({x:0, y:0, z:-2})
		camera.distanceToPlayer = 100
  }

  ground.receiveShadow = true
	ground.castShadow = true
	ground.name = "ground"


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
	switch (keyEvent.keyCode) {
		case 65:
		case 37: // "a" key or left arrow key (turn left)
			isTurning = true

			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					-10,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)

			break

		case 68:
			isTurning = true

			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					10,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)

			break
		case 32:
			isTurning = true

      if(isGrounded){
        isGrounded = false
        hero.mesh.setLinearVelocity({ x: 0, y: 0, z: -100 })
      }

			break
	}
}

function handleKeyUp(keyEvent) {
	switch (keyEvent.keyCode) {
		case 65:
			isTurning = false

			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					0,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)
			hero.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 0))

			break

		case 68: // "a" key or left arrow key (turn left)
			isTurning = false

			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					0,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)
			hero.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 0))

			break
	}
}

document.onkeydown = handleKeyDown
document.onkeyup = handleKeyUp
