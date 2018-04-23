// p5
var arrow, arrow_red, arrow_red_desat;
var imgSize;
var remainderX, remainderY;
var sizeX, sizeY;
var angles;
var touched;
var ripple;
var startX, startY;
var posX, posY, initPosY;
var imgX, imgY;
var oldPosX, oldPosY;
var osc, oscs, playing;
var controllerX, controllerY;

// osc
var incomingPort = 3333;
var connect_to_this_ip = '127.0.0.1';
var outgoingPort = 3334;

function preload() {
	arrow = loadImage("assets/arrow.png");
	arrow_red = loadImage("assets/arrow_red.png");
	arrow_red_desat = loadImage("assets/arrow_red_desat.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(30, 0, 40);
  noCursor();
  imgSize = 50;
  remainderX = windowWidth % imgSize;
  remainderY = windowHeight % imgSize;
  sizeX = Math.floor(windowWidth / imgSize);
  sizeY = Math.floor(windowHeight / imgSize);
  startX = 0;
  startY = 0;
  oldPosX = [];
  oldPosY = [];
  angles = [];
  touched = [];
  ripple = [];
  for (var i = 0; i < sizeX; i++) {
  	for (var j = 0; j < sizeY; j++) {
  		angles[sizeX*j + i] = 0.0;
  		touched[sizeX*j + i] = false;
  		ripple[sizeX*j + i] = false;
  		image(arrow, i*imgSize + remainderX / 2, j*imgSize + remainderY/2);
  	}
  }
  controllerX = -1;
  controllerY = -1;
  setupOsc(incomingPort, outgoingPort, connect_to_this_ip);
}

function draw() {
	clear();
	background(30, 0, 40);
	if (mouseIsPressed) {
	  	imgX = Math.floor((startX - remainderX/2) / imgSize);
	  	imgY = Math.floor((startY - remainderY/2) / imgSize);
	  	if ((imgX >= 0) && (imgY >= 0) && (imgX < sizeX) && (imgY < sizeY)) {
	  		var delta = (mouseY - startY)/windowHeight;
	  		if (touched[sizeX*imgY + imgX] == false) {
	    		sendOsc('/touch', [imgX, imgY, sizeX, sizeY]);
	    	} else {
	    		sendOsc('/angle', [angles[sizeX*imgY + imgX]]);
	    	}
	    	angles[sizeX*imgY + imgX] += 0.1*delta;
	    	angles[sizeX*imgY + imgX] = angles[sizeX*imgY + imgX] % (2*PI);
	    	// console.log(angles[sizeX*imgY + imgX]);
	    	touched[sizeX*imgY + imgX] = true;
	    }
	}
	disp();
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		push();
			translate((i+0.5)*imgSize + remainderX/2, (j+0.5)*imgSize + remainderY/2);	
			rotate(angles[sizeX*j + i]);
			imageMode(CENTER);	
			if (touched[sizeX*j+i]) {
				var alpha = clamp255(255 - (255 * (Math.abs(angles[sizeX*j + i]) / PI)));
				image(arrow_red, 0, 0);
			} else {
				if (ripple[sizeX*j+i]) {
					image(arrow_red_desat, 0, 0);
				} else {
					image(arrow, 0, 0);
				}
			}
	  		pop();
	  	}
  	}
  	drawCursor();
}

function drawCursor() {
	var x, y;
	x = (controllerX != -1) ? controllerX : mouseX;
	y = (controllerY != -1) ? controllerY : mouseY;
	// console.log("x: " + x + " y: " + y);
	stroke(255, 0);
	fill(120, 0, 0);
	ellipse(x, y, imgSize/4, imgSize/4);
}

function precise(x) {
  return Number.parseFloat(x).toPrecision(4);
}

function clamp255(val) {
	return (val > 255) ? 255 : (val < 0) ? 0 : val;
}

function mousePressed() {
	startX = mouseX;
	startY = mouseY;
}

function mouseMoved() {
	controllerX = -1;
	controllerY = -1;
}

function receiveOsc(address, value) {
	console.log("received OSC: " + address + ", " + value);
		
	if (address == '/controller') {
		controllerX = value[0];
		controllerY = value[1];
	}
  
}

function disp() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		angles[sizeX*j + i] += (Math.random()-0.5) * 0.01;
	  		var delta;
	  		var totalDelta = 0;

	  		// make it wrap

	  		// up
	  		delta = angles[sizeX*((j+sizeY-1)%sizeY) + i] - angles[sizeX*j + i];
	  		totalDelta += delta;
  			// delta = Math.min(angles[sizeX*((j+sizeY-1)%sizeY) + i] - angles[sizeX*j + i], (2*PI) - (angles[sizeX*((j+sizeY-1)%sizeY) + i] - angles[sizeX*j + i]));
  			totalDelta += delta;
  			if (!touched[sizeX*j+i]) {
  				if (!touched[sizeX*((j+sizeY-1)%sizeY) + i]) {
  					angles[sizeX*j + i] += delta / 100;
  				} else {
  					angles[sizeX*j + i] += delta / 10;
  				}
  			} else {
  				angles[sizeX*j + i] += delta / 1000;
  			}

	  		// down
	  		delta = angles[sizeX*((j+1)%sizeY) + i] - angles[sizeX*j + i];
	  		totalDelta += delta;
  			// delta = Math.min(angles[sizeX*((j+1)%sizeY) + i] - angles[sizeX*j + i], (2*PI) - (angles[sizeX*((j+1)%sizeY) + i] - angles[sizeX*j + i]));
  			totalDelta += delta;
  			if (!touched[sizeX*j+i]) {
  				if (!touched[sizeX*((j+1)%sizeY) + i]) {
  					angles[sizeX*j + i] += delta / 100;
  				} else {
  					angles[sizeX*j + i] += delta / 10;
  				}
  			} else {
  				angles[sizeX*j + i] += delta / 1000;
  			}

	  		// left
	  		delta = angles[sizeX*j + ((i+sizeX-1)%sizeX)] - angles[sizeX*j + i];
	  		totalDelta += delta;
  			// delta = Math.min(angles[sizeX*j + ((i+sizeX-1)%sizeX)] - angles[sizeX*j + i], (2*PI) - (angles[sizeX*j + ((i+sizeX-1)%sizeX)] - angles[sizeX*j + i]));
  			totalDelta += delta;
  			if (!touched[sizeX*j+i]) {
  				if (!touched[sizeX*j + ((i+sizeX-1)%sizeX)]) {
  					angles[sizeX*j + i] += delta / 100;
  				} else {
  					angles[sizeX*j + i] += delta / 10;
  				}
  			} else {
  				angles[sizeX*j + i] += delta / 1000;
  			}

	  		// right
	  		delta = angles[sizeX*j + ((i+1)%sizeX)] - angles[sizeX*j + i];
	  		totalDelta += delta;
  			// delta = Math.min(angles[sizeX*j + ((i+1)%sizeX)] - angles[sizeX*j + i], (2*PI) - (angles[sizeX*j + ((i+1)%sizeX)] - angles[sizeX*j + i]));
  			totalDelta += delta;
  			if (!touched[sizeX*j+i]) {
  				if (!touched[sizeX*j + ((i+1)%sizeX)]) {
  					angles[sizeX*j + i] += delta / 100;
  				} else {
  					angles[sizeX*j + i] += delta / 10;
  				}
  			} else {
  				angles[sizeX*j + i] += delta / 1000;
  			}

  			ripple[sizeX*j+i] = (totalDelta > 0.25);

	  		if ((Math.abs(totalDelta) < 0.01) && (touched[sizeX*j+i] == true)) {
	  			touched[sizeX*j+i] = false;	
	  			sendOsc('/noteoff', [i, j]);
	  		}
	  		// sendOsc('/angle',[angles[sizeX*j + i]]);
	  	}
	}
}