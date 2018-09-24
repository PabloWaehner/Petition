console.log("Sanity Check");

// .replace("data:image/png;base64,", "");

var ctx,
    flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

var x = "black",
    y = 2;

function init() {
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    canvas.addEventListener("mousemove", function(e) {
        findxy("move", e);
    });
    canvas.addEventListener("mousedown", function(e) {
        console.log("string");
        findxy("down", e);
        canvas.addEventListener("mouseup", function(e) {
            //I PUT THE MOUSEUP INSIDE OF THE MOUSEDOWN, SO THAT IT WOULD ONLY REGISTER THE SIGNATURE IF THE USER DOES MOUSEDOWN AND MOUSEUP INSIDE OF THE CANVAS. OTHERWISE, THE WAY I HAD IT BEFORE, MOUSINGDOWN OUTSIDE OF THE CANVAS, AND THEN UP INSIDE OF IT, WOULD REGISTER A SIGNATURE (BLANK)
            findxy("up", e);
            var canvas = document.getElementById("canvas"); //this has to be here, otherwise I won't get the image
            var dataURL = canvas.toDataURL(); //this has to be here, otherwise I won't get the image
            $("#hidden-input").val(dataURL);
            // console.log(dataURL);
        });
    });
    canvas.addEventListener("mouseout", function(e) {
        findxy("out", e);
    });
}

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = x;
    ctx.lineWidth = y;
    ctx.stroke();
    ctx.closePath();
}

function erase() {
    ctx.clearRect(0, 0, w, h);
    // $("#hidden-input").val("");
}

function findxy(res, e) {
    if (res == "down") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop;
        flag = true;
        dot_flag = true;
    }
    if (res == "up" || res == "out") {
        flag = false;
    }
    if (res == "move") {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;
            draw();
        }
    }
}

init();
