import * as THREE from 'three';
import * as CANNON from 'cannon';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';

//CANNON
var world,
    timeStep = 1 / 60,
    radius = 1, //m
    sphereBody;

//THREE
var camera,
    controls,
    scene,
    renderer,
    geometry = {},
    material = {},
    mesh = {},
    clock = new THREE.Clock();

var d,
    dPlanet,
    dMoon,
    dMoonVec = new THREE.Vector3();

//CHANGE SCENE ON PRESS
var pressTime = 0;

initThree();
initCannon();
animate();
function initCannon() {
    // World
    world = new CANNON.World();
    world.gravity.set(0, 0, -9.82); // m/s²
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Create a sphere
    sphereBody = new CANNON.Body({
        mass: 10, // kg
        position: new CANNON.Vec3(0, 0, 10), // m
        shape: new CANNON.Sphere(radius),
    });

    world.addBody(sphereBody);

    // Create a plane
    var groundBody = new CANNON.Body({
        mass: 0, // mass == 0 makes the body static
    });

    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    world.addBody(groundBody);
}
function initThree() {
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#ccc', 0.01, 50);
    scene.background = new THREE.Color('#ccc');

    //camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        100,
    );
    camera.position.z = 2;
    camera.position.y = -10;
    camera.rotation.x = (2 * Math.PI) / 4;

    scene.add(camera);

    //controls
    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.activeLook = false;

    //sphere
    geometry.sphere = new THREE.SphereGeometry(radius, 32, 32);
    material.sphere = new THREE.MeshBasicMaterial({
        color: '#000',
    });
    mesh.sphere = new THREE.Mesh(geometry.sphere, material.sphere);

    scene.add(mesh.sphere);

    //plane
    geometry.plane = new THREE.PlaneGeometry(100, 100, 100);
    material.plane = new THREE.MeshBasicMaterial({
        color: '#fff',
    });
    mesh.plane = new THREE.Mesh(geometry.plane, material.plane);
    scene.add(mesh.plane);
}
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    render();
}

function updatePhysics() {
    // Step the physics world
    world.step(timeStep);
    // Copy coordinates from Cannon.js to Three.js
    mesh.sphere.position.copy(sphereBody.position);
    mesh.sphere.quaternion.copy(sphereBody.quaternion);
}

function render() {
    var delta = clock.getDelta();

    // controls:
    //slow down as we approach the surface
    dPlanet = camera.position.length();
    dMoonVec.subVectors(camera.position, mesh.sphere.position);
    dMoon = dMoonVec.length();
    if (dMoon < dPlanet) {
        2;
        d = dMoon - radius * 1.01;
    } else {
        d = dPlanet - radius * 1.01;
    }
    controls.movementSpeed = 1 * d;

    if (controls.mouseDragOn) pressTime++;

    //switch scenes
    if (pressTime >= 100) {
        sphereBody.position = new CANNON.Vec3(0, 0, 3);
        // controls.lookAt(0, -10, 0);
    }

    controls.update(delta);
    renderer.render(scene, camera);
}
