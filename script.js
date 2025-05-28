// --- Start Button Logic ---
document.getElementById('startButton').addEventListener('click', () => {
     //Hide the start button and show the game canvas
   document.getElementById('gameCanvas').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
});

// --- Sprites Class ---
class GameSprite {
    constructor(imageSrc, x, y, frameWidth, frameHeight, totalFrames, framesPerRow, animationSpeed, scale = 1) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.x = x;
        this.y = y;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;
        this.framesPerRow = framesPerRow;
        this.animationSpeed = animationSpeed;
        this.scale = scale;

        this.currentFrame = 0;
        this.frameCounter = 0;
        this.isLoaded = false;

        // --- NEW: Movement and Rotation Properties ---
        this.vx = 0; // velocity x
        this.vy = 0; // velocity y
        this.currentRotation = 0; // Current rotation angle in radians
        this.rotationSpeed = Math.PI / 20; // Max tilt angle (e.g., 9 degrees in radians)
        this.rotationSmoothness = 0.15; // How smoothly the sprite rotates (0 to 1, higher = faster snap)

        this.image.onload = () => {
            this.isLoaded = true;
            console.log(`Sprite loaded: ${imageSrc}`);
        };
        this.image.onerror = () => {
            console.error(`Error loading sprite: ${imageSrc}`);
        };
    }

    // Method to update the sprite's animation frame and position/rotation
    update() {
        // Update animation frame
        this.frameCounter++;
        if (this.frameCounter >= this.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.frameCounter = 0;
        }

        // --- NEW: Update Position ---
        this.x += this.vx;
        this.y += this.vy;

        // --- NEW: Update Rotation based on Velocity ---
        let desiredRotation = 0;
        const tiltAngle = this.rotationSpeed;

        if (this.vx > 0) { // Moving right
            desiredRotation = tiltAngle;
        } else if (this.vx < 0) { // Moving left
            desiredRotation = -tiltAngle;
        }
        // You can add more complex diagonal angling if needed,
        // or prioritize horizontal tilt for a butterfly's side-to-side motion.
        // For vertical movement, butterflies might not typically tilt like this,
        // but you could add a slight nose-up/down if desired:
        // else if (this.vy < 0) { // Moving up
        //     desiredRotation = -Math.PI / 60; // Slight nose up
        // } else if (this.vy > 0) { // Moving down
        //     desiredRotation = Math.PI / 60; // Slight nose down
        // }


        // Smoothly interpolate currentRotation towards desiredRotation
        this.currentRotation = this.currentRotation * (1 - this.rotationSmoothness) + desiredRotation * this.rotationSmoothness;
    }

    // Method to draw the sprite on the canvas with rotation
    draw(context) {
        if (!this.isLoaded) {
            return;
        }

        const sx = (this.currentFrame % this.framesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / this.framesPerRow) * this.frameHeight;

        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;

        // Calculate the center of the sprite for rotation
        const centerX = this.x + drawWidth / 2;
        const centerY = this.y + drawHeight / 2;

        context.save(); // Save the current canvas state

        // Translate the canvas origin to the center of the sprite
        context.translate(centerX, centerY);

        // Rotate the canvas
        context.rotate(this.currentRotation);

        // Draw the sprite, offset by half its drawing width/height because the origin is now its center
        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight, // Source clipping
            -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight // Destination on canvas (relative to new origin)
        );

        context.restore(); // Restore the canvas state to prevent affecting other drawings
    }
}

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = false; // Always good for pixel art!
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// Array to hold all your active sprites
const allGameSprites = [];

// --- Sprite Instantiation ---
// Define a consistent movement speed for the butterfly
const BUTTERFLY_MOVE_SPEED = 2; // Pixels per frame

const IdleButterfly = new GameSprite(
    'Bens Sprites/IdleButterfly.png',
    200, 100, // Initial X, Y position
    8, 8, // Frame width, Frame height
    5, // Total frames in animation
    2, // Frames per row (e.g., 2 for a 8x8 with 5 frames could mean 3 rows total)
    7, // Animation speed
    4.5 // Scale
);
allGameSprites.push(IdleButterfly);

// --- NEW: Keyboard State Tracking ---
const keysPressed = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

document.addEventListener('keydown', (event) => {
    // Only set the flag to true if it's one of our tracked movement keys
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault(); // Prevent default browser scrolling/actions for arrow keys
    }

    // Spacebar for tornado effect (this logic is separate from continuous movement)
    if (event.key === ' ') {
        // IMPORTANT: The way you're currently handling tornadoEffect here
        // (modifying IdleButterfly's position and resetting its frame)
        // is likely not what you want. If the tornado is a separate sprite
        // like `tornadoEffect` declared above, you'd want to:
        // 1. Potentially add `tornadoEffect` to `allGameSprites` when triggered.
        // 2. Position `tornadoEffect` relative to `IdleButterfly`.
        // 3. You might even want to remove `tornadoEffect` from `allGameSprites`
        //    after its animation finishes.
        // For now, I'm commenting out the tornado logic as it applies to IdleButterfly.
        // IdleButterfly.x = IdleButterfly.x + 20;
        // IdleButterfly.y = IdleButterfly.y - 20;
        // IdleButterfly.currentFrame = 0;
        console.log("Spacebar pressed. Tornado effect logic here.");
    }
});

document.addEventListener('keyup', (event) => {
    // Set the flag back to false when the key is released
    if (keysPressed.hasOwnProperty(event.key)) {
        keysPressed[event.key] = false;
    }
});


// --- Game Loop ---
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

    // --- NEW: Update Butterfly Velocity based on Key State ---
    IdleButterfly.vx = 0;
    IdleButterfly.vy = 0;

    if (keysPressed.ArrowLeft) {
        IdleButterfly.vx = -BUTTERFLY_MOVE_SPEED;
    } else if (keysPressed.ArrowRight) {
        IdleButterfly.vx = BUTTERFLY_MOVE_SPEED;
    }

    if (keysPressed.ArrowUp) {
        IdleButterfly.vy = -BUTTERFLY_MOVE_SPEED;
    } else if (keysPressed.ArrowDown) {
        IdleButterfly.vy = BUTTERFLY_MOVE_SPEED;
    }

    // Optional: Normalize diagonal speed if you don't want faster diagonals
    // if (IdleButterfly.vx !== 0 && IdleButterfly.vy !== 0) {
    //     const magnitude = Math.sqrt(IdleButterfly.vx * IdleButterfly.vx + IdleButterfly.vy * IdleButterfly.vy);
    //     IdleButterfly.vx = (IdleButterfly.vx / magnitude) * BUTTERFLY_MOVE_SPEED;
    //     IdleButterfly.vy = (IdleButterfly.vy / magnitude) * BUTTERFLY_MOVE_SPEED;
    // }


    // Iterate through all sprites and update/draw them
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update(); // Update animation frame, position, and rotation
        sprite.draw(context); // Draw the sprite
    }

    requestAnimationFrame(gameLoop); // Request the next frame
}

// --- Initial Loading Check ---
function checkAllSpritesLoaded() {
    let allLoaded = true;
    for (let i = 0; i < allGameSprites.length; i++) {
        if (!allGameSprites[i].isLoaded) {
            allLoaded = false;
            break;
        }
    }

    if (allLoaded) {
        console.log("All sprites loaded! Starting game loop.");
        gameLoop();
    } else {
        setTimeout(checkAllSpritesLoaded, 100);
    }
}

// Initiate the loading check
checkAllSpritesLoaded();

// --- Unused Sprites (for reference, not added to allGameSprites array) ---
// const swordCharacter = new GameSprite(
//     'Bens Sprites/Sword.png',
//     50, 150,
//     8, 8,
//     12,
//     3,
//     4,
//     8
// );

// const tornadoEffect = new GameSprite(
//     'Bens Sprites/Tornado.png',
//     200, 100,
//     8, 8,
//     7,
//     3,
//     5,
//     8
// );