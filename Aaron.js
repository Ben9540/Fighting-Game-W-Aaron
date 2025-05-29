let xpos;
let ypos;
let health;
const toaster = document.getElementById("AChar");
const canv = document.getElementById("gameCanvas");

document.getElementById('startButton').addEventListener('click', () => {

   document.getElementById('charSelect').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'none';
});

function gameStart(){
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'flex';
}


document.addEventListener("keydown", (event) =>{
    switch (event.key) {
        case 'a':
            xpos ++;
            toaster.style.left = xpos + 'px';
            break;

        case 'd':
            xpos ++;
            toaster.style.left = xpos + 'px';
            break;

        case 'w':
            ypos ++;
            toaster.style.top = xpos + 'px';
            break;


            toaster.style.left = xpos + 'px';
            toaster.style.top = ypos + 'px';
    }
})

while (health>=0) {
    if (ypos>800){
        ypos --;
        toaster.style.top = ypos + 'px';
    }
    else{

    }
}