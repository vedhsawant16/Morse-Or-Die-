/**
 * MenuScene: Title screen and difficulty selection
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedDifficulty = 'novice';
    }

    create() {
        const { width, height } = this.scale;

        // Background image with dark green tint
        const bg = this.add.image(width / 2, height / 2, 'bunker');
        bg.setDisplaySize(width, height);
        bg.setTint(0x44aa66);
        bg.setAlpha(0.4);

        // Dark overlay panel
        const overlay = this.add.graphics();
        overlay.fillStyle(0x020f08, 0.85);
        overlay.fillRoundedRect(width / 2 - 380, height / 2 - 280, 760, 560, 16);
        overlay.lineStyle(3, 0x00ff66, 0.9);
        overlay.strokeRoundedRect(width / 2 - 380, height / 2 - 280, 760, 560, 16);

        // Scanlines graphic overlay
        this.createScanlines(width, height);

        // Top Banner Text
        this.add.text(width / 2, height / 2 - 240, 'TOP SECRET // DEPT OF DEFENSE', {
            fontFamily: 'Courier, monospace',
            fontSize: '18px',
            color: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Main Title
        const titleText = this.add.text(width / 2, height / 2 - 180, 'FACILITY 404: MORSE OR DIE', {
            fontFamily: 'Courier, monospace',
            fontSize: '36px',
            color: '#66ff99',
            fontStyle: 'bold',
            shadow: { color: '#00ff66', blur: 12, fill: true }
        }).setOrigin(0.5);

        // Subtitle warning
        this.add.text(width / 2, height / 2 - 130, 'DECODE AUDIO TRANSMISSIONS ACCURATELY.\nINCORRECT DECRYPTION RESULTS IN IMMEDIATE EXECUTIONS BY SHOTGUN.', {
            fontFamily: 'Courier, monospace',
            fontSize: '13px',
            color: '#ff6666',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Difficulty Selection Title
        this.add.text(width / 2, height / 2 - 60, 'SELECT CLEARANCE LEVEL (DIFFICULTY):', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Difficulty Buttons
        this.diffButtons = {};
        const difficulties = [
            { key: 'novice', label: 'NOVICE\n(12 WPM, Cheat Sheet)', x: width / 2 - 220 },
            { key: 'agent', label: 'AGENT\n(18 WPM, Standard)', x: width / 2 },
            { key: 'master', label: 'MASTER\n(24 WPM, Phrases)', x: width / 2 + 220 }
        ];

        difficulties.forEach(diff => {
            const btnContainer = this.add.container(diff.x, height / 2 + 20);

            const btnBg = this.add.graphics();
            btnContainer.add(btnBg);

            const btnText = this.add.text(0, 0, diff.label, {
                fontFamily: 'Courier, monospace',
                fontSize: '13px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            btnContainer.add(btnText);

            btnContainer.setSize(180, 60);
            btnContainer.setInteractive({ useHandCursor: true });

            btnContainer.on('pointerdown', () => {
                window.soundEngine.init();
                window.soundEngine.playKeyClick();
                this.selectDifficulty(diff.key);
            });

            this.diffButtons[diff.key] = { container: btnContainer, bg: btnBg, text: btnText };
        });

        this.updateDiffButtonsUI();

        // High Score Display
        const highScore = localStorage.getItem('morse_high_score') || 0;
        this.add.text(width / 2, height / 2 + 100, `FACILITY RECORD SCORE: ${highScore} PTS`, {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#ffff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Sound Check Button
        const testAudioBtn = this.add.container(width / 2, height / 2 + 150);
        const testBg = this.add.image(0, 0, 'button_green').setDisplaySize(200, 36);
        const testText = this.add.text(0, 0, '🔊 TEST AUDIO SIGNAL', {
            fontFamily: 'Courier, monospace',
            fontSize: '13px',
            color: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        testAudioBtn.add([testBg, testText]);
        testAudioBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -18, 200, 36), Phaser.Geom.Rectangle.Contains);
        testAudioBtn.on('pointerdown', () => {
            window.soundEngine.init();
            window.soundEngine.playMorseSequence('... --- ...', 18);
        });

        // Start Mission Button
        const startBtn = this.add.container(width / 2, height / 2 + 220);
        const startBg = this.add.image(0, 0, 'button_green').setDisplaySize(260, 50);
        const startText = this.add.text(0, 0, '▶ START SHIFT', {
            fontFamily: 'Courier, monospace',
            fontSize: '20px',
            color: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startBtn.add([startBg, startText]);
        startBtn.setInteractive(new Phaser.Geom.Rectangle(-130, -25, 260, 50), Phaser.Geom.Rectangle.Contains);

        startBtn.on('pointerover', () => {
            startBg.setTexture('button_green_hover');
            startText.setColor('#ffffff');
        });

        startBtn.on('pointerout', () => {
            startBg.setTexture('button_green');
            startText.setColor('#00ff66');
        });

        startBtn.on('pointerdown', () => {
            window.soundEngine.init();
            window.soundEngine.playKeyClick();
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
        });
    }

    selectDifficulty(diffKey) {
        this.selectedDifficulty = diffKey;
        this.updateDiffButtonsUI();
    }

    updateDiffButtonsUI() {
        Object.keys(this.diffButtons).forEach(key => {
            const btn = this.diffButtons[key];
            btn.bg.clear();
            if (key === this.selectedDifficulty) {
                btn.bg.fillStyle(0x00ff66, 0.3);
                btn.bg.fillRoundedRect(-90, -30, 180, 60, 8);
                btn.bg.lineStyle(3, 0x00ff66, 1);
                btn.bg.strokeRoundedRect(-90, -30, 180, 60, 8);
                btn.text.setColor('#ffffff');
            } else {
                btn.bg.fillStyle(0x052b14, 0.7);
                btn.bg.fillRoundedRect(-90, -30, 180, 60, 8);
                btn.bg.lineStyle(1, 0x006633, 0.8);
                btn.bg.strokeRoundedRect(-90, -30, 180, 60, 8);
                btn.text.setColor('#888888');
            }
        });
    }

    createScanlines(width, height) {
        const scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.15);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
    }
}

window.MenuScene = MenuScene;
