import { RemotePlayer } from './RemotePlayerEntity.js';
import { scene } from './scene.js';

export class RemotePlayerManager {
    constructor() {
        this.players = new Map();
    }
    
    addPlayer(data) {
        if (this.players.has(data.id)) {
            console.warn(`Player ${data.id} already exists`);
            return;
        }
        
        console.log(`Adding remote player: ${data.id} (Team: ${data.team})`);
        const player = new RemotePlayer(data);
        this.players.set(data.id, player);
        
        // Add to scene
        scene.add(player.group);
    }
    
    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            scene.remove(player.group);
            player.dispose();
            this.players.delete(id);
            console.log(`Removed remote player: ${id}`);
        }
    }
    
    updatePlayer(data) {
        const player = this.players.get(data.id);
        if (player) {
            player.update(data);
        }
    }
    
    changeWeapon(id, weapon) {
        const player = this.players.get(id);
        if (player) {
            player.changeWeapon(weapon);
        }
    }
    
    playShootEffect(data) {
        const player = this.players.get(data.id);
        if (player) {
            player.playShootEffect(data);
        }
    }
    
    getPlayers() {
        return Array.from(this.players.values());
    }
    
    getPlayer(id) {
        return this.players.get(id);
    }
    
    update(deltaTime) {
        this.players.forEach(player => {
            player.updateAnimation(deltaTime);
        });
    }
}
