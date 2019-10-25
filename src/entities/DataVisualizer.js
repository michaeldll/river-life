import * as THREE from 'three';

export default class DataVisualizer {
    constructor(content, position, rotation, sprite) {
        this.content = content;
        this.position = new THREE.Vector3(position);
        this.rotation = new THREE.Vector3(rotation);
        this.spriteMap = new THREE.TextureLoader().load(sprite);
    }
}
