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
let planeMouth;
let planeMouthGeometry;
let boxRiver;
let boxRiverGeometry;
let line;
let particleSystem;
let particleMaterials = [];
let particleParameters;
let models = [];
let controls;
let clock = new THREE.Clock();
let textureLoader = new THREE.TextureLoader();
let endTexture = textureLoader.load('assets/end.jpg');
let sprites = [];
const FISHES_NB = 20;
let currentDataMoving = 1;

//noise
let simplex = new SimplexNoise();
let xZoom = 6;
let yZoom = 18;
let noiseStrength = 2;

//audio
let playerData = {
    ambience: { file: 'assets/ambience_v2.mp3', started: false },
    one: { file: 'assets/premiere_partie_laure.mp3', started: false },
    two: { file: 'assets/deuxieme_partie_laure.mp3', started: false },
    three: { file: 'assets/troisieme_partie_laure.mp3', started: false },
};
let musicStarted = false;

//misc
let frameCounter = 0;
let currentSetPiece = 0; //0 = source, 1 = river, 2 = end
let pressTime = 0;
let pressed = false;
let pressing = false;
let mouseX = 0;
let mouseY = 0;
let percent = '0%';

window.fogFar = 35;
window.fogColor = '#fff';

/*
 * Helpers
 */
const d2r = degrees => {
    var pi = Math.PI;
    return degrees * (pi / 180);
};
const removeEntity = object => {
    var selectedObject = scene.getObjectByName(object.name);
    scene.remove(selectedObject);
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
    const player = players.filter(
        player => player.file === playerData[name].file,
    );

    return player[0];
};
const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
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

    //0,32,11
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
                planeSourceSide,
            );

            let planeSourceMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.8,
                color: new THREE.Color('#000'),
            });
            planeSource = new THREE.Mesh(
                planeSourceGeometry,
                planeSourceMaterial,
            );
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
                planeRiverSide,
            );

            let planeRiverMaterial = new THREE.MeshStandardMaterial({
                roughness: 0.8,
                color: new THREE.Color('#000'),
            });
            planeMiddleLeft = new THREE.Mesh(
                planeMiddleLeftGeometry,
                planeRiverMaterial,
            );

            planeMiddleLeft.castShadow = true;
            planeMiddleLeft.receiveShadow = true;
            planeMiddleLeft.rotation.x = d2r(-90);
            planeMiddleLeft.position.x = -18;
            planeMiddleLeft.position.y = -1.1;

            scene.add(planeMiddleLeft);

            //right
            planeMiddleRightGeometry = new THREE.PlaneGeometry(
                planeRiverSize.w,
                planeRiverSize.h,
                planeRiverSide,
                planeRiverSide,
            );

            planeMiddleRight = new THREE.Mesh(
                planeMiddleRightGeometry,
                planeRiverMaterial,
            );

            planeMiddleRight.castShadow = true;
            planeMiddleRight.receiveShadow = true;
            planeMiddleRight.rotation.x = d2r(-90);
            planeMiddleRight.position.x = 18;
            planeMiddleRight.position.y = -1.1;

            scene.add(planeMiddleRight);

            //middle
            var middleGeometry = new THREE.PlaneGeometry(
                planeRiverSize.w,
                planeRiverSize.h,
                planeRiverSide,
                planeRiverSide,
            );

            var planeMiddle = new THREE.Mesh(
                middleGeometry,
                planeRiverMaterial,
            );

            planeMiddle.castShadow = true;
            planeMiddle.receiveShadow = true;
            planeMiddle.rotation.x = d2r(-90);
            planeMiddle.position.x = 0;
            planeMiddle.position.y = -1;

            scene.add(planeMiddle);
            break;

        case 2:
            let planeMouthSize = { w: 30, h: 20 };
            let planeMouthSide = 50;

            planeMouthGeometry = new THREE.PlaneGeometry(
                planeMouthSize.w,
                planeMouthSize.h,
                planeMouthSide,
                planeMouthSide,
            );

            let planeMouthMaterial = new THREE.MeshStandardMaterial({
                roughness: 1,
                map: endTexture,
            });
            planeMouth = new THREE.Mesh(planeMouthGeometry, planeMouthMaterial);

            planeMouth.castShadow = true;
            planeMouth.receiveShadow = true;

            // planeMouth.rotation.z = 1.0135447182491815;
            planeMouth.position.x = -0.1;
            planeMouth.position.y = 37;
            planeMouth.position.z = -89;

            scene.add(planeMouth);

        default:
            break;
    }
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

function setupLine() {
    //config
    const MAX_POINTS = 500;
    const DRAWCOUNT = 100;

    // geometry
    let geometry = new THREE.BufferGeometry();

    // attributes
    let positions = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

    // draw range
    geometry.setDrawRange(0, DRAWCOUNT);

    // material
    let material = new THREE.LineBasicMaterial({
        color: '#fff',
    });

    // line
    line = new THREE.Line(geometry, material);
    scene.add(line);

    // console.log(line);

    //initial positions
    let x = 0;
    let y = -1;
    let z = 14;
    let geometryPositions = line.geometry.attributes.position.array;
    let index = 0;

    for (var i = 0, l = MAX_POINTS; i < l; i++) {
        geometryPositions[index++] = x;
        geometryPositions[index++] = y;
        geometryPositions[index++] = z;

        x += Math.random() - 0.5;
        y += Math.random() - 0.5;
        z += (Math.random() - 0.5) * 30;
    }

    line.geometry.attributes.position.needsUpdate = true;
}

function setupParticlesSimple() {
    let particleCount = 3;
    const pGeometry = new THREE.Geometry();
    pGeometry.verticesNeedUpdate = true;

    const pMaterial = new THREE.PointsMaterial({
        color: '#ccc',
        size: 0.5,
    });

    // generate individual particles
    for (let p = 0; p < particleCount; p++) {
        // generate a particle with random pos
        let pX = Math.random() * 2 - 1.5,
            pY = Math.random() + 30,
            pZ = Math.random() * 3 + 5,
            particle = new THREE.Vector3(pX, pY, pZ);

        // add it to the geometry
        pGeometry.vertices.push(particle);
    }

    particleSystem = new THREE.Points(pGeometry, pMaterial);
    scene.add(particleSystem);
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

    geometry.addAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
    );

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
        particleSystem.name = 'waterfall';

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
                percent = (xhr.loaded / xhr.total) * 100 + '%';
            },
            // called when loading has errors
            error => {
                // console.log('An error happened : ', error);
            },
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
                scene.add(cloned);
            }
        });
    }
}

function setupSprites() {
    const keys = Object.keys(data);
    for (let index = 0; index < keys.length; index++) {
        const params = data[keys[index]];
        const sprite = new Sprite(
            new THREE.Vector3(
                params.position[0],
                params.position[1],
                params.position[2],
            ),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(
                params.scale[0],
                params.scale[1],
                params.scale[2],
            ),
            params.file,
            '',
        );
        sprites.push(sprite.sprite);
    }
    for (let index = 0; index <= 9; index++) {
        scene.add(sprites[index]);
    }
}

function setupGUI() {
    const gui = new dat.GUI();

    // let planeFolder = gui.addFolder('Plane Mouth');
    // planeFolder.add(planeMouth.position, 'x', -20, 20).listen();
    // planeFolder.add(planeMouth.position, 'y', 0, 100).listen();
    // planeFolder.add(planeMouth.position, 'z', -100, -60).listen();
    // planeFolder.add(planeMouth.scale, 'x', -5, 5).listen();
    // planeFolder.add(planeMouth.scale, 'y', -5, 5).listen();
    // planeFolder.add(planeMouth.scale, 'z', -5, 5).listen();
    // planeFolder.add(planeMouth.rotation, 'z', 0.8, 1.2).listen();
    // planeFolder.close();

    // let planeFolder2 = gui.addFolder('Plane Middle Left');
    // planeFolder2.add(planeMiddleLeft.position, 'x', -20, 20).listen();
    // planeFolder2.add(planeMiddleLeft.position, 'y', -50, 50).listen();
    // planeFolder2.add(planeMiddleLeft.position, 'z', -100, -60).listen();
    // planeFolder2.close();

    // let planeFolder3 = gui.addFolder('Plane Middle Right');
    // planeFolder3.add(planeMiddleRight.position, 'x', -20, 20).listen();
    // planeFolder3.add(planeMiddleRight.position, 'y', -50, 50).listen();
    // planeFolder3.add(planeMiddleRight.position, 'z', -100, -60).listen();
    // planeFolder3.close();

    // let riverFolder = gui.addFolder('River');
    // riverFolder.add(boxRiver.position, 'x', -20, 20).listen();
    // riverFolder.add(boxRiver.position, 'y', -50, 50).listen();
    // riverFolder.add(boxRiver.position, 'z', -100, -60).listen();
    // riverFolder.close();

    let spriteFolder = gui.addFolder('Sprite');
    for (let index = 1; index <= 9; index++) {
        spriteFolder.add(sprites[index].position, 'x', -20, 20).listen();
        spriteFolder.add(sprites[index].position, 'y', -20, 100).listen();
        spriteFolder.add(sprites[index].position, 'z', -100, 100).listen();
        spriteFolder.add(sprites[index].scale, 'x', 0, 10).listen();
        spriteFolder.add(sprites[index].scale, 'y', 0, 10).listen();
        spriteFolder.add(sprites[index].scale, 'z', 0, 10).listen();
    }
    spriteFolder.open();

    // let check = setInterval(() => {
    //     if (models[1]) {
    //         clearInterval(check);
    //         let modelFolder = gui.addFolder('Fish');
    //         modelFolder.add(models[1].position, 'x', -20, 20).listen();
    //         modelFolder.add(models[1].position, 'y', -1, 1).listen();
    //         modelFolder.add(models[1].position, 'z', 5, 15).listen();
    //         modelFolder.add(models[1].scale, 'x', 0, 0.001).listen();
    //         modelFolder.add(models[1].scale, 'y', 0, 0.001).listen();
    //         modelFolder.add(models[1].scale, 'z', 0, 0.001).listen();
    //         modelFolder
    //             .add(models[1].rotation, 'x', d2r(-180), d2r(180))
    //             .listen();
    //         modelFolder
    //             .add(models[1].rotation, 'y', d2r(-180), d2r(180))
    //             .listen();
    //         modelFolder
    //             .add(models[1].rotation, 'z', d2r(-180), d2r(180))
    //             .listen();
    //         modelFolder.close();
    //     }
    // }, 200);

    // let cameraFolder = gui.addFolder('Camera');
    // cameraFolder.add(camera.position, 'x', -20, 20).listen();
    // cameraFolder.add(camera.position, 'y', 0, 100).listen();
    // cameraFolder.add(camera.position, 'z', -100, 100).listen();
    // cameraFolder.close();
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
    document
        .querySelector('.end-screen .start')
        .addEventListener('mousedown', onRestartMouseDown);
}

function onKeyDown(e) {
    pressing = true;
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
            }, 5000);
        }, 500);
    }
}

function onRestartMouseDown() {
    location.reload();
}

function onMouseDown() {
    pressing = true;
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
        // vertex.y = noise / 2;
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

function adjustParticlePos(offset) {
    let noise =
        simplex.noise2D(
            particleSystem.position.x,
            particleSystem.position.y + offset,
        ) * noiseStrength;

    // Create a velocity vector
    particleSystem.velocity = new THREE.Vector3(
        0,
        noise / 2, // y: random vel
        0,
    );

    TweenLite.to(particleSystem.position, 2, {
        y: particleSystem.velocity.y,
        z: particleSystem.position.z - particleSystem.velocity.z,
    });
}

function adjustLinePos() {
    var positions = line.geometry.attributes.position.array;
    var index = 0;

    for (var i = 0, l = MAX_POINTS; i < l; i++) {}
}

function adjustParticles(offset) {
    if (currentSetPiece === 0) {
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
}

function adjustFish(offset) {
    if (getNotEmptyArr(models).length === FISHES_NB + 1) {
        models.forEach(model => {
            if (model.name === 'fish') {
                const initial = { x: model.position.x, z: model.position.z };
                const randInt = parseInt(getRandomArbitrary(0.5, 5));
                //not mountain
                if (model.position.y <= -0.6999) {
                    model.position.x = getRandomArbitrary(-0.9, 0.9);
                    model.position.z =
                        initial.z + getRandomArbitrary(-0.5, 0.5);
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
    setupRiver();
    setupParticlesWithTexture();
    setupModel('assets/BlenderMontagne.glb', 'gltf');
    setupModel('assets/Poisson.fbx', 'fbx');
    setupSprites();

    setupGUI();
    setEventListeners();

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

function render() {
    requestAnimationFrame(render);
    frameCounter++;

    let smallOffset = Date.now() * 0.0001;
    let bigOffset = Date.now() * 0.00005;
    let delta = clock.getDelta();

    if (
        isMusicAvailable() &&
        percent === '100%' &&
        getMusicPlayer('ambience')
    ) {
        //hide loader when music and model is available
        document.querySelector('.loader').classList.add('hide');
        setTimeout(() => {
            document.querySelector('.loader').classList.add('none');
            document.querySelector('.start').classList.add('show');
            document
                .querySelector('.beginScreen .start')
                .addEventListener('mousedown', onStartMouseDown);
        }, 500);
    }

    adjustParticles(bigOffset);
    adjustFish(smallOffset);

    //animate section two terrain
    if (currentSetPiece === 1) {
        adjustMiddlePlanesVertices(smallOffset);
        if (!pressed) adjustCameraHeight(smallOffset);

        // adjustParticlePos(offset * 0.01);
    }

    //scene switcher progression bar
    if (pressTime >= 0 && pressTime <= 100) {
        if (pressing) pressTime++;
        else if (pressTime >= 1) pressTime--;
    }
    document.querySelector('.pressBar > div').style.height = pressTime + '%';
    //start moving
    if (currentSetPiece === 1 && window.fogFar === 35) {
        sprites[currentDataMoving].moving = true;
    }

    sprites.forEach(sprite => {
        if (sprite && sprite.moving) sprite.position.z += 0.07;
    });

    //switch scenes
    if (pressTime >= 100 && !pressed) {
        if (currentSetPiece < 4) currentSetPiece++;

        switch (currentSetPiece) {
            case 1:
                TweenLite.to(window, 1, {
                    fogFar: 1,
                });
                setTimeout(() => {
                    TweenLite.to(camera.position, 3, {
                        y: 1,
                    });
                    setTimeout(() => {
                        TweenLite.to(window, 2, {
                            fogFar: 35,
                        });
                        getMusicPlayer('two').start();
                        setInterval(() => {
                            currentDataMoving++;
                        }, 6500);
                    }, 1000);
                }, 1200);
                break;

            case 2:
                TweenLite.to(window, 2.5, {
                    fogFar: 10,
                });
                TweenLite.to(camera.position, 6, {
                    y: 37,
                    z: -77,
                });
                setTimeout(() => {
                    for (let index = 1; index <= 9; index++) {
                        removeEntity(sprites[index]);
                    }

                    for (let index = 10; index <= 12; index++) {
                        scene.add(sprites[index]);
                    }
                    window.removeEventListener('mousemove', onMouseMove);
                    TweenLite.to(window, 3.5, {
                        fogFar: 120,
                    });
                    setTimeout(() => {
                        getMusicPlayer('three').start();
                    }, 3500);
                }, 6000);
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
                    document
                        .querySelector('.end-screen .start')
                        .classList.add('show');
                }, 2000);
            }, 2500);
        }

        pressed = true;
        setTimeout(() => {
            pressed = false;
            pressTime = 0;
        }, 3000);
    }

    //on mouse move
    const x = camera.position.x + (mouseX - camera.position.x) * 0.0001;
    camera.position.x = clamp(x, -0.5, 0.5);

    //remove first elements
    if (window.fogFar <= 5.5) {
        removeEntity(particleSystem);
        removeEntity(planeSource);
        removeEntity(models[0]);
        removeEntity(sprites[0]);
    }

    camera.lookAt(scene.position);
    scene.fog = new THREE.Fog(window.fogColor, 0, window.fogFar);

    controls.update(delta);
    renderer.render(scene, camera);
}

init();
render();
