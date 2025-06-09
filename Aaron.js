import { GameSprite, addSprite, removeSprite, TOASTER_MOVE_SPEED, imageAssets } from './script.js'; // Added removeSprite import


export let IdleToaster;
export let chargeLevel
const TOASTER_SPRITESHEET_KEY = 'IdleToaster'; // Key for imageAssets
const TOASTER_FRAME_WIDTH = 8;
const TOASTER_FRAME_HEIGHT = 8;
const TOASTER_COLLISION_WIDTH = 8;
const TOASTER_COLLISION_HEIGHT = 8;
const TOASTER_COMMON_FRAMES_PER_ROW = 6; // Adjust to your sheet
const IDLE_ANIMATION_SPEED = 10;
const HIT_ANIMATION_SPEED = 5;

export function initializeToasterSprite() {
    // Only create the toaster when this function is called
    IdleToaster = new GameSprite(
        imageAssets[TOASTER_SPRITESHEET_KEY], // Use the pre-loaded combined image
        50, 235, // Initial x, y (top-left of the 8x8 collision box)
        TOASTER_FRAME_WIDTH, TOASTER_FRAME_HEIGHT, // Visual frame dimensions (16x16)
        TOASTER_COLLISION_WIDTH, TOASTER_COLLISION_HEIGHT, // Collision box dimensions (8x8)
        IDLE_ANIMATION_SPEED, // Default animation speed (used if no animation config is set)
        4.5 // scale
        // lifeTime defaults to -1
    );
    addSprite(IdleToaster); // Add it to the main sprite array
    console.log("Idletoaster initialized and added."); // Debug log

    // Define animation states for the toaster
    IdleToaster.animations = {
        'idle': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 0, end: 0, speed: IDLE_ANIMATION_SPEED, loop: true },
        // Add other animations as needed, e.g.:
        // 'hitRight':  { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        // 'hitLeft':   { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        // 'hitUp':     { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 5,  end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        // 'hitDown':   { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
    };

    IdleToaster.setAnimation('idle'); // Set initial animation state
    IdleToaster.lastDirection = 'right'; // Track last facing direction

    // Add properties for toast charge
    IdleToaster.isChargingToast = false;
    IdleToaster.toastChargeStartTime = 0;
    IdleToaster.currentToastSprite = null; // To hold the toast sprite while charging
}


export function updateToasterMovement(toasterSprite, keys) {
    toasterSprite.vx = 0;
    toasterSprite.vy = 0;

    // Update lastDirection based on movement
    if (keys.a) {
        toasterSprite.vx = -TOASTER_MOVE_SPEED;
        toasterSprite.lastDirection = 'left';
    } else if (keys.d) {
        toasterSprite.vx = TOASTER_MOVE_SPEED;
        toasterSprite.lastDirection = 'right';
    }

    // Handle jump
    if (keys.w) {
        if (jumpActive == false) {
            jump();
        }
        // Don't set lastDirection to 'up' if already moving horizontally for better animation control
        // if (!keys.a && !keys.d) toasterSprite.lastDirection = 'up';
    }

    // Handle toast charge and shot
    if (keys.i && !toasterSprite.isChargingToast && toastCooldown === 0) { // Only start charging if not already and no cooldown
        // Start charging
        toasterSprite.isChargingToast = true;
        toasterSprite.toastChargeStartTime = performance.now(); // Get current time
        toasterSprite.currentToastSprite = createChargingToast(); // Create the toast sprite
        // Link the toast to its caster (Toaster) for collision logic later
        toasterSprite.currentToastSprite.caster = toasterSprite;
        console.log("Started charging toast.");
    } else if (!keys.i && toasterSprite.isChargingToast) {
        // Key 'i' was released, trigger the shot
        toasterSprite.isChargingToast = false;
        const chargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
        let chargeLevel = 1;
        if (chargeDuration > 1000) chargeLevel = 2; // Example: >0.5s is level 2
        if (chargeDuration > 2000) chargeLevel = 3; // Example: >1.5s is level 3

        if (toasterSprite.currentToastSprite) {
            shootToast(toasterSprite.currentToastSprite, chargeLevel);
            toasterSprite.currentToastSprite = null; // Clear the reference to the now flying toast
        }
        console.log(`Released 'i', charge duration: ${chargeDuration}, level: ${chargeLevel}`);
    }

    // If still charging, update toast position and animation
    if (toasterSprite.isChargingToast && toasterSprite.currentToastSprite) {
        toasterSprite.currentToastSprite.x = toasterSprite.x + toasterSprite.collisionWidth / 2 - 4; // Centered above toaster
        toasterSprite.currentToastSprite.y = toasterSprite.y - 10;

        const currentChargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
        // Update toast animation based on charge duration
        if (currentChargeDuration > 2000) {
            toasterSprite.currentToastSprite.setAnimation('toastCharge3');
            
        } else if (currentChargeDuration > 1000) {
            toasterSprite.currentToastSprite.setAnimation('toastCharge2');
        } else {
            toasterSprite.currentToastSprite.setAnimation('toastCharge1');
        }
    }

    if (toasterSprite.vx === 0 && toasterSprite.vy === 0 && !toasterSprite.currentAnimationState.startsWith('hit')) {
        if (toasterSprite.currentAnimationState !== 'idle') {
 
            toasterSprite.setAnimation('idle');
        }
    } else if (toasterSprite.vx !== 0 || toasterSprite.vy !== 0) {
        if (!toasterSprite.currentAnimationState.startsWith('hit')) {
            if (toasterSprite.currentAnimationState !== 'idle') {

                toasterSprite.setAnimation('idle');
            }
        }
    }

    // Check if a non-looping animation has finished and revert to idle
    if (toasterSprite.currentAnimationConfig && !toasterSprite.currentAnimationConfig.loop &&
        toasterSprite.currentFrame >= toasterSprite.currentAnimationConfig.end) { // Use >= for robustness
        // If the finished animation was a 'hit' attack, reset the hitbox offset
        if (toasterSprite.currentAnimationState.startsWith('hit')) {
            toasterSprite.resetHitboxOffset();
            console.log("DEBUG: Hit animation finished, resetting hitbox offset.");
        }
        // Then set the next state (usually 'idle')
        toasterSprite.setAnimation(toasterSprite.currentAnimationConfig.nextState || 'idle');
    }

if (keys.o){
//block
}
if (keys.p) {

}
}

let jumpActive = false;
const GROUND_Y = 235;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function jump() {
    jumpActive = true;
    const totalFrames = 20;
    const jumpHeight = 60;
    const frameDelay = 16; 

    // Ascend
    for (let i = 0; i < totalFrames; i++) {
        IdleToaster.y -= jumpHeight / totalFrames;
        IdleToaster.y = Math.max(0, IdleToaster.y);
        await sleep(frameDelay);
    }
    // Descend
    for (let i = 0;  i < totalFrames && IdleToaster.y < GROUND_Y; i++) {
        IdleToaster.y += (jumpHeight / totalFrames) * 1.18;
        IdleToaster.y = Math.min(GROUND_Y, IdleToaster.y);
        await sleep(frameDelay)
    }
    jumpActive = false;
}

let toastCooldown = 0;

function createChargingToast() {
    const toast = new GameSprite(
        imageAssets.toastimg,
        IdleToaster.x + (TOASTER_FRAME_WIDTH * IdleToaster.scale) / 2 - (8 * 1) / 2,  // Position above the toaster (adjusted for 8x8 sprite)
        IdleToaster.y - 10,  // Slight offset above the toaster
        8, 8,                // Sprite size (8x8 for each frame in the sprite sheet)
        8, 8,                // Collision box size (8x8, same as the sprite size)
        5,                   // Animation speed
        4,                   // Scale factor
        -1                   // Lifetime (-1 means it stays until manually removed)
    );

    // Define animation states for the toast sprite
    // You need to adjust these frame numbers based on your actual 'Bread.png' spritesheet
    toast.animations = {
        'toastCharge1': { framesPerRow: 1, start: 0, end: 0, speed: 10, loop: true }, // Example: First frame for charge level 1
        'toastCharge2': { framesPerRow: 2, start: 1, end: 1, speed: 10, loop: true }, // Example: Second frame for charge level 2
        'toastCharge3': { framesPerRow: 1, start: 1, end: 1, speed: 10, loop: true }, // Example: Third frame for charge level 3
    };
    toast.setAnimation('toastCharge1'); // Start with the first charge animation

    addSprite(toast); // Add it to the main sprite array
    return toast;
}

// Function to handle toast projectile shot
function shootToast(toastSprite, chargeLevel) {
    toastSprite.vy = -5;
    toastSprite.vx = 0;
    toastSprite.lifeTime = 60;
    toastSprite.lifeRemaining = toastSprite.lifeTime;
    toastCooldown = 60; // Set cooldown time (in frames, e.g., 1 second)
    console.log(`Toast shot with charge level: ${chargeLevel}, speed: ${toastSprite.vy}`);
}

export function updateToastCooldown() {
    if (toastCooldown > 0) {
        toastCooldown--;
    }
}