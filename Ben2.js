// ===============================
// 1. IMPORTS & CONSTANTS
// ===============================
import {
    GameSprite,
    addSprite,
    BUTTERFLY_MOVE_SPEED,
    TORNADO_PROJECTILE_SPEED,
    TORNADO_LIFETIME_FRAMES,
    TORNADO_COOLDOWN_DURATION,
    HIT_COOLDOWN_DURATION,
    imageAssets
} from './script.js';

// Tornado sprite sheet and animation constants
const TORNADO_SPRITESHEET_KEY = 'tornado'; // Matches the key in script.js IMAGE_PATHS
const TORNADO_FRAME_WIDTH = 8; // Tornado frame size
const TORNADO_FRAME_HEIGHT = 8;
const TORNADO_COLLISION_WIDTH = 8;
const TORNADO_COLLISION_HEIGHT = 8;
const TORNADO_ANIMATION_SPEED = 5;

// Butterfly sprite sheet and animation constants
export let Butterfly; // Will be initialized in initializePlayerSprite()
const BUTTERFLY_SPRITESHEET_KEY = 'Butterfly'; // Key for imageAssets
const BUTTERFLY_FRAME_WIDTH = 16;
const BUTTERFLY_FRAME_HEIGHT = 16;
const BUTTERFLY_COLLISION_WIDTH = 8;
const BUTTERFLY_COLLISION_HEIGHT = 8;
const BUTTERFLY_COMMON_FRAMES_PER_ROW = 6; // Adjust to your sheet
const IDLE_ANIMATION_SPEED = 10;
const HIT_ANIMATION_SPEED = 5;
export const BUTTERFLY_HIT_DAMAGE = 15; // Damage dealt by Butterfly's hit attack (new)
const DASH_SPEED = 10; // How fast the dash is (adjust as needed)
const DASH_DURATION_FRAMES = 10; // How many frames the dash lasts (adjust as needed)
const DASH_COOLDOWN_DURATION = 60; // Cooldown for dash in frames (60 frames = 1 second at 60fps)


// ===============================
// 2. SPRITE INITIALIZATION
// ===============================
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
    // Set Butterfly specific health
    Butterfly.maxHealth = 100;
    Butterfly.health = Butterfly.maxHealth;
    Butterfly.hasDealtDamageThisAttack = false; // Flag to track if damage has been dealt in current attack


    addSprite(Butterfly); // Add it to the main sprite array
    console.log("IdleButterfly initialized and added."); // Debug log

    // Define animation states for the butterfly
    Butterfly.animations = {
        'idle':      { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 0,  end: 4,  speed: IDLE_ANIMATION_SPEED, loop: true },
        'hitRight':  { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp':     { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 5,  end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitDown':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
        // Adjust frame numbers and speed based on your actual sprite sheet layout
    };

    Butterfly.setAnimation('idle'); // Set initial animation state
    Butterfly.lastDirection = 'right'; // Track last facing direction
}

// ===============================
// 3. PLAYER ATTACK HANDLERS
// ===============================

// Handle hit attack (C key)
// Modified to use the imported checkCollision and apply damage
export function handleHitAttack(key, currentCooldown, setCooldownCallback) {
    if (key === 'c') {
        if (currentCooldown > 0) {
            return;
        }
        setCooldownCallback(HIT_COOLDOWN_DURATION); // Start hit cooldown

        // When starting a new attack, reset the damage dealt flag
        Butterfly.hasDealtDamageThisAttack = false;

        let hitAnimationState = 'idle'; // Default to idle if direction is unknown
        let hitboxOffsetX = 0; // Initialize offsets for this attack
        let hitboxOffsetY = 0;

        const HITBOX_EXTENSION_BASE = 4.5; // Change from 4 to 10
        const HITBOX_EXTENSION_SCALED = HITBOX_EXTENSION_BASE * Butterfly.scale;

        // Determine which hit animation to play based on last direction
        switch (Butterfly.lastDirection) {
            case 'up':
                hitAnimationState = 'hitUp';
                hitboxOffsetY = -HITBOX_EXTENSION_SCALED; // Move hitbox up by scaled amount
                break;
            case 'down':
                hitAnimationState = 'hitDown';
                hitboxOffsetY = HITBOX_EXTENSION_SCALED; // Move hitbox down
                break;
            case 'left':
                hitAnimationState = 'hitLeft';
                hitboxOffsetX = -HITBOX_EXTENSION_SCALED; // Move hitbox left
                break;
            case 'right':
                hitAnimationState = 'hitRight';
                hitboxOffsetX = HITBOX_EXTENSION_SCALED; // Move hitbox right
                break;
            default:
                hitAnimationState = 'hitRight'; // Fallback
                hitboxOffsetX = HITBOX_EXTENSION_SCALED;
                break;
        }

        Butterfly.setAnimation(hitAnimationState);
        // Optionally stop movement during hit animation
        // Butterfly.vx = 0;
        // Butterfly.vy = 0;

        Butterfly.setHitboxOffset(hitboxOffsetX, hitboxOffsetY);

        console.log(`Butterfly performing ${hitAnimationState} attack with hitbox offset (${hitboxOffsetX}, ${hitboxOffsetY}).`);

        // --- NEW: Check for collision with Toaster and apply damage
        // We'll pass `IdleToaster` as an argument or import it directly if needed,
        // but for now, the collision check logic happens in script.js gameLoop
        // after the hit animation and hitbox are set.
        // This function sets up the attack, the game loop handles its effect.
    }
}

// Handle tornado attack (Z key)
export function handleTornadoAttack(key, currentCooldown, setCooldownCallback) {
    if (key === 'z') {
        if (currentCooldown > 0) {
            return;
        }
        setCooldownCallback(TORNADO_COOLDOWN_DURATION); // Start tornado cooldown

        let launchVx = 0;
        let launchVy = 0;

        // Calculate launch direction based on current movement
        if (Butterfly.vx !== 0 || Butterfly.vy !== 0) {
            const butterflyCurrentSpeed = Math.sqrt(Butterfly.vx * Butterfly.vx + Butterfly.vy * Butterfly.vy);
            if (butterflyCurrentSpeed > 0) {
                launchVx = (Butterfly.vx / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (Butterfly.vy / butterflyCurrentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            // If idle, launch in the last known direction
            switch (Butterfly.lastDirection) {
                case 'up': launchVy = -TORNADO_PROJECTILE_SPEED; break;
                case 'down': launchVy = TORNADO_PROJECTILE_SPEED; break;
                case 'left': launchVx = -TORNADO_PROJECTILE_SPEED; break;
                case 'right': launchVx = TORNADO_PROJECTILE_SPEED; break;
                default: launchVx = TORNADO_PROJECTILE_SPEED; break; // Fallback
            }
        }

        // Create the tornado sprite at the butterfly's position
        const newTornado = new GameSprite(
            imageAssets[TORNADO_SPRITESHEET_KEY],
            // Center tornado's collision box on butterfly's collision box
            Butterfly.x + (Butterfly.collisionWidth * Butterfly.scale) / 2 - (TORNADO_COLLISION_WIDTH * Butterfly.scale) / 2,
            Butterfly.y + (Butterfly.collisionHeight * Butterfly.scale) / 2 - (TORNADO_COLLISION_HEIGHT * Butterfly.scale) / 2,
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
        newTornado.caster = Butterfly; // Assign the Butterfly as the caster


        // Define tornado animation (adjust as needed for your sheet)
        newTornado.animations = {
            'default': { framesPerRow: 3, start: 0, end: 6, speed: TORNADO_ANIMATION_SPEED, loop: true }
        };
        newTornado.setAnimation('default');

        addSprite(newTornado);
    }
}

// In Ben2.js, add this function below handleHitAttack and handleTornadoAttack
// Handle Dash Attack (X key)
export function handleDashAttack(key, currentCooldown, setCooldownCallback) {
    if (key === 'x') {
        if (currentCooldown > 0) {
            // console.log("DEBUG: Dash attack on cooldown."); // Optional debug
            return;
        }
        setCooldownCallback(DASH_COOLDOWN_DURATION); // Start dash cooldown

        Butterfly.isDashing = true; // Set a flag indicating the Butterfly is dashing
        Butterfly.dashFramesRemaining = DASH_DURATION_FRAMES; // Set duration counter

        // Determine dash velocity based on last direction
        switch (Butterfly.lastDirection) {
            case 'up':
                Butterfly.dashVx = 0;
                Butterfly.dashVy = -DASH_SPEED;
                break;
            case 'down':
                Butterfly.dashVx = 0;
                Butterfly.dashVy = DASH_SPEED;
                break;
            case 'left':
                Butterfly.dashVx = -DASH_SPEED;
                Butterfly.dashVy = 0;
                break;
            case 'right':
                Butterfly.dashVx = DASH_SPEED;
                Butterfly.dashVy = 0;
                break;
            default: // Fallback to dashing right if no direction known
                Butterfly.dashVx = DASH_SPEED;
                Butterfly.dashVy = 0;
                break;
        }
        // console.log(`DEBUG: Initiating dash in ${Butterfly.lastDirection} with speed (${Butterfly.dashVx}, ${Butterfly.dashVy})`); // Optional debug
    }
}

// ===============================
// 4. PLAYER MOVEMENT HANDLER
// ===============================
export function updatePlayerMovement(playerSprite, keys) {

      if (playerSprite.isDashing) {
        playerSprite.vx = playerSprite.dashVx; // Apply dash velocity
        playerSprite.vy = playerSprite.dashVy;
        playerSprite.dashFramesRemaining--;

        if (playerSprite.dashFramesRemaining <= 0) {
            playerSprite.isDashing = false; // Dash finished
            playerSprite.vx = 0; // Stop dash movement
            playerSprite.vy = 0;
            // console.log("DEBUG: Dash finished."); // Optional debug
            // Optionally, set a specific "dash_end" animation or revert to idle
            // playerSprite.setAnimation('idle');
        }
        // During dash, prevent normal movement input from affecting vx/vy
        // We've already set vx/vy to dash values, so just return or skip normal input processing.
        // The rest of this function's animation/rotation logic still applies.
    } else {
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
        if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'up';
    } else if (keys.ArrowDown) {
        playerSprite.vy = BUTTERFLY_MOVE_SPEED;
        if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'down';
    }

    // DEBUG: Log the current state for movement/animation decisions
    // console.log(`Butterfly Update: vx=${playerSprite.vx}, vy=${playerSprite.vy}, currentState=${playerSprite.currentAnimationState}`);


      // --- Butterfly specific rotation update ---
    // This logic should always apply, regardless of continuous movement keys being held
    let desiredRotation = 0;
    const tiltAngle = playerSprite.rotationSpeed;
    if (playerSprite.vx > 0) { // Moving right
        desiredRotation = tiltAngle;
    } else if (playerSprite.vx < 0) { // Moving left
        desiredRotation = -tiltAngle;
    } else { // Not moving horizontally, gradually return to 0 rotation
        desiredRotation = 0;
    }
    // Smoothly interpolate current rotation towards the desired rotation
    playerSprite.currentRotation = playerSprite.currentRotation * (1 - playerSprite.rotationSmoothness) + desiredRotation * playerSprite.rotationSmoothness;



    // If not moving, ensure idle animation is playing (unless an attack is active)
    if (playerSprite.vx === 0 && playerSprite.vy === 0 && !playerSprite.currentAnimationState.startsWith('hit')) {
        if (playerSprite.currentAnimationState !== 'idle') {
            // console.log("DEBUG: Butterfly setting animation to 'idle' (not moving, not hitting).");
            playerSprite.setAnimation('idle');
        }
    } else if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
        // If moving, ensure idle animation is playing (unless an attack is active)
        if (!playerSprite.currentAnimationState.startsWith('hit')) {
            if (playerSprite.currentAnimationState !== 'idle') {
                // console.log("DEBUG: Butterfly setting animation to 'idle' (moving, not hitting).");
                playerSprite.setAnimation('idle');
            }
        }
    }

    // Check if a non-looping animation has finished and revert to idle
    if (playerSprite.currentAnimationConfig && !playerSprite.currentAnimationConfig.loop &&
        playerSprite.currentFrame >= playerSprite.currentAnimationConfig.end) { // Use >= for robustness
        // --- NEW: If the finished animation was a 'hit' attack, reset the hitbox offset ---
        if (playerSprite.currentAnimationState.startsWith('hit')) {
            playerSprite.resetHitboxOffset();
            // console.log("DEBUG: Hit animation finished, resetting hitbox offset.");
            // --- NEW: Apply damage *after* the animation has completed its hit detection frame
            // This is a simplified approach. In a real game, damage application might
            // happen at a specific frame of the attack animation, not necessarily at the end.
            // For now, if hit animation finishes and a collision was detected, apply damage.
            // This is handled in the game loop now.
        }
        // Then set the next state (usually 'idle')
        playerSprite.setAnimation(playerSprite.currentAnimationConfig.nextState || 'idle');
    }
}
}

// ===============================
// 5. (OPTIONAL) UNUSED/REFERENCE SPRITES
// ===============================
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