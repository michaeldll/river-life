import * as THREE from '../build/three.module.js';

var materials = [],
    particles,
    parameters,
    mouseX = 0,
    mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function init() {
    var geometry = new THREE.BufferGeometry();
    var vertices = [];

    var textureLoader = new THREE.TextureLoader();

    var sprite1 = textureLoader.load('textures/sprites/snowflake1.png');
    var sprite2 = textureLoader.load('textures/sprites/snowflake2.png');
    var sprite3 = textureLoader.load('textures/sprites/snowflake3.png');
    var sprite4 = textureLoader.load('textures/sprites/snowflake4.png');
    var sprite5 = textureLoader.load('textures/sprites/snowflake5.png');

    for (var i = 0; i < 10000; i++) {
        var x = Math.random() * 2000 - 1000;
        var y = Math.random() * 2000 - 1000;
        var z = Math.random() * 2000 - 1000;

        vertices.push(x, y, z);
    }

    geometry.addAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
    );

    parameters = [
        [[1.0, 0.2, 0.5], sprite2, 20],
        [[0.95, 0.1, 0.5], sprite3, 15],
        [[0.9, 0.05, 0.5], sprite1, 10],
        [[0.85, 0, 0.5], sprite5, 8],
        [[0.8, 0, 0.5], sprite4, 5],
    ];

    for (var i = 0; i < parameters.length; i++) {
        var color = parameters[i][0];
        var sprite = parameters[i][1];
        var size = parameters[i][2];

        materials[i] = new THREE.PointsMaterial({
            size: size,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
        });
        materials[i].color.setHSL(color[0], color[1], color[2]);

        particles = new THREE.Points(geometry, materials[i]);

        particles.rotation.x = Math.random() * 6;
        particles.rotation.y = Math.random() * 6;
        particles.rotation.z = Math.random() * 6;

        scene.add(particles);
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);
}

function onDocumentMouseMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

//ds raf
function render() {
    var time = Date.now() * 0.00005;

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;

    camera.lookAt(scene.position);

    for (var i = 0; i < scene.children.length; i++) {
        var object = scene.children[i];

        if (object instanceof THREE.Points) {
            object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
        }
    }

    for (var i = 0; i < materials.length; i++) {
        var color = parameters[i][0];

        var h = ((360 * (color[0] + time)) % 360) / 360;
        materials[i].color.setHSL(h, color[1], color[2]);
    }

    renderer.render(scene, camera);
}
