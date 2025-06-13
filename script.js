// ===============================
// 1. GLOBAL CONSTANTS & VARIABLES
// ===============================
export const BUTTERFLY_MOVE_SPEED = 1;
export const TORNADO_PROJECTILE_SPEED = 4;
export const TORNADO_LIFETIME_FRAMES = 150;
export const TORNADO_COOLDOWN_DURATION = 150;
export const HIT_COOLDOWN_DURATION = 60; // Cooldown for hit animation (e.g., 1 second)
let tornadoCooldownP1 = 0; // Separate cooldown for P1's tornado
let hitCooldownP1 = 0;     // Separate cooldown for P1's hit
let dashCooldownP1 = 0;    // Separate cooldown for P1's dash

let tornadoCooldownP2 = 0; // Separate cooldown for P2's tornado
let hitCooldownP2 = 0;     // Separate cooldown for P2's hit
let dashCooldownP2 = 0;    // Separate cooldown for P2's dash

export const TOASTER_MOVE_SPEED = 2;

// GLOBAL PLAYER SPRITE INSTANCES - These will hold the selected characters
export let player1ActiveSprite = null; // Will point to either ButterflyP1 or ToasterP1
export let player2ActiveSprite = null; // Will point to either ButterflyP2 or ToasterP2

// Variables to track chosen character types and selection status
let player1SelectedCharType = null; // Stores 'butterfly' or 'toaster'
let player2SelectedCharType = null; // Stores 'butterfly' or 'toaster'
let player1HasSelected = false;
let player2HasSelected = false;


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
// Array to hold all your active sprites
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
    z: false, // Player 2 - typically attack/ability
    c: false, // Player 2 - typically attack/ability
    x: false, // Player 2 - typically attack/ability
    w: false, // Player 1 - typically up/jump
    a: false, // Player 1 - typically left
    s: false, // Player 1 - typically down
    d: false, // Player 1 - typically right
    i: false, // Player 1 - typically attack/ability
    o: false, // Player 1 - typically attack/ability
    p: false  // Player 1 - typically attack/ability
};

// ===============================
// 5. IMAGE ASSET LOADING
// ===============================
export const imageAssets = {};
const IMAGE_PATHS = {
    Butterfly: 'Bens Sprites/Butterfly.png', // Original Butterfly sprite sheet
    ButterflyP1: 'Bens Sprites/Butterfly.png', // New colorway for P1 Butterfly
    tornado: 'Bens Sprites/Tornado.png',
    IdleToaster: 'Aarons Sprites/Toaster.png', // Original Toaster sprite sheet (for NPC, or P2)
    ToasterP1: 'Aarons Sprites/Toaster.png', // New colorway for P1 Toaster
    ToasterP2: 'Aarons Sprites/Toaster.png', // New colorway for P2 Toaster (if you want a different one for P2)
    ground: 'Ground.png',
    toastimg: 'Aarons Sprites/Bread.png', // Toast projectile image
    background: 'bg.png',
    blockp1: 'Block P1.png', // P1 block image
    blockp2: 'Block P2.png'  // P2 block image
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
                callback(); // Call callback even if some failed, for robustness
            }
        };
    }
}

// ===============================
// 6. SPRITE CLASS DEFINITION
// ===============================
export class GameSprite {
    // Added an optional 'tag' to differentiate sprite types
    constructor(image, x, y, frameWidth, frameHeight, collisionWidth, collisionHeight, animationSpeed, scale = 1, lifeTime = -1, tag = 'generic') {
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
        this.tag = tag; // New property to identify sprite type (e.g., 'player1-butterfly', 'player2-toaster', 'tornado', 'toast', 'block')

        // Character-specific properties (will be set by their respective setup functions)
        // Butterfly specific
        this.hasDealtDamageThisAttack = false;
        this.isDashing = false;
        this.dashVx = 0;
        this.dashVy = 0;
        this.dashFramesRemaining = 0;
        this.lastDirection = 'right'; // For last facing direction for attacks/movement

        // Toaster specific
        this.isChargingToast = false;
        this.toastChargeStartTime = 0;
        this.currentToastSprite = null; // To hold the toast sprite while charging
        this.hasDealtDamageThisAttack2 = false; // For Toaster's hit attack
        this.currentBlock = null; // To hold the block sprite while blocking
        this.isBlocking = false; // Toaster's individual blocking state
        this.jumpActive = false; // Toaster's individual jump state
        this.toastCooldown = 0; // Toaster's individual toast cooldown
        this.chargeLevel = 1; // Default charge level for toast projectiles (initialized to 1)
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

        console.log(`${this.constructor.name} (Tag: ${this.tag}) took ${amount} damage. Health: ${this.health}`);

        if (this.health <= 0) {
            this.health = 0;
            this.shouldRemove = true; // Mark for removal or handle death state
            console.log(`${this.constructor.name} (Tag: ${this.tag}) defeated!`);
        }
    }

    // Set the current animation state
    setAnimation(state) {
        const config = this.animations[state];
        if (!config) {
            console.warn(`Animation state '${state}' not found for sprite (Tag: ${this.tag}). Available: ${Object.keys(this.animations).join(', ')}`);
            // If no config, clear current animation so default behavior takes over
            this.currentAnimationState = '';
            this.currentAnimationConfig = null;
            this.currentFrame = 0; // Reset to first frame for default cycle
            this.frameCounter = 0;
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
        this.framesPerRow = config.framesPerRow; // Ensure this is set for draw
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
            // Default animation behavior: cycle through all frames based on defaultAnimationSpeed
            // This is crucial for characters when no specific 'walk' animation is set or if animations are not defined.
            if (this.image && this.image.width && this.image.height && this.frameWidth && this.frameHeight && this.defaultAnimationSpeed > 0) {
                const totalFramesInSheet = (this.image.width / this.frameWidth) * (this.image.height / this.frameHeight);
                this.frameCounter++;
                if (this.frameCounter >= this.defaultAnimationSpeed) {
                    this.frameCounter = 0;
                    this.currentFrame = (this.currentFrame + 1) % totalFramesInSheet;
                }
            } else {
                 this.currentFrame = 0; // Stick to first frame if image/dimensions are missing or invalid animation speed
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
        if (!this.isLoaded || !this.visible || !this.image) return; // Don't draw if not loaded, no animation, or invisible image

        // Determine framesPerRow: use from currentAnimationConfig if available, otherwise calculate from image width
        const actualFramesPerRow = (this.currentAnimationConfig && this.currentAnimationConfig.framesPerRow !== undefined) ? this.currentAnimationConfig.framesPerRow : (this.image.width / this.frameWidth);

        // Calculate source rectangle on the sprite sheet
        const sx = (this.currentFrame % actualFramesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / actualFramesPerRow) * this.frameHeight;

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
    const box1 = spriteA.getCollisionBox();
    const box2 = spriteB.getCollisionBox();

    // Check for overlap on x-axis (now includes touching at edges)
    // box1's right edge must be >= box2's left edge
    // AND box1's left edge must be <= box2's right edge
    const xOverlap = box1.x <= box2.x + box2.width && box1.x + box1.width >= box2.x;

    // Check for overlap on y-axis (now includes touching at edges)
    // box1's bottom edge must be >= box2's top edge
    // AND box1's top edge must be <= box2's bottom edge
    const yOverlap = box1.y <= box2.y + box2.height && box1.y + box1.height >= box2.y;

    // Return true if both x and y axes overlap or touch
    return xOverlap && yOverlap;
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
// Imports for Player 1 Butterfly logic
import {
    ButterflyP1,
    initializePlayer1ButterflySprite,
    updatePlayer1ButterflyMovement,
    handlePlayer1ButterflyTornadoAttack,
    handlePlayer1ButterflyHitAttack,
    handlePlayer1ButterflyDashAttack,
    BUTTERFLY_HIT_DAMAGE as BUTTERFLY_HIT_DAMAGE_P1 // Alias for clarity
} from './Ben2.js';

// Imports for Player 2 Butterfly logic (original Butterfly)
import {
    Butterfly, // Original Butterfly for P2
    initializePlayer2ButterflySprite,
    updatePlayer2ButterflyMovement,
    handlePlayer2ButterflyTornadoAttack,
    handlePlayer2ButterflyHitAttack,
    handlePlayer2ButterflyDashAttack,
    BUTTERFLY_HIT_DAMAGE // No alias needed here, just the original
} from './Ben2.js';

// Imports for Player 1 Toaster logic
import {
    ToasterP1,
    initializePlayer1ToasterSprite,
    updatePlayer1ToasterMovement,
    handlePlayer1ToasterHitAttack,
    TOASTER_HIT_DAMAGE as TOASTER_HIT_DAMAGE_P1,
    updatePlayer1ToastCooldown // For Player 1 Toaster's specific toast cooldown
} from './Aaron.js';

// Imports for Player 2 Toaster logic (original IdleToaster)
import {
    IdleToaster, // Original IdleToaster (now used for P2 by default)
    initializePlayer2ToasterSprite,
    updatePlayer2ToasterMovement,
    handlePlayer2ToasterHitAttack,
    TOASTER_HIT_DAMAGE, // No alias needed here, just the original
    updatePlayer2ToastCooldown // For Player 2 Toaster's specific toast cooldown
} from './Aaron.js';


// ===============================
// 9. GAME LOOP
// ===============================
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

    // --- Draw Background Image ---
    if (imageAssets.background && imageAssets.background.complete) {
        context.drawImage(
            imageAssets.background,
            0, 0,
            canvas.width, canvas.height
        );
    } else {
        context.fillStyle = '#000'; // Fallback background color if image not loaded
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- Draw Ground Tiles ---
    const GROUND_TILE_WIDTH = 8;
    const GROUND_TILE_HEIGHT = 32;
    const GROUND_START_Y = canvas.height - GROUND_TILE_HEIGHT;

    if (imageAssets.ground && imageAssets.ground.complete) {
        const numTilesX = Math.ceil(canvas.width / GROUND_TILE_WIDTH);
        for (let i = 0; i < numTilesX; i++) {
            context.drawImage(
                imageAssets.ground,
                i * GROUND_TILE_WIDTH,
                GROUND_START_Y,
                GROUND_TILE_WIDTH,
                GROUND_TILE_HEIGHT
            );
        }
    }

    // --- Update Cooldowns ---
    // Update P1 cooldowns
    if (tornadoCooldownP1 > 0) tornadoCooldownP1--;
    if (hitCooldownP1 > 0) hitCooldownP1--;
    if (dashCooldownP1 > 0) dashCooldownP1--;
    // Update P2 cooldowns
    if (tornadoCooldownP2 > 0) tornadoCooldownP2--;
    if (hitCooldownP2 > 0) hitCooldownP2--;
    if (dashCooldownP2 > 0) dashCooldownP2--;

    // Update Toaster-specific cooldowns (handled internally by Toaster update functions as sprite properties)
    // However, the `updatePlayerXToastCooldown` functions exist in Aaron.js, so let's call them if the player is a toaster
    if (player1SelectedCharType === 'toaster') {
        updatePlayer1ToastCooldown();
    }
    if (player2SelectedCharType === 'toaster') {
        updatePlayer2ToastCooldown();
    }


    // --- Update Player Movement and Attacks ---
    // Player 1 (WASD keys, I, O, P)
    if (player1ActiveSprite) {
        const p1MovementKeys = {
            ArrowLeft: keysPressed.a,
            ArrowRight: keysPressed.d,
            ArrowUp: keysPressed.w,
            ArrowDown: keysPressed.s,
            attack1: keysPressed.i, // For Toaster (charge) or Butterfly (tornado)
            attack2: keysPressed.p, // For Toaster (basic hit) or Butterfly (hit)
            ability: keysPressed.o  // For Toaster (block) or Butterfly (dash)
        };

        if (player1SelectedCharType === 'butterfly') {
            updatePlayer1ButterflyMovement(p1MovementKeys);
            // Pass the key string ONLY if the key is pressed, otherwise null
            handlePlayer1ButterflyTornadoAttack(p1MovementKeys.attack1 ? 'i' : null, tornadoCooldownP1, (duration) => tornadoCooldownP1 = duration);
            handlePlayer1ButterflyHitAttack(p1MovementKeys.attack2 ? 'p' : null, hitCooldownP1, (duration) => hitCooldownP1 = duration);
            handlePlayer1ButterflyDashAttack(p1MovementKeys.ability ? 'o' : null, dashCooldownP1, (duration) => dashCooldownP1 = duration);
        } else if (player1SelectedCharType === 'toaster') {
            updatePlayer1ToasterMovement(p1MovementKeys);
            handlePlayer1ToasterHitAttack(p1MovementKeys.attack2 ? 'p' : null, hitCooldownP1, (duration) => hitCooldownP1 = duration);
        }
    }

    // Player 2 (Arrow keys, Z, C, X)
    if (player2ActiveSprite) {
        const p2MovementKeys = {
            ArrowLeft: keysPressed.ArrowLeft,
            ArrowRight: keysPressed.ArrowRight,
            ArrowUp: keysPressed.ArrowUp,
            ArrowDown: keysPressed.ArrowDown,
            attack1: keysPressed.z, // For Toaster (charge) or Butterfly (tornado)
            attack2: keysPressed.c, // For Toaster (basic hit) or Butterfly (hit)
            ability: keysPressed.x  // For Toaster (block) or Butterfly (dash)
        };

        if (player2SelectedCharType === 'butterfly') {
            updatePlayer2ButterflyMovement(p2MovementKeys);
            // Pass the key string ONLY if the key is pressed, otherwise null
            handlePlayer2ButterflyTornadoAttack(p2MovementKeys.attack1 ? 'z' : null, tornadoCooldownP2, (duration) => tornadoCooldownP2 = duration);
            handlePlayer2ButterflyHitAttack(p2MovementKeys.attack2 ? 'c' : null, hitCooldownP2, (duration) => hitCooldownP2 = duration);
            handlePlayer2ButterflyDashAttack(p2MovementKeys.ability ? 'x' : null, dashCooldownP2, (duration) => dashCooldownP2 = duration);
        } else if (player2SelectedCharType === 'toaster') {
            updatePlayer2ToasterMovement(p2MovementKeys);
            handlePlayer2ToasterHitAttack(p2MovementKeys.attack2 ? 'c' : null, hitCooldownP2, (duration) => hitCooldownP2 = duration);
        }
    }


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
    allGameSprites.push(...spritesToKeep);


    // --- Handle Character-to-Character Collisions ---
    const allPlayableCharacters = [player1ActiveSprite, player2ActiveSprite].filter(Boolean); // Filter out null/undefined

    for (let i = 0; i < allPlayableCharacters.length; i++) {
        for (let j = i + 1; j < allPlayableCharacters.length; j++) {
            const charA = allPlayableCharacters[i];
            const charB = allPlayableCharacters[j];
            if (checkCollision(charA, charB)) {
                // FIXED: One-way collision logic: Toaster pushes Butterfly, but not vice-versa
                const isA_Butterfly = charA.tag.includes('butterfly');
                const isA_Toaster = charA.tag.includes('toaster');
                const isB_Butterfly = charB.tag.includes('butterfly');
                const isB_Toaster = charB.tag.includes('toaster');

                if (isA_Butterfly && isB_Toaster) {
                    resolveCollision(charA, charB); // Push Butterfly (A) out of Toaster (B)
                    // Do NOT resolveCollision(charB, charA);
                } else if (isA_Toaster && isB_Butterfly) {
                    resolveCollision(charB, charA); // Push Butterfly (B) out of Toaster (A)
                    // Do NOT resolveCollision(charA, charB);
                } else {
                    // For other collisions (e.g., Butterfly-Butterfly, Toaster-Toaster),
                    // or if the collision is not specifically Butterfly-Toaster,
                    // apply symmetric resolution.
                    resolveCollision(charA, charB);
                    resolveCollision(charB, charA);
                }
            }
        }
    }


    // --- Handle Hit Attack Damage ---
    // Iterate through all characters to check if they are performing a hit attack and colliding with a target
    allPlayableCharacters.forEach(attacker => {
        if (!attacker) return; // Skip if attacker doesn't exist

        const targets = allPlayableCharacters.filter(target => target !== attacker); // All other characters are potential targets

        targets.forEach(target => {
            // Check for Butterfly's hit attack
            if (attacker.tag.includes('butterfly') &&
                attacker.currentAnimationState.startsWith('hit') &&
                (attacker.hitboxOffsetX !== 0 || attacker.hitboxOffsetY !== 0) &&
                (!attacker.hasDealtDamageThisAttack) &&
                checkCollision(attacker, target)) {
                if (target.takeDamage) {
                    attacker.hasDealtDamageThisAttack = true; // Mark damage dealt for this attack
                    let damage = attacker.tag.includes('player1') ? BUTTERFLY_HIT_DAMAGE_P1 : BUTTERFLY_HIT_DAMAGE;
                    // Apply blocking reduction if target is a Toaster and is blocking
                    if (target.tag.includes('toaster') && target.isBlocking) {
                        damage *= 0.75;
                    }
                    target.takeDamage(damage);
                }
            }
            // Check for Toaster's hit attack
            if (attacker.tag.includes('toaster') &&
                attacker.currentAnimationState.startsWith('hit') &&
                (attacker.hitboxOffsetX !== 0 || attacker.hitboxOffsetY !== 0) &&
                (!attacker.hasDealtDamageThisAttack2) &&
                checkCollision(attacker, target)) {
                if (target.takeDamage) {
                    attacker.hasDealtDamageThisAttack2 = true; // Mark damage dealt for this attack
                    let damage = attacker.tag.includes('player1') ? TOASTER_HIT_DAMAGE_P1 : TOASTER_HIT_DAMAGE;
                    // Apply blocking reduction if target is a Toaster and is blocking
                    if (target.tag.includes('toaster') && target.isBlocking) {
                        damage *= 0.75;
                    }
                    target.takeDamage(damage);
                }
            }
        });
    });


    // --- Handle Projectile Collisions (Tornado/Toast vs Characters) ---
    // We need to iterate over all sprites, not just playable characters, to find projectiles
    for (let i = 0; i < allGameSprites.length; i++) {
        const projectile = allGameSprites[i];
        if (projectile.shouldRemove || !projectile.image) continue;

        // Check for Tornado projectiles
        if (projectile.tag === 'tornado') {
            // Targets are all characters except the caster of *this specific projectile*
            const targets = allPlayableCharacters.filter(target => target !== projectile.caster);
            targets.forEach(target => {
                if (checkCollision(projectile, target)) {
                    console.log(`Tornado from ${projectile.caster.tag} collided with ${target.tag}!`);
                    let damage = 5; // Fixed damage for tornado
                    if (target.tag.includes('toaster') && target.isBlocking) {
                        damage *= 0.75;
                    }
                    target.takeDamage(damage);

                    // FIXED: Apply push effect to the target
                    // Impart the tornado's velocity to the target for a brief push
                    const PUSH_FORCE_MULTIPLIER = 1.5; // Adjust push strength
                    target.vx += projectile.vx * PUSH_FORCE_MULTIPLIER;
                    target.vy += projectile.vy * PUSH_FORCE_MULTIPLIER;

                    // Ensure the target is also pushed out of the tornado's collision box
                    resolveCollision(target, projectile);
                }
            });
        }

        // Check for Toast projectiles
        if (projectile.tag === 'toast') {
            // Targets are all characters except the caster of *this specific projectile*
            const targets = allPlayableCharacters.filter(target => target !== projectile.caster);
            targets.forEach(target => {
                if (checkCollision(projectile, target) && !projectile.shouldRemove) {
                    console.log(`Toast from ${projectile.caster.tag} collided with ${target.tag}!`);
                    let damage = 5;
                    // projectile.chargeLevel is now guaranteed to exist due to initialization in createChargingToast
                    if (projectile.chargeLevel === 2) damage = 10;
                    if (projectile.chargeLevel === 3) damage = 15;
                    if (target.tag.includes('toaster') && target.isBlocking) {
                        damage *= 0.75;
                    }
                    target.takeDamage(damage);
                    removeSprite(projectile); // Toast disappears on hit
                }
            });
        }
    }

    // --- Draw Health Bars ---
    if (player1ActiveSprite) {
        drawHealthBar(context, player1ActiveSprite);
    }
    if (player2ActiveSprite) {
        drawHealthBar(context, player2ActiveSprite);
    }
    // No dedicated NPC toaster in this setup unless you explicitly create one
    // if (IdleToaster) { // If you later add a specific NPC toaster
    //     drawHealthBar(context, IdleToaster);
    // }

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
// Function to initialize the actual GameSprite instances for player characters and NPCs
function initializeGameCharacters() {
    // Clear all existing sprites from previous game runs (if any)
    allGameSprites.length = 0;

    // --- Player 1 Character Initialization ---
    let p1StartX = 50;
    let p1StartY; // Will be set based on character type

    if (player1SelectedCharType === 'butterfly') {
        p1StartY = 100; // Butterfly initial Y
        initializePlayer1ButterflySprite(p1StartX, p1StartY); // Call setup for P1 Butterfly
        player1ActiveSprite = ButterflyP1; // Set active sprite to the P1 Butterfly instance
    } else if (player1SelectedCharType === 'toaster') {
        p1StartY = 235; // Toaster initial Y (closer to ground)
        initializePlayer1ToasterSprite(p1StartX, p1StartY); // Call setup for P1 Toaster
        player1ActiveSprite = ToasterP1; // Set active sprite to the P1 Toaster instance
    }
    console.log(`Player 1 initialized as ${player1SelectedCharType}.`);


    // --- Player 2 Character Initialization ---
    let p2StartX = 250;
    let p2StartY; // Will be set based on character type

    if (player2SelectedCharType === 'butterfly') {
        p2StartY = 100; // Butterfly initial Y
        initializePlayer2ButterflySprite(p2StartX, p2StartY); // Call setup for P2 Butterfly (original Butterfly logic)
        player2ActiveSprite = Butterfly; // Set active sprite to the P2 Butterfly instance
    } else if (player2SelectedCharType === 'toaster') {
        p2StartY = 235; // Toaster initial Y
        initializePlayer2ToasterSprite(p2StartX, p2StartY); // Call setup for P2 Toaster (original IdleToaster logic)
        player2ActiveSprite = IdleToaster; // Set active sprite to the P2 Toaster instance
    }
    console.log(`Player 2 initialized as ${player2SelectedCharType}.`);

    // In this "duplicate instance" setup, the original IdleToaster and Butterfly
    // are now potentially used as Player 2. If you want a separate NPC
    // that is always present, you'd initialize a *third* Toaster here,
    // explicitly as an NPC, with its own specific tag and initial position.
    // For now, no additional NPC is implicitly created here.

    console.log("All characters are set up. Starting game loop.");
    gameLoop(); // Start the game loop only once characters are ready
}

function startGameAfterAssetsLoaded() {
    // This function ensures assets are ready before character selection proceeds.
    console.log("Assets loaded. Ready for character selection.");
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
    // Load assets here, so they are ready when the char select screen is shown
    // and before the final game start
    if (!window.gameAssetsLoaded) {
        console.log("Main start button clicked. Loading assets...");
        loadAllImages(() => {
            window.gameAssetsLoaded = true;
            startGameAfterAssetsLoaded();
        });
    } else {
        console.log("Assets already loaded. Proceeding to character select.");
        startGameAfterAssetsLoaded();
    }
});

// Character Selection Logic for Player 1
document.getElementById('char1p1').addEventListener('click', () => {
    player1SelectedCharType = 'butterfly';
    player1HasSelected = true;
    console.log("Player 1 selected Butterfly.");
    // Optionally update UI to show selection (e.g., add a border or text)
});
document.getElementById('char2p1').addEventListener('click', () => {
    player1SelectedCharType = 'toaster';
    player1HasSelected = true;
    console.log("Player 1 selected Toaster.");
    // Optionally update UI to show selection
});

// Character Selection Logic for Player 2
document.getElementById('char1p2').addEventListener('click', () => {
    player2SelectedCharType = 'butterfly';
    player2HasSelected = true;
    console.log("Player 2 selected Butterfly.");
    // Optionally update UI to show selection
});
document.getElementById('char2p2').addEventListener('click', () => {
    player2SelectedCharType = 'toaster';
    player2HasSelected = true;
    console.log("Player 2 selected Toaster.");
    // Optionally update UI to show selection
});


document.getElementById('buttonStart').addEventListener('click', () => {
    if (!player1HasSelected || !player2HasSelected) {
        console.error("Please select a character for both players to confirm you are ready!");
        return;
    }

    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';

    initializeGameCharacters(); // Initialize the player sprites and start the game loop
});
