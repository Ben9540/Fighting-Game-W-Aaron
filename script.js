 
 document.getElementById('startButton').addEventListener('click', () => {
    // Hide the start button and show the game canvas
    document.getElementById('gameCanvas').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
 });
 
//Sprites

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
        this.animationSpeed = animationSpeed; // How many game loop frames before changing sprite frame
        this.scale = scale; // How much to scale the sprite when drawing

        this.currentFrame = 0;
        this.frameCounter = 0; // Counter for animation speed
        this.isLoaded = false; // To track if the image is loaded

        this.image.onload = () => {
            this.isLoaded = true;
            console.log(`Sprite loaded: ${imageSrc}`);
            // You might want a global flag or Promise.all to ensure all sprites are loaded before starting the gameLoop
        };
        this.image.onerror = () => {
            console.error(`Error loading sprite: ${imageSrc}`);
        };
    }

    // Method to update the sprite's animation frame
    update() {
        this.frameCounter++;
        if (this.frameCounter >= this.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.frameCounter = 0;
        }
        // You can add movement logic here too (e.g., this.x += this.vx;)
    }

    // Method to draw the sprite on the canvas
    draw(context) {
        if (!this.isLoaded) {
            return; // Don't draw if the image hasn't loaded yet
        }

        const sx = (this.currentFrame % this.framesPerRow) * this.frameWidth;
        const sy = Math.floor(this.currentFrame / this.framesPerRow) * this.frameHeight;

        // Calculate drawing dimensions based on scale
        const drawWidth = this.frameWidth * this.scale;
        const drawHeight = this.frameHeight * this.scale;

        context.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight, // Source clipping
            this.x, this.y, drawWidth, drawHeight // Destination on canvas
        );
    }
}

// In your main JavaScript file (e.g., main.js)
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

context.imageSmoothingEnabled = false; // Always good for pixel art!
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

// Array to hold all your active sprites
const allGameSprites = [];

// --- Instantiate your sprites ---

// Your main character (e.g., the sword character)
const swordCharacter = new GameSprite(
    'Bens Sprites/Sword.png', // Replace with your sword sprite sheet
    50, 150, // Initial X, Y position on canvas
    8, 8, // Frame width, Frame height (original pixel dimensions)
    12, // Total frames in animation
    3, // Frames per row (assuming 3 for your 24x24 sheet)
    4, // Animation speed (smaller = faster animation)
    8 // Scale: draws 8x8 as 64x64 on canvas
);
allGameSprites.push(swordCharacter);

// Your tornado special attack (could be a separate sprite)
const tornadoEffect = new GameSprite(
    'Bens Sprites/Tornado.png', // Replace with tornado sprite sheet
    200, 100, // Initial X, Y
    8, 8, // Example frame size for tornado
    7, // Total frames
    3, // Frames per row
    5, // Animation speed
    8 // Scale
);
allGameSprites.push(tornadoEffect);

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            swordCharacter.x -= 20; // Move left
            break;
        case 'ArrowRight':
            swordCharacter.x += 20; // Move right
            break;
        case 'ArrowUp':
            swordCharacter.y -= 20; // Move up
            break;
        case 'ArrowDown':
            swordCharacter.y += 20; // Move down
            break;
        case ' ':
            // Trigger tornado effect on spacebar press
            tornadoEffect.x = swordCharacter.x + 20; // Position relative to character
            tornadoEffect.y = swordCharacter.y - 20; // Position above character
            tornadoEffect.currentFrame = 0; // Reset animation frame for tornado effect
            break;
    }
});




// --- Game Loop Modified ---
function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

    // Iterate through all sprites and update/draw them
    for (let i = 0; i < allGameSprites.length; i++) {
        const sprite = allGameSprites[i];
        sprite.update(); // Update animation frame, and potentially position/state
        sprite.draw(context); // Draw the sprite
    }

    requestAnimationFrame(gameLoop); // Request the next frame
}

// Ensure all images are loaded before starting the loop (important for multiple sprites)
// A simple way is to check the `isLoaded` flag on all sprites
// A more robust way uses Promises or a loading manager.
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
        // If not all loaded, wait a bit and check again
        setTimeout(checkAllSpritesLoaded, 100);
    }
}

// Initiate the loading check
checkAllSpritesLoaded();