# GEMINI.md

This file provides context and guidance for Gemini when working with code in this repository.

## Project Overview
**Neon Void Shooter** is a fast-paced, browser-based FPS built with Three.js and vanilla JavaScript.

## Running the Game

Open `index.html` in a modern browser (Chrome, Firefox, Edge). No build step required - uses ES modules with CDN-hosted Three.js.

For local development with a server (recommended to avoid CORS issues):
```bash
npx serve .
# or
python -m http.server 8000
```

## Architecture

### Tech Stack
- **Three.js** (v0.160.0) - 3D rendering via ES module imports from unpkg CDN
- **Vanilla JavaScript** - No framework, ES modules
- **Pointer Lock API** - Mouse capture for FPS controls

### File Structure
```
js/
├── main.js      # Game loop, initialization, ties all systems together
├── player.js    # First-person controls, movement, weapon handling
├── weapons.js   # Weapon classes (Shotgun, RocketLauncher, Railgun), Projectile
├── enemy.js     # Enemy AI with state machine, EnemyManager for spawning
├── arena.js     # Map geometry, lighting, spawn points
├── physics.js   # AABB collision, raycasting, gravity
└── hud.js       # DOM-based UI updates
```

### Game Flow
1. `main.js` creates Game instance which initializes Three.js scene
2. Arena is built with collider meshes registered in Physics
3. Player gets 3 weapons attached to camera
4. EnemyManager spawns 4 bots at random spawn points
5. Game loop: `update()` → player movement → enemy AI → projectile updates → HUD sync

### Key Patterns
- **Weapons**: Base `Weapon` class extended by specific weapons. Hitscan vs projectile determined by `isHitscan` flag
- **Enemy AI**: Simple state machine (`patrol` → `chase` → `attack`) with line-of-sight checks
- **Collision**: Physics class maintains collider list. `resolveCollision()` handles sliding along walls
- **Combat**: Damage flows through `takeDamage()` methods on Player/Enemy. Splash damage calculated by distance

## Controls
- WASD - Move
- Mouse - Look
- Left Click - Shoot
- 1/2/3 - Switch weapons (Shotgun/Rocket/Railgun)
- Space - Jump
- Esc - Pause (releases pointer lock)
