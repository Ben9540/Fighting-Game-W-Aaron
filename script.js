// ===============================
// 1. GLOBAL CONSTANTS & VARIABLES
// ===============================
export const BUTTERFLY_MOVE_SPEED = 1;
export const TORNADO_PROJECTILE_SPEED = 3;
export const TORNADO_LIFETIME_FRAMES = 150; 
export const TORNADO_COOLDOWN_DURATION = 150;
export const HIT_COOLDOWN_DURATION = 60; // Cooldown for hit animation (e.g., 1 second)
let tornadoCooldown = 0;
let hitCooldown = 0; // Cooldown variable for hit animation
export const TOASTER_MOVE_SPEED = 2;

// ===============================
// 2. CANVAS SETUP
// ===============================
export const canvas = document.getElementById('gameCanvas'); // Make sure your HTML has <canvas id="gameCanvas">
export const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// ===============================
// 3. SPRITE MANAGEMENT
// ===============================
// Array to hold all your active sprites (ONLY ONE OF THESE)
export const allGameSprites = [];
export function addSprite(sprite) {
    allGameSprites.push(sprite);
}

// ===============================
// 4. KEYBOARD STATE TRACKING
// ===============================
export const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false, // For tornado input
    c: false, // For hit input
    w: false, // For Toaster movement
    a: false, // For Toaster movement
    s: false, // For Toaster movement
    d: false,  // For Toaster movement
    i: false,
    o: false,
    p: false
};

// ===============================
// 5. IMAGE ASSET LOADING
// ===============================
export const imageAssets = {};
const IMAGE_PATHS = {
    Butterfly: 'Bens Sprites/Butterfly.png', // New combined 16x16 sheet
    tornado: 'Bens Sprites/Tornado.png',
    IdleToaster: 'Aarons Sprites/Toaster.png'
};

// Loads all images and calls callback when done
function loadAllImages(callback) {
    let loadedCount = 0;
    const totalImages = Object.keys(IMAGE_PATHS).length;
    console.log(`Starting to load ${totalImages} images...`);

    if (totalImages === 0) {
        console.log("No images to load. Proceeding with callback.");
        callback();
        return;
    }

    for (const key in IMAGE_PATHS) {
        const img = new Image();
        img.src = IMAGE_PATHS[key];
        img.onload = () => {
            imageAssets[key] = img;
            loadedCount++;
            console.log(`Loaded ${key}: ${img.src}`);
            if (loadedCount === totalImages) {
                console.log("All images loaded.");
                callback();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${IMAGE_PATHS[key]}`);
            loadedCount++;
            if (loadedCount === totalImages) {
                console.warn("Image loading finished with errors. Proceeding anyway.");
                callback();
            }
        };
    }
}
// Call loadAllImages in your startup sequence (e.g., when start button is clicked)

// ===============================
// 6. SPRITE CLASS DEFINITION
// ===============================
export class GameSprite {
    constructor(image, x, y, frameWidth, frameHeight, collisionWidth, collisionHeight, animationSpeed, scale = 1, lifeTime = -1) {
        // Sprite image and position
        this.image = image;
        this.x = x;
        this.y = y;

        // Drawing and collision dimensions
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;

        this.defaultAnimationSpeed = animationSpeed;
        this.scale = scale;

        // Animation state
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = true;

        // Movement and rotation
        this.vx = 0; this.vy = 0;
        this.currentRotation = 0;
        this.rotationSpeed = Math.PI / 20;
        this.rotationSmoothness = 0.15;

        // Lifetime and removal
        this.lifeTime = lifeTime;
        this.lifeRemaining = lifeTime;
        this.shouldRemove = false;
        this.visible = true;

        // Animation config
        this.animations = {};
        this.currentAnimationState = '';
        this.currentAnimationConfig = null;

        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
    }

      // --- NEW: Method to set hitbox offset ---
    setHitboxOffset(offsetX, offsetY) {
        this.hitboxOffsetX = offsetX;
        this.hitboxOffsetY = offsetY;
    }

    // --- NEW: Method to reset hitbox offset ---
    resetHitboxOffset() {
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
    }

    // Set the current animation state
    setAnimation(state) {
        const config = this.animations[state];
        if (!config) {
            console.warn(`Animation state '${state}' not found for sprite. Available: ${Object.keys(this.animations).join(', ')}`);
            return;
        }
        if (this.currentAnimationState === state && !config.loop) {
            return;
        }
        this.currentAnimationState = state;
        this.currentAnimationConfig = config;
        this.currentFrame = config.start;
        this.frameCounter = 0;
        this.framesPerRow = config.framesPerRow;
    }

    // Update animation, position, lifetime, and rotation
    update() {
        // --- Animation update ---
        if (this.currentAnimationConfig) {
            this.frameCounter++;
            if (this.frameCounter >= this.currentAnimationConfig.speed) {
                this.frameCounter = 0;
                this.currentFrame++;
                if (this.currentFrame > this.currentAnimationConfig.end) {
                    if (this.currentAnimationConfig.loop) {
                        this.currentFrame = this.currentAnimationConfig.start;
                    } else {
                        this.currentFrame = this.currentAnimationConfig.end;
                    }
                }
            }
        } else {
            this.frameCounter++;
            if (this.frameCounter >= this.defaultAnimationSpeed) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.frameCounter = 0;
            }
        }

        // --- Position update ---
        this.x += this.vx;
        this.y += this.vy;

        const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;

        // --- Boundary checks (top/left/right/bottom) ---
        if (this.x < 0) {
            this.x = 0; this.vx = 0;
        } else if (this.x + scaledCollisionWidth > canvas.width) {
            this.x = canvas.width - scaledCollisionWidth; this.vx = 0;
        }
        if (this.y < 0) {
            this.y = 0; this.vy = 0;
        } else if (this.y + scaledCollisionHeight > canvas.height) {
            this.y = canvas.height - scaledCollisionHeight; this.vy = 0;
        }

        // --- Lifetime management ---
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true;
            }
        }

        // --- Rotation update (for Butterfly) ---
        if (this === Butterfly) {
            let desiredRotation = 0;
            const tiltAngle = this.rotationSpeed;
            if (this.vx > 0) {
                desiredRotation = tiltAngle;
            } else if (this.vx < 0) {
                desiredRotation = -tiltAngle;
            }
            this.currentRotation = this.currentRotation * (1 - this.rotationSmoothness) + desiredRotation * this.rotationSmoothness;
        }
    }

    // Draw the sprite on the canvas
    draw(context) {
        if (!this.isLoaded || !this.currentAnimationConfig || !this.visible) return;

        // Calculate source rectangle on the sprite sheet
        const sx = (this.currentFrame % this.currentAnimationConfig.framesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / this.currentAnimationConfig.framesPerRow) * this.frameHeight;

        // Calculate destination size on canvas
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;

        // Center visual around collision box
        const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;
        const offsetX = (drawWidth - scaledCollisionWidth) / 2;
        const offsetY = (drawHeight - scaledCollisionHeight) / 2;
        const destX = this.x - offsetX;
        const destY = this.y - offsetY;

        // Calculate center for rotation
        const centerX = destX + drawWidth / 2;
        const centerY = destY + drawHeight / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(this.currentRotation);
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            -drawWidth / 2, -drawHeight / 2,
            drawWidth, drawHeight
        );
        context.restore();

        // Optional: Draw collision box for debugging
         context.strokeStyle = 'white';
         context.strokeRect(this.x + this.hitboxOffsetX, this.y + this.hitboxOffsetY, scaledCollisionWidth, scaledCollisionHeight);
    }
}

// ===============================
// 7. MODULE IMPORTS
// ===============================
// Import player and toaster logic from other modules
import { Butterfly, updatePlayerMovement, handleTornadoAttack, initializePlayerSprite, handleHitAttack } from './Ben2.js';
import { IdleToaster, initializeToasterSprite, updateToasterMovement } from './Aaron.js';

// ===============================
// 8. GAME LOOP
// ===============================
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Update player and toaster movement
    updatePlayerMovement(Butterfly, keysPressed);
    updateToasterMovement(IdleToaster, keysPressed);

    // Decrement cooldowns
    if (tornadoCooldown > 0) tornadoCooldown--;
    if (hitCooldown > 0) hitCooldown--;

    // Update, draw, and filter sprites
    const spritesToKeep = [];
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update();
        if (!sprite.shouldRemove) {
            sprite.draw(context);
            spritesToKeep.push(sprite);
        }
    }
    allGameSprites.length = 0;
    allGameSprites.push(...spritesToKeep);

    requestAnimationFrame(gameLoop);
}

// ===============================
// 9. SPRITE LOADING & GAME START
// ===============================
function startGameAfterAssetsLoaded() {
    let allLoaded = true;
    for (let i = 0; i < allGameSprites.length; i++) {
        if (!allGameSprites[i].isLoaded) {
            allLoaded = false;
            break;
        }
    }

    if (allLoaded) {
        console.log("All sprites loaded! Starting game loop.");

        // Debug: Inspect loaded image assets
        console.log("--- Image Assets Inspection (Pre-Sprite Init) ---");
        for (const key in imageAssets) {
            const img = imageAssets[key];
            if (img instanceof HTMLImageElement) {
                console.log(`Key: '${key}', Image:`, img, ` (src: ${img.src}, complete: ${img.complete}, naturalWidth: ${img.naturalWidth}, naturalHeight: ${img.naturalHeight})`);
            } else {
                console.log(`Key: '${key}', Image:`, img, ` (NOT an HTMLImageElement, type: ${typeof img})`);
            }
        }
        console.log("-----------------------------------------------");
        
        if (!Butterfly) {
            initializePlayerSprite();
        }
        if (!IdleToaster) {
            initializeToasterSprite();
        }
        gameLoop();
    } else {
        setTimeout(checkAllSpritesLoaded, 100);
    }
}

// ===============================
// 10. EVENT LISTENERS
// ===============================

// Keyboard events for movement and attacks
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault();
    }
    handleTornadoAttack(event.key, tornadoCooldown, (newCooldown) => { tornadoCooldown = newCooldown; });
    handleHitAttack(event.key, hitCooldown, (newCooldown) => { hitCooldown = newCooldown; });
});

document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});

// UI button events for menu/char select/game start
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
});

document.getElementById('buttonStart').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'flex';
    if (!window.gameStartedAndLoaded) {
        console.log("Game start button clicked. Loading assets...");
        loadAllImages(startGameAfterAssetsLoaded);
        window.gameStartedAndLoaded = true;
    } else {
        console.log("Game already started/assets already loaded.");
    }
});