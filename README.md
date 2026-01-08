# FPS Movement System - Three.js + Cannon-ES

A clean implementation of FPS-style player movement using Three.js for rendering and cannon-es for physics, based on the voxel shooter example pattern.

## Features

- **Sphere-based physics body** for the player
- **Force-based movement** (not velocity-based)
- **PointerLockControlsCannon** class for input handling
- WASD movement
- SPACE to jump
- Mouse look with pointer lock
- Camera follows physics body

## Project Structure

```
src/
├── main.js           # Entry point and animation loop
├── physics.js        # Physics world setup
├── player.js         # Player sphere body creation
├── controls.js       # PointerLockControlsCannon class
├── scene.js          # Three.js scene, camera, renderer, lights
├── constants.js      # Game constants
└── style.css         # Minimal styling
```

## Key Components

### Physics Setup (physics.js)

- Cannon-es world with gravity
- Ground plane
- Contact materials

### Player Body (player.js)

- Sphere body (`CANNON.Sphere`)
- Mass-based physics
- Linear damping for air resistance

### Pointer Lock Controls (controls.js)

- `PointerLockControlsCannon` class
- WASD movement state
- Jump detection via collision events
- Force-based movement in `update(deltaTime)`
- Camera rotation via mouse look

### Animation Loop (main.js)

```javascript
1. controls.update(deltaTime)  // Apply forces based on input
2. world.step(fixedTimeStep, deltaTime, maxSubSteps)  // Physics simulation
3. renderer.render(scene, camera)  // Render frame
```

## Controls

- **Click** - Request pointer lock
- **WASD** - Move
- **SPACE** - Jump
- **Mouse** - Look around
- **ESC** - Exit pointer lock

## Running

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Implementation Notes

This follows the voxel shooter pattern:

- Movement is **force-based**, not position-based
- The player is a **sphere body**, not a capsule or cylinder
- Controls handle their own input state
- Physics step uses fixed timestep
- Camera position is synced to physics body each frame
