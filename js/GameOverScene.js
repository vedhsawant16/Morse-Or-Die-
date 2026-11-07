/**
 * GameOverScene: Termination Incident Report & Re-play options
 */

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.roundReached = data.round || 1;
        this.difficulty = data.difficulty || 'novice';
        this.reason = data.reason || 'FAILED CODE TRANSMISSION';
    }

    create() {
        const { width, height } = this.scale;

        // Check & Update High Score
        const oldHighScore = parseInt(localStorage.getItem('morse_high_score') || '0');
        this.isNewRecord = this.finalScore > oldHighScore;
        if (this.isNewRecord) {
            localStorage.setItem('morse_high_score', this.finalScore.toString());
        }

        // Clearance Rank
        const rankInfo = window.morseUtils.getClearanceRank(this.finalScore);

        // Dark background with red strobe tint
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0303, 1);
        bg.fillRect(0, 0, width, height);

        // Red emergency alert line border
        const alertBorder = this.add.graphics();
        alertBorder.lineStyle(6, 0xff0000, 0.9);
        alertBorder.strokeRect(10, 10, width - 20, height - 20);

        // Scanlines
        this.createScanlines(width, height);

        // Report Terminal Panel
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0202, 0.92);
        panel.fillRoundedRect(width / 2 - 360, height / 2 - 270, 720, 540, 12);
        panel.lineStyle(3, 0xff3333, 0.9);
        panel.strokeRoundedRect(width / 2 - 360, height / 2 - 270, 720, 540, 12);

        // Top Header
        this.add.text(width / 2, height / 2 - 230, '🚨 INCIDENT REPORT: EMPLOYEE TERMINATION 🚨', {
            fontFamily: 'Courier, monospace',
            fontSize: '22px',
            color: '#ff3333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Execution Details
        const detailsText = [
            `CAUSE OF DEATH : EXECUTED VIA SHOTGUN BY FACILITY MANAGER`,
            `FAILURE REASON : ${this.reason}`,
            `SECURITY LEVEL : ${rankInfo.security}`,
            `RANK ASSIGNED  : ${rankInfo.title}`,
            `FINAL SCORE    : ${this.finalScore} PTS`,
            `ROUNDS SURVIVED: ${this.roundReached - 1}`
        ].join('\n');

        this.add.text(width / 2 - 310, height / 2 - 160, detailsText, {
            fontFamily: 'Courier, monospace',
            fontSize: '14px',
            color: '#ff8888',
            lineSpacing: 10
        });

        // New High Score Banner
        if (this.isNewRecord) {
            const recordText = this.add.text(width / 2, height / 2 + 50, '★ NEW FACILITY HIGH SCORE RECORD! ★', {
                fontFamily: 'Courier, monospace',
                fontSize: '18px',
                color: '#ffff00',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: recordText,
                alpha: 0.3,
                yoyo: true,
                repeat: -1,
                duration: 400
            });
        }

        // Action Buttons
        // Re-assign / Try again
        const retryBtn = this.add.container(width / 2 - 140, height / 2 + 180);
        const retBg = this.add.image(0, 0, 'button_red').setDisplaySize(240, 48);
        const retText = this.add.text(0, 0, '🔄 RE-ASSIGN (RETRY)', {
            fontFamily: 'Courier, monospace',
            fontSize: '15px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        retryBtn.add([retBg, retText]);
        retryBtn.setInteractive(new Phaser.Geom.Rectangle(-120, -24, 240, 48), Phaser.Geom.Rectangle.Contains);
        retryBtn.on('pointerdown', () => {
            window.soundEngine.init();
            window.soundEngine.playKeyClick();
            this.scene.start('GameScene', { difficulty: this.difficulty });
        });

        // Menu button
        const menuBtn = this.add.container(width / 2 + 140, height / 2 + 180);
        const menuBg = this.add.image(0, 0, 'button_green').setDisplaySize(240, 48);
        const menuText = this.add.text(0, 0, '🏠 MAIN TERMINAL', {
            fontFamily: 'Courier, monospace',
            fontSize: '15px',
            color: '#00ff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        menuBtn.add([menuBg, menuText]);
        menuBtn.setInteractive(new Phaser.Geom.Rectangle(-120, -24, 240, 48), Phaser.Geom.Rectangle.Contains);
        menuBtn.on('pointerdown', () => {
            window.soundEngine.init();
            window.soundEngine.playKeyClick();
            this.scene.start('MenuScene');
        });
    }

    createScanlines(width, height) {
        const scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.2);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
    }
}

window.GameOverScene = GameOverScene;
