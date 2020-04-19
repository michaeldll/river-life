import * as THREE from 'three';
import SimplexNoise from './utils/noise';
import { FirstPersonControls } from './utils/FirstPersonControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { TweenLite } from 'gsap/TweenLite';
import Sprite from './entities/Sprite';
import data from './data';
import * as dat from 'dat.gui';
import {
	setAudioContext,
	buffersLengths,
	dataArrays,
	analysers,
	players,
	audioContext,
} from './entities/setAudioContext';

//Three
let scene;
let camera;
let renderer;

//Three objects
let planeSource;
let planeSourceGeometry;
let planeMiddleLeft;
let planeMiddleLeftGeometry;
let planeMiddleRight;
let planeMiddleRightGeometry;
let planeMiddle;
let planeMouth;
let planeMouthGeometry;
let planeEnd;
let planeEndGeometry;
let boxRiver;
let boxRiverGeometry;
let particleSystem;
let particleMaterials = [];
let particleParameters;
let models = [];
let sprites = [];

//Three misc
let controls;
let clock = new THREE.Clock();
let textureLoader = new THREE.TextureLoader();
const FISHES_NB = 10;
let currentDataMoving = 0;
let hasReset = false;
const reset = {
	POS: {
		x: 0.22,
		y: 38.21,
		z: -79.66,
	},
	SCALE: {
		x: 0.0009,
		y: 0.0009,
		z: 0.0009,
	},
	ROTATE: {
		x: 0,
		y: 0,
		z: -2,
	},
};
window.fishes = {
	moveX: -0.006,
	moveY: -0.008,
	currentZ: 0.01,
};

//noise
let simplex = new SimplexNoise();
let xZoom = 6;
let yZoom = 18;
let noiseStrength = 2;

//audio
let playerData = {
	ambience: { file: 'assets/ambience_v4.mp3', started: false },
	one: { file: 'assets/premiere_partie_laure.mp3', started: false },
	two: { file: 'assets/deuxieme_partie_laure.mp3', started: false },
	three: { file: 'assets/troisieme_partie_laure.mp3', started: false },
};
let musicStarted = false;

//misc
// let frameCounter = 0;
let currentSetPiece = 0; //0 = source, 1 = river, 2 = end
let pressTime = 0;
let pressed = false;
let pressing = false;
let mouseX = 0;
let mouseY = 0;
let percent = '0%';
let canAdvance = false;

window.fogFar = 35;
window.fogColor = '#fff';
window.startMoving = false;

/*
 * Helpers
 */
const d2r = degrees => {
	var pi = Math.PI;
	return degrees * (pi / 180);
};
const clamp = (val, min, max) => {
	return val > max ? max : val < min ? min : val;
};
const getNotEmptyArr = arr => arr.filter(data => typeof data !== 'undefined');
const isInitialized = (notEmptyArr, originalArr) =>
	notEmptyArr.length === originalArr.length && notEmptyArr.length !== 0;
const isMusicAvailable = () => {
	const isPlayers = Object.keys(playerData).map(data => {
		return getMusicPlayer(data);
	});

	const isMusicInitialized =
		isInitialized(getNotEmptyArr(dataArrays), dataArrays) &&
		isInitialized(getNotEmptyArr(buffersLengths), buffersLengths) &&
		isInitialized(getNotEmptyArr(analysers), analysers) &&
		isInitialized(getNotEmptyArr(isPlayers), players);

	return isMusicInitialized;
};
const getMusicPlayer = name => {
	const player = players.filter(player => player.file === playerData[name].file);

	return player[0];
};
const getRandomArbitrary = (min, max) => {
	return Math.random() * (max - min) + min;
};
const hideOnKeyPress = () => {
	document.querySelector('.key.special').classList.add('pressed');
	setTimeout(() => {
		document.querySelector('.key.special').classList.add('hide');
	}, 500);
};
const removeParticles = scene => {
	if (scene)
		scene.children.forEach(child => {
			if (child.type === 'Points') {
				child.visible = false;
			}
		});
};
const removeObject = (obj, scene) => {
	if (scene)
		scene.children.forEach(child => {
			if (child.uuid === obj.uuid) {
				console.log(child);
				child.visible = false;
			}
		});
};

/*
 * Init
 */
function setupScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog('#fff', 0, window.fogFar);
	scene.background = new THREE.Color('#fff');
}

function setupRenderer() {
	renderer = new THREE.WebGLRenderer({
		antialias: true,
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

function setupCamera() {
	let res = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(75, res, 0.1, 10000);
	camera.position.x = 0;
	camera.position.y = 32;
	camera.position.z = 11;
}

function setupControls() {
	controls = new FirstPersonControls(camera, renderer.domElement);
	controls.activeLook = false;
	controls.movementSpeed = 10;
}

function setupLights() {
	let ambientLight = new THREE.AmbientLight('#fff');
	scene.add(ambientLight);

	let spotLight = new THREE.SpotLight('#fff');
	spotLight.position.set(-30, 60, 60);
	spotLight.castShadow = true;
	scene.add(spotLight);
}

function setupPlanes(setPiece) {
	switch (setPiece) {
		case 0:
			let planeSourceSize = { w: 200, h: 200 };
			let planeSourceSide = 200;

			planeSourceGeometry = new THREE.PlaneGeometry(
				planeSourceSize.w,
				planeSourceSize.h,
				planeSourceSide,
				planeSourceSide
			);

			let planeSourceMaterial = new THREE.MeshStandardMaterial({
				roughness: 0.8,
				color: new THREE.Color('#000'),
			});
			planeSource = new THREE.Mesh(planeSourceGeometry, planeSourceMaterial);
			planeSource.castShadow = true;
			planeSource.receiveShadow = true;
			planeSource.name = 'source';

			planeSource.rotation.x = d2r(-90);
			planeSource.position.y = 27;

			scene.add(planeSource);
			break;

		case 1:
			//left
			let planeRiverSize = { w: 30, h: 300 };
			let planeRiverSide = 120;

			planeMiddleLeftGeometry = new THREE.PlaneGeometry(
				planeRiverSize.w,
				planeRiverSize.h,
				planeRiverSide,
				planeRiverSide
			);

			let planeRiverMaterial = new THREE.MeshStandardMaterial({
				roughness: 0.8,
				color: new THREE.Color('#000'),
			});
			planeMiddleLeft = new THREE.Mesh(planeMiddleLeftGeometry, planeRiverMaterial);

			planeMiddleLeft.castShadow = true;
			planeMiddleLeft.receiveShadow = true;
			planeMiddleLeft.rotation.x = d2r(-90);
			planeMiddleLeft.position.x = -18;
			planeMiddleLeft.position.y = -1.1;

			planeMiddleLeft.name = 'middleright';

			scene.add(planeMiddleLeft);

			//right
			planeMiddleRightGeometry = new THREE.PlaneGeometry(
				planeRiverSize.w,
				planeRiverSize.h,
				planeRiverSide,
				planeRiverSide
			);

			planeMiddleRight = new THREE.Mesh(planeMiddleRightGeometry, planeRiverMaterial);

			planeMiddleRight.castShadow = true;
			planeMiddleRight.receiveShadow = true;
			planeMiddleRight.rotation.x = d2r(-90);
			planeMiddleRight.position.x = 18;
			planeMiddleRight.position.y = -1.1;

			planeMiddleRight.name = 'middleright';

			scene.add(planeMiddleRight);

			//middle
			var middleGeometry = new THREE.PlaneGeometry(
				planeRiverSize.w,
				planeRiverSize.h,
				planeRiverSide,
				planeRiverSide
			);

			planeMiddle = new THREE.Mesh(middleGeometry, planeRiverMaterial);

			planeMiddle.castShadow = true;
			planeMiddle.receiveShadow = true;
			planeMiddle.rotation.x = d2r(-90);
			planeMiddle.position.x = 0;
			planeMiddle.position.y = -1;

			planeMiddle.name = 'middle';

			scene.add(planeMiddle);
			break;

		case 2:
			let planeMouthSize = { w: 35, h: 20 };
			let planeMouthSide = 100;

			planeMouthGeometry = new THREE.PlaneGeometry(
				planeMouthSize.w,
				planeMouthSize.h,
				planeMouthSide,
				planeMouthSide
			);

			let planeMouthMaterial = new THREE.MeshStandardMaterial({
				roughness: 1,
				color: '#000',
			});
			planeMouth = new THREE.Mesh(planeMouthGeometry, planeMouthMaterial);

			planeMouth.castShadow = true;
			planeMouth.receiveShadow = true;

			planeMouth.position.x = -0.1;
			planeMouth.position.y = 48.54144408064794;
			planeMouth.position.z = -80;
			planeMouth.rotation.z = -0.5594003101843874;

			scene.add(planeMouth);

		default:
			break;
	}
}

function setupEnd() {
	let planeEndSize = { w: 10, h: 10 };
	let planeEndSide = 10;

	planeEndGeometry = new THREE.PlaneGeometry(planeEndSize.w, planeEndSize.h, planeEndSide, planeEndSide);

	let planeEndMaterial = new THREE.MeshStandardMaterial({
		roughness: 0.8,
		color: new THREE.Color('#fff'),
	});
	planeEnd = new THREE.Mesh(planeEndGeometry, planeEndMaterial);
	planeEnd.castShadow = true;
	planeEnd.receiveShadow = true;
	planeEnd.name = 'End';

	planeEnd.position.x = 0.1180423918662763;
	planeEnd.position.y = 38.07513355161123;
	planeEnd.position.z = -79.83715319662244;
	planeEnd.scale.x = 1.5517835602274683;
	planeEnd.scale.y = -0.10253317249698402;
	planeEnd.scale.z = 4.198690332586594;
	planeEnd.rotation.z = 0.9473720489402033;

	scene.add(planeEnd);
}

function setupRiver() {
	boxRiverGeometry = new THREE.BoxGeometry(2, 5, 300, 300);
	var material = new THREE.MeshBasicMaterial({
		color: '#fff',
		side: THREE.DoubleSide,
	});
	boxRiver = new THREE.Mesh(boxRiverGeometry, material);
	boxRiver.position.x = 0;
	boxRiver.position.y = -3;
	boxRiver.position.z = 10;

	// planeRiver.rotation.x = d2r(90);
	boxRiver.castShadow = true;
	boxRiver.receiveShadow = true;
	boxRiver.verticesNeedUpdate = true;

	scene.add(boxRiver);
}

function setupParticlesWithTexture() {
	var geometry = new THREE.BufferGeometry(),
		vertices = [];

	var sprite1 = textureLoader.load('/assets/snowflake1.png');
	var number = 1000;

	for (var i = 0; i < number; i++) {
		var x = Math.random() * 2000 - 1000;
		var y = Math.random() * 2 + 550;
		var z = Math.random() * 2000 - 1000;

		vertices.push(x, y, z);
	}

	geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

	particleParameters = [
		[[1.0, 0.2, 0.5], sprite1, 4],
		[[0.95, 0.1, 0.5], sprite1, 3],
		[[0.9, 0.05, 0.5], sprite1, 2],
		[[0.85, 0, 0.5], sprite1, 1.6],
		[[0.8, 0, 0.5], sprite1, 1],
	];

	for (var i = 0; i < particleParameters.length; i++) {
		var color = particleParameters[i][0];
		var sprite = particleParameters[i][1];
		var size = particleParameters[i][2];

		particleMaterials[i] = new THREE.PointsMaterial({
			size: size,
			map: sprite,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true,
		});
		particleMaterials[i].color.setHSL(color[0], color[1], color[2]);

		particleSystem = new THREE.Points(geometry, particleMaterials[i]);

		particleSystem.rotation.x = Math.random() * 6;
		particleSystem.rotation.y = Math.random() * 6;
		particleSystem.rotation.z = Math.random() * 6;
		particleSystem.name = 'rain';

		scene.add(particleSystem);
	}
}

function setupModel(url, type) {
	// instantiate the loader
	let getLoader = type => {
		return type === 'gltf' ? new GLTFLoader() : new FBXLoader();
	};

	let loader = getLoader(type);

	if (type === 'gltf') {
		// function called on successful load
		const callbackOnLoad = gltf => {
			percent = 100;
			gltf.scene.scale.x = 1;
			gltf.scene.scale.y = 1;
			gltf.scene.scale.z = 1;
			gltf.scene.position.y = 30;
			gltf.scene.position.z = 1;
			gltf.scene.name = gltf.scene.uuid;
			scene.add(gltf.scene);
			models.push(gltf.scene);
		};

		// Load a glTF resource
		loader.load(
			// resource URL
			url,
			// called when the resource is loaded
			callbackOnLoad,
			// called while loading is progressing
			xhr => {
				percent = (xhr.loaded / xhr.total) * 100;
			},
			// called when loading has errors
			error => {
				// console.log('An error happened : ', error);
			}
		);
	} else if (type === 'fbx') {
		loader.load(url, function(object) {
			for (let i = 0; i < FISHES_NB; i++) {
				let cloned = object.clone();
				cloned.position.x = getRandomArbitrary(-0.9, 0.9);
				cloned.position.y = -0.3;
				cloned.position.z = getRandomArbitrary(-10, 13);
				cloned.scale.x = 0.001;
				cloned.scale.y = 0.001;
				cloned.scale.z = 0.001;
				cloned.rotation.x = 1.599;
				cloned.rotation.y = 0.074;
				cloned.rotation.z = -1.104;
				cloned.name = 'fish';
				cloned.animating = false;
				models.push(cloned);
				if (cloned) scene.add(cloned);
			}
		});
	}
}

function setupSprites() {
	const keys = Object.keys(data);
	for (let index = 0; index < keys.length; index++) {
		const params = data[keys[index]];
		const sprite = new Sprite(
			new THREE.Vector3(params.position[0], params.position[1], params.position[2]),
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(params.scale[0], params.scale[1], params.scale[2]),
			params.file,
			''
		);
		sprite.name = 'data';

		sprites.push(sprite.sprite);
	}
	for (let index = 0; index <= 9; index++) {
		if (sprites[index]) scene.add(sprites[index]);
	}
	sprites[0].material.transparent = true;
	sprites[0].material.opacity = 0;
}

function setupGUI() {
	const gui = new dat.GUI();

	setTimeout(() => {
		let fishFolder = gui.addFolder('fish');
		fishFolder.add(models[1].position, 'x', -20, 20).listen();
		fishFolder.add(models[1].position, 'y', -50, 50).listen();
		fishFolder.add(models[1].position, 'z', -100, -60).listen();
		fishFolder.add(models[1].scale, 'x', 0, 10).listen();
		fishFolder.add(models[1].scale, 'y', 0, 10).listen();
		fishFolder.add(models[1].scale, 'z', 0, 10).listen();
		fishFolder.add(models[1].rotation, 'z', -1, 1).listen();
		fishFolder.close();

		let fishFolder2 = gui.addFolder('fish2');
		fishFolder2.add(models[2].position, 'x', -2, 2).listen();
		fishFolder2.add(models[2].position, 'y', 30, 40).listen();
		fishFolder2.add(models[2].position, 'z', -85, -75).listen();
		fishFolder2.add(models[2].scale, 'x', 0, 0.01).listen();
		fishFolder2.add(models[2].scale, 'y', 0, 0.01).listen();
		fishFolder2.add(models[2].scale, 'z', 0, 0.01).listen();
		fishFolder2.add(models[2].rotation, 'z', -2, 2).listen();
		fishFolder2.close();
	}, 10000);

	let cameraFolder = gui.addFolder('Camera');
	cameraFolder.add(camera.position, 'x', -20, 20).listen();
	cameraFolder.add(camera.position, 'y', 0, 100).listen();
	cameraFolder.add(camera.position, 'z', -100, 100).listen();
	cameraFolder.close();
}

/*
 * Events
 */
function setEventListeners() {
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	document.querySelector('canvas').addEventListener('mousedown', onMouseDown);
	document.querySelector('canvas').addEventListener('mouseup', onMouseUp);
	window.addEventListener('resize', onWindowResize);
	window.addEventListener('mousemove', onMouseMove);
	document.querySelector('.end-screen .start').addEventListener('mousedown', onRestartMouseDown);
}

function onKeyDown(e) {
	if (canAdvance) pressing = true;
}

function onKeyUp(e) {
	pressing = false;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
	mouseX = event.clientX - window.innerWidth / 2;
	mouseY = event.clientY - window.innerHeight / 2;
}

function onStartMouseDown(e) {
	e.preventDefault();

	canAdvance = false;

	if (!musicStarted && getMusicPlayer('ambience')) {
		musicStarted = true;

		document.querySelector('.beginScreen').classList.add('hide');
		setTimeout(() => {
			document.querySelector('.beginScreen').classList.add('none');

			audioContext.resume();

			getMusicPlayer('ambience').start();
			getMusicPlayer('ambience').loop = true;

			setTimeout(() => {
				getMusicPlayer('one').start();
				setTimeout(() => {
					if (currentSetPiece === 0) {
						if (!data.one.moving) {
							data.one.moving = true;
							TweenLite.to(sprites[0].material, 2, {
								opacity: 1,
							});
						}
					}
				}, 5000);
			}, 4000);
		}, 500);

		setTimeout(() => {
			canAdvance = true;
			document.querySelector('.key.special').classList.remove('hide');
			document.querySelector('body').addEventListener('keypress', hideOnKeyPress);
			document.querySelector('body').addEventListener('keypress', hideOnKeyPress);
		}, 15000);
	}
}

function onRestartMouseDown() {
	location.reload();
}

function onMouseDown() {
	if (canAdvance) pressing = true;
}

function onMouseUp() {
	pressing = false;
}

/*
 * Animations
 */
function adjustMiddlePlanesVertices(offset) {
	for (let i = 0; i < planeMiddleLeft.geometry.vertices.length; i++) {
		let vertex = planeMiddleLeft.geometry.vertices[i];
		let x = vertex.x / xZoom;
		let y = vertex.y / yZoom;
		let noise = simplex.noise2D(x, y + offset) * noiseStrength;
		vertex.z = noise / 1.8;
	}
	planeMiddleLeftGeometry.verticesNeedUpdate = true;
	planeMiddleLeftGeometry.computeVertexNormals();

	for (let i = 0; i < planeMiddleRight.geometry.vertices.length; i++) {
		let vertex = planeMiddleRight.geometry.vertices[i];
		let x = vertex.x / xZoom;
		let y = vertex.y / yZoom;
		let noise = simplex.noise2D(x, y + offset) * noiseStrength * 1.2;
		vertex.z = noise / 2;
	}
	planeMiddleRightGeometry.verticesNeedUpdate = true;
	planeMiddleRightGeometry.computeVertexNormals();

	for (let i = 0; i < boxRiver.geometry.vertices.length; i++) {
		let vertex = boxRiver.geometry.vertices[i];
		let x = vertex.x / xZoom;
		let y = vertex.y / yZoom;
		let noise = simplex.noise2D(x, y + offset) * noiseStrength;
	}
	boxRiverGeometry.verticesNeedUpdate = true;
	boxRiverGeometry.computeVertexNormals();
}

function adjustCameraHeight(offset) {
	let x = camera.position.x / xZoom;
	let y = camera.position.y / yZoom;
	let noise = simplex.noise2D(x, y + offset) * noiseStrength + 1.5;
	TweenLite.to(camera.position, 2, { y: noise / 2 });
}

function adjustParticles(offset) {
	for (var i = 0; i < scene.children.length; i++) {
		var object = scene.children[i];

		if (object instanceof THREE.Points) {
			object.rotation.x = -(offset * i + 1);
		}
	}

	for (var i = 0; i < particleMaterials.length; i++) {
		var color = particleParameters[i][0];

		var h = ((360 * (color[0] + offset)) % 360) / 360;
		particleMaterials[i].color.setHSL(h, color[1], color[2]);
	}
}

function adjustFish() {
	if (getNotEmptyArr(models).length === FISHES_NB + 1) {
		models.forEach(model => {
			if (model.name === 'fish') {
				const initial = { x: model.position.x, z: model.position.z };
				const randInt = parseInt(getRandomArbitrary(0.5, 5));
				//not mountain
				if (model.position.y <= -0.6999) {
					model.position.x = getRandomArbitrary(-0.9, 0.9);
					model.position.z = initial.z + getRandomArbitrary(-0.4, 0.4);
				}
				if (model.animating) {
					model.animating = false;
					TweenLite.to(model.position, randInt, { y: -0.7 });

					setTimeout(() => {
						TweenLite.to(model.position, 3, {
							y: getRandomArbitrary(-0.1, -0.4),
						});
						TweenLite.to(model.position, 6, {
							z: model.position.z - getRandomArbitrary(0.2, 2),
						});
					}, randInt * 1000);
				}
			}
		});
	}
}

/*
 * Magic is here
 */
function init() {
	Object.keys(playerData).forEach(data => {
		setAudioContext(playerData[data].file);
	});

	setupScene();
	setupRenderer();
	setupCamera();
	setupControls();
	setupLights();

	setupPlanes(0);
	setupPlanes(1);
	setupPlanes(2);
	setupEnd();

	setupRiver();
	setupParticlesWithTexture();
	setupModel('assets/optimized_mountain_v2.glb', 'gltf');
	setupModel('assets/Poisson.fbx', 'fbx');
	setupSprites();

	// setupGUI();
	setEventListeners();

	setInterval(() => {
		document.querySelector('.key.special').classList.add('pressed');
		setTimeout(() => {
			document.querySelector('.key.special').classList.remove('pressed');
		}, 500);
	}, 2000);

	//animate fishes
	const isLoaded = setInterval(() => {
		if (getNotEmptyArr(models).length === FISHES_NB + 1) {
			clearInterval(isLoaded);
			models.forEach(model => {
				model.animating = true;
				model.animatedInterval = setInterval(() => {
					model.animating = true;
				}, getRandomArbitrary(3000, 6000));
			});
		}
	}, 200);
}

setInterval(() => {
	//hide loader when music and model is available
	if (percent >= 98 && isMusicAvailable() && getMusicPlayer('ambience')) {
		document.querySelector('.loader').classList.add('hide');
		setTimeout(() => {
			document.querySelector('.loader').classList.add('none');
			document.querySelector('.beginScreen .start').classList.add('show');
			document.querySelector('.beginScreen .start').addEventListener('mousedown', onStartMouseDown);
		}, 500);
	}

	//switch scenes
	if (pressTime >= 100 && !pressed) {
		if (currentSetPiece < 4) currentSetPiece++;

		switch (currentSetPiece) {
			case 1:
				canAdvance = false;

				TweenLite.to(window, 1, {
					fogFar: 1,
				});
				setTimeout(() => {
					console.log(particleSystem);

					removeParticles(scene);
					removeObject(planeSource, scene);
					removeObject(models[0], scene);
					removeObject(sprites[0], scene);

					TweenLite.to(camera.position, 3, {
						y: 1,
					});
					setTimeout(() => {
						getMusicPlayer('two').start();
					}, 2000);
					setTimeout(() => {
						TweenLite.to(window, 2, {
							fogFar: 35,
						});
						setInterval(() => {
							currentDataMoving++;
							if (sprites[currentDataMoving]) sprites[currentDataMoving].moving = true;
						}, 6500);
					}, 1000);
				}, 1200);
				document.querySelector('.key.special').classList.add('hide');
				document.querySelector('body').removeEventListener('keypress', hideOnKeyPress);

				setTimeout(() => {
					canAdvance = true;
					document.querySelector('.key.special').classList.remove('hide');
					document.querySelector('body').addEventListener('keypress', hideOnKeyPress);
				}, 40000);

				break;

			case 2:
				canAdvance = false;
				window.removeEventListener('mousemove', onMouseMove);
				TweenLite.to(window, 2.5, {
					fogFar: 10,
				});
				TweenLite.to(camera.position, 6, {
					y: 37,
					z: -77,
				});

				//CLEAR PREVIOUS SCENE AND RESET
				setTimeout(() => {
					for (let index = 1; index <= 7; index++) {
						if (sprites[index]) removeObject(sprites[index], scene);
					}

					removeObject(planeMiddleRight, scene);
					removeObject(planeMiddleLeft, scene);
					removeObject(planeMiddle, scene);

					//move fishes
					models.forEach((model, i) => {
						model.moving = false;
						if (i < 2) {
							model.position.x = getRandomArbitrary(reset.POS.x - 0.45, reset.POS.x + 0.45);
							model.position.y = getRandomArbitrary(reset.POS.y - 0.45, reset.POS.y + 0.45);
							model.position.z = reset.POS.z;
							model.scale.y = reset.SCALE.y;
							model.scale.y = reset.SCALE.y;
							model.scale.z = reset.SCALE.z;
							model.rotation.x = reset.ROTATE.x;
							model.rotation.y = reset.ROTATE.y;
							model.rotation.z = reset.ROTATE.z;
						}
					});

					for (let index = 10; index <= 12; index++) {
						if (sprites[index]) scene.add(sprites[index]);
					}

					TweenLite.to(window, 3.5, {
						fogFar: 120,
					});

					setTimeout(() => {
						getMusicPlayer('three').start();
					}, 3500);
				}, 6000);

				setTimeout(() => {
					document.querySelector('.data').classList.add('show');
				}, 7000);

				document.querySelector('.key.special').classList.add('hide');
				document.querySelector('body').removeEventListener('keypress', hideOnKeyPress);

				setTimeout(() => {
					canAdvance = true;
					document.querySelector('.key.special').classList.remove('hide');
					document.querySelector('body').addEventListener('keypress', hideOnKeyPress);
				}, 24000);

			default:
				break;
		}

		if (currentSetPiece === 3) {
			TweenLite.to(window, 2.5, {
				fogColor: '#000',
				fogFar: 10,
			});
			setTimeout(() => {
				document.querySelector('.end-screen').classList.add('show');
				setTimeout(() => {
					document.querySelector('.end-screen .start').classList.add('show');
				}, 2000);
			}, 2500);
		}

		pressed = true;

		setTimeout(() => {
			pressed = false;
			pressTime = 0;
		}, 3000);
	}

	if (currentSetPiece === 2) {
		if (!hasReset) {
			hasReset = true;
		}
	}
}, 100);

function render() {
	requestAnimationFrame(render);
	// frameCounter++;

	let smallOffset = Date.now() * 0.0001;
	let bigOffset = Date.now() * 0.00005;
	let delta = clock.getDelta();

	if (currentSetPiece === 0) {
		adjustParticles(bigOffset);
	}

	//animate section two terrain
	if (currentSetPiece === 1) {
		adjustMiddlePlanesVertices(smallOffset);
		if (!pressed) adjustCameraHeight(smallOffset);
		adjustFish(smallOffset);
		sprites.forEach(sprite => {
			if (sprite && sprite.moving) sprite.position.z += 0.07;
		});
	}

	//animate fishes
	if (currentSetPiece === 2) {
		models.forEach((model, i) => {
			setTimeout(() => {
				model.startMoving = true;
			}, parseInt(getRandomArbitrary(0, 3) * 1000));
			if (model.startMoving) {
				window.fishes.currentZ += 0.0016;

				model.position.x = model.position.x + window.fishes.moveX / 2;
				model.position.y = model.position.y + window.fishes.moveY / 2;
				model.position.z = -79.8 + Math.sin(window.fishes.currentZ) / 3;
			}
		});
	}

	//scene switcher progression bar
	if (pressTime >= 0 && pressTime <= 100) {
		if (pressing) pressTime++;
		else if (pressTime >= 1) pressTime--;
		document.querySelector('.pressBar > div').style.height = pressTime + '%';
	}

	//on mouse move
	const x = camera.position.x + (mouseX - camera.position.x) * 0.0001;
	camera.position.x = clamp(x, -0.5, 0.5);

	camera.lookAt(scene.position);
	scene.fog.far = window.fogFar;

	controls.update(delta);
	renderer.render(scene, camera);
}

init();
render();
