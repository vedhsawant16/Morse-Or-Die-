/**
 * BootScene: Loads assets and generates procedural textures
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load background and boss assets
        this.load.image('bunker', 'assets/bunker.jpg');
        this.load.image('boss', 'assets/boss.jpg');
    }

    create() {
        // Generate procedural textures for UI elements
        this.createProceduralTextures();

        // Transition to Menu Scene
        this.scene.start('MenuScene');
    }

    createProceduralTextures() {
        // 1. Signal Light Texture (Off & On)
        const lightOff = this.add.graphics();
        lightOff.fillStyle(0x333311, 1);
        lightOff.fillCircle(16, 16, 14);
        lightOff.lineStyle(2, 0x666633, 1);
        lightOff.strokeCircle(16, 16, 14);
        lightOff.generateTexture('light_off', 32, 32);
        lightOff.destroy();

        const lightOn = this.add.graphics();
        lightOn.fillStyle(0xffff33, 1);
        lightOn.fillCircle(16, 16, 14);
        lightOn.lineStyle(2, 0xffffff, 1);
        lightOn.strokeCircle(16, 16, 14);
        lightOn.generateTexture('light_on', 32, 32);
        lightOn.destroy();

        // 2. Green CRT Button Frame
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x052B14, 0.9);
        btnBg.fillRoundedRect(0, 0, 160, 44, 8);
        btnBg.lineStyle(2, 0x00FF66, 0.8);
        btnBg.strokeRoundedRect(0, 0, 160, 44, 8);
        btnBg.generateTexture('button_green', 160, 44);
        btnBg.destroy();

        const btnHover = this.add.graphics();
        btnHover.fillStyle(0x0A5C2B, 0.95);
        btnHover.fillRoundedRect(0, 0, 160, 44, 8);
        btnHover.lineStyle(2, 0x66FF99, 1);
        btnHover.strokeRoundedRect(0, 0, 160, 44, 8);
        btnHover.generateTexture('button_green_hover', 160, 44);
        btnHover.destroy();

        // 3. Red CRT Button Frame
        const btnRedBg = this.add.graphics();
        btnRedBg.fillStyle(0x3B0505, 0.9);
        btnRedBg.fillRoundedRect(0, 0, 160, 44, 8);
        btnRedBg.lineStyle(2, 0xFF3333, 0.8);
        btnRedBg.strokeRoundedRect(0, 0, 160, 44, 8);
        btnRedBg.generateTexture('button_red', 160, 44);
        btnRedBg.destroy();

        // 4. Muzzle Flash Particle Texture
        const flashGfx = this.add.graphics();
        flashGfx.fillStyle(0xffaa00, 1);
        flashGfx.fillCircle(16, 16, 16);
        flashGfx.fillStyle(0xffffff, 1);
        flashGfx.fillCircle(16, 16, 8);
        flashGfx.generateTexture('muzzle_flash', 32, 32);
        flashGfx.destroy();

        // 5. Blood Splatter / Red Flash Overlay
        const bloodGfx = this.add.graphics();
        bloodGfx.fillStyle(0xaa0000, 0.7);
        bloodGfx.fillRect(0, 0, 1280, 720);
        bloodGfx.generateTexture('red_overlay', 1280, 720);
        bloodGfx.destroy();
    }
}

window.BootScene = BootScene;
