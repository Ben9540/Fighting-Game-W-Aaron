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




// --- GameSprite Class (Consolidated from both files) ---
export class GameSprite {
    constructor(imageSrc, x, y, frameWidth, frameHeight, totalFrames, framesPerRow, animationSpeed, scale = 1, lifeTime = -1) {
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
        this.defaultAnimationSpeed = animationSpeed; // Store default speed

        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = false;

        this.vx = 0;
        this.vy = 0;
        this.currentRotation = 0;
        this.rotationSpeed = Math.PI / 20;
        this.rotationSmoothness = 0.15;

        this.lifeTime = lifeTime;
        this.lifeRemaining = lifeTime;
        this.shouldRemove = false;

        this.animations = {}; // Stores animation configurations { 'idle': { start: 0, end: 4, speed: 7, loop: true }, ... }
        this.currentAnimationState = ''; // e.g., 'idle', 'hitUp'
        this.currentAnimationConfig = null; // The config object for the current state

        this.image.onload = () => {
            this.isLoaded = true;
            // console.log(`Sprite loaded: ${imageSrc}`); // Optional: for debugging
        };
        this.image.onerror = () => {
            console.error(`Error loading sprite: ${imageSrc}`);
        };
    }

     setAnimation(state) {
        if (this.currentAnimationState === state) {
            return; // Animation is already playing
        }
        const config = this.animations[state];
        if (!config) {
            console.warn(`Animation state '${state}' not found for sprite.`);
            return;
        }

        this.currentAnimationState = state;
        this.currentAnimationConfig = config;
        this.currentFrame = config.start; // Reset to the start frame of the new animation
        this.frameCounter = 0; // Reset frame counter
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

        // Canvas Boundary Checks (Barriers)
        const scaledWidth = this.frameWidth * this.scale;
        const scaledHeight = this.frameHeight * this.scale;
        if (this.x < 0) {
            this.x = 0; this.vx = 0;
        } else if (this.x + scaledWidth > canvas.width) {
            this.x = canvas.width - scaledWidth; this.vx = 0;
        }
        if (this.y < 0) {
            this.y = 0; this.vy = 0;
        } else if (this.y + scaledHeight > canvas.height) {
            this.y = canvas.height - scaledHeight; this.vy = 0;
        }

        // Lifetime Management
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) {
                this.shouldRemove = true;
            }
        }

        // Update Rotation
    if (this === IdleButterfly) {
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

import { IdleButterfly, updatePlayerMovement, handleTornadoAttack, initializePlayerSprite  } from './Ben2.js';
import { IdleToaster, initializeToasterSprite, updateToasterMovement } from './Aaron.js'; // Import the GameSprite class from Aaron.js

function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Update Player (Butterfly) Movement
    updatePlayerMovement(IdleButterfly, keysPressed); // Pass butterfly and keysPressed
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
         if (!IdleButterfly) { // Ensure it's only initialized once
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
    checkAllSpritesLoaded(); // Start the game after assets load
});

document.getElementById('buttonStart').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'flex';
    checkAllSpritesLoaded(); // Start the game after assets load
});



// ... (Previous Event Listeners, etc.) ...

/*
// --- Game Loop (Consolidated from both files) ---
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // --- Update Butterfly Velocity based on Key State ---
    IdleButterfly.vx = 0;
    IdleButterfly.vy = 0;
    if (keysPressed.ArrowLeft) {
        IdleButterfly.vx = -BUTTERFLY_MOVE_SPEED;
    } else if (keysPressed.ArrowRight) {
        IdleButterfly.vx = BUTTERFLY_MOVE_SPEED;
    }
    if (keysPressed.ArrowUp) {
        IdleButterfly.vy = -BUTTERFLY_MOVE_SPEED;
    } else if (keysPressed.ArrowDown) {
        IdleButterfly.vy = BUTTERFLY_MOVE_SPEED;
    }

    // --- Example: Update Second Character Velocity (if applicable) ---
    // SecondCharacter.vx = 0;
    // SecondCharacter.vy = 0;
    // if (keysPressed.KeyW) { SecondCharacter.vy = -SOME_OTHER_SPEED; }
    // ... etc.

    // --- Decrement Tornado Cooldown Timer ---
    if (tornadoCooldown > 0) {
        tornadoCooldown--;
    }

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

// --- Initial Loading Check (Consolidated from both files) ---
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
        gameLoop(); // Start the game loop only once all assets are ready
    } else {
        setTimeout(checkAllSpritesLoaded, 100); // Check again in 100ms
    }
} */



// --- Initiate the loading check (at the very end of your main.js file) ---
checkAllSpritesLoaded();