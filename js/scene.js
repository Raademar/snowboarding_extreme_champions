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
let physics

let groundWidth = 50

init()
function init() {
	// set up the scene
	createScene()

	//call game loop
	update()
}

function createScene() {
	scene = new Physijs.Scene()
	scene.setGravity(new THREE.Vector3(0, -10, 0))
	scene.fog = new THREE.FogExp2(0xf0fff0, 0.005)
	camera = new THREE.PerspectiveCamera(
		35,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.set(0, 20, 60)
	camera.zoom = 10

	camera.position.y = 40
	// camera.position.x = 10
	// camera.rotation.z = 10
	camera.rotateX(1.2)

	renderer = new THREE.WebGLRenderer({ alpha: true })
	renderer.setClearColor(0x000000, 0)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	const heroGeometry = new THREE.BoxGeometry(1, 0.2, 3)
	const heroMaterial = new THREE.MeshBasicMaterial({ color: 0x883333 })
	hero = new Physijs.BoxMesh(heroGeometry, heroMaterial)
	hero.castShadow = true
	hero.receiveShadow = false
	hero.position.y = 1
	hero.position.x = 2
	hero.rotation.x = 2
	scene.add(hero)

	const planeMaterial = Physijs.createMaterial(
		new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
		0.5,
		0.1 // low restitution
	)

	ground = new Physijs.BoxMesh(
		new THREE.PlaneGeometry(groundWidth, 10000),
		planeMaterial,
		0
	)
	ground.receiveShadow = true
	ground.castShadow = false
	// ground.rotation. = -90
	ground.rotateX(-Math.PI / 2 - 10)
	scene.add(ground)

	//Math.PI / 3

	// camera.rotation.z = hero.rotation.z

	sun = new THREE.PointLight(0xffffff, 1, 0)
	sun.position.set(10, 60, 10)
	sun.castShadow = true
	scene.add(sun)
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = groundWidth
	sun.shadow.mapSize.height = 1000
	sun.shadow.camera.near = 0.5
	sun.shadow.camera.far = 1000

	orbitControl = new THREE.OrbitControls(camera, renderer.domElement) //helper to rotate around in scene
	orbitControl.update()
	orbitControl.addEventListener('change', render)
	orbitControl.enableZoom = false

	// var helper = new THREE.CameraHelper(sun.shadow.camera)
	// scene.add(helper) // enable to see the light cone

	window.addEventListener('resize', onWindowResize, false) //resize callback
}

function update() {
	render()
	requestAnimationFrame(update) //request next update
}
function render() {
	scene.simulate()
	renderer.render(scene, camera) //draw
	// console.log(camera.rotation)
	// console.log(hero.position.z, 'z')
	// console.log(hero.position.y, 'y')
	camera.position.z = hero.position.z + 20
	camera.position.y = hero.position.y + 20
	camera.position.x = hero.position.x
	// camera.rotation.z = hero.position.x
	// camera.position.z = hero.position.z + 5
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
			hero.position.x = -10
			break
		case 68:
		case 39: // "d" key  or right arrow key (turn right)
			busArray[0].wheel_fr_constraint.configureAngularMotor(
				1,
				-Math.PI / 4,
				Math.PI / 4,
				-10,
				200
			)
			busArray[0].wheel_fr_constraint.enableAngularMotor(1)
			busArray[0].wheel_fl_constraint.configureAngularMotor(
				1,
				-Math.PI / 4,
				Math.PI / 4,
				-10,
				200
			)
			busArray[0].wheel_fl_constraint.enableAngularMotor(1)
			break
	}
}
document.onkeydown = handleKeyDown
