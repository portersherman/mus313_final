function wrapX(x, remainderX, remainderY) {
	return remainderX/2 + ((x - remainderX/2) + (windowWidth - remainderX)) % (windowWidth - remainderX);
}

function wrapY(y, remainderX, remainderY) {
	return remainderY/2 + ((y - remainderY/2) + (windowHeight - remainderY)) % (windowHeight - remainderY);
}

function Point(x, y, size, color, lifetime) {
	this.x = x;
	this.y = y;
	this.lifetime = lifetime;
	this.maxLifetime = lifetime;
	this.size = size;
	this.maxSize = size;
	this.dir = getAngleFromPixel(x, y);
	this.color = color;
	this.above = (127 < (0.2126 * color.levels[0] + 0.7152*color.levels[1] + 0.0722*color.levels[2]));
}

Point.prototype.update = function(remainderX, remainderY) {
	this.lifetime -= 1;
	this.size = this.maxSize*(this.lifetime/this.maxLifetime);
	this.x += Math.cos(this.dir) * (0.5 * (1 - (this.size/this.maxSize)));
	this.y += Math.sin(this.dir) * (0.5 * (1 - (this.size/this.maxSize)));
	if (!getHolesFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY))) {
		this.dir = getAngleFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY));
	}
}

Point.prototype.display = function(colorDisc, remainderX, remainderY) {
	var newColor
	var intersected;
	var dx = (mouseX-wrapX(this.x, remainderX, remainderY));
	var dy = (mouseY-wrapY(this.y, remainderX, remainderY));
	if (Math.sqrt(dx*dx + dy*dy) < this.size/2) {
		newColor = this.getNewColor(255);
		intersected = true;
	} else {
		newColor = this.getNewColor(colorDisc);
		intersected = false;
	}
	fill(newColor);
	noStroke();
	ellipse(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), this.size, this.size);
	this.update(remainderX, remainderY);
	return intersected;
}

Point.prototype.link = function(prev, colorDisc) {
	var newColor = this.getNewColor(colorDisc);
	if (prev) {
		strokeWeight(3.0);
		stroke(newColor);
	    line(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), wrapX(prev.x, remainderX, remainderY), wrapY(prev.y, remainderX, remainderY));
	}
}

Point.prototype.getNewColor = function(colorDisc) {
	if (!this.above) {
		return color(this.color.levels[0]+colorDisc, this.color.levels[1]+colorDisc, this.color.levels[2]+colorDisc);
	} else {
		return color(this.color.levels[0]-colorDisc, this.color.levels[1]-colorDisc, this.color.levels[2]-colorDisc);
	}
}

function Chain(type, length) {
	this.points = [];
	this.drawn = false;
	this.type = type;
	this.maxChainLength = length;
	this.intersected = false;
}

Chain.prototype.isIntersected = function() {
	return this.intersected;
}

Chain.prototype.add = function(x, y, size, color, lifetime) {
	if (this.type === "mouse") {
		this.points.push(new Point(x, y, size, color, lifetime));
	} else {
		this.points.splice(Math.random() * (this.points.length - 1), 0, new Point(x, y, size, color, lifetime));
	} 
	
	if (this.points.length > this.maxChainLength) {
		this.points.pop();
	}
}

Chain.prototype.draw = function(link, colorDisc, remainderX, remainderY) {
	var intersected = false;
	for (var i = this.points.length - 1; i >= 0; i--) {
		if (this.points[i].lifetime <= 0) {
			this.points.splice(i, 1);
		} else {
			this.points[i].link(this.points[i+1], colorDisc/2);
		}
	}
	for (var i = this.points.length - 1; i >= 0; i--) {
		intersected = ((this.points[i].display(colorDisc, remainderX, remainderY)) || intersected);
	}
	this.intersected = intersected;
	this.drawn = true;
}