import { GameSprite, addSprite, BUTTERFLY_MOVE_SPEED, TORNADO_PROJECTILE_SPEED, TORNADO_LIFETIME_FRAMES, TORNADO_COOLDOWN_DURATION, HIT_COOLDOWN_DURATION, imageAssets  } from './script.js';


// =========================
// 3. GLOBAL GAME CONSTANTS
// =========================
const TORNADO_SPRITESHEET_KEY = 'tornado'; // Matches the key in script.js IMAGE_PATHS
const TORNADO_FRAME_WIDTH = 8; // Assuming your tornado image frames are 8x8
const TORNADO_FRAME_HEIGHT = 8;
const TORNADO_COLLISION_WIDTH = 8; // Assuming 8x8 collision for tornado
const TORNADO_COLLISION_HEIGHT = 8;
const TORNADO_ANIMATION_SPEED = 15; // From your code



// =========================
// 4. SPRITE INSTANTIATION
// =========================


export let Butterfly; // Declare it but don't initialize it yet

// IMPORTANT: Define the unified sprite sheet key from imageAssets
const BUTTERFLY_SPRITESHEET_KEY = 'combinedButterfly'; // Matches the key in script.js imageAssets

// Visual frame dimensions (actual size on the combined 16x16 spritesheet)
const BUTTERFLY_FRAME_WIDTH = 16;
const BUTTERFLY_FRAME_HEIGHT = 16;

// Desired collision box dimensions (8x8)
const BUTTERFLY_COLLISION_WIDTH = 8;
const BUTTERFLY_COLLISION_HEIGHT = 8;

// Common frames per row for the entire 16x16 combined sheet
// YOU MUST ADJUST THIS TO YOUR ACTUAL SPRITESHEET LAYOUT
const BUTTERFLY_COMMON_FRAMES_PER_ROW = 6; // Example: if your 16x16 sheet has 3 frames per row

// Animation speeds
const IDLE_ANIMATION_SPEED = 7;
const HIT_ANIMATION_SPEED = 5;

export function initializePlayerSprite() {
    // Only create the butterfly when this function is called
    Butterfly = new GameSprite(
        imageAssets[BUTTERFLY_SPRITESHEET_KEY], // Use the pre-loaded combined image
        200, 100, // Initial x, y (top-left of the 8x8 collision box)
        BUTTERFLY_FRAME_WIDTH, BUTTERFLY_FRAME_HEIGHT, // Visual frame dimensions (16x16)
        BUTTERFLY_COLLISION_WIDTH, BUTTERFLY_COLLISION_HEIGHT, // Collision box dimensions (8x8)
        IDLE_ANIMATION_SPEED, // Default animation speed (used if no animation config is set)
        4.5 // scale
        // lifeTime defaults to -1
    );
    addSprite(Butterfly); // Add it to the main sprite array
    console.log("IdleButterfly initialized and added."); // Add a log for debugging
    Butterfly.animations = {
        'idle': { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 0, end: 4, speed: IDLE_ANIMATION_SPEED, loop: true }, // Frames 0-4 for idle
        'hitRight': { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }, // Frames 5-7 for hit right
        'hitLeft': { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }, // Frames 8-10 for hit left
        'hitUp': { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 5, end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }, // Frames 11-13 for hit up
        'hitDown': { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' } // Frames 14-16 for hit down
        // Adjust frame numbers (start/end) and speed based on your actual sprite sheet layout
    };

    Butterfly.setAnimation('idle'); // Set initial animation state
    Butterfly.lastDirection = 'right'; // NEW: Track last facing direction


}

export function handleHitAttack(key, currentCooldown, setCooldownCallback) {
    if (key === 'c') {
        if (currentCooldown > 0) {
            return;
        }
        setCooldownCallback(HIT_COOLDOWN_DURATION); // Use the new hit cooldown

        let hitAnimationState = 'idle'; // Default to idle if direction is unknown

        // Determine which hit animation to play based on last direction
        switch (Butterfly.lastDirection) {
            case 'up': hitAnimationState = 'hitUp'; break;
            case 'down': hitAnimationState = 'hitDown'; break;
            case 'left': hitAnimationState = 'hitLeft'; break;
            case 'right': hitAnimationState = 'hitRight'; break;
            default: hitAnimationState = 'hitRight'; break; // Fallback
        }

        Butterfly.setAnimation(hitAnimationState);
        // You might want to temporarily stop movement during hit animation
        // IdleButterfly.vx = 0;
        // IdleButterfly.vy = 0;

        console.log(`Butterfly performing ${hitAnimationState} attack.`);
    }
}

// Unused/Reference Sprites
 
/*
const upHit = new GameSprite(
    'Bens Sprites/UpButterfly.png',
    200, 100,
    16, 16,
    7,
    3,
    5,
    4.5
);

*/



export function updatePlayerMovement(playerSprite, keys) {
    playerSprite.vx = 0;
    playerSprite.vy = 0;

    // Update lastDirection based on movement
    if (keys.ArrowLeft) {
        playerSprite.vx = -BUTTERFLY_MOVE_SPEED;
        playerSprite.lastDirection = 'left';
    } else if (keys.ArrowRight) {
        playerSprite.vx = BUTTERFLY_MOVE_SPEED;
        playerSprite.lastDirection = 'right';
    }

    // Prioritize horizontal for rotation, but track vertical for hit animation
    if (keys.ArrowUp) {
        playerSprite.vy = -BUTTERFLY_MOVE_SPEED;
        if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'up'; // Only if not moving horizontally
    } else if (keys.ArrowDown) {
        playerSprite.vy = BUTTERFLY_MOVE_SPEED;
        if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'down'; // Only if not moving horizontally
    }

    // If not moving, ensure idle animation is playing (unless an attack is active)
    if (playerSprite.vx === 0 && playerSprite.vy === 0 && playerSprite.currentAnimationState.startsWith('hit') === false) {
        playerSprite.setAnimation('idle');
    } else if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
        // If moving, ensure idle animation is playing (unless an attack is active)
        if (playerSprite.currentAnimationState.startsWith('hit') === false) {
             playerSprite.setAnimation('idle'); // Or a 'run' animation if you have one
        }
    }

    // Check if a non-looping animation has finished and revert to idle
    if (playerSprite.currentAnimationConfig && !playerSprite.currentAnimationConfig.loop &&
        playerSprite.currentFrame === playerSprite.currentAnimationConfig.end) {
        playerSprite.setAnimation(playerSprite.currentAnimationConfig.nextState || 'idle');
    }
}

// Function to handle tornado attack logic (exported)
export function handleTornadoAttack(key, currentCooldown, setCooldownCallback) {
    if (key === 'z') {
        if (currentCooldown > 0) {
            return;
        }
        setCooldownCallback(TORNADO_COOLDOWN_DURATION); // Callback to update cooldown in main.js

        let launchVx = 0;
        let launchVy = 0;

        if (Butterfly.vx !== 0 || Butterfly.vy !== 0) {
            const butterflyCurrentSpeed = Math.sqrt(Butterfly.vx * Butterfly.vx + Butterfly.vy * Butterfly.vy);
            if (butterflyCurrentSpeed > 0) {
                launchVx = (Butterfly.vx / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (Butterfly.vy / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            launchVx = TORNADO_PROJECTILE_SPEED; // Default right if idle
        }

        const newTornado = new GameSprite(
            imageAssets[TORNADO_SPRITESHEET_KEY], // <-- Use the pre-loaded imageAssets object
            Butterfly.x + (Butterfly.frameWidth * Butterfly.scale) / 2 - (TORNADO_COLLISION_WIDTH * Butterfly.scale) / 2,
            Butterfly.y + (Butterfly.frameHeight * Butterfly.scale) / 2 - (TORNADO_COLLISION_HEIGHT * Butterfly.scale) / 2,
            TORNADO_FRAME_WIDTH,
            TORNADO_FRAME_HEIGHT,
            TORNADO_COLLISION_WIDTH,
            TORNADO_COLLISION_HEIGHT,
            TORNADO_ANIMATION_SPEED,
            Butterfly.scale,
            TORNADO_LIFETIME_FRAMES
        );
        newTornado.vx = launchVx;
        newTornado.vy = launchVy;

        // Define tornado animations (you'll need to know your tornado sprite sheet layout)
        newTornado.animations = {
            'default': { framesPerRow: 3, start: 0, end: 6, speed: TORNADO_ANIMATION_SPEED, loop: true } // Example: 3 frames per row, frames 0-6
        };
        newTornado.setAnimation('default'); // Set initial animation for tornado

        addSprite(newTornado);
    }
}

// =========================
// 7. EVENT LISTENERS
// =========================

// --- Movement keys ---

    // --- Tornado launch with 'z' ---
   
    // --- Tornado launch with 'c' (duplicate logic, consider refactoring// filepath: c:\Users\Ben\Documents\GitHub\Fighting-Game-W-Aaron\Ben.js

     