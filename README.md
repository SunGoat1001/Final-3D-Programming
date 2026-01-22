# 🔫 Final 3D FPS - Multiplayer Shooter

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

> **A high-octane First-Person Shooter developed with Three.js, Cannon-es physics, and Socket.IO for real-time multiplayer action.**

---

## 📖 Introduction

**Final 3D FPS** is a browser-based shooter that combines precise physics-based movement with seamless real-time multiplayer implementation.  
Experience fast-paced combat, team-based mechanics (Red vs Blue), and a smooth weapon system, all powered by modern web technologies.

---

## ✨ Key Features

### 🛰️ **Real-Time Multiplayer**
- **Socket.IO Integration**: Low-latency state synchronization (30 updates/sec).
- **Team System**: Auto-balanced **Red** 🔴 vs **Blue** 🔵 teams.
- **Interpolation**: Smooth remote player movement and rotation.
- **State Sync**: Weapon switching, shooting, reloading, and health updates synchronized across all clients.

### 🏃 **Advanced Movement & Physics**
- **Physics Engine**: Powered by `cannon-es` for realistic collision and gravity.
- **Controller**: Custom `PointerLockControls` with force-based movement (not just velocity).
- **Mechanics**: Jumping, sliding, and air control.
- **Collision**: Precise sphere-based player hitboxes.

### 🔫 **Combat System**
- **Arsenal**: Multiple weapons including Assault Rifles (G36), Shotguns, and Melee (Sword).
- **Ballistics**: Raycasting and projectile simulation.
- **Damage Model**: Team-based damage logic, health bars, and kill notifications.
- **Visuals**: Dynamic crosshairs, muzzle flashes, and impact effects.

### 🎨 **Immersive Audio-Visuals**
- **3D Models**: High-quality GLB/GLTF character and weapon models.
- **Animations**: Integrated Mixamo animations for running, idle, and attacking.
- **Sound**: 3D spatial audio for gunshots and footsteps.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Core** | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| **Rendering** | ![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white) |
| **Physics** | **Cannon-es** |
| **Networking** | ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&logoColor=white) ![Nodejs](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) |

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository** (if applicable)
2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Running the Game

To play the game, you need to run both the **Socket.IO Server** and the **Vite Client**.

#### Option 1: One-Click Start (Recommended)
Run both backend and frontend concurrently:
```bash
npm start
```

#### Option 2: Manual Start
**1. Start the Server:**
```bash
npm run server
```
> Server runs on port `3001`

**2. Start the Client:**
```bash
npm run dev
```
> Client runs on `http://localhost:5173`

---

## 🎮 Controls

| Action | Key / Input |
| :--- | :--- |
| **Move** | `W` `A` `S` `D` |
| **Jump** | `SPACE` |
| **Shoot** | `Left Mouse Click` |
| **Aim / Zoom** | `Right Mouse Click` (Hold) |
| **Reload** | `R` |
| **Switch Weapon** | `1`, `2`, `3` ... |
| **Chat** | `ENTER` |
| **Scoreboard** | `TAB` |
| **Unlock Cursor** | `ESC` |

---

## 📂 Project Structure

```bash
📦 src
 ┣ 📜 main.js               # Entry point, game loop & rendering
 ┣ 📜 network-manager.js    # Client-side Socket.IO logic
 ┣ 📜 physics.js            # Cannon-es world setup
 ┣ 📜 player.js             # Local player physics & logic
 ┣ 📜 controls.js           # Input handling (WASD + Mouse)
 ┣ 📜 shooting.js           # Weapon mechanics & raycasting
 ┣ 📜 scene.js              # Three.js setup (lights, skybox)
 ┣ 📜 RemotePlayer.js       # Rendering other players
 ┗ 📜 assets/               # 3D models, textures, sounds
```

## 🧩 Architecture

The game uses a clear Client-Server architecture:

1.  **Server (`server.js`)**: Authoritative source for player states, health, and team assignments. It broadcasts updates to all connected clients.
2.  **Client (`src/`)**: Handles rendering, local physics prediction, and input. It sends player actions to the server and interpolates received data for smooth visuals.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

<p align="center">
  Made with ❤️ by the Final Extion 33 Team
</p>
