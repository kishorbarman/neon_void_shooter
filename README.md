# Neon Void Shooter

A fast-paced, first-person shooter set in a neon-lit digital void. Built with Three.js and vanilla JavaScript.

## Features

- **Fast-paced FPS Action**: Smooth movement and shooting mechanics.
- **Multiple Weapons**: Choose your playstyle with a Shotgun, Rocket Launcher, or Railgun.
- **Intelligent Enemies**: Battle against AI bots that patrol, chase, and attack.
- **Dynamic Arena**: Fight in a 3D environment with physics-based collisions and lighting.
- **Score System**: Track your progress and survive as long as possible.

## Controls

| Action | Key / Input |
|--------|------------|
| Move | **W, A, S, D** |
| Look | **Mouse** |
| Shoot | **Left Click** |
| Jump | **Space** |
| Switch Weapon | **1, 2, 3** |
| Pause / Release Mouse | **Esc** |

## How to Play

1.  **Start the Game**: Click "INITIATE SEQUENCE" on the main screen.
2.  **Survive**: Eliminate enemies to survive waves and earn points.
3.  **Manage Health**: Watch your health bar; avoid enemy fire.
4.  **Game Over**: If your health reaches zero, the system fails. Reboot to try again.

## Running the Game

### Browser
Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge).

### Local Server (Recommended)
For the best experience (and to avoid CORS issues), run a local development server:

Using Node.js:
```bash
npx serve .
```

Using Python:
```bash
python -m http.server 8000
```

Then navigate to `http://localhost:8000` (or the port shown in your terminal).

## Tech Stack

- **Three.js**: 3D rendering engine.
- **Vanilla JavaScript**: Core game logic (ES Modules).
- **Pointer Lock API**: Immersive first-person controls.

## License

[MIT License](LICENSE)
