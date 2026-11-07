/**
 * GameScene: Main Morse Code Facility Gameplay Loop
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.difficulty = data.difficulty || 'novice';
        this.score = 0;
        this.streak = 1;
        this.roundNum = 1;

        // Difficulty properties
        if (this.difficulty === 'novice') {
            this.wpm = 12;
            this.roundTimeMax = 25;
            this.showCheatSheetByDefault = true;
        } else if (this.difficulty === 'agent') {
            this.wpm = 18;
            this.roundTimeMax = 18;
            this.showCheatSheetByDefault = false;
        } else { // master
            this.wpm = 24;
            this.roundTimeMax = 12;
            this.showCheatSheetByDefault = false;
        }

        this.playerInput = "";
        this.isGameOver = false;
        this.isPlayingSignal = false;
        this.isCheatSheetOpen = this.showCheatSheetByDefault;
        this.timerEvent = null;
        this.timeRemaining = this.roundTimeMax;
    }

    create() {
        const { width, height } = this.scale;

        // 1. Background Bunker Image
        const bg = this.add.image(width / 2, height / 2, 'bunker');
        bg.setDisplaySize(width, height);
        bg.setTint(0x338855);

        // 2. Boss Shadow / Character in background window
        this.bossSprite = this.add.image(width - 200, height / 2 - 50, 'boss');
        this.bossSprite.setDisplaySize(320, 320);
        this.bossSprite.setAlpha(0.6);
        this.bossSprite.setTint(0x556655);

        // Scanline overlay
        this.createScanlines(width, height);

        // 3. Main CRT Console Screen Frame
        const crtWidth = 680;
        const crtHeight = 440;
        const crtX = width / 2 - 120;
        const crtY = height / 2 - 20;

        const crtBg = this.add.graphics();
        crtBg.fillStyle(0x02140A, 0.95);
        crtBg.fillRoundedRect(crtX - crtWidth / 2, crtY - crtHeight / 2, crtWidth, crtHeight, 16);
        crtBg.lineStyle(4, 0x00FF66, 0.9);
        crtBg.strokeRoundedRect(crtX - crtWidth / 2, crtY - crtHeight / 2, crtWidth, crtHeight, 16);

        // Header Terminal Bar
        this.add.text(crtX, crtY - crtHeight / 2 + 30, 'CLASSIFIED DECODER TERMINAL // SECTOR 7G', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#00FF66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Signal Light Indicator
        this.signalLight = this.add.image(crtX - crtWidth / 2 + 40, crtY - crtHeight / 2 + 30, 'light_off');

        // Oscilloscope Visualizer Box
        this.oscGfx = this.add.graphics();
        this.crtX = crtX;
        this.crtY = crtY;
        this.crtWidth = crtWidth;
        this.crtHeight = crtHeight;

        // Transmission info text
        this.transText = this.add.text(crtX, crtY - 100, 'STATUS: WAITING FOR AUDIO TRANSMISSION...', {
            fontFamily: 'Courier, monospace',
            fontSize: '15px',
            color: '#ffff66',
            align: 'center'
        }).setOrigin(0.5);

        // Input Label & Typed Text Box
        this.add.text(crtX, crtY - 30, 'ENTER DECODED TEXT:', {
            fontFamily: 'Courier, monospace',
            fontSize: '14px',
            color: '#88ffaa'
        }).setOrigin(0.5);

        // Box for typed text
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x042E16, 0.9);
        inputBg.fillRoundedRect(crtX - 250, crtY - 10, 500, 60, 8);
        inputBg.lineStyle(2, 0x00FF66, 1);
        inputBg.strokeRoundedRect(crtX - 250, crtY - 10, 500, 60, 8);

        this.inputText = this.add.text(crtX, crtY + 20, '_', {
            fontFamily: 'Courier, monospace',
            fontSize: '28px',
            color: '#00FF66',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Timer Bar
        this.timerBar = this.add.graphics();
        this.updateTimerBarUI(1.0);

        // Top HUD (Score, Streak, Round)
        this.hudScore = this.add.text(40, 25, 'SCORE: 0', {
            fontFamily: 'Courier, monospace',
            fontSize: '20px',
            color: '#00FF66',
            fontStyle: 'bold'
        });

        this.hudStreak = this.add.text(260, 25, 'STREAK: 1x', {
            fontFamily: 'Courier, monospace',
            fontSize: '20px',
            color: '#ffff66',
            fontStyle: 'bold'
        });

        this.hudRound = this.add.text(480, 25, `ROUND: ${this.roundNum}`, {
            fontFamily: 'Courier, monospace',
            fontSize: '20px',
            color: '#66ffff',
            fontStyle: 'bold'
        });

        // 4. Desk Buttons
        this.createDeskButtons(crtX, crtY, crtHeight);

        // 5. Interactive Cheat Sheet Sidebar Card
        this.createCheatSheetUI(width, height);

        // 6. Keyboard Listeners
        this.input.keyboard.on('keydown', this.handleKeyDown, this);

        // Start background ambient bunker radio sound
        window.soundEngine.startBunkerAmbience();

        // Start First Transmission Round
        this.startNextRound();
    }

    createDeskButtons(crtX, crtY, crtHeight) {
        // Repeat Button
        const repeatBtn = this.add.container(crtX - 160, crtY + crtHeight / 2 - 50);
        const repBg = this.add.image(0, 0, 'button_green').setDisplaySize(220, 44);
        const repText = this.add.text(0, 0, '🔊 REPEAT (SPACE)', {
            fontFamily: 'Courier, monospace',
            fontSize: '14px',
            color: '#00FF66',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        repeatBtn.add([repBg, repText]);
        repeatBtn.setInteractive(new Phaser.Geom.Rectangle(-110, -22, 220, 44), Phaser.Geom.Rectangle.Contains);
        repeatBtn.on('pointerdown', () => {
            window.soundEngine.playKeyClick();
            this.replaySignal();
        });

        // Transmit (Submit) Button
        const submitBtn = this.add.container(crtX + 160, crtY + crtHeight / 2 - 50);
        const subBg = this.add.image(0, 0, 'button_green').setDisplaySize(220, 44);
        const subText = this.add.text(0, 0, '⚡ TRANSMIT (ENTER)', {
            fontFamily: 'Courier, monospace',
            fontSize: '14px',
            color: '#66FF99',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        submitBtn.add([subBg, subText]);
        submitBtn.setInteractive(new Phaser.Geom.Rectangle(-110, -22, 220, 44), Phaser.Geom.Rectangle.Contains);
        submitBtn.on('pointerdown', () => {
            window.soundEngine.playKeyClick();
            this.submitAnswer();
        });

        // Toggle Cheat Sheet Button
        const cheatBtn = this.add.container(100, this.scale.height - 40);
        const cheatBg = this.add.image(0, 0, 'button_green').setDisplaySize(160, 36);
        const cheatText = this.add.text(0, 0, '📋 MORSE CHART', {
            fontFamily: 'Courier, monospace',
            fontSize: '12px',
            color: '#ffff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        cheatBtn.add([cheatBg, cheatText]);
        cheatBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -18, 160, 36), Phaser.Geom.Rectangle.Contains);
        cheatBtn.on('pointerdown', () => {
            window.soundEngine.playKeyClick();
            this.toggleCheatSheet();
        });
    }

    createCheatSheetUI(width, height) {
        this.cheatSheetContainer = this.add.container(width - 230, 100);

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0f1c13, 0.95);
        cardBg.fillRoundedRect(0, 0, 210, 520, 10);
        cardBg.lineStyle(2, 0x00FF66, 0.8);
        cardBg.strokeRoundedRect(0, 0, 210, 520, 10);
        this.cheatSheetContainer.add(cardBg);
        

        const title = this.add.text(105, 20, 'MORSE CODE CHART', {
            fontFamily: 'Courier, monospace',
            fontSize: '14px',
            color: '#ffff66',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.cheatSheetContainer.add(title);

        // Build 2 column Morse code list
        const entries = Object.entries(window.morseUtils.MORSE_CODE_MAP);
        // cheat sheet text position.
        let yPos = 40;
        let col = 0;

        entries.forEach(([letter, code], i) => {
            const xPos = col === 0 ? 20 : 115;
            const itemText = this.add.text(xPos, yPos, `${letter}: ${code}`, {
                fontFamily: 'Courier, monospace',
                fontSize: '11px',
                color: '#66ffaa'
            });
            this.cheatSheetContainer.add(itemText);

            if (col === 1) {
                yPos += 20;
                col = 0;
            } else {
                col = 1;
            }
        });

        this.cheatSheetContainer.setVisible(this.isCheatSheetOpen);
    }

    toggleCheatSheet() {
        this.isCheatSheetOpen = !this.isCheatSheetOpen;
        this.cheatSheetContainer.setVisible(this.isCheatSheetOpen);
    }

    startNextRound() {
        if (this.isGameOver) return;

        this.playerInput = "";
        this.updateInputDisplay();

        // Select transmission text based on difficulty
        const db = window.morseUtils.TRANSMISSION_DATABASE[this.difficulty];
        this.targetText = db[Math.floor(Math.random() * db.length)];
        this.targetMorse = window.morseUtils.textToMorse(this.targetText);

        this.transText.setText(`ROUND ${this.roundNum}: RECEIVING MORSE SIGNAL...`);
        this.transText.setColor('#ffff66');

        // Reset and start countdown timer
        this.timeRemaining = this.roundTimeMax;
        this.startRoundTimer();

        // Play Morse Audio Signal
        this.replaySignal();
    }

    replaySignal() {
        if (this.isGameOver || this.isPlayingSignal) return;

        this.isPlayingSignal = true;
        this.signalLight.setTexture('light_on');

        window.soundEngine.playMorseSequence(
            this.targetMorse,
            this.wpm,
            (symbol) => {
                this.signalLight.setTexture('light_on');
                this.drawOscilloscope(true);
            },
            () => {
                this.signalLight.setTexture('light_off');
                this.drawOscilloscope(false);
            },
            () => {
                this.isPlayingSignal = false;
                this.signalLight.setTexture('light_off');
                this.drawOscilloscope(false);
                this.transText.setText(`DECODE THE TRANSMISSION ABOVE!`);
                this.transText.setColor('#00ff66');
            }
        );
    }

    drawOscilloscope(isActive) {
        this.oscGfx.clear();
        const startX = this.crtX - 250;
        const endX = this.crtX + 250;
        const yCenter = this.crtY - 140;

        this.oscGfx.lineStyle(2, isActive ? 0x00FF66 : 0x004411, 0.8);
        this.oscGfx.beginPath();

        for (let x = startX; x <= endX; x += 5) {
            const waveY = isActive
                ? yCenter + Math.sin((x + this.time.now * 0.05) * 0.1) * 15
                : yCenter + (Math.random() * 2 - 1);
            if (x === startX) this.oscGfx.moveTo(x, waveY);
            else this.oscGfx.lineTo(x, waveY);
        }
        this.oscGfx.strokePath();
    }

    startRoundTimer() {
        if (this.timerEvent) this.timerEvent.remove();

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isGameOver) return;
                this.timeRemaining--;
                const fraction = Math.max(0, this.timeRemaining / this.roundTimeMax);
                this.updateTimerBarUI(fraction);

                if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
                    window.soundEngine.playBeep(80, 1200); // Stress ticking sound
                }

                if (this.timeRemaining <= 0) {
                    this.handleWrongAnswer("TIME EXPIRED - TRANSMISSION TIMEOUT!");
                }
            },
            repeat: this.roundTimeMax - 1
        });
    }

    updateTimerBarUI(fraction) {
        this.timerBar.clear();
        const barWidth = 500;
        const x = this.crtX - barWidth / 2;
        const y = this.crtY - 60;

        let color = 0x00FF66;
        if (fraction < 0.5) color = 0xFFFF00;
        if (fraction < 0.25) color = 0xFF3333;

        this.timerBar.fillStyle(0x002200, 0.8);
        this.timerBar.fillRect(x, y, barWidth, 10);
        this.timerBar.fillStyle(color, 1);
        this.timerBar.fillRect(x, y, barWidth * fraction, 10);
    }

    handleKeyDown(event) {
        if (this.isGameOver) return;

        if (event.key === 'Backspace') {
            this.playerInput = this.playerInput.slice(0, -1);
            window.soundEngine.playKeyClick();
            this.updateInputDisplay();
        } else if (event.key === 'Enter') {
            window.soundEngine.playKeyClick();
            this.submitAnswer();
        } else if (event.key === ' ') {
            if (this.playerInput.length > 0 && !this.playerInput.endsWith(' ')) {
                this.playerInput += ' ';
                window.soundEngine.playKeyClick();
                this.updateInputDisplay();
            } else {
                // Replay signal shortcut on space
                this.replaySignal();
            }
        } else if (/^[a-zA-Z0-9]$/.test(event.key)) {
            if (this.playerInput.length < 25) {
                this.playerInput += event.key.toUpperCase();
                window.soundEngine.playKeyClick();
                this.updateInputDisplay();
            }
        }
    }

    updateInputDisplay() {
        this.inputText.setText(this.playerInput + '_');
    }

    submitAnswer() {
        if (this.isGameOver) return;

        const cleanUser = this.playerInput.trim().toUpperCase();
        const cleanTarget = this.targetText.trim().toUpperCase();

        if (cleanUser === cleanTarget) {
            this.handleRightAnswer();
        } else {
            this.handleWrongAnswer(`INCORRECT CODE: EXPECTED "${cleanTarget}", GOT "${cleanUser}"`);
        }
    }

    handleRightAnswer() {
        window.soundEngine.stopMorse();
        if (this.timerEvent) this.timerEvent.remove();

        window.soundEngine.playSuccessSound();

        // Calculate score bonus based on speed & streak
        const speedBonus = this.timeRemaining * 15;
        const points = Math.round((100 + speedBonus) * this.streak);
        this.score += points;
        this.streak = Math.min(5, this.streak + 1);
        this.roundNum++;

        // Update HUD
        this.hudScore.setText(`SCORE: ${this.score}`);
        this.hudStreak.setText(`STREAK: ${this.streak}x`);
        this.hudRound.setText(`ROUND: ${this.roundNum}`);

        // Floating score popup text
        const popup = this.add.text(this.crtX, this.crtY, `+${points} PTS!`, {
            fontFamily: 'Courier, monospace',
            fontSize: '32px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: popup,
            y: this.crtY - 80,
            alpha: 0,
            duration: 900,
            onComplete: () => popup.destroy()
        });

        // Flash CRT Green
        this.cameras.main.flash(300, 0, 255, 100);

        // Next round after brief delay
        this.time.delayedCall(1000, () => {
            this.startNextRound();
        });
    }

    // THE SHOTGUN TERMINATION EVENT!
    handleWrongAnswer(reason) {
        this.isGameOver = true;
        window.soundEngine.stopMorse();
        if (this.timerEvent) this.timerEvent.remove();

        this.transText.setText('🚨 SECURITY VIOLATION! DISCIPLINARY EXECUTION IMMINENT! 🚨');
        this.transText.setColor('#ff3333');

        // Step 1: Boss steps out into the room with shotgun!
        this.tweens.add({
            targets: this.bossSprite,
            x: this.scale.width / 2,
            y: this.scale.height / 2,
            scaleX: 1.6,
            scaleY: 1.6,
            alpha: 1,
            tint: 0xffffff,
            duration: 600,
            ease: 'Power2'
        });

        // Sound: Cock shotgun sound!
        window.soundEngine.playShotgunCock();

        // Step 2: Sudden shotgun blast sound + visual screen destruction!
        this.time.delayedCall(650, () => {
            // LOUD SHOTGUN BLAST AUDIO
            window.soundEngine.playShotgunBlast();

            // Muzzle flash visual
            const flash = this.add.image(this.scale.width / 2 + 50, this.scale.height / 2 + 30, 'muzzle_flash');
            flash.setScale(4);

            // Intense screenshake
            this.cameras.main.shake(600, 0.06);

            // Red blood overlay flash
            const blood = this.add.image(this.scale.width / 2, this.scale.height / 2, 'red_overlay');
            blood.setDepth(100);

            // Fade to black and launch GameOverScene
            this.time.delayedCall(1200, () => {
                window.soundEngine.stopBunkerAmbience();
                this.scene.start('GameOverScene', {
                    score: this.score,
                    round: this.roundNum,
                    difficulty: this.difficulty,
                    reason: reason
                });
            });
        });
    }

    createScanlines(width, height) {
        const scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.12);
        for (let y = 0; y < height; y += 4) {
            scanlines.fillRect(0, y, width, 2);
        }
    }
}

window.GameScene = GameScene;
