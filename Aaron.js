import { GameSprite, addSprite, TOASTER_MOVE_SPEED, imageAssets} from './script.js';


export let IdleToaster; // Declare it but don't initialize it yet
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
        'idle':      { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 0,  end: 0,  speed: IDLE_ANIMATION_SPEED, loop: true },
   /*     'hitRight':  { framesPerRow: toaster_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft':   { framesPerRow: toaster_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp':     { framesPerRow: toaster_COMMON_FRAMES_PER_ROW, start: 5,  end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitDown':   { framesPerRow: toaster_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }*/
        // Adjust frame numbers and speed based on your actual sprite sheet layout
    };

    IdleToaster.setAnimation('idle'); // Set initial animation state
    IdleToaster.lastDirection = 'right'; // Track last facing direction
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

    // Prioritize horizontal for rotation, but track vertical for hit animation
    if (keys.w) {
        if (jumpActive == false) {
                  jump()  
        }
        if (!keys.a && !keys.d) toasterSprite.lastDirection = 'up';
    } 

    // DEBUG: Log the current state for movement/animation decisions
    console.log(`toaster Update: vx=${toasterSprite.vx}, vy=${toasterSprite.vy}, currentState=${toasterSprite.currentAnimationState}`);

    // If not moving, ensure idle animation is playing (unless an attack is active)
    if (toasterSprite.vx === 0 && toasterSprite.vy === 0 && !toasterSprite.currentAnimationState.startsWith('hit')) {
        if (toasterSprite.currentAnimationState !== 'idle') {
            console.log("DEBUG: toaster setting animation to 'idle' (not moving, not hitting).");
            toasterSprite.setAnimation('idle');
        }
    } else if (toasterSprite.vx !== 0 || toasterSprite.vy !== 0) {
        // If moving, ensure idle animation is playing (unless an attack is active)
        if (!toasterSprite.currentAnimationState.startsWith('hit')) {
            if (toasterSprite.currentAnimationState !== 'idle') {
                console.log("DEBUG: toaster setting animation to 'idle' (moving, not hitting).");
                toasterSprite.setAnimation('idle');
            }
        }
    }

    // Check if a non-looping animation has finished and revert to idle
    if (toasterSprite.currentAnimationConfig && !toasterSprite.currentAnimationConfig.loop &&
        toasterSprite.currentFrame >= toasterSprite.currentAnimationConfig.end) { // Use >= for robustness
        // --- NEW: If the finished animation was a 'hit' attack, reset the hitbox offset ---
        if (toasterSprite.currentAnimationState.startsWith('hit')) {
            toasterSprite.resetHitboxOffset();
            console.log("DEBUG: Hit animation finished, resetting hitbox offset.");
        }
        // Then set the next state (usually 'idle')
        toasterSprite.setAnimation(toasterSprite.currentAnimationConfig.nextState || 'idle');
    }


 if (keys.i) {
//special
toastSpecial()
}
if (keys.o) {
//block
}
if (keys.p) {
//basic
}

}

let jumpActive = false;
let jumpDuration = 0;

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}

async function jump(){
    jumpActive = true;
    jumpDuration = 2;
    const totalFrames = 20;
    const jumpHeight = 60;
    const frameDelay = 16;
    for (let i = 0; i < totalFrames; i++) {
        IdleToaster.y -= jumpHeight / totalFrames;
        await sleep(frameDelay);
    }
    for (let i = 0;IdleToaster.y < 235; i++){
        IdleToaster.y += (jumpHeight / totalFrames)*1.18;
        await sleep(frameDelay)
    }
    jumpActive = false
}

let toastCooldown = 0;  // Cooldown to prevent multiple toasts being spawned at once

// Function to handle toast special attack
export function toastSpecial(chargeLevel) {
    if (toastCooldown > 0) return;  // Prevent multiple toasts before cooldown is over

    // Create the toast sprite
    const toast = new GameSprite(
        imageAssets.toastimg,  // The sprite sheet for the toast
        IdleToaster.x + IdleToaster.collisionWidth / 2 - 8,  // Position above the toaster
        IdleToaster.y - 10,    // Slight offset above the toaster
        8, 8,                  // Sprite size (8x8 for each frame in the sprite sheet)
        8, 8,                  // Collision box size (8x8, same as the sprite size)
        5,                     // Animation speed
        1,                     // Scale factor
        -1                     // Lifetime (-1 means it stays until manually removed)
    );

    // Set the animation for the toast sprite based on charge level
    if (chargeLevel === 1) {
        toast.setAnimation('toastCharge1');  // Animation for charge level 1 (first frame in sprite sheet)
    } else if (chargeLevel === 2) {
        toast.setAnimation('toastCharge2');  // Animation for charge level 2 (second frame in sprite sheet)
    } else if (chargeLevel === 3) {
        toast.setAnimation('toastCharge3');  // Animation for charge level 3 (third frame in sprite sheet)
    }

    // Add the toast sprite to the game
    addSprite(toast);

    // Set cooldown to prevent another toast spawn too soon
    toastCooldown = 60;  // Set cooldown time (in frames, adjust as necessary)

    // Start a simple timer to manage the toast disappearing when it hits the top
    toast.update = function() {
        // Update the toast's position to follow the toaster during the charge
        this.x = IdleToaster.x + IdleToaster.collisionWidth / 2 - 8;  // Keep the toast centered with the toaster
        this.y = IdleToaster.y - 10;  // Keep it just above the toaster

        // Move upwards when shot
        if (this.vy !== 0) {
            this.y += this.vy;
        }

        // If the toast has hit the top of the canvas, remove it
        if (this.y <= 0) {
            this.shouldRemove = true;  // Remove toast when it hits the top
        }
    };

    // Once the player releases the charge key (e.g., 'z'), shoot the toast upwards
    setTimeout(() => {
        toast.vy = -5;  // Give it a velocity to move upwards
    }, 200);  // Delay a little bit to let the toast charge before it shoots up
}

// Decrement cooldown for toast special attack
export function updateToastCooldown() {
    if (toastCooldown > 0) {
        toastCooldown--;
    }
}

/*while (health>=0) {
    if (ypos>800){
        ypos --;
        toaster.style.top = ypos + 'px';
    }
    else{

    }
}
*/