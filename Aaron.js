let xpos = 200;
let ypos = 100;
let health = 100;
const toaster = document.getElementById("AChar");
const canv = document.getElementById("gameCanvas");
//const context = canv.getContext('2d')

document.getElementById('startButton').addEventListener('click', () => {

   document.getElementById('charSelect').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'none';
});


// Assuming GameSprite is a class like this:

class gameSprite2 {
    constructor(imageSrc, x, y, frameWidth, frameHeight, totalFrames, framesPerRow, animSpeed, scale) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.x = x;
        this.y = y;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;
        this.framesPerRow = framesPerRow;
        this.animSpeed = animSpeed;
        this.scale = scale;
        this.currentFrame = 0;
        this.tickCount = 0;
    }

    update() {
        // Example movement: move right 1px per frame
        this.x += 1;

        // Update animation frame
        this.tickCount++;
        if (this.tickCount > this.animSpeed) {
            this.tickCount = 0;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        }
    }

    draw(ctx) {
        const frameX = (this.currentFrame % this.framesPerRow) * this.frameWidth;
        const frameY = Math.floor(this.currentFrame / this.framesPerRow) * this.frameHeight;

        ctx.drawImage(
            this.image,
            frameX,
            frameY,
            this.frameWidth,
            this.frameHeight,
            this.x,
            this.y,
            this.frameWidth * this.scale,
            this.frameHeight * this.scale
        );
    }
}



// Setup the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// The sprite you created
const IdleToaster = new GameSprite2(
    'Aarons Sprites/Toaster.png',
    200, 100,
    8, 8,
    1,
    1,
    7,
    4.5
);
allGameSprites.push(IdleToaster);

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    allGameSprites.forEach(sprite => {
        sprite.update();
        sprite.draw(ctx);
    });

    requestAnimationFrame(gameLoop);
}

function gameStart(){
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'flex';
    gameLoop(); // Start the game loop
}





document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case 'a':
            IdleToaster.x -= 5;
            break;
        case 'd':
            IdleToaster.x += 5;
            break;
        case 'w':
            IdleToaster.y -= 5;
            break;
        case 's':
            IdleToaster.y += 5;
            break;
    }
});

/*while (health>=0) {
    if (ypos>800){
        ypos --;
        toaster.style.top = ypos + 'px';
    }
    else{

    }
}
*/