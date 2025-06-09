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

// Function to remove a sprite from the game
// This just sets a flag; actual removal from allGameSprites happens in the gameLoop
export function removeSprite(spriteToRemove) {
    spriteToRemove.shouldRemove = true;
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
    w: false, // For Toaster movement (jump)
    a: false, // For Toaster movement (left)
    s: false, // For Toaster movement (down - currently unused)
    d: false, // For Toaster movement (right)
    i: false, // For Toaster special attack (charge shot)
    o: false, // For Toaster block (currently unused)
    p: false  // For Toaster basic attack (currently unused)
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
    toastimg: 'Aarons Sprites/Bread.png', // Assumed to be the sprite sheet for toast projectiles
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
        this.isLoaded = true; // Assuming images are loaded via loadAllImages before sprites are created

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

        // Health and Damage properties
        this.maxHealth = 100; // Default max health
        this.health = this.maxHealth; // Current health
        this.invincibilityFrames = 0; // Frames sprite is invincible after taking damage
        this.invincibilityDuration = 30; // 0.5 seconds at 60 FPS

        // Caster ID for projectiles
        this.caster = null; // Reference to the sprite that created this projectile
    }

    // Method to set hitbox offset
    setHitboxOffset(offsetX, offsetY) {
        this.hitboxOffsetX = offsetX;
        this.hitboxOffsetY = offsetY;
    }

    // Method to reset hitbox offset
    resetHitboxOffset() {
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
    }

    // Method to take damage
    takeDamage(amount) {
        if (this.invincibilityFrames > 0) {
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
        // If already in this state and it's not a looping animation, don't restart it
        if (this.currentAnimationState === state && !config.loop) {
            return;
        }
        this.currentAnimationState = state;
        this.currentAnimationConfig = config;
        this.currentFrame = config.start; // Reset to the start frame of the new animation
        this.frameCounter = 0; // Reset frame counter
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
                        this.currentFrame = this.currentAnimationConfig.start; // Loop back
                    } else {
                        // If it's a non-looping animation that just finished,
                        // it will stay on its end frame. The calling code (e.g., updatePlayerMovement)
                        // is responsible for transitioning to the next state (e.g., 'idle').
                        this.currentFrame = this.currentAnimationConfig.end;
                    }
                }
            }
        } else {
            // Fallback for sprites without explicit animation configs (less common)
            this.frameCounter++;
            if (this.frameCounter >= this.defaultAnimationSpeed) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames; // Assuming totalFrames is defined somewhere
                this.frameCounter = 0;
            }
        }

        // --- Invincibility frames update ---
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
        // Prevents sprites from going off the left/right sides
        if (this.x < 0) {
            this.x = 0; this.vx = 0;
        } else if (this.x + scaledCollisionWidth > canvas.width) {
            this.x = canvas.width - scaledCollisionWidth; this.vx = 0;
        }
        // Prevents sprites from going off the top and through the "ground"
        if (this.y < 0) {
            this.y = 0; this.vy = 0;
        } else if (this.y + scaledCollisionHeight > 270) { // Assuming 270 is the ground level Y
            this.y = 270 - scaledCollisionHeight; this.vy = 0;
        }

        // --- Lifetime management ---
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true; // Mark for removal
            }
        }
    }

    // Draw the sprite on the canvas
    draw(context) {
        if (!this.isLoaded || !this.currentAnimationConfig || !this.visible) return; // Don't draw if not loaded, no animation, or invisible

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

        context.save(); // Save the current canvas state
        context.translate(centerX, centerY); // Move origin to sprite center
        context.rotate(this.currentRotation); // Apply rotation
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight, // Source rectangle (sx, sy, sWidth, sHeight)
            -drawWidth / 2, -drawHeight / 2, // Destination x, y (relative to new origin)
            drawWidth, drawHeight // Destination width, height
        );
        context.restore(); // Restore the canvas state

        // Optional: Draw collision box for debugging
        context.strokeStyle = 'white';
        // Draw the collision box adjusted for offsets
        context.strokeRect(this.x + this.hitboxOffsetX, this.y + this.hitboxOffsetY, scaledCollisionWidth, scaledCollisionHeight);
    }

    // Method to get the actual collision bounding box, adjusted for offsets
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
// 7. HELPER FUNCTIONS
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
// Only import necessary functions for Toaster movement and cooldown, not the internal helpers
import { IdleToaster, initializeToasterSprite, updateToasterMovement, updateToastCooldown, chargeLevel, handleHitAttack2 } from './Aaron.js';

// ===============================
// 9. GAME LOOP
// ===============================
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

    // --- Draw Background Image ---
    if (imageAssets.background && imageAssets.background.complete) {
        context.drawImage(
            imageAssets.background,
            0, 0,                      // Destination x, y (top-left corner of canvas)
            canvas.width, canvas.height // Destination width, height (fills canvas)
        );
    } else {
        context.fillStyle = '#000'; // Fallback background color if image not loaded
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- Draw Ground Tiles ---
    const GROUND_TILE_WIDTH = 8;    // Your ground tile's width
    const GROUND_TILE_HEIGHT = 32;  // Your ground tile's height
    const GROUND_START_Y = canvas.height - GROUND_TILE_HEIGHT; // Y position for the bottom of the canvas

    if (imageAssets.ground && imageAssets.ground.complete) { // Ensure ground image is loaded
        const numTilesX = Math.ceil(canvas.width / GROUND_TILE_WIDTH); // Calculate number of tiles needed across the width
        for (let i = 0; i < numTilesX; i++) {
            context.drawImage(
                imageAssets.ground,
                i * GROUND_TILE_WIDTH, // X position for this tile
                GROUND_START_Y,        // Y position: fixed at the bottom
                GROUND_TILE_WIDTH,
                GROUND_TILE_HEIGHT
            );
        }
    }

    // Update player and toaster movement based on keyboard input
    updatePlayerMovement(Butterfly, keysPressed);
    updateToasterMovement(IdleToaster, keysPressed);

    // Decrement attack cooldowns
    if (tornadoCooldown > 0) tornadoCooldown--;
    if (hitCooldown > 0) hitCooldown--;
    updateToastCooldown(); // Decrement toast cooldown

    // Update, draw, and filter sprites (remove those marked for removal)
    const spritesToKeep = [];
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update(); // Call each sprite's update method
        if (!sprite.shouldRemove) {
            sprite.draw(context); // Draw only if not marked for removal
            spritesToKeep.push(sprite);
        }
    }
    // Efficiently update the allGameSprites array with only the sprites to keep
    allGameSprites.length = 0; // Clear the original array
    allGameSprites.push(...spritesToKeep); // Add back only the sprites that should remain


    // --- Handle Character-to-Character Collision (Butterfly vs Toaster) ---
    if (Butterfly && IdleToaster) {
        if (checkCollision(Butterfly, IdleToaster)) {
            // Resolve collision to prevent characters from overlapping
            resolveCollision(Butterfly, IdleToaster);
            resolveCollision(IdleToaster, Butterfly); // Resolve from both sides for robust separation
        }
    }

    // --- Handle Butterfly Hit Attack Collision (Butterfly's hitbox vs Toaster) ---
    if (Butterfly && IdleToaster &&
        Butterfly.currentAnimationState.startsWith('hit') && // Check if Butterfly is in a 'hit' animation
        (Butterfly.hitboxOffsetX !== 0 || Butterfly.hitboxOffsetY !== 0) && // Check if Butterfly's hitbox is extended
        checkCollision(Butterfly, IdleToaster)) { // Check for collision with Toaster
        // Apply damage to the Toaster
        if (IdleToaster.takeDamage) { // Ensure Toaster has the takeDamage method
            IdleToaster.takeDamage(BUTTERFLY_HIT_DAMAGE); // Use the damage constant from Ben2.js
        }
    }

    // --- Handle Projectile Collisions (Tornado vs Characters, Toast vs Characters) ---
    if (Butterfly && IdleToaster) {
        for (let i = 0; i < allGameSprites.length; i++) {
            const projectile = allGameSprites[i];

            // Skip if the sprite is marked for removal or doesn't have an image (e.g., if it's a generic invisible hitbox)
            if (projectile.shouldRemove || !projectile.image) continue;

            // Check if the sprite is a tornado projectile
            if (projectile.image === imageAssets.tornado) {
                // Tornado vs Butterfly (don't collide with the caster)
                if (projectile.caster !== Butterfly && checkCollision(projectile, Butterfly)) {
                    console.log("Tornado collided with Butterfly!");
                    Butterfly.takeDamage(5); // Example damage from tornado
                    resolveCollision(Butterfly, projectile); // Push Butterfly away
                    // DO NOT SET shouldRemove = true here for Tornado
                }
                // Tornado vs Toaster (don't collide with the caster)
                if (projectile.caster !== IdleToaster && checkCollision(projectile, IdleToaster)) {
                    console.log("Tornado collided with Toaster!");
                    if (IdleToaster.takeDamage) {
                        IdleToaster.takeDamage(5); // Example damage from tornado
                    }
                    resolveCollision(IdleToaster, projectile); // Push Toaster away
                    // DO NOT SET shouldRemove = true here for Tornado
                }
            }
            
            // Check if the sprite is a toast projectile
            if (projectile.image === imageAssets.toastimg) {
                // Toast vs Butterfly: Check if the toast was cast by the Toaster AND it collides with Butterfly
                // AND the toast itself hasn't already been marked for removal (important for single hit)
                if (projectile.caster === IdleToaster && checkCollision(projectile, Butterfly) && !projectile.shouldRemove) {
                    let damage = 5;
                    if (projectile.chargeLevel === 2) damage = 10;
                    if (projectile.chargeLevel === 3) damage = 15;
                    
                    Butterfly.takeDamage(damage);
                    projectile.shouldRemove = true; // Toast disappears on hit
                    console.log("Toast from Toaster collided with Butterfly! Damage:", damage, "Charge Level:", projectile.chargeLevel);
                }
            }
        }
    }
    // --- Draw Health Bar for Butterfly ---
    if (Butterfly) {
        drawHealthBar(context, Butterfly);
    }
    // Draw Health Bar for IdleToaster
    if (IdleToaster) {
        drawHealthBar(context, IdleToaster);
    }

    requestAnimationFrame(gameLoop); // Request next frame for continuous animation
}


// --- Health Bar Drawing Function ---
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
        event.preventDefault(); // Prevent default browser actions for game keys
    }
    // Only handle attacks if the player sprite exists
    if (Butterfly) {
        // These functions now internally check for cooldowns and key states
        handleTornadoAttack(event.key, tornadoCooldown, (newCooldown) => { tornadoCooldown = newCooldown; });
        handleHitAttack(event.key, hitCooldown, (newCooldown) => { hitCooldown = newCooldown; });
    }
    if (IdleToaster) {
        // These functions now internally check for cooldowns and key states
        handleHitAttack2(event.key, hitCooldown, (newCooldown) => { hitCooldown = newCooldown; });
    }
    // The toaster's special attack (toast charge) is handled in updateToasterMovement
    // when 'i' is pressed or released, so no direct call here.
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
