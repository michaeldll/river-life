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
