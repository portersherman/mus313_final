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
}

Point.prototype.update = function(remainderX, remainderY) {
	this.lifetime -= 1;
	this.size = this.maxSize*(this.lifetime/this.maxLifetime);
	this.x += Math.cos(this.dir) * (2 * (1 - (this.size/this.maxSize)));
	this.y += Math.sin(this.dir) * (2 * (1 - (this.size/this.maxSize)));
	if (!getHolesFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY))) {
		this.dir = getAngleFromPixel(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY));
	}
}

Point.prototype.display = function(prev, colorDisc, remainderX, remainderY) {
	// tint(255, this.lifetime);
	// console.log(this.lifetime);
	var newColor = color(this.color.levels[0]+colorDisc, this.color.levels[1]+colorDisc, this.color.levels[2]+colorDisc);
	fill(newColor);
	noStroke();
	ellipse(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), this.size, this.size);
	this.update(remainderX, remainderY);
	if (prev) {
		strokeWeight(3.0);
		stroke(newColor);
	    line(wrapX(this.x, remainderX, remainderY), wrapY(this.y, remainderX, remainderY), wrapX(prev.x, remainderX, remainderY), wrapY(prev.y, remainderX, remainderY));
	}
}

function Chain(type, length) {
	this.points = [];
	this.drawn = false;
	this.type = type;
	this.maxChainLength = length;
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
	for (var i = this.points.length - 1; i >= 0; i--) {
		if (this.points[i].lifetime <= 0) {
			this.points.splice(i, 1);
		} else {
			if (link) {
				this.points[i].display(this.points[i+1], colorDisc, remainderX, remainderY);
			} else {
				this.points[i].display(undefined, colorDisc, remainderX, remainderY);
			}
		}
	}
	this.drawn = true;
}