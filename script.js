// ===============================
// GLOBAL CONSTANTS & PLAYER STATE
// ===============================

// Movement and attack constants
export const BUTTERFLY_MOVE_SPEED = 1;
export const TORNADO_PROJECTILE_SPEED = 4;
export const TORNADO_LIFETIME_FRAMES = 150;
export const TORNADO_COOLDOWN_DURATION = 150;
export const HIT_COOLDOWN_DURATION = 60;
export const TOASTER_MOVE_SPEED = 2;

// Player cooldowns (separate for each player)
let tornadoCooldownP1 = 0, hitCooldownP1 = 0, dashCooldownP1 = 0;
let tornadoCooldownP2 = 0, hitCooldownP2 = 0, dashCooldownP2 = 0;

// Active player sprite references
export let player1ActiveSprite = null;
export let player2ActiveSprite = null;

// Character selection state
let player1SelectedCharType = null;
let player2SelectedCharType = null;
let player1HasSelected = false;
let player2HasSelected = false;

// ===============================
// CANVAS & CONTEXT SETUP
// ===============================

export const canvas = document.getElementById('gameCanvas');
export const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// ===============================
// SPRITE MANAGEMENT
// ===============================

export const allGameSprites = [];
export function addSprite(sprite) {
    allGameSprites.push(sprite);
}
export function removeSprite(spriteToRemove) {
    spriteToRemove.shouldRemove = true;
}

// ===============================
// KEYBOARD INPUT TRACKING
// ===============================

export const keysPressed = {
    ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false,
    z: false, c: false, x: false, // Player 2 attacks/abilities
    w: false, a: false, s: false, d: false, // Player 1 movement
    i: false, o: false, p: false // Player 1 attacks/abilities
};

// ===============================
// IMAGE ASSET LOADING
// ===============================

export const imageAssets = {};
const IMAGE_PATHS = {
    Butterfly: 'Bens Sprites/Butterfly2.png',
    ButterflyP1: 'Bens Sprites/Butterfly.png',
    tornado: 'Bens Sprites/Tornado.png',
    IdleToaster: 'Aarons Sprites/ToasterRecolour.png',
    ToasterP1: 'Aarons Sprites/Toaster.png',
    ToasterP2: 'Aarons Sprites/ToasterRecolour.png',
    ground: 'Ground.png',
    toastimg: 'Aarons Sprites/Bread.png',
    background: 'bg.png',
    blockp1: 'Block P1.png',
    blockp2: 'Block P2.png'
};

function loadAllImages(callback) {
    let loadedCount = 0;
    const totalImages = Object.keys(IMAGE_PATHS).length;
    if (totalImages === 0) {
        callback();
        return;
    }
    for (const key in IMAGE_PATHS) {
        const img = new Image();
        img.src = IMAGE_PATHS[key];
        img.onload = () => {
            imageAssets[key] = img;
            loadedCount++;
            if (loadedCount === totalImages) callback();
        };
        img.onerror = () => {
            loadedCount++;
            if (loadedCount === totalImages) callback();
        };
    }
}

// ===============================
// SPRITE CLASS DEFINITION
// ===============================

export class GameSprite {
    constructor(image, x, y, frameWidth, frameHeight, collisionWidth, collisionHeight, animationSpeed, scale = 1, lifeTime = -1, tag = 'generic') {
        // Sprite image and position
        this.image = image;
        this.x = x;
        this.y = y;

        // Sprite dimensions and collision box
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.collisionWidth = collisionWidth;
        this.collisionHeight = collisionHeight;
        this.defaultAnimationSpeed = animationSpeed;
        this.scale = scale;

        // Animation state
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = true;

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

        // Hitbox offset for attacks
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;

        // Health and invincibility
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.invincibilityFrames = 0;
        this.invincibilityDuration = 30;

        // Projectile and character-specific properties
        this.caster = null;
        this.tag = tag;
        this.hasDealtDamageThisAttack = false;
        this.isDashing = false;
        this.dashVx = 0;
        this.dashVy = 0;
        this.dashFramesRemaining = 0;
        this.lastDirection = 'right';
        this.isChargingToast = false;
        this.toastChargeStartTime = 0;
        this.currentToastSprite = null;
        this.hasDealtDamageThisAttack2 = false;
        this.currentBlock = null;
        this.isBlocking = false;
        this.jumpActive = false;
        this.toastCooldown = 0;
        this.chargeLevel = 1;
    }

    setHitboxOffset(offsetX, offsetY) {
        this.hitboxOffsetX = offsetX;
        this.hitboxOffsetY = offsetY;
    }
    resetHitboxOffset() {
        this.hitboxOffsetX = 0;
        this.hitboxOffsetY = 0;
    }
    takeDamage(amount) {
        if (this.invincibilityFrames > 0) return;
        this.health -= amount;
        this.invincibilityFrames = this.invincibilityDuration;
        if (this.health <= 0) {
            this.health = 0;
            this.shouldRemove = true;
            document.getElementById("gameCanvas").style.display = 'none';
            document.getElementById("mainMenu").style.display = 'flex';
            if(ButterflyP1.health <= 0){
                alert("Player 2 won")
            }
            if(ToasterP1.health <= 0){
                alert("Player 2 won")
            }
            if(Butterfly.health <= 0){
                alert("Player 1 won")
            }
            if(IdleToaster.health <= 0){
                alert("Player 1 won")
            }
            location.reload();
        }
    }
    setAnimation(state) {
        const config = this.animations[state];
        if (!config) {
            this.currentAnimationState = '';
            this.currentAnimationConfig = null;
            this.currentFrame = 0;
            this.frameCounter = 0;
            return;
        }
        if (this.currentAnimationState === state && !config.loop) return;
        this.currentAnimationState = state;
        this.currentAnimationConfig = config;
        this.currentFrame = config.start;
        this.frameCounter = 0;
        this.framesPerRow = config.framesPerRow;
    }
    update() {
        // Animation update
        if (this.currentAnimationConfig) {
            this.frameCounter++;
            if (this.frameCounter >= this.currentAnimationConfig.speed) {
                this.frameCounter = 0;
                this.currentFrame++;
                if (this.currentFrame > this.currentAnimationConfig.end) {
                    if (this.currentAnimationConfig.loop) {
                        this.currentFrame = this.currentAnimationConfig.start;
                    } else {
                        this.currentFrame = this.currentAnimationConfig.end;
                    }
                }
            }
        } else {
            if (this.image && this.image.width && this.image.height && this.frameWidth && this.frameHeight && this.defaultAnimationSpeed > 0) {
                const totalFramesInSheet = (this.image.width / this.frameWidth) * (this.image.height / this.frameHeight);
                this.frameCounter++;
                if (this.frameCounter >= this.defaultAnimationSpeed) {
                    this.frameCounter = 0;
                    this.currentFrame = (this.currentFrame + 1) % totalFramesInSheet;
                }
            } else {
                this.currentFrame = 0;
            }
        }
        // Invincibility flash effect
        if (this.invincibilityFrames > 0) {
            this.invincibilityFrames--;
            this.visible = !this.visible;
        } else {
            this.visible = true;
        }
        // Position update
        this.x += this.vx;
        this.y += this.vy;
        const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;
        // Canvas boundary checks
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        else if (this.x + scaledCollisionWidth > canvas.width) { this.x = canvas.width - scaledCollisionWidth; this.vx = 0; }
        if (this.y < 0) { this.y = 0; this.vy = 0; }
        else if (this.y + scaledCollisionHeight > 270) { this.y = 270 - scaledCollisionHeight; this.vy = 0; }
        // Lifetime management
        if (this.lifeTime > 0) {
            this.lifeRemaining--;
            if (this.lifeRemaining <= 0) this.shouldRemove = true;
        }
    }
    draw(context) {
        if (!this.isLoaded || !this.visible || !this.image) return;
        const actualFramesPerRow = (this.currentAnimationConfig && this.currentAnimationConfig.framesPerRow !== undefined) ? this.currentAnimationConfig.framesPerRow : (this.image.width / this.frameWidth);
        const sx = (this.currentFrame % actualFramesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / actualFramesPerRow) * this.frameHeight;
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;
        const scaledCollisionWidth = this.collisionWidth * this.scale;
        const scaledCollisionHeight = this.collisionHeight * this.scale;
        const offsetX = (drawWidth - scaledCollisionWidth) / 2;
        const offsetY = (drawHeight - scaledCollisionHeight) / 2;
        const destX = this.x - offsetX;
        const destY = this.y - offsetY;
        const centerX = destX + drawWidth / 2;
        const centerY = destY + drawHeight / 2;
        context.save();
        context.translate(centerX, centerY);
        context.rotate(this.currentRotation);
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            -drawWidth / 2, -drawHeight / 2,
            drawWidth, drawHeight
        );
        context.restore();
        // Draw collision box for debugging
        context.strokeStyle = 'white';
        context.strokeRect(this.x + this.hitboxOffsetX, this.y + this.hitboxOffsetY, scaledCollisionWidth, scaledCollisionHeight);
    }
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
// COLLISION & PHYSICS HELPERS
// ===============================

export function checkCollision(spriteA, spriteB) {
    if (!spriteA.visible || !spriteB.visible) return false;
    const box1 = spriteA.getCollisionBox();
    const box2 = spriteB.getCollisionBox();
    const xOverlap = box1.x <= box2.x + box2.width && box1.x + box1.width >= box2.x;
    const yOverlap = box1.y <= box2.y + box2.height && box1.y + box1.height >= box2.y;
    return xOverlap && yOverlap;
}

export function resolveCollision(spriteA, spriteB) {
    const boxA = spriteA.getCollisionBox();
    const boxB = spriteB.getCollisionBox();
    const overlapX = Math.max(0, Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x));
    const overlapY = Math.max(0, Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y));
    if (overlapX === 0 || overlapY === 0) return;
    if (overlapX < overlapY) {
        if (boxA.x < boxB.x) spriteA.x -= overlapX;
        else spriteA.x += overlapX;
        spriteA.vx = 0;
    } else {
        if (boxA.y < boxB.y) spriteA.y -= overlapY;
        else spriteA.y += overlapY;
        spriteA.vy = 0;
    }
}

// ===============================
// MODULE IMPORTS (CHARACTER LOGIC)
// ===============================

import {
    ButterflyP1, initializePlayer1ButterflySprite, updatePlayer1ButterflyMovement,
    handlePlayer1ButterflyTornadoAttack, handlePlayer1ButterflyHitAttack, handlePlayer1ButterflyDashAttack,
    BUTTERFLY_HIT_DAMAGE as BUTTERFLY_HIT_DAMAGE_P1
} from './Ben2.js';

import {
    Butterfly, initializePlayer2ButterflySprite, updatePlayer2ButterflyMovement,
    handlePlayer2ButterflyTornadoAttack, handlePlayer2ButterflyHitAttack, handlePlayer2ButterflyDashAttack,
    BUTTERFLY_HIT_DAMAGE
} from './Ben2.js';

import {
    ToasterP1, initializePlayer1ToasterSprite, updatePlayer1ToasterMovement,
    handlePlayer1ToasterHitAttack, TOASTER_HIT_DAMAGE as TOASTER_HIT_DAMAGE_P1, updatePlayer1ToastCooldown
} from './Aaron.js';

import {
    IdleToaster, initializePlayer2ToasterSprite, updatePlayer2ToasterMovement,
    handlePlayer2ToasterHitAttack, TOASTER_HIT_DAMAGE, updatePlayer2ToastCooldown
} from './Aaron.js';

// ===============================
// MAIN GAME LOOP
// ===============================

function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image or fallback color
    if (imageAssets.background && imageAssets.background.complete) {
        context.drawImage(imageAssets.background, 0, 0, canvas.width, canvas.height);
    } else {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw ground tiles at the bottom of the canvas
    const GROUND_TILE_WIDTH = 8, GROUND_TILE_HEIGHT = 32;
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

    // Update cooldowns for both players
    if (tornadoCooldownP1 > 0) tornadoCooldownP1--;
    if (hitCooldownP1 > 0) hitCooldownP1--;
    if (dashCooldownP1 > 0) dashCooldownP1--;
    if (tornadoCooldownP2 > 0) tornadoCooldownP2--;
    if (hitCooldownP2 > 0) hitCooldownP2--;
    if (dashCooldownP2 > 0) dashCooldownP2--;

    // Update toaster-specific cooldowns if needed
    if (player1SelectedCharType === 'toaster') updatePlayer1ToastCooldown();
    if (player2SelectedCharType === 'toaster') updatePlayer2ToastCooldown();

    // Handle player movement and attacks for both players
    if (player1ActiveSprite) {
        const p1MovementKeys = {
            ArrowLeft: keysPressed.a, ArrowRight: keysPressed.d,
            ArrowUp: keysPressed.w, ArrowDown: keysPressed.s,
            attack1: keysPressed.i, attack2: keysPressed.p, ability: keysPressed.o
        };
        if (player1SelectedCharType === 'butterfly') {
            updatePlayer1ButterflyMovement(p1MovementKeys);
            handlePlayer1ButterflyTornadoAttack(p1MovementKeys.attack1 ? 'i' : null, tornadoCooldownP1, (duration) => tornadoCooldownP1 = duration);
            handlePlayer1ButterflyHitAttack(p1MovementKeys.attack2 ? 'p' : null, hitCooldownP1, (duration) => hitCooldownP1 = duration);
            handlePlayer1ButterflyDashAttack(p1MovementKeys.ability ? 'o' : null, dashCooldownP1, (duration) => dashCooldownP1 = duration);
        } else if (player1SelectedCharType === 'toaster') {
            updatePlayer1ToasterMovement(p1MovementKeys);
            handlePlayer1ToasterHitAttack(p1MovementKeys.attack2 ? 'p' : null, hitCooldownP1, (duration) => hitCooldownP1 = duration);
        }
    }
    if (player2ActiveSprite) {
        const p2MovementKeys = {
            ArrowLeft: keysPressed.ArrowLeft, ArrowRight: keysPressed.ArrowRight,
            ArrowUp: keysPressed.ArrowUp, ArrowDown: keysPressed.ArrowDown,
            attack1: keysPressed.z, attack2: keysPressed.c, ability: keysPressed.x
        };
        if (player2SelectedCharType === 'butterfly') {
            updatePlayer2ButterflyMovement(p2MovementKeys);
            handlePlayer2ButterflyTornadoAttack(p2MovementKeys.attack1 ? 'z' : null, tornadoCooldownP2, (duration) => tornadoCooldownP2 = duration);
            handlePlayer2ButterflyHitAttack(p2MovementKeys.attack2 ? 'c' : null, hitCooldownP2, (duration) => hitCooldownP2 = duration);
            handlePlayer2ButterflyDashAttack(p2MovementKeys.ability ? 'x' : null, dashCooldownP2, (duration) => dashCooldownP2 = duration);
        } else if (player2SelectedCharType === 'toaster') {
            updatePlayer2ToasterMovement(p2MovementKeys);
            handlePlayer2ToasterHitAttack(p2MovementKeys.attack2 ? 'c' : null, hitCooldownP2, (duration) => hitCooldownP2 = duration);
        }
    }

    // Update and draw all sprites, removing those marked for removal
    const spritesToKeep = [];
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update();
        if (!sprite.shouldRemove) {
            sprite.draw(context);
            spritesToKeep.push(sprite);
        }
    }
    allGameSprites.length = 0;
    allGameSprites.push(...spritesToKeep);

    // Handle character-to-character collisions (Butterfly vs Toaster, etc.)
    const allPlayableCharacters = [player1ActiveSprite, player2ActiveSprite].filter(Boolean);
    for (let i = 0; i < allPlayableCharacters.length; i++) {
        for (let j = i + 1; j < allPlayableCharacters.length; j++) {
            const charA = allPlayableCharacters[i];
            const charB = allPlayableCharacters[j];
            if (checkCollision(charA, charB)) {
                const isA_Butterfly = charA.tag.includes('butterfly');
                const isA_Toaster = charA.tag.includes('toaster');
                const isB_Butterfly = charB.tag.includes('butterfly');
                const isB_Toaster = charB.tag.includes('toaster');
                if (isA_Butterfly && isB_Toaster) {
                    resolveCollision(charA, charB);
                } else if (isA_Toaster && isB_Butterfly) {
                    resolveCollision(charB, charA);
                } else {
                    resolveCollision(charA, charB);
                    resolveCollision(charB, charA);
                }
            }
        }
    }

    // Handle hit attack damage for both characters
    allPlayableCharacters.forEach(attacker => {
        if (!attacker) return;
        const targets = allPlayableCharacters.filter(target => target !== attacker);
        targets.forEach(target => {
            if (attacker.tag.includes('butterfly') &&
                attacker.currentAnimationState.startsWith('hit') &&
                (attacker.hitboxOffsetX !== 0 || attacker.hitboxOffsetY !== 0) &&
                (!attacker.hasDealtDamageThisAttack) &&
                checkCollision(attacker, target)) {
                if (target.takeDamage) {
                    attacker.hasDealtDamageThisAttack = true;
                    let damage = attacker.tag.includes('player1') ? BUTTERFLY_HIT_DAMAGE_P1 : BUTTERFLY_HIT_DAMAGE;
                    if (target.tag.includes('toaster') && target.isBlocking) damage *= 0.25;
                    target.takeDamage(damage);
                }
            }
            if (attacker.tag.includes('toaster') &&
                attacker.currentAnimationState.startsWith('hit') &&
                (attacker.hitboxOffsetX !== 0 || attacker.hitboxOffsetY !== 0) &&
                (!attacker.hasDealtDamageThisAttack2) &&
                checkCollision(attacker, target)) {
                if (target.takeDamage) {
                    attacker.hasDealtDamageThisAttack2 = true;
                    let damage = attacker.tag.includes('player1') ? TOASTER_HIT_DAMAGE_P1 : TOASTER_HIT_DAMAGE;
                    if (target.tag.includes('toaster') && target.isBlocking) damage *= 0.25;
                    target.takeDamage(damage);
                }
            }
        });
    });

    // Handle projectile collisions (tornado/toast vs characters)
    for (let i = 0; i < allGameSprites.length; i++) {
        const projectile = allGameSprites[i];
        if (projectile.shouldRemove || !projectile.image) continue;
        // Tornado projectiles
        if (projectile.tag === 'tornado') {
            const targets = allPlayableCharacters.filter(target => target !== projectile.caster);
            targets.forEach(target => {
                if (checkCollision(projectile, target)) {
                    let damage = 5;
                    if (target.tag.includes('toaster') && target.isBlocking) damage *= 0;
                    target.takeDamage(damage);
                    const PUSH_FORCE_MULTIPLIER = 1.5;
                    target.vx += projectile.vx * PUSH_FORCE_MULTIPLIER;
                    target.vy += projectile.vy * PUSH_FORCE_MULTIPLIER;
                    resolveCollision(target, projectile);
                }
            });
        }
        // Toast projectiles
        if (projectile.tag === 'toast') {
            const targets = allPlayableCharacters.filter(target => target !== projectile.caster);
            targets.forEach(target => {
                if (checkCollision(projectile, target) && !projectile.shouldRemove) {
                    let damage = 10;
                    if (projectile.chargeLevel === 2) damage = 20;
                    if (projectile.chargeLevel === 3) damage = 30;
                    if (target.tag.includes('toaster') && target.isBlocking) damage *= 0;
                    target.takeDamage(damage);
                    removeSprite(projectile);
                }
            });
        }
    }

    // Draw health bars for both players
    if (player1ActiveSprite) drawHealthBar(context, player1ActiveSprite);
    if (player2ActiveSprite) drawHealthBar(context, player2ActiveSprite);

    requestAnimationFrame(gameLoop);
}

// Draws a health bar above a sprite
function drawHealthBar(ctx, sprite) {
    const barWidth = sprite.collisionWidth * sprite.scale * 1.5;
    const barHeight = 4;
    const barX = sprite.x + sprite.hitboxOffsetX + (sprite.collisionWidth * sprite.scale / 2) - (barWidth / 2);
    const barY = sprite.y + sprite.hitboxOffsetY - barHeight - 5;
    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const currentHealthWidth = (sprite.health / sprite.maxHealth) * barWidth;
    ctx.fillStyle = 'lime';
    ctx.fillRect(barX, barY, currentHealthWidth, barHeight);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// ===============================
// GAME INITIALIZATION & CHARACTER SELECTION
// ===============================

function initializeGameCharacters() {
    allGameSprites.length = 0;
    let p1StartX = 50, p1StartY;
    if (player1SelectedCharType === 'butterfly') {
        p1StartY = 100;
        initializePlayer1ButterflySprite(p1StartX, p1StartY);
        player1ActiveSprite = ButterflyP1;
    } else if (player1SelectedCharType === 'toaster') {
        p1StartY = 235;
        initializePlayer1ToasterSprite(p1StartX, p1StartY);
        player1ActiveSprite = ToasterP1;
    }
    let p2StartX = 250, p2StartY;
    if (player2SelectedCharType === 'butterfly') {
        p2StartY = 100;
        initializePlayer2ButterflySprite(p2StartX, p2StartY);
        player2ActiveSprite = Butterfly;
    } else if (player2SelectedCharType === 'toaster') {
        p2StartY = 235;
        initializePlayer2ToasterSprite(p2StartX, p2StartY);
        player2ActiveSprite = IdleToaster;
    }
    gameLoop();
}

function startGameAfterAssetsLoaded() {
    // Called after all images are loaded and ready for character selection
}

// ===============================
// EVENT LISTENERS (KEYBOARD & UI)
// ===============================

// Keyboard input for movement and attacks
document.addEventListener('keydown', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault();
    }
});
document.addEventListener('keyup', (event) => {
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});

// Main menu and character selection UI
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('charSelect').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
    if (!window.gameAssetsLoaded) {
        loadAllImages(() => {
            window.gameAssetsLoaded = true;
            startGameAfterAssetsLoaded();
        });
    } else {
        startGameAfterAssetsLoaded();
    }
});

document.getElementById('helpButton').addEventListener('click', () => {
    document.getElementById('helpMenu').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
});

document.getElementById('backButton').addEventListener('click', () => {
    document.getElementById('helpMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
});

// Player 1 character select
document.getElementById('char1p1').addEventListener('click', () => {
    if (!player1HasSelected || player1SelectedCharType == 'toaster') {
        document.getElementById('char1p1').style.backgroundColor = "blue";
        document.getElementById('char2p1').style.backgroundColor = "#88E688";
    }
    player1SelectedCharType = 'butterfly';
    player1HasSelected = true;
});
document.getElementById('char2p1').addEventListener('click', () => {
    if (!player1HasSelected || player1SelectedCharType == 'butterfly') {
        document.getElementById('char2p1').style.backgroundColor = "blue";
        document.getElementById('char1p1').style.backgroundColor = "#88E688";
    }
    player1SelectedCharType = 'toaster';
    player1HasSelected = true;
});

// Player 2 character select
document.getElementById('char1p2').addEventListener('click', () => {
    if (!player2HasSelected || player2SelectedCharType == 'toaster') {
        document.getElementById('char1p2').style.backgroundColor = "blue";
        document.getElementById('char2p2').style.backgroundColor = "#88E688";
    }
    player2SelectedCharType = 'butterfly';
    player2HasSelected = true;
});
document.getElementById('char2p2').addEventListener('click', () => {
    if (!player2HasSelected || player2SelectedCharType == 'butterfly') {
        document.getElementById('char2p2').style.backgroundColor = "blue";
        document.getElementById('char1p2').style.backgroundColor = "#88E688";
    }
    player2SelectedCharType = 'toaster';
    player2HasSelected = true;
});

// Start game after both players have selected
document.getElementById('buttonStart').addEventListener('click', () => {
    if (!player1HasSelected || !player2HasSelected) {
        console.error("Please select a character for both players to confirm you are ready!");
        return;
    }
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    initializeGameCharacters();
});     