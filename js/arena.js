import * as THREE from 'three';

export class Arena {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.meshes = [];

        this.createArena();
    }

    createMaterial(color, emissive = 0x000000) {
        return new THREE.MeshStandardMaterial({
            color,
            emissive,
            emissiveIntensity: 0.5,
            roughness: 0.7,
            metalness: 0.3
        });
    }

    addMesh(geometry, material, position, isCollider = true) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.meshes.push(mesh);

        if (isCollider) {
            this.physics.addCollider(mesh);
        }

        return mesh;
    }

    createArena() {
        // Materials - brighter colors for better visibility
        const floorMat = this.createMaterial(0x556677);
        const wallMat = this.createMaterial(0x667788);
        const platformMat = this.createMaterial(0x778899);
        const accentMat = this.createMaterial(0x884400, 0xff6600);
        const pillarMat = this.createMaterial(0x556666);

        // Arena dimensions
        const arenaSize = 60;
        const wallHeight = 12;
        const wallThickness = 2;

        // Floor
        const floor = this.addMesh(
            new THREE.BoxGeometry(arenaSize, 1, arenaSize),
            floorMat,
            new THREE.Vector3(0, -0.5, 0)
        );

        // Ceiling
        this.addMesh(
            new THREE.BoxGeometry(arenaSize, 1, arenaSize),
            wallMat,
            new THREE.Vector3(0, wallHeight + 0.5, 0)
        );

        // Walls
        const halfSize = arenaSize / 2;

        // North wall
        this.addMesh(
            new THREE.BoxGeometry(arenaSize, wallHeight, wallThickness),
            wallMat,
            new THREE.Vector3(0, wallHeight / 2, -halfSize)
        );

        // South wall
        this.addMesh(
            new THREE.BoxGeometry(arenaSize, wallHeight, wallThickness),
            wallMat,
            new THREE.Vector3(0, wallHeight / 2, halfSize)
        );

        // East wall
        this.addMesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize),
            wallMat,
            new THREE.Vector3(halfSize, wallHeight / 2, 0)
        );

        // West wall
        this.addMesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize),
            wallMat,
            new THREE.Vector3(-halfSize, wallHeight / 2, 0)
        );

        // Central elevated platform
        this.addMesh(
            new THREE.BoxGeometry(12, 2, 12),
            platformMat,
            new THREE.Vector3(0, 1, 0)
        );

        // Corner platforms
        const cornerOffset = 18;
        const platformPositions = [
            new THREE.Vector3(cornerOffset, 2, cornerOffset),
            new THREE.Vector3(-cornerOffset, 2, cornerOffset),
            new THREE.Vector3(cornerOffset, 2, -cornerOffset),
            new THREE.Vector3(-cornerOffset, 2, -cornerOffset)
        ];

        platformPositions.forEach(pos => {
            this.addMesh(
                new THREE.BoxGeometry(10, 4, 10),
                platformMat,
                pos
            );
        });

        // Ramps to corner platforms
        this.createRamp(-12, 0, cornerOffset, Math.PI / 2);   // To NE from center
        this.createRamp(12, 0, cornerOffset, -Math.PI / 2);   // To NW from center
        this.createRamp(-12, 0, -cornerOffset, Math.PI / 2);  // To SE from center
        this.createRamp(12, 0, -cornerOffset, -Math.PI / 2);  // To SW from center

        // Pillars for cover
        const pillarPositions = [
            new THREE.Vector3(10, 3, 0),
            new THREE.Vector3(-10, 3, 0),
            new THREE.Vector3(0, 3, 10),
            new THREE.Vector3(0, 3, -10),
            new THREE.Vector3(8, 3, 8),
            new THREE.Vector3(-8, 3, 8),
            new THREE.Vector3(8, 3, -8),
            new THREE.Vector3(-8, 3, -8)
        ];

        pillarPositions.forEach(pos => {
            this.addMesh(
                new THREE.BoxGeometry(2, 6, 2),
                pillarMat,
                pos
            );
        });

        // Accent lights on walls
        this.createAccentStrip(0, 2, -halfSize + 1.5, arenaSize - 4, 0.5, 0.2, accentMat);
        this.createAccentStrip(0, 2, halfSize - 1.5, arenaSize - 4, 0.5, 0.2, accentMat);
        this.createAccentStrip(-halfSize + 1.5, 2, 0, 0.2, 0.5, arenaSize - 4, accentMat);
        this.createAccentStrip(halfSize - 1.5, 2, 0, 0.2, 0.5, arenaSize - 4, accentMat);

        // Add some lighting
        this.addLighting();
    }

    createRamp(x, y, z, rotation) {
        const rampLength = 8;
        const rampWidth = 4;
        const rampHeight = 4;

        const geometry = new THREE.BoxGeometry(rampLength, 0.5, rampWidth);
        const material = this.createMaterial(0x3a3a45);

        const ramp = new THREE.Mesh(geometry, material);
        ramp.position.set(x, y + rampHeight / 2, z);
        ramp.rotation.z = Math.PI / 6; // 30 degree incline
        ramp.rotation.y = rotation;
        ramp.receiveShadow = true;
        ramp.castShadow = true;

        this.scene.add(ramp);
        this.meshes.push(ramp);
        this.physics.addCollider(ramp);

        return ramp;
    }

    createAccentStrip(x, y, z, width, height, depth, material) {
        const strip = this.addMesh(
            new THREE.BoxGeometry(width, height, depth),
            material,
            new THREE.Vector3(x, y, z),
            false
        );
        return strip;
    }

    addLighting() {
        // Strong ambient light for overall brightness
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        // Hemisphere light for natural fill
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // Main directional light - brighter
        const directional = new THREE.DirectionalLight(0xffffff, 1.0);
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        directional.shadow.camera.near = 0.5;
        directional.shadow.camera.far = 100;
        directional.shadow.camera.left = -40;
        directional.shadow.camera.right = 40;
        directional.shadow.camera.top = 40;
        directional.shadow.camera.bottom = -40;
        this.scene.add(directional);

        // Second directional from opposite side
        const directional2 = new THREE.DirectionalLight(0xffffee, 0.5);
        directional2.position.set(-10, 15, -10);
        this.scene.add(directional2);

        // Bright point lights spread around arena
        const lightPositions = [
            new THREE.Vector3(0, 10, 0),
            new THREE.Vector3(20, 8, 20),
            new THREE.Vector3(-20, 8, 20),
            new THREE.Vector3(20, 8, -20),
            new THREE.Vector3(-20, 8, -20),
            new THREE.Vector3(0, 8, 20),
            new THREE.Vector3(0, 8, -20),
            new THREE.Vector3(20, 8, 0),
            new THREE.Vector3(-20, 8, 0)
        ];

        lightPositions.forEach(pos => {
            const pointLight = new THREE.PointLight(0xffffff, 1.0, 40);
            pointLight.position.copy(pos);
            this.scene.add(pointLight);
        });

        // Accent orange lights on corners
        const accentPositions = [
            new THREE.Vector3(25, 3, 25),
            new THREE.Vector3(-25, 3, 25),
            new THREE.Vector3(25, 3, -25),
            new THREE.Vector3(-25, 3, -25)
        ];

        accentPositions.forEach(pos => {
            const accentLight = new THREE.PointLight(0xff6600, 1.5, 20);
            accentLight.position.copy(pos);
            this.scene.add(accentLight);
        });
    }

    getSpawnPoints() {
        return [
            new THREE.Vector3(20, 1, 20),
            new THREE.Vector3(-20, 1, 20),
            new THREE.Vector3(20, 1, -20),
            new THREE.Vector3(-20, 1, -20),
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(18, 5, 18),
            new THREE.Vector3(-18, 5, 18),
            new THREE.Vector3(18, 5, -18),
            new THREE.Vector3(-18, 5, -18)
        ];
    }
}
