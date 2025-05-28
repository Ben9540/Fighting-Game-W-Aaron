let xpos;
let ypos;
let health;
const toaster = document.getElementById("AChar");
const canv = document.getElementById("gameCanvas");
const startButton = document.getElementById('startButton');
const mainMenu = document.getElementById('mainMenu');
const charMenu = document.getElementById('charSelect');

window.onload = function(){

}


document.getElementById('charSelect').addEventListener('click', () =>{
    mainMenu.style.display = 'none'
    charMenu.style.display = 'flex';
}
)


document.addEventListener("keydown", (event) =>{
    switch (event.key) {
        case 'ArrowLeft':
            xpos ++;
            toaster.style.left = xpos + 'px';
            break;

        case 'ArrowRight':
            xpos ++;
            toaster.style.left = xpos + 'px';
            break;

        case 'ArrowUp':
            ypos ++;
            toaster.style.left = xpos + 'px';
            break;
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