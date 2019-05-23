import Physijs from './physi.js'
import OrbitControls from './controls/OrbitControls.js'
import GLTFLoader from './GLTFLoader.js'
import * as THREE from 'https://unpkg.com/three@0.104.0/build/three.module.js'

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
let obstacles = []
let isTurning = false
let isGrounded = true
let isFinished = false
let groundWidth = 50
let groundHeight = 10000
let finish
let isStarted = false
let cancel
let debugFinish = false
let music = new Audio('../assets/winter_music.m4a')
let ambient = new Audio('../assets/winter_ambient_music.m4a')

music.volume = 0.5
music.play()

class Player extends THREE.Object3D {
	constructor(y, x, rotationX) {
		super()
		this.group = new THREE.Geometry()
		this.character = {}

		this.geometry = new THREE.CylinderGeometry(0.8, 1.4, 4, 5)
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 1
		})
		this.mesh = new Physijs.BoxMesh(this.geometry, this.material)
		this.mesh.componentOf = 'hero'

		this.mesh.castShadow = true
		this.mesh.receiveShadow = false
		this.mesh.position.y = y
		this.mesh.position.x = x
		this.mesh.rotation.x = rotationX
		this.mesh.__dirtyPosition = true
		this.mesh.__dirtyRotation = true

		this.mesh.addEventListener(
			'collision',
			(other_object, linear_velocity, angular_velocity) => {
				if (other_object.name === 'tree') {
					console.log('aj')
				}
			}
		)
	}
	addToObject(objectToMergeIn) {
		this.mesh.add(objectToMergeIn)
	}
	addTo(scene) {
		scene.add(this.mesh)
	}

	resetPosition() {
			isTurning = true
			this.mesh.__dirtyRotation = true
			this.mesh.rotation.set(-0.4, 0, 0)
	}
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

		//return this.group
	}

	addToObject(objectToMergeIn) {
		this.group.add(objectToMergeIn)
	}
	addTo(scene) {
		scene.add(this.group)
	}
}

class Obstacle extends THREE.Object3D {
	constructor(x, y, z) {
		super()
		this.geo = new THREE.Geometry()

		let random = generateRandomNumber(100)

		if (random > 10) {
			this.level1 = new THREE.ConeGeometry(1.5, 2, 4)
			this.level1.faces.forEach(f => f.color.set(0xf5f5fd))
			this.level1.translate(0, 5, 0)
			this.geo.merge(this.level1)

			this.level2 = new THREE.ConeGeometry(2, 2, 4)
			this.level2.faces.forEach(f => f.color.set(0xa9adff))
			this.level2.translate(0, 4, 0)
			this.geo.merge(this.level2)

			this.level3 = new THREE.ConeGeometry(3, 2, 4)

			this.level3.faces.forEach(f => f.color.set(0x7079fc))
			this.level3.translate(0, 3, 0)
			this.geo.merge(this.level3)

			this.trunk = new THREE.CylinderGeometry(0.5, 0.5, 4)
			this.trunk.faces.forEach(f => f.color.set(0x7079fc))
			this.trunk.translate(0, 0, 0)
			this.geo.merge(this.trunk)

			this.group = new Physijs.CylinderMesh(
				this.geo,
				new THREE.MeshLambertMaterial({
					vertexColors: THREE.VertexColors
				}),
				0
			)

			this.group.rotation.x = -19.4
			this.group.position.y = y
		} else {
			this.level1 = new THREE.BoxGeometry(6, 1, 15)
			this.level1.faces.forEach(f => f.color.set(0xa9adff))
			this.level1.translate(0, 1, 0)
			this.geo.merge(this.level1)

			this.group = new Physijs.BoxMesh(
				this.geo,
				new THREE.MeshLambertMaterial({
					vertexColors: THREE.VertexColors
				}),
				0
			)

			this.group.__dirtyRotation = true

			this.group.rotation.x = 2.8
			this.group.position.y = y - 1
		}

		this.group.position.x = x
		this.group.position.z = z
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
		if (!this.finished) {
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

document.querySelector('.mute-icon').addEventListener('click', e => {
	document.querySelector('.mute-icon').classList.add('hidden')
	document.querySelector('.unmute-icon').classList.remove('hidden')

	ambient.pause()
	music.pause()

})

document.querySelector('.unmute-icon').addEventListener('click', e => {
	document.querySelector('.unmute-icon').classList.add('hidden')
	document.querySelector('.mute-icon').classList.remove('hidden')

	ambient.play()
	music.play()

})

document.querySelector('.highscore-button').addEventListener('click', e => {
		document.querySelector('.start-screen').classList.add('hidden')
		document.querySelector('.highscore-screen').classList.remove('hidden')
})


document.querySelectorAll('.start-button').forEach(button => {
	button.addEventListener('click', e => {
	if (!isStarted) {
		document.querySelector('.highscore-screen').classList.add('hidden')
		document.querySelector('.start-screen').classList.add('hidden')
		document.querySelector('.ui-score').classList.remove('hidden')
		document.querySelector('.mute-button').classList.remove('hidden')


		isStarted = true

		init()

		cancel = setInterval(incrementSeconds, 10)
	}
})
})

document.querySelector('.restart-button').addEventListener('click', e => {
	location.reload();
})

function init() {
	// set up the scene
	createScene()

	spawnObstacles()

	//call game loop
	update()
}

function createScene() {
	scene = new Physijs.Scene()
	scene.setGravity(new THREE.Vector3(0, -50, 0))
	scene.fog = new THREE.FogExp2(0xf0fff0, 0.005)
	camera = new Camera(35, window.innerWidth / window.innerHeight, 0.1, 1000)

	renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
	renderer.setClearColor(0x000000, 0)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)
	const loader = new GLTFLoader()

	const b = (getCosFromDegrees(32.957795) * -groundHeight) / 2
	finish = new Ending(0, getTanFromDegrees(32.957795) * b, b)
	// finish.rotateX(-3.4)

	finish.addTo(scene)
	loader.load('../assets/bleacher.gltf', function(gltf) {
		const bleacher = gltf.scene
		finish.addToObject(bleacher)
	})

	hero = new Player(10, 1, -0.4)
	hero.addTo(scene)
	hero.mesh.setCcdMotionThreshold(1)

	loader.load('../assets/boy_character/scene.gltf', function(gltf) {
		const character = gltf.scene
		character.rotation.y = 1.5
		character.position.y = -1.9
		character.scale.x = 0.01
		character.scale.y = 0.01
		character.scale.z = 0.01
		hero.addToObject(character)
	})
	loader.load('../assets/snowboard.gltf', function(gltf) {
		const snowboard = gltf.scene
		snowboard.position.y = -1.9
		snowboard.scale.x = 3
		snowboard.scale.y = 2
		snowboard.scale.z = 3
		hero.addToObject(snowboard)
	})

	hero.mesh.addEventListener('collision', function(
		other_object,
		linear_velocity,
		angular_velocity
	) {
		if (other_object.name == 'ground') {
			isGrounded = true
		}

		if (other_object.name == 'finish') {
			console.log('finished!')
			isFinished = true
			document.querySelector('.finish-screen').classList.remove('hidden')
			document.querySelector('.ui-score').classList.add('hidden')
			document.querySelector('.mute-button').classList.add('hidden')

			var highScore = localStorage.getItem('highScore')

			if (highScore) {
				if (parseInt(highScore) > totalMilliseconds) {
					console.log('highScore!!!')
					document.querySelector('.seconds-counter').classList.add('highscore')
					localStorage.setItem('highScore', totalMilliseconds)
				}
			} else {
				console.log('highScore!!!')

				document.querySelector('.seconds-counter').classList.add('highscore')
				localStorage.setItem('highScore', totalMilliseconds)
			}

			document.querySelector('.seconds-counter').classList.add('finished-timer')
			clearInterval(cancel)

			// setTimeout(()=>{
			// 	location.reload()
			// }, 4000)
		}
	})

	ambient.volume = 0.5
	ambient.play()

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
		new THREE.BoxGeometry(groundWidth, groundHeight),
		planeMaterial,
		0
	)
	ground.receiveShadow = true
	ground.castShadow = true

	ground.rotateX(-Math.PI / 2 - 10)
	scene.add(ground)

	sun = new THREE.PointLight(0xffffff, 1, 0)
	sun.position.set(50, 50, 50)
	sun.castShadow = true
	scene.add(sun)
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = groundWidth
	sun.shadow.mapSize.height = (getCosFromDegrees(32.957795) * -groundHeight) / 2
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

for (let i = 0; i < 200; i++) {
	let x = i % 2 === 0 ? generateRandomNumber(25) : generateRandomNumber(-25)
	let z = generateRandomNumber(
		(getCosFromDegrees(32.957795) * -groundHeight) / 2
	)
	let y = getTanFromDegrees(32.957795) * z + 1.5
	obstacles.push(new Obstacle(x, y, z))
}

function spawnObstacles() {
	for (let i = 0; i < obstacles.length; i++) {
		setTimeout(() => {
			scene.add(obstacles[i])
		}, 10)
	}
}

var seconds = 0
var milliseconds = 0
var totalMilliseconds = 0
var counter = document.querySelector('.seconds-counter')
var highscore = document.querySelector('.highscore-counter')

function incrementSeconds() {
	if (milliseconds >= 100) {
		seconds += 1
		milliseconds = 0
	}

		if(milliseconds >= 99){
			seconds += 1
			milliseconds = 0
		}

		milliseconds += 1;
		totalMilliseconds += 1;

    counter.innerText = seconds+"."+milliseconds;
		highscore.innerText = `${localStorage.getItem('highScore')[0]}${localStorage.getItem('highScore')[1]}.${localStorage.getItem('highScore')[2]}${localStorage.getItem('highScore')[3]}`

	counter.innerText = seconds + '.' + milliseconds
	highscore.innerText = `${localStorage.getItem('highScore')[0]}${
		localStorage.getItem('highScore')[1]
	}.${localStorage.getItem('highScore')[2]}${
		localStorage.getItem('highScore')[3]
	}`
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
	if (!isTurning && hero.mesh.getLinearVelocity().z < -60) {
		hero.mesh.setLinearVelocity({
			x: hero.mesh.getLinearVelocity().x,
			y: hero.mesh.getLinearVelocity().y,
			z: -40
		})
	}
	if (isFinished) {
		hero.mesh.setLinearVelocity({ x: 0, y: 0, z: -2 })
		camera.distanceToPlayer = 100
	}

	if(debugFinish){
		hero.mesh.setLinearVelocity({x:0, y:0, z:0})
		camera.position.x = finish.position.x
		camera.position.y = finish.position.y + 130
		camera.position.z = finish.position.z + 130
	}

	if (hasPlayerFallen()) {
		// location.reload()
	}
	ground.receiveShadow = true
	ground.castShadow = true
	ground.name = 'ground'

	ground.receiveShadow = true
	ground.castShadow = true

	scene.simulate()
	renderer.render(scene, camera) //draw
}

function hasPlayerFallen() {
	if (
		hero.mesh.position.y <
		getTanFromDegrees(32.957795) * hero.mesh.position.z - 20
	) {
		return true
	} else {
		return false
	}
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

			isTurning = false

			if (isGrounded) {
				isGrounded = false
				hero.mesh.setLinearVelocity({ x: 0, y: 0, z: -100 })
			}

			break
		case 69:
			debugFinish = true
      break
		case 82:
			hero.resetPosition()
			break
	}
}

function handleKeyUp(keyEvent) {
	switch (keyEvent.keyCode) {
		case 65:
			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					0,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)
			hero.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 0))
			setTimeout(() => {
				isTurning = false
			}, 50)
			break

		case 68: // "a" key or left arrow key (turn left)
			hero.mesh.setLinearVelocity(
				new THREE.Vector3(
					0,
					hero.mesh.getLinearVelocity().y,
					hero.mesh.getLinearVelocity().z
				)
			)
			hero.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 0))

			setTimeout(() => {
				isTurning = false
			}, 50)
			break
	}
}

document.onkeydown = handleKeyDown
document.onkeyup = handleKeyUp
