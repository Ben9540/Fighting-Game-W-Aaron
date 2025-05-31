// --- Global Constants and Variables ---
export const BUTTERFLY_MOVE_SPEED = 0.5;
export const TORNADO_PROJECTILE_SPEED = 2;
export const TORNADO_LIFETIME_FRAMES = 250;
export const TORNADO_COOLDOWN_DURATION = 250;
export const HIT_COOLDOWN_DURATION = 60; // NEW: Cooldown for hit animation (e.g., 1 second)
let tornadoCooldown = 0;
let hitCooldown = 0; // NEW: Cooldown variable for hit animation
export const TOASTER_MOVE_SPEED = 0.5;

// --- Canvas Setup ---
export const canvas = document.getElementById('gameCanvas'); // Make sure your HTML has <canvas id="gameCanvas">
export const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// Array to hold all your active sprites (ONLY ONE OF THESE)
export const allGameSprites = [];

export function addSprite(sprite) {
    allGameSprites.push(sprite);
}

// --- Keyboard State Tracking (ONLY ONE OF THESE) ---
export const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false, // Add 'z' for tornado input, if not already there
    c: false, // Add 'c' for hit input, if not already there
    w: false, // For Toaster movement
    a: false, // For Toaster movement
    s: false, // For Toaster movement
    d: false  // For Toaster movement
};

export const imageAssets = {};
const IMAGE_PATHS = {
    combinedButterfly: 'Bens Sprites/Butterfly.png', // New combined 16x16 sheet
    tornado: 'Bens Sprites/Tornado.png',
    toaster: 'Aarons Sprites/Toaster.png'
};



function loadAllImages(callback) {
    let loadedCount = 0;
    const totalImages = Object.keys(IMAGE_PATHS).length;
    console.log(`Starting to load ${totalImages} images...`);

    if (totalImages === 0) { // Handle case with no images to load
        console.log("No images to load. Proceeding with callback.");
        callback();
        return;
    }

    for (const key in IMAGE_PATHS) {
        const img = new Image();
        img.src = IMAGE_PATHS[key];
        img.onload = () => {
            imageAssets[key] = img; // Assign the loaded Image object
            loadedCount++;
            console.log(`Loaded ${key}: ${img.src}`);
            if (loadedCount === totalImages) {
                console.log("All images loaded.");
                callback(); // Execute the callback ONLY when all are loaded
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${IMAGE_PATHS[key]}`);
            loadedCount++; // Still increment count even on error to prevent infinite wait
            if (loadedCount === totalImages) {
                console.warn("Image loading finished with errors. Proceeding anyway.");
                callback();
            }
        };
    }
}
// Call loadAllImages in your startup sequence (e.g., when start button is clicked)
// document.getElementById('startButton').addEventListener('click', () => { /* ... */ loadAllImages(checkAllSpritesLoaded); });




// --- GameSprite Class (Consolidated from both files) ---
export class GameSprite {
constructor(image, x, y, frameWidth, frameHeight, collisionWidth, collisionHeight, animationSpeed, scale = 1, lifeTime = -1) {
        this.image = image; // This is now an already loaded Image object from imageAssets
        this.x = x; // THIS IS THE TOP-LEFT OF THE COLLISION BOX
        this.y = y; // THIS IS THE TOP-LEFT OF THE COLLISION BOX

        // Dimensions for drawing (e.g., 16x16 from the sheet)
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        // Dimensions for collision (e.g., 8x8 hitbox)
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;

        this.defaultAnimationSpeed = animationSpeed;

        this.scale = scale;

        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = true; // Assumed loaded if passed an Image object

        this.vx = 0; this.vy = 0;
        this.currentRotation = 0;
        this.rotationSpeed = Math.PI / 20;
        this.rotationSmoothness = 0.15;

        this.lifeTime = lifeTime;
        this.lifeRemaining = lifeTime;
        this.shouldRemove = false;
        this.visible = true; // Control visibility of the sprite

        this.animations = {}; // { 'stateName': { framesPerRow: N, start: 0, end: 4, speed: 7, loop: true, nextState: 'idle' } }
        this.currentAnimationState = '';
        this.currentAnimationConfig = null;
    
    }

     setAnimation(state) {
         const config = this.animations[state];
        if (!config) {
            console.warn(`Animation state '${state}' not found for sprite. Available: ${Object.keys(this.animations).join(', ')}`);
            return;
        }

        // Only switch if different state OR if the animation is non-looping
        if (this.currentAnimationState === state && !config.loop) {
            return;
        }

        // Update animation config (frameWidth/Height are fixed for this sprite, so no need to update here)
        // If a specific animation had a *different collision box*, you would update it here.
        // E.g., `this.collisionWidth = config.collisionWidth || this.collisionWidth;`
        this.currentAnimationState = state;
        this.currentAnimationConfig = config;
        this.currentFrame = config.start; // Reset to the start frame of the new animation
        this.frameCounter = 0; // Reset frame counter
        // IMPORTANT: framesPerRow is now dynamic per animation config, if you have varied layouts per animation type
        // If your combined sheet has a fixed framesPerRow (e.g., 3 frames/row for all animations),
        // then framesPerRow can be a fixed property of GameSprite.
        // Assuming a fixed framesPerRow for the combined sheet:
        this.framesPerRow = config.framesPerRow; // This property is part of the animation config now.
    }


    update() {
        // Update animation frame based on currentAnimationConfig
        if (this.currentAnimationConfig) {
            this.frameCounter++;
            if (this.frameCounter >= this.currentAnimationConfig.speed) {
                this.frameCounter = 0;
                this.currentFrame++;

                // Check if animation has reached its end
                if (this.currentFrame > this.currentAnimationConfig.end) {
                    if (this.currentAnimationConfig.loop) {
                        this.currentFrame = this.currentAnimationConfig.start; // Loop back
                    } else {
                        // Non-looping animation finished, revert to idle (or previous state)
                        this.currentFrame = this.currentAnimationConfig.end; // Stay on last frame
                        // This is where you'd typically revert to an 'idle' state
                        // The specific character's module (Ben2.js) will handle this for player actions
                    }
                }
            }
        } else {
            // Fallback if no animation is set (shouldn't happen if initialized properly)
            this.frameCounter++;
            if (this.frameCounter >= this.defaultAnimationSpeed) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.frameCounter = 0;
            }
        }


        // Update Position
        this.x += this.vx;
        this.y += this.vy;

         const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;

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



        // Lifetime Management
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true;
            }
        }

        // Update Rotation
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

       draw(context) {
        if (!this.isLoaded || !this.currentAnimationConfig || !this.visible) return;

        // Calculate source rectangle on the sprite sheet (always based on frame dimensions)
        const sx = (this.currentFrame % this.currentAnimationConfig.framesPerRow) * this.frameWidth; // Use framesPerRow from current animation config
        const sy = Math.floor(this.currentFrame / this.currentAnimationConfig.framesPerRow) * this.frameHeight;

        // Calculate destination size on canvas (always based on frame dimensions and scale)
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;

        // --- CRITICAL CHANGE: Calculate drawing offset to center visual around collision box ---
        // (x, y) is top-left of collision box.
        // We want the visual to be centered over this collision box.
        const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;

        const offsetX = (drawWidth - scaledCollisionWidth) / 2; // Difference in width / 2
        const offsetY = (drawHeight - scaledCollisionHeight) / 2; // Difference in height / 2

        // Destination X, Y for drawing on canvas
        // This means the visual sprite's top-left will be `this.x - offsetX`
        const destX = this.x - offsetX;
        const destY = this.y - offsetY;

        // Calculate center for rotation (relative to the draw position)
        const centerX = destX + drawWidth / 2;
        const centerY = destY + drawHeight / 2;


        context.save();
        context.translate(centerX, centerY);
        context.rotate(this.currentRotation);
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight, // Source rectangle
            -drawWidth / 2, -drawHeight / 2, // Destination (relative to translated center)
            drawWidth, drawHeight // Destination size
        );
        context.restore();

        // Optional: Draw collision box for debugging
        // context.strokeStyle = 'red';
        // context.strokeRect(this.x, this.y, scaledCollisionWidth, scaledCollisionHeight);
    }
}

import { Butterfly, updatePlayerMovement, handleTornadoAttack, initializePlayerSprite, handleHitAttack  } from './Ben2.js';
import { IdleToaster, initializeToasterSprite, updateToasterMovement } from './Aaron.js'; // Import the GameSprite class from Aaron.js

function gameLoop() {

    // --- DEBUGGING: Check allGameSprites at the start of each loop ---
    console.log("--- Game Loop Start ---");
    console.log("allGameSprites count:", allGameSprites.length);
    if (allGameSprites.length > 0) {
        console.log("First sprite in array:", allGameSprites[0]);
    }
    // --- END DEBUGGING ---

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Update Player (Butterfly) Movement
    updatePlayerMovement(Butterfly, keysPressed); // Pass butterfly and keysPressed
    // Update Toaster Movement
    updateToasterMovement(IdleToaster, keysPressed); // Pass toaster and keysPressed


    // Decrement Tornado Cooldown (Managed centrally)
    if (tornadoCooldown > 0) {
        tornadoCooldown--;
    }

     if (hitCooldown > 0) { // NEW: Decrement hit cooldown
        hitCooldown--;
    }

    // Process and Filter all sprites
    const spritesToKeep = [];
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update(); // All sprites update themselves

        if (!sprite.shouldRemove) {
            sprite.draw(context); // Draw each sprite
            spritesToKeep.push(sprite);
        }
    }
    allGameSprites.length = 0;
    allGameSprites.push(...spritesToKeep);

    requestAnimationFrame(gameLoop);
}

// --- Initial Loading Check & Game Start ---
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
        
         if (!Butterfly) { // Ensure it's only initialized once
            initializePlayerSprite();
        }
        if (!IdleToaster) { // Ensure it's only initialized once
            initializeToasterSprite();
        }
        gameLoop(); // Start the game loop
    } else {
        setTimeout(checkAllSpritesLoaded, 100); // Check again
    }
}

// --- Event Listeners (Consolidated from both files) ---
// --- Central Event Listeners (Delegate tasks to other modules) ---
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault();
    }
    // Handle tornado attack logic via the player module
    handleTornadoAttack(event.key, tornadoCooldown, (newCooldown) => { tornadoCooldown = newCooldown; });

    handleHitAttack(event.key, hitCooldown, (newCooldown) => { hitCooldown = newCooldown; }); // NEW: Pass hitCooldown
});

document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});

// Start button listener (from your HTML)
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
});

document.getElementById('buttonStart').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'flex';
    if (!window.gameStartedAndLoaded) {
        console.log("Game start button clicked. Loading assets...");
        loadAllImages(startGameAfterAssetsLoaded); // Pass the startup function as a callback
        window.gameStartedAndLoaded = true; // Set flag
    } else {
        console.log("Game already started/assets already loaded.");
    }
});
