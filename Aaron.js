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
    for (let i = 0; i < totalFrames && IdleToaster.y < 235; i++){
        IdleToaster.y += (jumpHeight / totalFrames)*1.18;
        await sleep(frameDelay)
    }
    jumpActive = false
}

let toastCharge = 1 ;
let toastAllow = true;

export function toastSpecial(){
    if(toastAllow == true){
        if(toastCharge == 1 && keys.i){
            sleep(1000)
            toastCharge ++;
        }
        if(toastCharge == 2 && keys.i){
            sleep(1000)
            toastCharge ++;
        }
        if(toastCharge == 3 && keys.i){
            sleep(1000)
            toastCharge ++;
        }
    
        const toast = new GameSprite(
            imageAssets[toastimg],
    
            addSprite(toast)
        )
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