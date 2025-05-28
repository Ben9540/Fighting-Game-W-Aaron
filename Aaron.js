let xpos;
let ypos;
let health;
const toaster = document.getElementById("AChar");
const canv = document.getElementById("gameCanvas");

window.onload = function(){

}


//document.getElementById('startButton').addEventListener('click', () => {
     //Hide the start button and show the game canvas
  // document.getElementById('charSelect').style.display = 'flex';
 //   document.getElementById('mainMenu').style.display = 'none';
   //     document.getElementById('gameCanvas').style.display = 'none';
//});


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