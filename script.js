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
    IdleToaster: 'Aarons Sprites/Toaster.png',
    ground: 'Ground.png',
    toastimg: 'Aarons Sprites/Bread.png',
    background: 'bg.png'
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

        // Health and Damage properties (new)
        this.maxHealth = 100; // Default max health
        this.health = this.maxHealth; // Current health
        this.invincibilityFrames = 0; // Frames sprite is invincible after taking damage
        this.invincibilityDuration = 30; // 0.5 seconds at 60 FPS

        // --- NEW: Caster ID for projectiles ---
        this.caster = null; // Reference to the sprite that created this projectile
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

    // --- NEW: Method to take damage ---
    takeDamage(amount) {
        if (this.invincibilityFrames > 0) {
            // console.log(`${this.constructor.name} is invincible.`); // Commented to reduce log spam
            return; // Cannot take damage if invincible
        }

        this.health -= amount;
        this.invincibilityFrames = this.invincibilityDuration; // Start invincibility

        console.log(`${this.constructor.name} took ${amount} damage. Health: ${this.health}`);

        if (this.health <= 0) {
            this.health = 0;
            this.shouldRemove = true; // Mark for removal or handle death state
            console.log(`${this.constructor.name} defeated!`);
        }
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
                        // If it's a non-looping animation that just finished,
                        // trigger any 'onAnimationEnd' logic if applicable.
                        // The 'nextState' handling is done in updatePlayerMovement/ToasterMovement
                        this.currentFrame = this.currentAnimationConfig.end;
                    }
                }
            }
        } else {
            this.frameCounter++;
            if (this.frameCounter >= this.defaultAnimationSpeed) {
                // This path might be less used if you always set an animation state
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames; // Assuming totalFrames is defined if no config
                this.frameCounter = 0;
            }
        }

        // --- Invincibility frames update (new) ---
        if (this.invincibilityFrames > 0) {
            this.invincibilityFrames--;
            this.visible = !this.visible; // Flash effect
        } else {
            this.visible = true; // Ensure visible when not invincible
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
        } else if (this.y + scaledCollisionHeight > 270) {
            this.y = 270 - scaledCollisionHeight; this.vy = 0;
        }

        // --- Lifetime management ---
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true;
            }
        }

        // --- Rotation update (for Butterfly) ---
        // Moved this specific logic to Ben2.js's updatePlayerMovement
        // as it's specific to Butterfly and tightly coupled with its movement.
        // Keeping it here means any sprite can rotate, which might not be desired.
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
        // Draw the collision box adjusted for offsets
        context.strokeRect(this.x + this.hitboxOffsetX, this.y + this.hitboxOffsetY, scaledCollisionWidth, scaledCollisionHeight);
    }

    // --- NEW: Method to get the actual collision bounding box ---
    getCollisionBox() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            width: this.collisionWidth * this.scale,
            height: this.collisionHeight * this.scale
        };
    }
}

// ===============================
// 7. HELPER FUNCTIONS (NEW)
// ===============================

/**
 * Checks for AABB collision between two sprites.
 * @param {GameSprite} spriteA
 * @param {GameSprite} spriteB
 * @returns {boolean} True if collision, false otherwise.
 */
export function checkCollision(spriteA, spriteB) {
    // If either sprite is not visible (e.g., during invincibility flash), no collision
    if (!spriteA.visible || !spriteB.visible) return false;

    // Get the collision boxes including any offsets
    const boxA = spriteA.getCollisionBox();
    const boxB = spriteB.getCollisionBox();

    // Check if the boxes overlap on both axes
    return boxA.x < boxB.x + boxB.width &&
           boxA.x + boxA.width > boxB.x &&
           boxA.y < boxB.y + boxB.height &&
           boxA.y + boxA.height > boxB.y;
}

/**
 * Resolves collision by pushing spriteA out of spriteB.
 * This is a simple separation response, more complex physics might be needed for realistic bouncing etc.
 * @param {GameSprite} spriteA - The sprite to move.
 * @param {GameSprite} spriteB - The sprite that spriteA is colliding with.
 */
export function resolveCollision(spriteA, spriteB) {
    const boxA = spriteA.getCollisionBox();
    const boxB = spriteB.getCollisionBox();

    // Calculate overlap on both axes
    const overlapX = Math.max(0, Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x));
    const overlapY = Math.max(0, Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y));

    // No overlap or if the sprites are "inside" each other perfectly, no resolution needed
    if (overlapX === 0 || overlapY === 0) return;

    // Determine which axis has the smallest overlap (this is the axis of least resistance)
    if (overlapX < overlapY) {
        // Resolve on X axis
        if (boxA.x < boxB.x) { // A is to the left of B, push A left
            spriteA.x -= overlapX;
        } else { // A is to the right of B, push A right
            spriteA.x += overlapX;
        }
        spriteA.vx = 0; // Stop horizontal movement
    } else {
        // Resolve on Y axis
        if (boxA.y < boxB.y) { // A is above B, push A up
            spriteA.y -= overlapY;
        } else { // A is below B, push A down
            spriteA.y += overlapY;
        }
        spriteA.vy = 0; // Stop vertical movement
    }
}


// ===============================
// 8. MODULE IMPORTS
// ===============================
// Import player and toaster logic from other modules
import { Butterfly, updatePlayerMovement, handleTornadoAttack, initializePlayerSprite, handleHitAttack, BUTTERFLY_HIT_DAMAGE } from './Ben2.js';
import { IdleToaster, initializeToasterSprite, updateToasterMovement, toastSpecial } from './Aaron.js';

// ===============================
// 9. GAME LOOP
// ===============================
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (imageAssets.background && imageAssets.background.complete) {
        context.drawImage(
            imageAssets.background,
            0, 0,                      // Destination x, y
            canvas.width, canvas.height // Destination width, height (fills canvas)
        );
    } else {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    // --- Draw Ground Tiles ---
    const GROUND_TILE_WIDTH = 8;  // Your ground tile's width
    const GROUND_TILE_HEIGHT = 32; // Your ground tile's height

    // Calculate the Y position for the bottom of the canvas
    const GROUND_START_Y = canvas.height - GROUND_TILE_HEIGHT;

    if (imageAssets.ground && imageAssets.ground.complete) { // Ensure image is loaded
        // Calculate how many tiles are needed to cover the canvas width
        const numTilesX = Math.ceil(canvas.width / GROUND_TILE_WIDTH);

        for (let i = 0; i < numTilesX; i++) {
            context.drawImage(
                imageAssets.ground,
                i * GROUND_TILE_WIDTH, // X position for this tile
                GROUND_START_Y,        // Y position: fixed at the bottom
                GROUND_TILE_WIDTH,
                GROUND_TILE_HEIGHT
            );
        }
    } else {
        // Optional: Log if ground tile isn't loaded yet
        // console.warn("Ground tile image not loaded yet.");
    }


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


    // --- Handle Character-to-Character Collision ---
    if (Butterfly && IdleToaster) {
        if (checkCollision(Butterfly, IdleToaster)) {
            // Resolve collision so they don't overlap
            resolveCollision(Butterfly, IdleToaster);
            resolveCollision(IdleToaster, Butterfly); // Resolve from both sides for robust separation
            // console.log("Collision between Butterfly and Toaster!"); // Commented to reduce log spam
        }
    }

    // --- Handle Butterfly Hit Attack Collision (Butterfly's hitbox vs Toaster) ---
    if (Butterfly && IdleToaster &&
        Butterfly.currentAnimationState.startsWith('hit') &&
        (Butterfly.hitboxOffsetX !== 0 || Butterfly.hitboxOffsetY !== 0) && // Check if hitbox is extended
        checkCollision(Butterfly, IdleToaster)) {
        // Apply damage to the Toaster
        if (IdleToaster.takeDamage) { // Check if Toaster has the takeDamage method
            IdleToaster.takeDamage(BUTTERFLY_HIT_DAMAGE); // Use the damage constant from Ben2.js
        }
    }

    // --- Handle Tornado Projectile Collision ---
    // Iterate through all active sprites to find tornadoes and check their collision
    // against characters.
    if (Butterfly && IdleToaster) {
        for (let i = 0; i < allGameSprites.length; i++) {
            const sprite = allGameSprites[i];
            // Check if the sprite is a tornado (you might add a 'type' property to GameSprite)
            // For now, let's assume if it uses the tornado image it's a tornado projectile.
            if (sprite.image === imageAssets.tornado) {
                // Tornado vs Butterfly
                // ADDED: Don't collide with the caster (Butterfly)
                if (sprite.caster !== Butterfly && checkCollision(sprite, Butterfly)) {
                    console.log("Tornado collided with Butterfly!");
                    // If the tornado is meant to damage the Butterfly:
                    Butterfly.takeDamage(5); // Example damage from tornado
                    // REMOVED: sprite.shouldRemove = true; // Tornado no longer dissipates on hit
                    resolveCollision(Butterfly, sprite); // Push Butterfly away
                }
                // Tornado vs Toaster
                if (sprite.caster !== IdleToaster && checkCollision(sprite, IdleToaster)) {
                    console.log("Tornado collided with Toaster!");
                    // If the tornado is meant to damage the Toaster:
                    if (IdleToaster.takeDamage) {
                        IdleToaster.takeDamage(5); // Example damage from tornado
                    }
                    // REMOVED: sprite.shouldRemove = true; // Tornado no longer dissipates on hit
                    resolveCollision(IdleToaster, sprite); // Push Toaster away
                }
            }
        }
    }

    // --- Draw Health Bar for Butterfly (NEW) ---
    if (Butterfly) {
        drawHealthBar(context, Butterfly);
    }
    // You'd add a similar block for IdleToaster when you implement its health and damage
    // if (IdleToaster) {
    //     drawHealthBar(context, IdleToaster);
    // }


    requestAnimationFrame(gameLoop);
}

// --- Health Bar Drawing Function (NEW) ---
function drawHealthBar(ctx, sprite) {
    const barWidth = sprite.collisionWidth * sprite.scale * 1.5; // Health bar wider than sprite
    const barHeight = 4;
    const barX = sprite.x + sprite.hitboxOffsetX + (sprite.collisionWidth * sprite.scale / 2) - (barWidth / 2);
    const barY = sprite.y + sprite.hitboxOffsetY - barHeight - 5; // 5 pixels above the sprite

    // Draw background (empty) part of health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw foreground (current health) part of health bar
    const currentHealthWidth = (sprite.health / sprite.maxHealth) * barWidth;
    ctx.fillStyle = 'lime';
    ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

    // Optional: Draw border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}


// ===============================
// 10. SPRITE LOADING & GAME START
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
        console.log("All images loaded! Starting game loop.");

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

        // Ensure initialization happens only once
        if (!Butterfly) {
            initializePlayerSprite();
        }
        if (!IdleToaster) {
            initializeToasterSprite();
        }
        gameLoop();
    } else {
        // Changed to call itself to re-check asset loading status
        setTimeout(startGameAfterAssetsLoaded, 100);
    }
}

// ===============================
// 11. EVENT LISTENERS
// ===============================

// Keyboard events for movement and attacks
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault();
    }
    // Only handle attacks if the player sprite exists
    if (Butterfly) {
        handleTornadoAttack(event.key, tornadoCooldown, (newCooldown) => { tornadoCooldown = newCooldown; });
        handleHitAttack(event.key, hitCooldown, (newCooldown) => { hitCooldown = newCooldown; });
    }
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