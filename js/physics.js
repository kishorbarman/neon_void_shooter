import * as THREE from 'three';

export class Physics {
    constructor() {
        this.gravity = -30;
        this.colliders = [];
    }

    addCollider(mesh) {
        if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
        }
        this.colliders.push(mesh);
    }

    removeCollider(mesh) {
        const index = this.colliders.indexOf(mesh);
        if (index > -1) {
            this.colliders.splice(index, 1);
        }
    }

    getColliders() {
        return this.colliders;
    }

    checkCollision(position, radius = 0.5) {
        const playerBox = new THREE.Box3();
        playerBox.setFromCenterAndSize(
            position,
            new THREE.Vector3(radius * 2, 1.8, radius * 2)
        );

        for (const collider of this.colliders) {
            const colliderBox = new THREE.Box3();
            colliderBox.setFromObject(collider);

            if (playerBox.intersectsBox(colliderBox)) {
                return { collided: true, collider, box: colliderBox };
            }
        }
        return { collided: false };
    }

    resolveCollision(oldPosition, newPosition, radius = 0.5) {
        const resolved = newPosition.clone();

        // Try X movement
        const testX = new THREE.Vector3(newPosition.x, oldPosition.y, oldPosition.z);
        if (this.checkCollision(testX, radius).collided) {
            resolved.x = oldPosition.x;
        }

        // Try Z movement
        const testZ = new THREE.Vector3(resolved.x, oldPosition.y, newPosition.z);
        if (this.checkCollision(testZ, radius).collided) {
            resolved.z = oldPosition.z;
        }

        // Try Y movement (for jumping/falling)
        const testY = new THREE.Vector3(resolved.x, newPosition.y, resolved.z);
        const yCollision = this.checkCollision(testY, radius);
        if (yCollision.collided) {
            resolved.y = oldPosition.y;
            return { position: resolved, grounded: newPosition.y < oldPosition.y };
        }

        return { position: resolved, grounded: false };
    }

    raycast(origin, direction, maxDistance = 1000) {
        const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance);
        const intersects = raycaster.intersectObjects(this.colliders, true);

        if (intersects.length > 0) {
            return {
                hit: true,
                point: intersects[0].point,
                distance: intersects[0].distance,
                object: intersects[0].object,
                normal: intersects[0].face ? intersects[0].face.normal : new THREE.Vector3(0, 1, 0)
            };
        }
        return { hit: false };
    }

    checkGrounded(position, height = 1.8) {
        const rayOrigin = new THREE.Vector3(position.x, position.y - height / 2 + 0.1, position.z);
        const rayDirection = new THREE.Vector3(0, -1, 0);
        const result = this.raycast(rayOrigin, rayDirection, 0.3);
        return result.hit;
    }
}
