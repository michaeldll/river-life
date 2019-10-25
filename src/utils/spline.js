var sunGeo = new THREE.SphereGeometry(12, 35, 35);
var sunMat = new THREE.MeshPhongMaterial();
sunMat.map = THREE.ImageUtils.loadTexture('image/sunmap.jpg');
var sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(0, 0, 0);
scene.add(sun); // add Sun

var mercuryGeo = new THREE.SphereGeometry(2, 15, 15);
var mercuryMat = new THREE.MeshPhongMaterial();
mercuryMat.map = THREE.ImageUtils.loadTexture('image/mercurymap.jpg');
var mercury = new THREE.Mesh(mercuryGeo, mercuryMat);
scene.add(mercury); // add Mercury

var t = 0;
function render() {
    requestAnimationFrame(render);
    t += 0.01;
    sun.rotation.y += 0.005;
    mercury.rotation.y += 0.03;

    mercury.position.x = 20 * Math.cos(t) + 0;
    mercury.position.z = 20 * Math.sin(t) + 0; // These to strings make it work

    renderer.render(scene, camera);
}
render();
