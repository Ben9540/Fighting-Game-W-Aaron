  // Get the canvas element and its 2D rendering context
        const canvas = document.getElementById('gameCanvas');
        const context = canvas.getContext('2d');

        context.imageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false; // For Firefox compatibility
        context.webkitImageSmoothingEnabled = false; // For Webkit browsers (Safari, older Chrome)
        context.msImageSmoothingEnabled = false; // For Internet Explorer/Edge

        // --- Sprite Configuration ---
        const SPRITE_SHEET_URL = 'Tornado.png'; // <<< REPLACE THIS WITH YOUR ACTUAL SPRITE SHEET PATH
        const SPRITE_WIDTH = 8;     // Width of a single sprite frame in pixels
        const SPRITE_HEIGHT = 8;    // Height of a single sprite frame in pixels
        const TOTAL_FRAMES = 7;     // Total number of animation frames in your sprite sheet
        const FRAMES_PER_ROW = 3;   // How many sprite frames fit horizontally in one row (24px / 8px = 3)

        // The size to draw the sprite on the canvas (scaled up for better visibility)
        const DRAW_WIDTH = 64;
        const DRAW_HEIGHT = 64;

        // Animation speed: how many game loop frames before advancing to the next sprite frame
        const ANIMATION_SPEED = 10; // Lower value = faster animation

        // --- Game Variables ---
        let spriteImage = new Image();
        let currentFrame = 0;       // Current animation frame index (0 to TOTAL_FRAMES-1)
        let frameCounter = 0;       // Counter to control animation speed
        let spriteX = (canvas.width / 2) - (DRAW_WIDTH / 2);  // Center the sprite horizontally
        let spriteY = (canvas.height / 2) - (DRAW_HEIGHT / 2); // Center the sprite vertically

        // --- Load the Sprite Sheet Image ---
        spriteImage.src = SPRITE_SHEET_URL;

        spriteImage.onload = () => {
            console.log("Sprite sheet loaded successfully!");
            // Start the game loop once the image is loaded
            gameLoop();
        };

        spriteImage.onerror = () => {
            console.error("Error loading sprite sheet. Please check the URL:", SPRITE_SHEET_URL);
            // Optionally display an error message on the canvas
            context.fillStyle = 'red';
            context.font = '16px Arial';
            context.fillText('Error loading sprite sheet!', 10, 30);
        };

        // --- Game Loop Function ---
        function gameLoop() {
            // 1. Clear the entire canvas for the new frame
            context.clearRect(0, 0, canvas.width, canvas.height);

            // 2. Update animation frame
            frameCounter++;
            if (frameCounter >= ANIMATION_SPEED) {
                currentFrame = (currentFrame + 1) % TOTAL_FRAMES; // Loop through frames
                frameCounter = 0; // Reset counter
            }

            // 3. Calculate source (sx, sy) coordinates on the sprite sheet
            // Assuming frames are arranged left-to-right, top-to-bottom
            const frameX = currentFrame % FRAMES_PER_ROW;
            const frameY = Math.floor(currentFrame / FRAMES_PER_ROW);

            const sx = frameX * SPRITE_WIDTH;
            const sy = frameY * SPRITE_HEIGHT;

            // 4. Draw the current sprite frame onto the canvas
            // context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            context.drawImage(
                spriteImage,     // The image object (your sprite sheet)
                sx,              // Source X: X coordinate to start clipping from the sprite sheet
                sy,              // Source Y: Y coordinate to start clipping from the sprite sheet
                SPRITE_WIDTH,    // Source Width: Width of the clipped portion from the sprite sheet
                SPRITE_HEIGHT,   // Source Height: Height of the clipped portion from the sprite sheet
                spriteX,         // Destination X: X coordinate on the canvas to draw the image
                spriteY,         // Destination Y: Y coordinate on the canvas to draw the image
                DRAW_WIDTH,      // Destination Width: Width to draw the image on the canvas (scaled)
                DRAW_HEIGHT      // Destination Height: Height to draw the image on the canvas (scaled)
            );

            // 5. Request the next animation frame
            requestAnimationFrame(gameLoop);
        }

        // Handle canvas resizing to maintain responsiveness
        window.addEventListener('resize', () => {
            // Recalculate sprite position to keep it centered
            spriteX = (canvas.width / 2) - (DRAW_WIDTH / 2);
            spriteY = (canvas.height / 2) - (DRAW_HEIGHT / 2);
        });




        