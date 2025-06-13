// ===============================
// 1. IMPORTS & CONSTANTS
// ===============================
import {
    GameSprite,
    // addSprite, // Dynamically imported where needed for projectiles
    BUTTERFLY_MOVE_SPEED,
    TORNADO_PROJECTILE_SPEED,
    TORNADO_LIFETIME_FRAMES,
    TORNADO_COOLDOWN_DURATION,
    HIT_COOLDOWN_DURATION,
    imageAssets,
    canvas // Import canvas to check boundaries for dash
} from './script.js';

// Tornado sprite sheet and animation constants (shared)
const TORNADO_SPRITESHEET_KEY = 'tornado';
const TORNADO_FRAME_WIDTH = 8;
const TORNADO_FRAME_HEIGHT = 8;
const TORNADO_COLLISION_WIDTH = 8;
const TORNADO_COLLISION_HEIGHT = 8;
const TORNADO_ANIMATION_SPEED = 5;

// Butterfly sprite sheet and animation constants (shared across Butterfly types)
const BUTTERFLY_FRAME_WIDTH = 16;
const BUTTERFLY_FRAME_HEIGHT = 16;
const BUTTERFLY_COLLISION_WIDTH = 8;
const BUTTERFLY_COLLISION_HEIGHT = 8;
const BUTTERFLY_COMMON_FRAMES_PER_ROW = 6;
const IDLE_ANIMATION_SPEED = 10;
const HIT_ANIMATION_SPEED = 5;
export const BUTTERFLY_HIT_DAMAGE = 15; // Damage dealt by Butterfly's hit attack (shared)
const DASH_SPEED = 10;
const DASH_DURATION_FRAMES = 10;
const DASH_COOLDOWN_DURATION = 60;


// ===============================
// PLAYER 1 BUTTERFLY (WASD, I, O, P Keys) - Uses ButterflyP1.png
// ===============================
export let ButterflyP1; // Global instance for Player 1 Butterfly

// Initializes/configures the Player 1 Butterfly sprite
export function initializePlayer1ButterflySprite(initialX, initialY) {
    ButterflyP1 = new GameSprite(
        imageAssets.ButterflyP1, // Use P1 specific image
        initialX, initialY,
        BUTTERFLY_FRAME_WIDTH, BUTTERFLY_FRAME_HEIGHT,
        BUTTERFLY_COLLISION_WIDTH, BUTTERFLY_COLLISION_HEIGHT,
        IDLE_ANIMATION_SPEED,
        4.5, // scale
        -1, // lifeTime
        'player1-butterfly' // Tag for identification
    );
    ButterflyP1.maxHealth = 100;
    ButterflyP1.health = ButterflyP1.maxHealth;
    ButterflyP1.hasDealtDamageThisAttack = false;
    ButterflyP1.isDashing = false;
    ButterflyP1.dashVx = 0;
    ButterflyP1.dashVy = 0;
    ButterflyP1.dashFramesRemaining = 0;

    ButterflyP1.animations = {
        'idle':      { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 0,  end: 4,  speed: IDLE_ANIMATION_SPEED, loop: true },
        'hitRight':  { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp':     { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 5,  end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitDown':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
    };
    ButterflyP1.setAnimation('idle');
    ButterflyP1.lastDirection = 'right';
    import('./script.js').then(({ addSprite }) => { addSprite(ButterflyP1); }); // Add to global sprite array
}

// Update movement for Player 1 Butterfly
export function updatePlayer1ButterflyMovement(keys) {
    const playerSprite = ButterflyP1; // Directly reference the global P1 Butterfly instance
    if (!playerSprite) return; // Guard in case not initialized

    if (playerSprite.isDashing) {
        playerSprite.vx = playerSprite.dashVx;
        playerSprite.vy = playerSprite.dashVy;
        playerSprite.dashFramesRemaining--;
        if (playerSprite.dashFramesRemaining <= 0) {
            playerSprite.isDashing = false;
            playerSprite.vx = 0;
            playerSprite.vy = 0;
        }
    } else {
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        if (keys.ArrowLeft) { // Use WASD keys for P1
            playerSprite.vx = -BUTTERFLY_MOVE_SPEED;
            playerSprite.lastDirection = 'left';
        } else if (keys.ArrowRight) {
            playerSprite.vx = BUTTERFLY_MOVE_SPEED;
            playerSprite.lastDirection = 'right';
        }
        if (keys.ArrowUp) {
            playerSprite.vy = -BUTTERFLY_MOVE_SPEED;
            if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'up';
        } else if (keys.ArrowDown) {
            playerSprite.vy = BUTTERFLY_MOVE_SPEED;
            if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'down';
        }
        let desiredRotation = 0;
        const tiltAngle = playerSprite.rotationSpeed;
        if (playerSprite.vx > 0) { desiredRotation = tiltAngle; } else if (playerSprite.vx < 0) { desiredRotation = -tiltAngle; } else { desiredRotation = 0; }
        playerSprite.currentRotation = playerSprite.currentRotation * (1 - playerSprite.rotationSmoothness) + desiredRotation * playerSprite.rotationSmoothness;

        if (playerSprite.vx === 0 && playerSprite.vy === 0 && !playerSprite.currentAnimationState.startsWith('hit')) {
            if (playerSprite.currentAnimationState !== 'idle') { playerSprite.setAnimation('idle'); }
        } else if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
            if (!playerSprite.currentAnimationState.startsWith('hit')) {
                if (playerSprite.currentAnimationState !== 'idle') { playerSprite.setAnimation('idle'); }
            }
        }
        if (playerSprite.currentAnimationConfig && !playerSprite.currentAnimationConfig.loop && playerSprite.currentFrame >= playerSprite.currentAnimationConfig.end) {
            if (playerSprite.currentAnimationState.startsWith('hit')) { playerSprite.resetHitboxOffset(); }
            playerSprite.setAnimation(playerSprite.currentAnimationConfig.nextState || 'idle');
        }
    }
}

// Handle P1 Butterfly hit attack (P key)
export function handlePlayer1ButterflyHitAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = ButterflyP1; // Directly reference the global P1 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'p') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(HIT_COOLDOWN_DURATION);
        playerSprite.hasDealtDamageThisAttack = false;
        let hitAnimationState = 'idle'; let hitboxOffsetX = 0; let hitboxOffsetY = 0;
        const HITBOX_EXTENSION_BASE = 4.5;
        const HITBOX_EXTENSION_SCALED = HITBOX_EXTENSION_BASE * playerSprite.scale;
        switch (playerSprite.lastDirection) {
            case 'up': hitAnimationState = 'hitUp'; hitboxOffsetY = -HITBOX_EXTENSION_SCALED; break;
            case 'down': hitAnimationState = 'hitDown'; hitboxOffsetY = HITBOX_EXTENSION_SCALED; break;
            case 'left': hitAnimationState = 'hitLeft'; hitboxOffsetX = -HITBOX_EXTENSION_SCALED; break;
            case 'right': hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
            default: hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
        }
        playerSprite.setAnimation(hitAnimationState);
        playerSprite.setHitboxOffset(hitboxOffsetX, hitboxOffsetY);
        console.log(`P1 Butterfly performing ${hitAnimationState} attack.`);
    }
}

// Handle P1 Butterfly tornado attack (I key)
export function handlePlayer1ButterflyTornadoAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = ButterflyP1; // Directly reference the global P1 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'i') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(TORNADO_COOLDOWN_DURATION);
        let launchVx = 0; let launchVy = 0;
        if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
            const currentSpeed = Math.sqrt(playerSprite.vx * playerSprite.vx + playerSprite.vy * playerSprite.vy);
            if (currentSpeed > 0) {
                launchVx = (playerSprite.vx / currentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (playerSprite.vy / currentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            switch (playerSprite.lastDirection) {
                case 'up': launchVy = -TORNADO_PROJECTILE_SPEED; break;
                case 'down': launchVy = TORNADO_PROJECTILE_SPEED; break;
                case 'left': launchVx = -TORNADO_PROJECTILE_SPEED; break;
                case 'right': launchVx = TORNADO_PROJECTILE_SPEED; break;
                default: launchVx = TORNADO_PROJECTILE_SPEED; break;
            }
        }
        const newTornado = new GameSprite(
            imageAssets[TORNADO_SPRITESHEET_KEY],
            playerSprite.x + (playerSprite.collisionWidth * playerSprite.scale) / 2 - (TORNADO_COLLISION_WIDTH * playerSprite.scale) / 2,
            playerSprite.y + (playerSprite.collisionHeight * playerSprite.scale) / 2 - (TORNADO_COLLISION_HEIGHT * playerSprite.scale) / 2,
            TORNADO_FRAME_WIDTH, TORNADO_FRAME_HEIGHT,
            TORNADO_COLLISION_WIDTH, TORNADO_COLLISION_HEIGHT,
            TORNADO_ANIMATION_SPEED, playerSprite.scale, TORNADO_LIFETIME_FRAMES, 'tornado'
        );
        newTornado.vx = launchVx; newTornado.vy = launchVy; newTornado.caster = playerSprite;
        newTornado.animations = { 'default': { framesPerRow: 3, start: 0, end: 6, speed: TORNADO_ANIMATION_SPEED, loop: true } };
        newTornado.setAnimation('default');
        import('./script.js').then(({ addSprite }) => { addSprite(newTornado); });
    }
}

// Handle P1 Butterfly dash attack (O key)
export function handlePlayer1ButterflyDashAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = ButterflyP1; // Directly reference the global P1 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'o') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(DASH_COOLDOWN_DURATION);
        playerSprite.isDashing = true;
        playerSprite.dashFramesRemaining = DASH_DURATION_FRAMES;
        switch (playerSprite.lastDirection) {
            case 'up': playerSprite.dashVx = 0; playerSprite.dashVy = -DASH_SPEED; break;
            case 'down': playerSprite.dashVx = 0; playerSprite.dashVy = DASH_SPEED; break;
            case 'left': playerSprite.dashVx = -DASH_SPEED; playerSprite.dashVy = 0; break;
            case 'right': playerSprite.dashVx = DASH_SPEED; playerSprite.dashVy = 0; break;
            default: playerSprite.dashVx = DASH_SPEED; playerSprite.dashVy = 0; break;
        }
    }
}


// ===============================
// PLAYER 2 BUTTERFLY (Arrow Keys, Z, C, X Keys) - Uses original Butterfly.png
// ===============================
export let Butterfly; // Original global instance for Player 2 Butterfly

// Initializes/configures the Player 2 Butterfly sprite
export function initializePlayer2ButterflySprite(initialX, initialY) {
    Butterfly = new GameSprite(
        imageAssets.Butterfly, // Use original Butterfly image
        initialX, initialY,
        BUTTERFLY_FRAME_WIDTH, BUTTERFLY_FRAME_HEIGHT,
        BUTTERFLY_COLLISION_WIDTH, BUTTERFLY_COLLISION_HEIGHT,
        IDLE_ANIMATION_SPEED,
        4.5, // scale
        -1, // lifeTime
        'player2-butterfly' // Tag for identification
    );
    Butterfly.maxHealth = 100;
    Butterfly.health = Butterfly.maxHealth;
    Butterfly.hasDealtDamageThisAttack = false;
    Butterfly.isDashing = false;
    Butterfly.dashVx = 0;
    Butterfly.dashVy = 0;
    Butterfly.dashFramesRemaining = 0;

    Butterfly.animations = {
        'idle':      { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 0,  end: 4,  speed: IDLE_ANIMATION_SPEED, loop: true },
        'hitRight':  { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 19, end: 25, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitLeft':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 11, end: 18, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitUp':     { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 5,  end: 10, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' },
        'hitDown':   { framesPerRow: BUTTERFLY_COMMON_FRAMES_PER_ROW, start: 26, end: 32, speed: HIT_ANIMATION_SPEED, loop: false, nextState: 'idle' }
    };
    Butterfly.setAnimation('idle');
    Butterfly.lastDirection = 'right';
    import('./script.js').then(({ addSprite }) => { addSprite(Butterfly); }); // Add to global sprite array
}

// Update movement for Player 2 Butterfly
export function updatePlayer2ButterflyMovement(keys) {
    const playerSprite = Butterfly; // Directly reference the global P2 Butterfly instance
    if (!playerSprite) return; // Guard in case not initialized

    if (playerSprite.isDashing) {
        playerSprite.vx = playerSprite.dashVx;
        playerSprite.vy = playerSprite.dashVy;
        playerSprite.dashFramesRemaining--;
        if (playerSprite.dashFramesRemaining <= 0) {
            playerSprite.isDashing = false;
            playerSprite.vx = 0;
            playerSprite.vy = 0;
        }
    } else {
        playerSprite.vx = 0;
        playerSprite.vy = 0;
        if (keys.ArrowLeft) { // Use Arrow keys for P2
            playerSprite.vx = -BUTTERFLY_MOVE_SPEED;
            playerSprite.lastDirection = 'left';
        } else if (keys.ArrowRight) {
            playerSprite.vx = BUTTERFLY_MOVE_SPEED;
            playerSprite.lastDirection = 'right';
        }
        if (keys.ArrowUp) {
            playerSprite.vy = -BUTTERFLY_MOVE_SPEED;
            if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'up';
        } else if (keys.ArrowDown) {
            playerSprite.vy = BUTTERFLY_MOVE_SPEED;
            if (!keys.ArrowLeft && !keys.ArrowRight) playerSprite.lastDirection = 'down';
        }
        let desiredRotation = 0;
        const tiltAngle = playerSprite.rotationSpeed;
        if (playerSprite.vx > 0) { desiredRotation = tiltAngle; } else if (playerSprite.vx < 0) { desiredRotation = -tiltAngle; } else { desiredRotation = 0; }
        playerSprite.currentRotation = playerSprite.currentRotation * (1 - playerSprite.rotationSmoothness) + desiredRotation * playerSprite.rotationSmoothness;

        if (playerSprite.vx === 0 && playerSprite.vy === 0 && !playerSprite.currentAnimationState.startsWith('hit')) {
            if (playerSprite.currentAnimationState !== 'idle') { playerSprite.setAnimation('idle'); }
        } else if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
            if (!playerSprite.currentAnimationState.startsWith('hit')) {
                if (playerSprite.currentAnimationState !== 'idle') { playerSprite.setAnimation('idle'); }
            }
        }
        if (playerSprite.currentAnimationConfig && !playerSprite.currentAnimationConfig.loop && playerSprite.currentFrame >= playerSprite.currentAnimationConfig.end) {
            if (playerSprite.currentAnimationState.startsWith('hit')) { playerSprite.resetHitboxOffset(); }
            playerSprite.setAnimation(playerSprite.currentAnimationConfig.nextState || 'idle');
        }
    }
}

// Handle P2 Butterfly hit attack (C key)
export function handlePlayer2ButterflyHitAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = Butterfly; // Directly reference the global P2 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'c') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(HIT_COOLDOWN_DURATION);
        playerSprite.hasDealtDamageThisAttack = false;
        let hitAnimationState = 'idle'; let hitboxOffsetX = 0; let hitboxOffsetY = 0;
        const HITBOX_EXTENSION_BASE = 4.5;
        const HITBOX_EXTENSION_SCALED = HITBOX_EXTENSION_BASE * playerSprite.scale;
        switch (playerSprite.lastDirection) {
            case 'up': hitAnimationState = 'hitUp'; hitboxOffsetY = -HITBOX_EXTENSION_SCALED; break;
            case 'down': hitAnimationState = 'hitDown'; hitboxOffsetY = HITBOX_EXTENSION_SCALED; break;
            case 'left': hitAnimationState = 'hitLeft'; hitboxOffsetX = -HITBOX_EXTENSION_SCALED; break;
            case 'right': hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
            default: hitAnimationState = 'hitRight'; hitboxOffsetX = HITBOX_EXTENSION_SCALED; break;
        }
        playerSprite.setAnimation(hitAnimationState);
        playerSprite.setHitboxOffset(hitboxOffsetX, hitboxOffsetY);
        console.log(`P2 Butterfly performing ${hitAnimationState} attack.`);
    }
}

// Handle P2 Butterfly tornado attack (Z key)
export function handlePlayer2ButterflyTornadoAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = Butterfly; // Directly reference the global P2 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'z') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(TORNADO_COOLDOWN_DURATION);
        let launchVx = 0; let launchVy = 0;
        if (playerSprite.vx !== 0 || playerSprite.vy !== 0) {
            const currentSpeed = Math.sqrt(playerSprite.vx * playerSprite.vx + playerSprite.vy * playerSprite.vy);
            if (currentSpeed > 0) {
                launchVx = (playerSprite.vx / currentSpeed) * TORNADO_PROJECTILE_SPEED;
                launchVy = (playerSprite.vy / currentSpeed) * TORNADO_PROJECTILE_SPEED;
            }
        } else {
            switch (playerSprite.lastDirection) {
                case 'up': launchVy = -TORNADO_PROJECTILE_SPEED; break;
                case 'down': launchVy = TORNADO_PROJECTILE_SPEED; break;
                case 'left': launchVx = -TORNADO_PROJECTILE_SPEED; break;
                case 'right': launchVx = TORNADO_PROJECTILE_SPEED; break;
                default: launchVx = TORNADO_PROJECTILE_SPEED; break;
            }
        }
        const newTornado = new GameSprite(
            imageAssets[TORNADO_SPRITESHEET_KEY],
            playerSprite.x + (playerSprite.collisionWidth * playerSprite.scale) / 2 - (TORNADO_COLLISION_WIDTH * playerSprite.scale) / 2,
            playerSprite.y + (playerSprite.collisionHeight * playerSprite.scale) / 2 - (TORNADO_COLLISION_HEIGHT * playerSprite.scale) / 2,
            TORNADO_FRAME_WIDTH, TORNADO_FRAME_HEIGHT,
            TORNADO_COLLISION_WIDTH, TORNADO_COLLISION_HEIGHT,
            TORNADO_ANIMATION_SPEED, playerSprite.scale, TORNADO_LIFETIME_FRAMES, 'tornado'
        );
        newTornado.vx = launchVx; newTornado.vy = launchVy; newTornado.caster = playerSprite;
        newTornado.animations = { 'default': { framesPerRow: 3, start: 0, end: 6, speed: TORNADO_ANIMATION_SPEED, loop: true } };
        newTornado.setAnimation('default');
        import('./script.js').then(({ addSprite }) => { addSprite(newTornado); });
    }
}

// Handle P2 Butterfly dash attack (X key)
export function handlePlayer2ButterflyDashAttack(key, currentCooldown, setCooldownCallback) {
    const playerSprite = Butterfly; // Directly reference the global P2 Butterfly instance
    if (!playerSprite || key === null) return;

    if (key === 'x') {
        if (currentCooldown > 0) { return; }
        setCooldownCallback(DASH_COOLDOWN_DURATION);
        playerSprite.isDashing = true;
        playerSprite.dashFramesRemaining = DASH_DURATION_FRAMES;
        switch (playerSprite.lastDirection) {
            case 'up': playerSprite.dashVx = 0; playerSprite.dashVy = -DASH_SPEED; break;
            case 'down': playerSprite.dashVx = 0; playerSprite.dashVy = DASH_SPEED; break;
            case 'left': playerSprite.dashVx = -DASH_SPEED; playerSprite.dashVy = 0; break;
            case 'right': playerSprite.dashVx = DASH_SPEED; playerSprite.dashVy = 0; break;
            default: playerSprite.dashVx = DASH_SPEED; playerSprite.dashVy = 0; break;
        }
    }
}
