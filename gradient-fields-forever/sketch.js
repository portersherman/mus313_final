// consts
const maxLifetime = 1000;
const maxTrailLength = 50;
const trackMouse = false;
const alignTime = 100;
const dev = false;
const arrowSize = "md";
const spawnProb = 0.005;
const dispLength = 1000;
const maxSize = 100;

// p5
var arrow;
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
var poles;
var relAngles;
var startX, startY;
var posX, posY, initPosY;
var oldPosX, oldPosY;
var osc, oscs, playing;
var controllerX, controllerY;
var start;
var imgSize;
var gColor;
var colorDisc;

// osc
var incomingPort = 3333;
var connect_to_this_ip = '127.0.0.1';
var outgoingPort = 3334;

function preload() {
	arrow = "↣";
	imgSize = (arrowSize == "sm") ? 50 : 75;
}

function setup() {
  	createCanvas(windowWidth, windowHeight);
	noCursor();
  	startX = 0;
	startY = 0;
	oldPosX = [];
	oldPosY = [];
	angles = [];
	touched = [];
	touchedAt = [];
	ripple = [];
	poles = [];
	trails = [];
	trailing = false;
	next = 0;
	start = dev;
	gColor = color(29, 11, 50);
	colorDisc = 40;
	spawns = new Trail("spawn");

	relAngles = { 	"up": (1/2)*PI,
					"down": (3/2)*PI,
					"left": 0,
					"right": PI }

	setupMesh();	
	controllerX = -1;
	controllerY = -1;
	setupOsc(incomingPort, outgoingPort, connect_to_this_ip);
}

function draw() {
	drawBackground(gColor);
	if (start) {
		if (mouseIsPressed) {
	  		manipMesh();
		}
		disp();
		spawn();
		drawMesh();
	} else {
		drawWelcome();
	}
	drawCursor();
  	if (trackMouse) {
  		drawTrails();
  		cullTrails();
  	}
}

function setupMesh(oldAngles, oldTouched, oldTouchedAt, oldRipple, oldPoles) {
	remainderX = windowWidth % imgSize;
  	remainderY = windowHeight % imgSize;
  	sizeX = Math.floor(windowWidth / imgSize);
  	sizeY = Math.floor(windowHeight / imgSize);
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		if (oldAngles) {
	  			if (oldAngles[sizeX*j + i]) {
	  				angles[sizeX*j + i] = oldAngles[sizeX*j + i];
	  			} else {
	  				angles[sizeX*j + i] = Math.random() * (2*PI);
	  			}
	  		} else {
  				angles[sizeX*j + i] = Math.random() * (2*PI);
  			}

  			if (oldTouched) {
	  			touched[sizeX*j + i] = oldTouched[sizeX*j + i];
	  		} else {
				touched[sizeX*j + i] = false;
	  		}

	  		if (oldTouchedAt) {
	  			touchedAt[sizeX*j + i] = oldTouchedAt[sizeX*j + i];
	  		} else {
	  			touchedAt[sizeX*j + i] = -1;
	  		}

	  		if (oldRipple) {
	  			ripple[sizeX*j + i] = oldRipple[sizeX*j + i];
	  		} else {
				ripple[sizeX*j + i] = false;
	  		}

	  		if (oldPoles) {
	  			poles[sizeX*j + i] = oldPoles[sizeX*j + i];
	  		} else {
				poles[sizeX*j + i] = (Math.random() < 0.01);
	  		}
	  		// image(arrow, i*imgSize + remainderX / 2, j*imgSize + remainderY/2);
	  	}
	}
}

function drawBackground(color) {
	var r, g, b;
	r = color.levels[0];
	g = color.levels[1];
	b = color.levels[2];
	// console.log(r + " " + g + " " + b);
	if (dev) {
		background(color);
		return;
	}
	if (frameCount < dispLength/3) {
		background(	r + ((255 - r)*(1 - (frameCount)/(dispLength/3))), 
					g + ((255 - g)*(1 - (frameCount)/(dispLength/3))),
					b + ((255 - b)*(1 - (frameCount)/(dispLength/3))));
	} else if (frameCount < 2*dispLength/3) {
		background(r, g, b);
	} else if (frameCount < dispLength) {
		background(	r + ((127 - r)*((frameCount - 2*dispLength/3)/(dispLength/3))), 
					g + ((127 - g)*((frameCount - 2*dispLength/3)/(dispLength/3))),
					b + ((127 - b)*((frameCount - 2*dispLength/3)/(dispLength/3))));
	} else if (frameCount < dispLength*2) {
		background(	r + ((127 - r)*(1 - (frameCount-dispLength)/(dispLength))), 
					g + ((127 - g)*(1 - (frameCount-dispLength)/(dispLength))),
					b + ((127 - b)*(1 - (frameCount-dispLength)/(dispLength))));
	} else {
		background(color);
	}
}

function drawWelcome() {
	var factor = (.25) * (frameCount) + 100;
	rectMode(CENTER);
	textAlign(CENTER);
	textSize(50);
	if (frameCount < dispLength/3) {
		fill(255, 255*(frameCount)/(dispLength/3));
	} else if (frameCount < 2*dispLength/3) {
		fill(255);
	} else if (frameCount < dispLength) {
		fill(255, 255*(1 - (frameCount-2*dispLength/3)/(dispLength/3)));
	} else {
		start = true;
		return;
	}
	writeCentered("DRIFT", windowHeight/2, factor);
}

function writeCentered(string, y, factor) {
	var length = string.length;
	for (var i = 0; i < length; i++) {
		text(string.charAt(i), windowWidth/2+((i+1/2-length/2)*factor), y);
	}
}

function drawMesh() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		push();
			translate((i+0.5)*imgSize + remainderX/2, (j+0.5)*imgSize + remainderY/2);	
			if (poles[sizeX*j+i]) {
				stroke(127);
				strokeWeight(3);
				fill(255, 0);
				ellipseMode(CENTER);
				ellipse(0, 0, imgSize/2, imgSize/2);
			} else {
				rotate(angles[sizeX*j + i]);
				imageMode(CENTER);	
				if (touched[sizeX*j+i]) {
					fill(0);
					noStroke();
					textAlign(CENTER);
					textSize(imgSize);
					text(arrow, 0, imgSize/4);
				} else {
					if (ripple[sizeX*j+i]) {
						fill(127);
						noStroke();
						textAlign(CENTER);
						textSize(imgSize);
						text(arrow, 0, imgSize/4);
						//image(arrow_rippled, 0, 0);
					} else {
						fill(255);
						noStroke();
						textAlign(CENTER);
						textSize(imgSize);
						text(arrow, 0, imgSize/4);
						//image(arrow, 0, 0);
					}
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
			trails[trails.length - 1].add(mouseX, mouseY, imgSize/4, gColor);
			next = millis() + Math.random() * 150;
		} else {
			noStroke();
			fill(200, 0, 0);
			ellipse(mouseX, mouseY, imgSize/4, imgSize/4);
		}
	} else {
		noStroke();
		fill(255, 255, 255);
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
	if (Math.random() < spawnProb) {
		spawns.add(Math.random()*(windowWidth - 100) + 50, Math.random()*(windowHeight - 100) + 50, Math.random()*maxSize*0.9+maxSize*0.1, gColor);
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

function doubleClicked() {
  	var fs = fullscreen();
   	fullscreen(!fs);
}

function windowResized() {
  	resizeCanvas(windowWidth, windowHeight);
  	setupMesh(angles, touched, touchedAt, ripple, poles);
}

function receiveOsc(address, value) {
	console.log("received OSC: " + address + ", " + value);
		
	if (address == '/controller') {
		controllerX = value[0];
		controllerY = value[1];
	}

	if (address == '/color') {
		gColor = color(value[0], value[1], value[2]);
		// debugger;
	}
}

function getAngleFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / imgSize);
	indY = Math.floor((y - remainderY/2) / imgSize);
	// console.log(x + " " + y);
	return angles[sizeX*indY + indX];
}

function disp() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		// angles[sizeX*j + i] += (Math.random()-0.5) * 0.01;
	  		var totalDelta = 0;
	  		
	  		// up
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+sizeY-1)%sizeY) + i, "up");

	  		// down
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+1)%sizeY) + i, "down");

	  		// left
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+sizeX-1)%sizeX), "left");

	  		// right
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+1)%sizeX), "right");

  			ripple[sizeX*j+i] = (totalDelta > 0.25);

	  		if ((Math.abs(totalDelta) < 0.05) && (touched[sizeX*j+i] == true)) {
	  			if (millis() - touchedAt[sizeX*j+i] > 1000) {
	  				touched[sizeX*j+i] = false;	
	  				sendOsc('/noteoff', [i, j]);
	  			}
	  		}
	  		// sendOsc('/angle',[angles[sizeX*j + i]]);
	  	}
	}
}

function propDelta(cur, neighbor, rel) {
	var delta;
	if (poles[neighbor]) {
		delta = relAngles[rel] - angles[cur];
		angles[cur] += delta;
		return 0;
	} else {
		delta = angles[neighbor] - angles[cur];
	}
	if (!touched[cur]) {
		if (!touched[neighbor]) {
			angles[cur] += delta / (10 * alignTime);
		} else {
			angles[cur] += delta / alignTime;
		}
	} else {
		angles[cur] += delta / (100 * alignTime);
	}
	return Math.abs(delta);
}

function wrapX(x) {
	return remainderX/2 + ((x - remainderX/2) + (windowWidth - remainderX)) % (windowWidth - remainderX);
}

function wrapY(y) {
	return remainderY/2 + ((y - remainderY/2) + (windowHeight - remainderY)) % (windowHeight - remainderY);
}

function Trail(type) {
	this.ellipses = [];
	this.drawn = false;
	this.type = type;
}

Trail.prototype.add = function(x, y, size, color) {
	if (this.type === "mouse") {
		this.ellipses.push(new Point(x, y, size, color));
	} else {
		this.ellipses.splice(Math.random() * (this.ellipses.length - 1), 0, new Point(x, y, size, color));
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

function Point(x, y, size, color) {
	this.x = x;
	this.y = y;
	this.lifetime = maxLifetime;
	this.origSize = size;
	this.size = size;
	this.dir = getAngleFromPixel(x, y);
	this.color = color;
}

Point.prototype.update = function() {
	this.lifetime -= 1;
	this.size = this.origSize*(this.lifetime/maxLifetime);
	this.x += Math.cos(this.dir) * (2 * (1 - (this.size/maxSize)));
	this.y += Math.sin(this.dir) * (2 * (1 - (this.size/maxSize)));
	this.dir = getAngleFromPixel(wrapX(this.x), wrapY(this.y));
}

Point.prototype.display = function(prev) {
	// tint(255, this.lifetime);
	// console.log(this.lifetime);
	var newColor = color(this.color.levels[0]+colorDisc, this.color.levels[1]+colorDisc, this.color.levels[2]+colorDisc);
	if (Math.sqrt((mouseX - wrapX(this.x))*(mouseX - wrapX(this.x)) + (mouseY - wrapY(this.y))*(mouseY - wrapY(this.y))) < this.size) {
		fill(255);
	} else {
		fill(newColor);
	}
	noStroke();
	ellipse(wrapX(this.x), wrapY(this.y), this.size, this.size);
	this.update();
	if (prev) {
		strokeWeight(3.0);
		stroke(newColor);
	    line(wrapX(this.x), wrapY(this.y), wrapX(prev.x), wrapY(prev.y));
	}
}