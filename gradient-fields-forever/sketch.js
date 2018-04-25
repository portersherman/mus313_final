// consts
const maxLifetime = 500;
const maxTrailLength = 50;
const imgSize = 75;
const trackMouse = false;
const alignTime = 100;
const dev = false;

// p5
var arrow, arrow_red, arrow_red_desat;
var remainderX, remainderY;
var sizeX, sizeY;
var angles;
var trails;
var spawns;
var trailing;
var next;
var touched;
var touchedAt;
var ripple;
var startX, startY;
var posX, posY, initPosY;
var oldPosX, oldPosY;
var osc, oscs, playing;
var controllerX, controllerY;
var start;

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
  noCursor();
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
  touchedAt = [];
  ripple = [];
  trails = [];
  trailing = false;
  next = 0;
  start = dev;
  spawns = new Trail("spawn");
  for (var i = 0; i < sizeX; i++) {
  	for (var j = 0; j < sizeY; j++) {
  		angles[sizeX*j + i] = Math.random() * (2*PI);
  		touched[sizeX*j + i] = false;
  		touchedAt[sizeX*j + i] = -1;
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
	background(6, 78, 123);
	if (start) {
		if (mouseIsPressed) {
	  		manipMesh();
		}
		disp();
		drawMesh();
	  	spawn();
	} else {
		drawWelcome();
	}
	drawCursor();
  	if (trackMouse) {
  		drawTrails();
  		cullTrails();
  	}
}

function drawWelcome() {
	var dispLength = 400;
	rectMode(CENTER);
	textAlign(CENTER);
	textSize(50);
	if (frameCount < dispLength/2) {
		fill(255);
	} else if (frameCount < dispLength) {
		fill(255, 255*(1 - (frameCount-dispLength/2)/(dispLength/2)));
	} else {
		start = true;
	}
	text("W     E     L     C     O     M     E", windowWidth/2, windowHeight/2)
}

function drawMesh() {
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
}

function manipMesh() {
	var imgX, imgY;
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
    	touchedAt[sizeX*imgY + imgX] = millis();
    }
}

function drawCursor() {
	if (trackMouse) {
		if ((trailing) && (millis() > next)) {
			trails[trails.length - 1].add(mouseX, mouseY, imgSize/4);
			next = millis() + Math.random() * 150;
		} else {
			stroke(255, 0);
			fill(200, 0, 0);
			ellipse(mouseX, mouseY, imgSize/4, imgSize/4);
		}
	} else {
		stroke(255, 0);
		fill(200, 0, 0);
		ellipse(mouseX, mouseY, imgSize/4, imgSize/4);
	}
}

function drawTrails() {
	for (var i = 0; i < trails.length; i++) {
		// console.log(trails[i]);
		trails[i].draw(true);
	}
}

function cullTrails() {
	for (var i = 0; i < trails.length; i++) {
		if ((trails[i].drawn) && (trails[i].ellipses.length == 0)) {
			trails.splice(i, 1);
		}
	}
	// console.log(trails.length);
}

function spawn() {
	if (Math.random() < 0.025) {
		spawns.add(Math.random()*(windowWidth - 100) + 50, Math.random()*(windowHeight - 100) + 50, Math.random()*90+10);
	}
	// console.log(spawns.ellipses.length);
	spawns.draw(true);
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
	if (trackMouse) {
		trails.push(new Trail("mouse"));
		trailing = true;
	}
}

function mouseReleased() {
	if (trackMouse) {
		trailing = false;
	}	
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

function getAngleFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / imgSize);
	indY = Math.floor((y - remainderY/2) / imgSize);
	return angles[sizeX*indY + indX];
}

function disp() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		angles[sizeX*j + i] += (Math.random()-0.5) * 0.01;
	  		var totalDelta = 0;
	  		
	  		// up
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+sizeY-1)%sizeY) + i);

	  		// down
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+1)%sizeY) + i);

	  		// left
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+sizeX-1)%sizeX));

	  		// right
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+1)%sizeX));

  			ripple[sizeX*j+i] = (totalDelta > 0.25);

	  		if ((Math.abs(totalDelta) < 0.01) && (touched[sizeX*j+i] == true)) {
	  			if (millis() - touchedAt[sizeX*j+i] > 1000) {
	  				touched[sizeX*j+i] = false;	
	  				sendOsc('/noteoff', [i, j]);
	  			}
	  		}
	  		// sendOsc('/angle',[angles[sizeX*j + i]]);
	  	}
	}
}

function propDelta(cur, neighbor) {
	var delta = angles[neighbor] - angles[cur];
	if (!touched[cur]) {
		if (!touched[neighbor]) {
			angles[cur] += delta / (10 * alignTime);
		} else {
			angles[cur] += delta / alignTime;
		}
	} else {
		angles[cur] += delta / (100 * alignTime);
	}
	return delta;
}

function Trail(type) {
	this.ellipses = [];
	this.drawn = false;
	this.type = type;
}

Trail.prototype.add = function(x, y, size) {
	if (this.type === "mouse") {
		this.ellipses.push(new Point(x, y, size));
	} else {
		this.ellipses.splice(Math.random() * (this.ellipses.length - 1), 0, new Point(x, y, size));
	} 
	
	if (this.ellipses.length > maxTrailLength) {
		this.ellipses.pop();
	}
}

Trail.prototype.draw = function(link) {
	for (var i = this.ellipses.length - 1; i >= 0; i--) {
		if (this.ellipses[i].lifetime <= 0) {
			this.ellipses.splice(i, 1);
		} else {
			if (link) {
				this.ellipses[i].display(this.ellipses[i+1]);
			} else {
				this.ellipses[i].display();
			}
		}
	}
	this.drawn = true;
}

function Point(x, y, size) {
	this.x = x;
	this.y = y;
	this.lifetime = maxLifetime;
	this.size = size;
	this.dir = getAngleFromPixel(x, y);
}

Point.prototype.update = function() {
	this.lifetime -= 1;
	this.x += Math.cos(this.dir) * 0.5;
	this.y += Math.sin(this.dir) * 0.5;
	this.dir = getAngleFromPixel(this.x, this.y);
}

Point.prototype.display = function(prev) {
	// tint(255, this.lifetime);
	// console.log(this.lifetime);
	stroke(255, 0);
	fill(255);
	ellipse((this.x + windowWidth) % windowWidth, (this.y + windowHeight) % windowHeight, this.size*(this.lifetime/maxLifetime), this.size*(this.lifetime/maxLifetime));
	this.update();
	if (prev) {
		strokeWeight(3.0 * (this.lifetime/maxLifetime) + 1);
		stroke(255);
	    line((this.x + windowWidth) % windowWidth, (this.y + windowHeight) % windowHeight, (prev.x + windowWidth) % windowWidth, (prev.y + windowHeight) % windowHeight);
	}
}