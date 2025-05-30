// =========================
// 1. SPRITE CLASS DEFINITION
// =========================

class GameSprite {
    // --- Constructor: Initializes all properties ---
    constructor(imageSrc, x, y, frameWidth, frameHeight, totalFrames, framesPerRow, animationSpeed, scale = 1, lifeTime = -1) {
        // --- Sprite Image & Animation ---
        this.image = new Image();
        this.image.src = imageSrc;
        this.x = x;
        this.y = y;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;
        this.framesPerRow = framesPerRow;
        this.animationSpeed = animationSpeed;
        this.scale = scale;
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = false;

        // --- Movement & Lifetime ---
        this.vx = 0;
        this.vy = 0;
        this.lifeTime = lifeTime; // -1 for infinite, >0 for frames to live
        this.lifeRemaining = lifeTime;
        this.shouldRemove = false;

        // --- Rotation ---
        this.currentRotation = 0; // Current rotation angle in radians
        this.rotationSpeed = Math.PI / 20; // Max tilt angle
        this.rotationSmoothness = 0.15; // How smoothly the sprite rotates

        // --- Image Load Handlers ---
        this.image.onload = () => {
            this.isLoaded = true;
            console.log(`Sprite loaded: ${imageSrc}`);
        };
        this.image.onerror = () => {
            console.error(`Error loading sprite: ${imageSrc}`);
        };
    }

    // --- Updates animation, position, rotation, and lifetime ---
    update() {
        // Animation frame update
        this.frameCounter++;
        if (this.frameCounter >= this.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.frameCounter = 0;
        }

        // Position update
        const scaledWidth = this.frameWidth * this.scale;
        const scaledHeight = this.frameHeight * this.scale;
        this.x += this.vx;
        this.y += this.vy;

        // Canvas boundary checks
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + scaledWidth > canvas.width) {
            this.x = canvas.width - scaledWidth;
            this.vx = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        } else if (this.y + scaledHeight > canvas.height) {
            this.y = canvas.height - scaledHeight;
            this.vy = 0;
        }

        // Lifetime management
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true;
            }
        }

        // Rotation based on velocity
        let desiredRotation = 0;
        const tiltAngle = this.rotationSpeed;
        if (this.vx > 0) desiredRotation = tiltAngle;
        else if (this.vx < 0) desiredRotation = -tiltAngle;
        // (Optional: add vertical tilt here if desired)
        this.currentRotation = this.currentRotation * (1 - this.rotationSmoothness) + desiredRotation * this.rotationSmoothness;
    }

    // --- Draws the sprite with rotation ---
    draw(context) {
        if (!this.isLoaded) return;

        const sx = (this.currentFrame % this.framesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / this.framesPerRow) * this.frameHeight;
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;
        const centerX = this.x + drawWidth / 2;
        const centerY = this.y + drawHeight / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(this.currentRotation);
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
        );
        context.restore();
    }
}

// =========================
// 2. CANVAS & CONTEXT SETUP
// =========================

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// =========================
// 3. GLOBAL GAME CONSTANTS
// =========================

const BUTTERFLY_MOVE_SPEED = 0.5;
const TORNADO_PROJECTILE_SPEED = 2;
const TORNADO_LIFETIME_FRAMES = 120;
const TORNADO_COOLDOWN_DURATION = 120;

// =========================
// 4. SPRITE INSTANTIATION
// =========================

const allGameSprites = [];

const IdleButterfly = new GameSprite(
    'Bens Sprites/IdleButterfly.png',
    200, 100,
    8, 8,
    5,
    2,
    7,
    4.5
);
allGameSprites.push(IdleButterfly);

// Unused/Reference Sprites
const tornadoEffect = new GameSprite(
    'Bens Sprites/Tornado.png',
    200, 100,
    8, 8,
    7,
    3,
    5,
    4.5
);

const upHit = new GameSprite(
    'Bens Sprites/UpButterfly.png',
    200, 100,
    16, 16,
    7,
    3,
    5,
    4.5
);

// =========================
// 5. KEYBOARD STATE TRACKING
// =========================

const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// =========================
// 6. TORNADO COOLDOWN VARIABLE
// =========================

let tornadoCooldown = 0;

// =========================
// 7. EVENT LISTENERS
// =========================

// --- Movement keys ---
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault();
    }

    // --- Tornado launch with 'z' ---
    if (event.key === 'z') {
        if (event.repeat || tornadoCooldown > 0) return;

        // Remove all existing tornadoes
        for (let i = allGameSprites.length - 1; i >= 0; i--) {
            if (allGameSprites[i].image.src.includes('Tornado.png')) {
                allGameSprites.splice(i, 1);
            }
        }

        tornadoCooldown = TORNADO_COOLDOWN_DURATION;

        let launchVx = 0, launchVy = 0;
        if (IdleButterfly.vx !== 0 || IdleButterfly.vy !== 0) {
            const butterflyCurrentSpeed = Math.sqrt(IdleButterfly.vx * IdleButterfly.vx + IdleButterfly.vy * IdleButterfly.vy);
            if (butterflyCurrentSpeed > 0) {
                launchVx = (IdleButterfly.vx / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (IdleButterfly.vy / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            launchVx = TORNADO_PROJECTILE_SPEED;
        }

        const newTornado = new GameSprite(
            'Bens Sprites/Tornado.png',
            IdleButterfly.x + (IdleButterfly.frameWidth * IdleButterfly.scale) / 2 - (8 * IdleButterfly.scale) / 2,
            IdleButterfly.y + (IdleButterfly.frameHeight * IdleButterfly.scale) / 2 - (8 * IdleButterfly.scale) / 2,
            8, 8,
            7,
            3,
            5,
            IdleButterfly.scale,
            TORNADO_LIFETIME_FRAMES
        );
        newTornado.vx = launchVx;
        newTornado.vy = launchVy;
        allGameSprites.push(newTornado);

        console.log("Tornado launched!");
    }

    // --- Tornado launch with 'c' (duplicate logic, consider refactoring// filepath: c:\Users\Ben\Documents\GitHub\Fighting-Game-W-Aaron\Ben.js

     if (event.key === 'c') {
        if (event.repeat || tornadoCooldown > 0) return;

        for (let i = allGameSprites.length - 1; i >= 0; i--) {
            if (allGameSprites[i].image.src.includes('Tornado.png')) {
                allGameSprites.splice(i, 1);
            }
        }

        tornadoCooldown = TORNADO_COOLDOWN_DURATION;

        let launchVx = 0, launchVy = 0;
        if (IdleButterfly.vx !== 0 || IdleButterfly.vy !== 0) {
            const butterflyCurrentSpeed = Math.sqrt(IdleButterfly.vx ** 2 + IdleButterfly.vy ** 2);
            if (butterflyCurrentSpeed > 0) {
                launchVx = (IdleButterfly.vx / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (IdleButterfly.vy / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            launchVx = TORNADO_PROJECTILE_SPEED;
        }

        const newTornado = new GameSprite(
            'Bens Sprites/Tornado.png',
            IdleButterfly.x + (IdleButterfly.frameWidth * IdleButterfly.scale) / 2 - (8 * IdleButterfly.scale) / 2,
            IdleButterfly.y + (IdleButterfly.frameHeight * IdleButterfly.scale) / 2 - (8 * IdleButterfly.scale) / 2,
            8, 8, 7, 3, 5, IdleButterfly.scale, TORNADO_LIFETIME_FRAMES
        );
        newTornado.vx = launchVx;
        newTornado.vy = launchVy;
        allGameSprites.push(newTornado);

        console.log("Tornado launched!");
    }
});

// --- Keyup for Movement ---
document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});

// =====================
// 7. Game Loop
// =====================
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (tornadoCooldown > 0) tornadoCooldown--;

    // Update butterfly velocity
    IdleButterfly.vx = 0;
    IdleButterfly.vy = 0;
    if (keysPressed.ArrowLeft) IdleButterfly.vx = -BUTTERFLY_MOVE_SPEED;
    else if (keysPressed.ArrowRight) IdleButterfly.vx = BUTTERFLY_MOVE_SPEED;
    if (keysPressed.ArrowUp) IdleButterfly.vy = -BUTTERFLY_MOVE_SPEED;
    else if (keysPressed.ArrowDown) IdleButterfly.vy = BUTTERFLY_MOVE_SPEED;

    // Update and draw all sprites
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update();
        sprite.draw(context);
    }

    // Remove sprites marked for removal
    for (let i = allGameSprites.length - 1; i >= 0; i--) {
        if (allGameSprites[i].shouldRemove) {
            allGameSprites.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// =====================
// 8. Sprite Loading Check
// =====================
function checkAllSpritesLoaded() {
    let allLoaded = true;
    for (let i = 0; i < allGameSprites.length; i++) {
        if (!allGameSprites[i].isLoaded) {
            allLoaded = false;
            break;
        }
    }
    if (allLoaded) {
        console.log("All sprites loaded! Starting game loop.");
        gameLoop();
    } else {
        setTimeout(checkAllSpritesLoaded, 100);
    }
}
checkAllSpritesLoaded();