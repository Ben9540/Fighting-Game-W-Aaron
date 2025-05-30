import { GameSprite, addSprite, TOASTER_MOVE_SPEED} from './script.js';


export let IdleToaster; // Declare it but don't initialize it yet

export function initializeToasterSprite() {
    // Only create the butterfly when this function is called
    IdleToaster = new GameSprite(
    'Aarons Sprites/Toaster.png',
    200, 100,
    8, 8,
    1,
    1,
    7,
    4.5
);
    addSprite(IdleToaster); // Add it to the main sprite array
    console.log("IdleToaster initialized and added."); // Add a log for debugging
}

export function updateToasterMovement(playerSprite, keys) {
    playerSprite.vx = 0;
    playerSprite.vy = 0;

    if (keys.a) {
        playerSprite.vx = -TOASTER_MOVE_SPEED;
    } else if (keys.d) {
        playerSprite.vx = TOASTER_MOVE_SPEED;
    }
    if (keys.w) {
        playerSprite.vy = -TOASTER_MOVE_SPEED;
    } else if (keys.s) {
        playerSprite.vy = TOASTER_MOVE_SPEED;
    }
    // Note: The playerSprite.update() call is handled in main.js gameLoop
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