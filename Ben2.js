import { GameSprite, addSprite, BUTTERFLY_MOVE_SPEED, TORNADO_PROJECTILE_SPEED, TORNADO_LIFETIME_FRAMES, TORNADO_COOLDOWN_DURATION, HIT_COOLDOWN_DURATION } from './script.js';


// =========================
// 3. GLOBAL GAME CONSTANTS
// =========================



// =========================
// 4. SPRITE INSTANTIATION
// =========================


export let Butterfly; // Declare it but don't initialize it yet

export function initializePlayerSprite() {
    // Only create the butterfly when this function is called
    Butterfly = new GameSprite(
        'Bens Sprites/Butterfly.png',
        200, 100,// x and y pos
        16, 16,// each frame size
        5, //total frames
        6, // frames per row
        10, // animation speed
        4.5 // scale
    );
    addSprite(Butterfly); // Add it to the main sprite array
    console.log("IdleButterfly initialized and added."); // Add a log for debugging
    Butterfly.animations = {
        'idle': { start: 0, end: 4, speed: 30, loop: true }, // Frames 0-4 for idle
        'hitRight': { start: 19, end: 25, speed: 20, loop: false, nextState: 'idle' }, // Frames 5-7 for hit right
        'hitLeft': { start: 11, end: 18, speed: 20, loop: false, nextState: 'idle' }, // Frames 8-10 for hit left
        'hitUp': { start: 5, end: 10, speed: 20, loop: false, nextState: 'idle' }, // Frames 11-13 for hit up
        'hitDown': { start: 26, end: 32, speed: 20, loop: false, nextState: 'idle' } // Frames 14-16 for hit down
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
            'Bens Sprites/Tornado.png',
            Butterfly.x + (Butterfly.frameWidth * Butterfly.scale) / 2 - (8 * Butterfly.scale) / 2,
            Butterfly.y + (Butterfly.frameHeight * Butterfly.scale) / 2 - (8 * Butterfly.scale) / 2,
            8, // each frame size
            8, // each frame size
            7, // total frames
            3, // frames per row
            15, // animation speed
            Butterfly.scale, 
            TORNADO_LIFETIME_FRAMES
        );
        newTornado.vx = launchVx;
        newTornado.vy = launchVy;
        addSprite(newTornado); // Add new tornado to central sprite array
    }
}

// =========================
// 7. EVENT LISTENERS
// =========================

// --- Movement keys ---

    // --- Tornado launch with 'z' ---
   
    // --- Tornado launch with 'c' (duplicate logic, consider refactoring// filepath: c:\Users\Ben\Documents\GitHub\Fighting-Game-W-Aaron\Ben.js

     