import { GameSprite, addSprite, removeSprite, TOASTER_MOVE_SPEED, imageAssets } from './script.js';
import { HIT_COOLDOWN_DURATION } from './script.js';

// Exported for script.js to access toaster-specific constants
export const TOASTER_HIT_DAMAGE = 7.5; // Shared damage constant for Toaster's hit

// Internal constants for Toaster logic (shared across Toaster types)
const TOASTER_FRAME_WIDTH = 8;
const TOASTER_FRAME_HEIGHT = 8;
const TOASTER_COLLISION_WIDTH = 8;
const TOASTER_COLLISION_HEIGHT = 8;
const TOASTER_COMMON_FRAMES_PER_ROW = 4;
const IDLE_ANIMATION_SPEED = 10;
const HIT_ANIMATION_SPEED = 7;
const GROUND_Y = 235; // Ground Y for toaster's jump


// ===============================
// PLAYER 1 TOASTER (WASD, I, O, P Keys) - Uses ToasterP1.png
// ===============================
export let ToasterP1; // Global instance for Player 1 Toaster

// Initializes/configures the Player 1 Toaster sprite
export function initializePlayer1ToasterSprite(initialX, initialY) {
    ToasterP1 = new GameSprite(
        imageAssets.ToasterP1, // Use P1 specific image
        initialX, initialY,
        TOASTER_FRAME_WIDTH, TOASTER_FRAME_HEIGHT,
        TOASTER_COLLISION_WIDTH, TOASTER_COLLISION_HEIGHT,
        IDLE_ANIMATION_SPEED,
        4.5, // scale
        -1, // lifeTime
        'player1-toaster' // Tag for identification
    );
    ToasterP1.maxHealth = 100;
    ToasterP1.health = ToasterP1.maxHealth;
    ToasterP1.hasDealtDamageThisAttack2 = false; // For Toaster's hit attack
    ToasterP1.isChargingToast = false;
    ToasterP1.toastChargeStartTime = 0;
    ToasterP1.currentToastSprite = null;
    ToasterP1.currentBlock = null;
    ToasterP1.isBlocking = false;
    ToasterP1.jumpActive = false;
    ToasterP1.toastCooldown = 0; // Individual cooldown for this toaster instance

    ToasterP1.animations = {
        'idle': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 0, end: 0, speed: IDLE_ANIMATION_SPEED, loop: true },
        'hitRight': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 9, end: 12, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 5, end: 8, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 2, end: 5, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
    };
    ToasterP1.setAnimation('idle');
    ToasterP1.lastDirection = 'right';
    import('./script.js').then(({ addSprite }) => { addSprite(ToasterP1); }); // Add to global sprite array
}

// Update movement for Player 1 Toaster
export function updatePlayer1ToasterMovement(keys) {
    const toasterSprite = ToasterP1; // Directly reference the global P1 Toaster instance
    if (!toasterSprite) return;

    toasterSprite.vx = 0;
    toasterSprite.vy = 0;

    // Handle blocking (O key)
    if (keys.ability) { // 'O' key for P1
        if (!toasterSprite.isBlocking) {
            toasterSprite.isBlocking = true;
            toasterSprite.currentBlock = createBlock(toasterSprite);
        }
    } else {
        if (toasterSprite.isBlocking) {
            toasterSprite.isBlocking = false;
            if (toasterSprite.currentBlock) {
                removeSprite(toasterSprite.currentBlock);
                toasterSprite.currentBlock = null;
            }
        }
    }

    // Movement (WASD keys)
    if (!toasterSprite.isBlocking) {
        if (keys.ArrowLeft) { toasterSprite.vx = -TOASTER_MOVE_SPEED; toasterSprite.lastDirection = 'left'; }
        else if (keys.ArrowRight) { toasterSprite.vx = TOASTER_MOVE_SPEED; toasterSprite.lastDirection = 'right'; }
    }

    // Jump (W key)
    if (keys.ArrowUp) { // 'W' key for P1
        toasterSprite.lastDirection = 'up';
        if (!toasterSprite.jumpActive) { jump(toasterSprite); }
    }

    // Toast charge and shoot (I key)
    if (!toasterSprite.isBlocking) {
        if (keys.attack1 && !toasterSprite.isChargingToast && toasterSprite.toastCooldown === 0) { // 'I' key for P1
            toasterSprite.isChargingToast = true;
            toasterSprite.toastChargeStartTime = performance.now();
            toasterSprite.currentToastSprite = createChargingToast(toasterSprite);
            toasterSprite.currentToastSprite.caster = toasterSprite;
            console.log(`P1 Toaster started charging toast.`);
        } else if (!keys.attack1 && toasterSprite.isChargingToast) {
            toasterSprite.isChargingToast = false;
            const chargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
            let currentChargeLevel = 1;
            if (chargeDuration > 1000) currentChargeLevel = 2;
            if (chargeDuration > 2000) currentChargeLevel = 3;
            if (toasterSprite.currentToastSprite) {
                shootToast(toasterSprite.currentToastSprite, currentChargeLevel, toasterSprite);
                toasterSprite.currentToastSprite = null;
            }
            console.log(`P1 Toaster released toast, charge: ${chargeDuration}, level: ${currentChargeLevel}`);
        }
        if (toasterSprite.isChargingToast && toasterSprite.currentToastSprite) {
            toasterSprite.toastCooldown = 60;
            toasterSprite.currentToastSprite.x = toasterSprite.x + (toasterSprite.collisionWidth * toasterSprite.scale) / 2 - (toasterSprite.currentToastSprite.collisionWidth * toasterSprite.currentToastSprite.scale) / 2;
            toasterSprite.currentToastSprite.y = toasterSprite.y - 10;
            const currentChargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
            if (currentChargeDuration > 2000) { toasterSprite.currentToastSprite.setAnimation('toastCharge3'); }
            else if (currentChargeDuration > 1000) { toasterSprite.currentToastSprite.setAnimation('toastCharge2'); }
            else { toasterSprite.currentToastSprite.setAnimation('toastCharge1'); }
        }
    }

    // Animation state
    if (toasterSprite.vx === 0 && toasterSprite.vy === 0 && !toasterSprite.currentAnimationState.startsWith('hit') && !toasterSprite.isChargingToast && !toasterSprite.isBlocking) {
        if (toasterSprite.currentAnimationState !== 'idle') { toasterSprite.setAnimation('idle'); }
    } else if ((toasterSprite.vx !== 0 || toasterSprite.vy !== 0) && !toasterSprite.currentAnimationState.startsWith('hit') && !toasterSprite.isChargingToast && !toasterSprite.isBlocking) {
        if (toasterSprite.currentAnimationState !== 'idle') { toasterSprite.setAnimation('idle'); }
    }
    if (toasterSprite.currentAnimationConfig && !toasterSprite.currentAnimationConfig.loop && toasterSprite.currentFrame >= toasterSprite.currentAnimationConfig.end) {
        if (toasterSprite.currentAnimationState.startsWith('hit')) { toasterSprite.resetHitboxOffset(); }
        toasterSprite.setAnimation(toasterSprite.currentAnimationConfig.nextState || 'idle');
    }
}

// Handle Player 1 Toaster basic attack (P key)
export function handlePlayer1ToasterHitAttack(key, currentCooldown, setCooldownCallback) {
    const toasterSprite = ToasterP1; // Directly reference the global P1 Toaster instance
    if (!toasterSprite || key === null) return; // Only execute if key is pressed and not null

    if (!toasterSprite.isBlocking) {
        if (key === 'p') { // 'P' key for P1
            if (currentCooldown > 0) { return; }
            toasterSprite.hasDealtDamageThisAttack2 = false;
            setCooldownCallback(HIT_COOLDOWN_DURATION);
            let hitAnimationState = 'idle'; let hitboxOffsetX = 0; let hitboxOffsetY = 0;
            const HITBOX_EXTENSION_SCALED = 4 * toasterSprite.scale;
            switch (toasterSprite.lastDirection) {
                case 'up': hitAnimationState = 'hitUp'; hitboxOffsetY = -HITBOX_EXTENSION_SCALED / 2; break;
                case 'left': hitAnimationState = 'hitLeft'; hitboxOffsetX = -HITBOX_EXTENSION_SCALED; break;
                case 'right': hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
                default: hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
            }
            toasterSprite.setAnimation(hitAnimationState);
            toasterSprite.setHitboxOffset(hitboxOffsetX, hitboxOffsetY);
            console.log(`P1 Toaster performing ${hitAnimationState} attack.`);
        }
    }
}

// Update P1 Toaster's toast cooldown
export function updatePlayer1ToastCooldown() {
    const toasterSprite = ToasterP1;
    if (toasterSprite && toasterSprite.toastCooldown > 0) {
        toasterSprite.toastCooldown--;
    }
    if (toasterSprite.isBlocking && toasterSprite.currentBlock) {
        toasterSprite.currentBlock.x = toasterSprite.x;
        toasterSprite.currentBlock.y = toasterSprite.y;
    }
}


// ===============================
// PLAYER 2 TOASTER (Arrow Keys, Z, C, X Keys) - Uses original IdleToaster.png
// ===============================
export let IdleToaster; // Original global instance for Player 2 Toaster (or NPC if P2 selects Butterfly)

// Initializes/configures the Player 2 Toaster sprite
export function initializePlayer2ToasterSprite(initialX, initialY) {
    IdleToaster = new GameSprite(
        imageAssets.IdleToaster, // Use original Toaster image
        initialX, initialY,
        TOASTER_FRAME_WIDTH, TOASTER_FRAME_HEIGHT,
        TOASTER_COLLISION_WIDTH, TOASTER_COLLISION_HEIGHT,
        IDLE_ANIMATION_SPEED,
        4.5, // scale
        -1, // lifeTime
        'player2-toaster' // Tag for identification
    );
    IdleToaster.maxHealth = 100;
    IdleToaster.health = IdleToaster.maxHealth;
    IdleToaster.hasDealtDamageThisAttack2 = false;
    IdleToaster.isChargingToast = false;
    IdleToaster.toastChargeStartTime = 0;
    IdleToaster.currentToastSprite = null;
    IdleToaster.currentBlock = null;
    IdleToaster.isBlocking = false;
    IdleToaster.jumpActive = false;
    IdleToaster.toastCooldown = 0; // Individual cooldown for this toaster instance

    IdleToaster.animations = {
        'idle': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 0, end: 0, speed: IDLE_ANIMATION_SPEED, loop: true },
        'hitRight': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 9, end: 12, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 5, end: 8, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 2, end: 5, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
    };
    IdleToaster.setAnimation('idle');
    IdleToaster.lastDirection = 'right';
    import('./script.js').then(({ addSprite }) => { addSprite(IdleToaster); }); // Add to global sprite array
}


// Update movement for Player 2 Toaster
export function updatePlayer2ToasterMovement(keys) {
    const toasterSprite = IdleToaster; // Directly reference the global P2 Toaster instance
    if (!toasterSprite) return;

    toasterSprite.vx = 0;
    toasterSprite.vy = 0;

    // Handle blocking (X key)
    if (keys.ability) { // 'X' key for P2
        if (!toasterSprite.isBlocking) {
            toasterSprite.isBlocking = true;
            toasterSprite.currentBlock = createBlock(toasterSprite);
        }
    } else {
        if (toasterSprite.isBlocking) {
            toasterSprite.isBlocking = false;
            if (toasterSprite.currentBlock) {
                removeSprite(toasterSprite.currentBlock);
                toasterSprite.currentBlock = null;
            }
        }
    }

    // Movement (Arrow keys)
    if (!toasterSprite.isBlocking) {
        if (keys.ArrowLeft) { toasterSprite.vx = -TOASTER_MOVE_SPEED; toasterSprite.lastDirection = 'left'; }
        else if (keys.ArrowRight) { toasterSprite.vx = TOASTER_MOVE_SPEED; toasterSprite.lastDirection = 'right'; }
    }

    // Jump (ArrowUp key)
    if (keys.ArrowUp) { // 'ArrowUp' key for P2
        toasterSprite.lastDirection = 'up';
        if (!toasterSprite.jumpActive) { jump(toasterSprite); }
    }

    // Toast charge and shoot (Z key)
    if (!toasterSprite.isBlocking) {
        if (keys.attack1 && !toasterSprite.isChargingToast && toasterSprite.toastCooldown === 0) { // 'Z' key for P2
            toasterSprite.isChargingToast = true;
            toasterSprite.toastChargeStartTime = performance.now();
            toasterSprite.currentToastSprite = createChargingToast(toasterSprite);
            toasterSprite.currentToastSprite.caster = toasterSprite;
            console.log(`P2 Toaster started charging toast.`);
        } else if (!keys.attack1 && toasterSprite.isChargingToast) {
            toasterSprite.isChargingToast = false;
            const chargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
            let currentChargeLevel = 1;
            if (chargeDuration > 1000) currentChargeLevel = 2;
            if (chargeDuration > 2000) currentChargeLevel = 3;
            if (toasterSprite.currentToastSprite) {
                shootToast(toasterSprite.currentToastSprite, currentChargeLevel, toasterSprite);
                toasterSprite.currentToastSprite = null;
            }
            console.log(`P2 Toaster released toast, charge: ${chargeDuration}, level: ${currentChargeLevel}`);
        }
        if (toasterSprite.isChargingToast && toasterSprite.currentToastSprite) {
            toasterSprite.toastCooldown = 60;
            toasterSprite.currentToastSprite.x = toasterSprite.x + (toasterSprite.collisionWidth * toasterSprite.scale) / 2 - (toasterSprite.currentToastSprite.collisionWidth * toasterSprite.currentToastSprite.scale) / 2;
            toasterSprite.currentToastSprite.y = toasterSprite.y - 10;
            const currentChargeDuration = performance.now() - toasterSprite.toastChargeStartTime;
            if (currentChargeDuration > 2000) { toasterSprite.currentToastSprite.setAnimation('toastCharge3'); }
            else if (currentChargeDuration > 1000) { toasterSprite.currentToastSprite.setAnimation('toastCharge2'); }
            else { toasterSprite.currentToastSprite.setAnimation('toastCharge1'); }
        }
    }

    // Animation state
    if (toasterSprite.vx === 0 && toasterSprite.vy === 0 && !toasterSprite.currentAnimationState.startsWith('hit') && !toasterSprite.isChargingToast && !toasterSprite.isBlocking) {
        if (toasterSprite.currentAnimationState !== 'idle') { toasterSprite.setAnimation('idle'); }
    } else if ((toasterSprite.vx !== 0 || toasterSprite.vy !== 0) && !toasterSprite.currentAnimationState.startsWith('hit') && !toasterSprite.isChargingToast && !toasterSprite.isBlocking) {
        if (toasterSprite.currentAnimationState !== 'idle') { toasterSprite.setAnimation('idle'); }
    }
    if (toasterSprite.currentAnimationConfig && !toasterSprite.currentAnimationConfig.loop && toasterSprite.currentFrame >= toasterSprite.currentAnimationConfig.end) {
        if (toasterSprite.currentAnimationState.startsWith('hit')) { toasterSprite.resetHitboxOffset(); }
        toasterSprite.setAnimation(toasterSprite.currentAnimationConfig.nextState || 'idle');
    }
}

// Handle Player 2 Toaster basic attack (C key)
export function handlePlayer2ToasterHitAttack(key, currentCooldown, setCooldownCallback) {
    const toasterSprite = IdleToaster; // Directly reference the global P2 Toaster instance
    if (!toasterSprite || key === null) return; // Only execute if key is pressed and not null

    if (!toasterSprite.isBlocking) {
        if (key === 'c') { // 'C' key for P2
            if (currentCooldown > 0) { return; }
            toasterSprite.hasDealtDamageThisAttack2 = false;
            setCooldownCallback(HIT_COOLDOWN_DURATION);
            let hitAnimationState = 'idle'; let hitboxOffsetX = 0; let hitboxOffsetY = 0;
            const HITBOX_EXTENSION_SCALED = 4 * toasterSprite.scale;
            switch (toasterSprite.lastDirection) {
                case 'up': hitAnimationState = 'hitUp'; hitboxOffsetY = -HITBOX_EXTENSION_SCALED / 2; break;
                case 'left': hitAnimationState = 'hitLeft'; hitboxOffsetX = -HITBOX_EXTENSION_SCALED; break;
                case 'right': hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
                default: hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
            }
            toasterSprite.setAnimation(hitAnimationState);
            toasterSprite.setHitboxOffset(hitboxOffsetX, hitboxOffsetY);
            console.log(`P2 Toaster performing ${hitAnimationState} attack.`);
        }
    }
}

// Update P2 Toaster's toast cooldown
export function updatePlayer2ToastCooldown() {
    const toasterSprite = IdleToaster;
    if (toasterSprite && toasterSprite.toastCooldown > 0) {
        toasterSprite.toastCooldown--;
    }
    if (toasterSprite.isBlocking && toasterSprite.currentBlock) {
        toasterSprite.currentBlock.x = toasterSprite.x;
        toasterSprite.currentBlock.y = toasterSprite.y;
    }
}

// ===============================
// SHARED TOASTER HELPER FUNCTIONS (used by both P1 and P2 Toaster logic)
// ===============================

// Utility sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handles the Toaster's jump movement.
 * @param {GameSprite} toasterSprite - The specific Toaster sprite jumping.
 */
async function jump(toasterSprite) {
    toasterSprite.jumpActive = true;
    const totalFrames = 40;
    const jumpHeight = 60;
    const frameDelay = 8;

    for (let i = 0; i < totalFrames; i++) {
        toasterSprite.y -= jumpHeight / totalFrames;
        toasterSprite.y = Math.max(0, toasterSprite.y);
        await sleep(frameDelay);
    }
    for (let i = 0; i < totalFrames || toasterSprite.y < GROUND_Y; i++) {
        toasterSprite.y += (jumpHeight / totalFrames) * 1.18;
        toasterSprite.y = Math.min(GROUND_Y, toasterSprite.y);
        await sleep(frameDelay);
    }
    toasterSprite.jumpActive = false;
}

/**
 * Creates a toast sprite for charging.
 * @param {GameSprite} toasterSprite - The toaster sprite that is charging the toast.
 * @returns {GameSprite} The newly created toast sprite.
 */
function createChargingToast(toasterSprite) {
    const toast = new GameSprite(
        imageAssets.toastimg,
        toasterSprite.x + (toasterSprite.collisionWidth * toasterSprite.scale) / 2 - (8 * toasterSprite.scale) / 2,
        toasterSprite.y - 10,
        8, 8,
        8, 8,
        5,
        toasterSprite.scale,
        -1,
        'toast'
    );
    // Initialize chargeLevel here to prevent undefined errors
    toast.chargeLevel = 1;

    toast.animations = {
        'toastCharge1': { framesPerRow: 2, start: 0, end: 0, speed: 10, loop: true },
        'toastCharge2': { framesPerRow: 2, start: 1, end: 1, speed: 10, loop: true },
        'toastCharge3': { framesPerRow: 2, start: 2, end: 2, speed: 10, loop: true },
    };
    toast.setAnimation('toastCharge1');
    import('./script.js').then(({ addSprite }) => { addSprite(toast); });
    return toast;
}

/**
 * Handles the logic for shooting the toast.
 * @param {GameSprite} toastSprite - The toast projectile sprite.
 * @param {number} chargeLevel - The charge level (1, 2, or 3) indicating damage and speed.
 * @param {GameSprite} caster - The toaster sprite that launched this toast.
 */
export function shootToast(toastSprite, chargeLevel, caster) {
    if (!toastSprite) return;

    const TOAST_SPEED_BASE = 6;
    const TOAST_SPEED_MULTIPLIER = 1; // Each charge level increases speed by this factor

    toastSprite.chargeLevel = chargeLevel; // Set the actual charge level for damage calculation later
    toastSprite.caster = caster; // Assign the caster

    let launchVx = TOAST_SPEED_BASE; // Default to right
    let launchVy = 0;

    // Determine launch direction based on the toaster's last direction
    switch (caster.lastDirection) {
        case 'up': launchVy = -TOAST_SPEED_BASE; launchVx = 0; break;
        case 'down': launchVy = TOAST_SPEED_BASE; launchVx = 0; break;
        case 'left': launchVx = -TOAST_SPEED_BASE; break;
        case 'right': launchVx = TOAST_SPEED_BASE; break;
        default: launchVx = TOAST_SPEED_BASE; break; // Default to right if no direction
    }

    // Apply speed based on charge level
    if (chargeLevel === 2) {
        launchVx *= TOAST_SPEED_MULTIPLIER;
        launchVy *= TOAST_SPEED_MULTIPLIER;
    } else if (chargeLevel === 3) {
        launchVx *= (TOAST_SPEED_MULTIPLIER * 2); // Double multiplier for level 3
        launchVy *= (TOAST_SPEED_MULTIPLIER * 2);
    }

    toastSprite.vx = launchVx;
    toastSprite.vy = launchVy;
    toastSprite.lifeTime = 60; // Toast exists for 3 seconds (60 frames/sec * 3) or until collision
    toastSprite.lifeRemaining = toastSprite.lifeTime;
    console.log(`Shot toast with charge level ${chargeLevel}. Speed: (${toastSprite.vx}, ${toastSprite.vy})`);
}

/**
 * Creates a block sprite (used by Toaster).
 * @param {GameSprite} toasterSprite - The toaster sprite creating the block.
 * @returns {GameSprite} The newly created block sprite.
 */
function createBlock(toasterSprite) {
    let blockImage = imageAssets.blockp1;
    // Determine block image based on player tag for different colors
    if (toasterSprite.tag === 'player2-toaster') {
        blockImage = imageAssets.blockp2;
        blockImage.animations = {
            'spin': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 1, end: 9, speed: IDLE_ANIMATION_SPEED, loop: true }
        };
    }
    else{
        blockImage.animations = {
            'spin': { framesPerRow: TOASTER_COMMON_FRAMES_PER_ROW, start: 1, end: 9, speed: IDLE_ANIMATION_SPEED, loop: true }
        };
    }
    // For NPC toaster if applicable, might have a default or specific block image
    // else if (toasterSprite.tag === 'toaster-npc') {
    //     blockImage = imageAssets.blockp1; // Or a dedicated NPC block image
    // }


    const block = new GameSprite(
        blockImage,
        toasterSprite.x,
        toasterSprite.y,
        8, 8,
        8, 8,
        5,
        toasterSprite.scale,
        -1,
        'block'
    );
    import('./script.js').then(({ addSprite }) => { addSprite(block); });
    return block;
}
