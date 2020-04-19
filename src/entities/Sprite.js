import * as THREE from 'three';

export default class Sprite {
    constructor(position, rotation, scale, asset, color) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.asset = asset;
        this.color = color;
        this.sprite = null;

        //three
        var spriteMap = new THREE.TextureLoader().load(this.asset);
        var spriteMaterial = new THREE.SpriteMaterial({
            map: spriteMap,
            color: this.color,
        });
        this.sprite = new THREE.Sprite(spriteMaterial);
        this.sprite.position.x = this.position.x;
        this.sprite.position.y = this.position.y;
        this.sprite.position.z = this.position.z;
        this.sprite.scale.x = this.scale.x;
        this.sprite.scale.y = this.scale.y;
        this.sprite.scale.z = this.scale.z;
        this.sprite.rotation.x = this.rotation.x;
        this.sprite.rotation.y = this.rotation.y;
        this.sprite.rotation.z = this.rotation.z;
    }
}
