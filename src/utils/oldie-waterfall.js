var stats;
var r = 0;

var delta;
var time;
var oldTime;

var particleArray = [];
var particleSystemArray = [];
var waterGeometry;
var surfaceGeometry;
var surfaceArray = [];
var splashGeometry;
var splashArray = [];

function onDocumentMouseMove(event) {
    var windowHalfX = window.innerWidth >> 1;
    var windowHalfY = window.innerHeight >> 1;

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function addParticles() {
    // Particles (waterfall)
    waterGeometry = new THREE.Geometry();

    for (i = 0; i < 2000; i++) {
        var x = (i % 10) * 4 + Math.random() * 4 - 2;
        var z = Math.random() * 4 - 2;
        var y = i / 20 + Math.random() * 4 - 2;

        var newvector = new THREE.Vector3(x, y, z);
        waterGeometry.vertices.push(new THREE.Vertex(newvector));

        particleArray.push({ x: x, y: y, z: z, origx: x });
    }
    waterGeometry.dynamic = true;

    var particleImage = THREE.ImageUtils.loadTexture('fraction1.png');
    var colorArray = [0x101826, 0x29303e, 0x777777, 0x888888, 0x999999];
    var materialArray = [];

    for (var i = 0; i < 5; ++i) {
        var color = colorArray[i % colorArray.length];

        var particleMaterial = new THREE.ParticleBasicMaterial({
            color: color,
            size: 8,
            map: particleImage,
            opacity: 0.4,
            transparent: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
        });
        materialArray.push(particleMaterial);
    }

    for (var i = 0; i < 5; ++i) {
        var material = materialArray[i % materialArray.length];

        var particles = new THREE.ParticleSystem(waterGeometry, material);

        particles.rotation.y = Math.random() * 0.4 - 0.2;
        particles.position.z = -i + 28;
        particles.position.x = -22; //+(Math.random()*2)-1;
        particles.position.y = -8 + i / 5; //(Math.random()*1)-0.5;

        var xshrink = 0.9 + 0.025 * i;
        particles.scale.set(1.2 * xshrink, 1.25, 1.3);

        scene.addChild(particles);
        particleSystemArray.push(particles);
    }

    // Surface waves
    surfaceGeometry = new THREE.Geometry();

    for (i = 0; i < 1000; i++) {
        var r = Math.random() * 140;
        var a = Math.random() * 360;
        var x = Math.cos((a * Math.PI) / 180) * r;
        var z = Math.sin((a * Math.PI) / 180) * r;
        var y = Math.abs(Math.sin(r / 16) * 20);

        var newvector = new THREE.Vector3(x, y, z);
        surfaceGeometry.vertices.push(new THREE.Vertex(newvector));

        surfaceArray.push({ x: x, y: y, z: z, r: r, a: a });
    }

    surfaceGeometry.dynamic = true;

    for (var i = 0; i < 5; ++i) {
        var material = materialArray[i % materialArray.length];

        var surfaceParticles = new THREE.ParticleSystem(
            surfaceGeometry,
            material,
        );
        surfaceParticles.scale.z = 0.5;
        surfaceParticles.scale.y = 1.2;
        surfaceParticles.scale.x = 1.1;
        surfaceParticles.position.z = 40 - i;
        surfaceParticles.position.y = -8;
        surfaceParticles.rotation.y = Math.random() * 0.6 - 0.3;
        scene.addChild(surfaceParticles);
    }

    // extra surface (smoke)
    var particleMaterial = new THREE.ParticleBasicMaterial({
        color: 0xffffff,
        size: 48,
        map: particleImage,
        opacity: 0.05,
        transparent: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
    });

    var surfaceParticles = new THREE.ParticleSystem(
        surfaceGeometry,
        particleMaterial,
    );
    surfaceParticles.scale.y = 0.1;
    surfaceParticles.scale.x = 2;
    surfaceParticles.scale.z = 0.6;
    surfaceParticles.position.y = -8;
    surfaceParticles.position.z = 45;
    scene.addChild(surfaceParticles);

    // Surface splash
    splashGeometry = new THREE.Geometry();

    for (i = 0; i < 500; i++) {
        var r = 10 + Math.random() * 40;
        var a = Math.random() * 360;
        var x = Math.cos((a * Math.PI) / 180) * r;
        var z = Math.sin((a * Math.PI) / 180) * r;
        var y = Math.abs(Math.sin(r / 30) * 30);

        var newvector = new THREE.Vector3(x, y, z);
        splashGeometry.vertices.push(new THREE.Vertex(newvector));

        splashArray.push({ x: x, y: y, z: z, r: r, a: a });
    }

    splashGeometry.dynamic = true;

    var particleMaterial = new THREE.ParticleBasicMaterial({
        color: 0xffffff,
        size: 2,
        opacity: 0.5,
        transparent: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
    });

    var splashParticles = new THREE.ParticleSystem(
        splashGeometry,
        particleMaterial,
    );
    splashParticles.scale.y = 1.3;
    splashParticles.scale.x = 1;
    splashParticles.scale.z = 0.5;
    splashParticles.position.y = -18;
    splashParticles.position.z = 46;
    splashParticles.renderDepth = 55;
    scene.addChild(splashParticles);
}

addParticles();

function animateParticles(delta) {
    if (!waterGeometry) {
        return;
    }

    // Splash
    for (var i = 0, l = splashGeometry.vertices.length; i < l; ++i) {
        splashArray[i].r += delta / 16;
        var a = splashArray[i].a;
        var r = splashArray[i].r;

        var rnd = 5 * ((50 - r) / 100);

        splashGeometry.vertices[i].position.y =
            Math.abs(Math.sin(r / 30) * 30) + Math.random() * 4 - 2;
        splashGeometry.vertices[i].position.x =
            Math.cos((a * Math.PI) / 180) * r;
        splashGeometry.vertices[i].position.z =
            Math.sin((a * Math.PI) / 180) * r;

        if (r > 50) {
            splashArray[i].r = 10 + Math.random() * 10;
            splashArray[i].a = Math.random() * 360;
        }
    }
    splashGeometry.__dirtyVertices = true;

    // Surface
    for (var i = 0, l = surfaceGeometry.vertices.length; i < l; ++i) {
        surfaceArray[i].r += delta / 16;
        var a = surfaceArray[i].a;
        var r = surfaceArray[i].r;

        var falloff = r / 7;
        var rnd = 3 * ((140 - r) / 100);

        surfaceGeometry.vertices[i].position.y =
            Math.abs(Math.sin(r / 14) * (20 - falloff)) +
            Math.random() * rnd -
            rnd / 2;
        surfaceGeometry.vertices[i].position.x =
            Math.cos((a * Math.PI) / 180) * r;
        surfaceGeometry.vertices[i].position.z =
            Math.sin((a * Math.PI) / 180) * r;

        if (r > 140) {
            surfaceArray[i].r = Math.random() * 20;
            surfaceArray[i].a = Math.random() * 360;
        }
    }
    surfaceGeometry.__dirtyVertices = true;

    // Waterfall
    for (var i = 0, l = waterGeometry.vertices.length; i < l; ++i) {
        var count = r + i;

        var spread = (100 - waterGeometry.vertices[i].position.y) / 100;
        var addz = Math.min(spread * 40, 5);
        waterGeometry.vertices[i].position.y -=
            delta / 160 + Math.abs(addz / 2);
        waterGeometry.vertices[i].position.x =
            particleArray[i].x + Math.cos(count) * spread;
        waterGeometry.vertices[i].position.z =
            particleArray[i].z + Math.sin(count) * spread + addz;

        if (waterGeometry.vertices[i].position.y < 5) {
            waterGeometry.vertices[i].position.y = 100 + Math.random() * 4 - 2;
            waterGeometry.vertices[i].position.z = Math.random() * 4 - 2;

            particleArray[i].x = particleArray[i].origx + Math.random() * 4 - 2;
            particleArray[i].y = waterGeometry.vertices[i].position.y;
            particleArray[i].z = waterGeometry.vertices[i].position.z;
        }
    }
    waterGeometry.__dirtyVertices = true;
}

function animate() {
    requestAnimationFrame(animate);
    loop();
}

function loop() {
    time = new Date().getTime();
    delta = time - oldTime;
    oldTime = time;

    if (isNaN(delta) || delta > 1000 || delta == 0) {
        delta = 1000 / 60;
    }

    r += delta / 160;

    var tox = mouseX / 6;
    if (tox < -120) tox = -120;
    if (tox > 120) tox = 120;
    var smoothing = Math.max(60 - delta, 10);
    camera.position.x += (tox - camera.position.x) / smoothing;

    camera.position.y = 90 + Math.abs(camera.position.x / 8);

    animateParticles(delta);

    effectFocus.uniforms['screenWidth'].value = window.innerWidth;
    effectFocus.uniforms['screenHeight'].value = window.innerHeight;

    if (render_gl && has_gl) {
        webglRenderer.clear();
        composer.render(delta);
    }
}
