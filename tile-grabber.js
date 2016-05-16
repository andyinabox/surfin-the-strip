var Emitter = require('events').EventEmitter;
var tilebelt = require('tilebelt');
var TILE_SIZE = 256;

function tileUrl(base, x, y, z) {
	return base + z + '/' + x + '/' + y + '.png';
}

module.exports = function(canvas, lon, lat, zoom, tileCount, tileBase) {
	var ctx
		, xy = tilebelt.pointToTile(lon, lat, zoom)
		, emitter = new Emitter()
		, images = [];

	// set canvas dimensions
	canvas.width = TILE_SIZE * tileCount/2;
	canvas.height = TILE_SIZE * 2;
	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// generate images
	for(var i=0; i<tileCount; i++) {
		images.push(new Image());
	}

	var loaded = 0;

	// setup image loading
	images.forEach(function(img, i) {
		img.crossOrigin = "anonymous";
		img.onload = function() {
			if(i >= tileCount/2) {
				ctx.drawImage(img, TILE_SIZE*(i-(tileCount/2)), -TILE_SIZE/2);
				ctx.drawImage(img, TILE_SIZE*(i-(tileCount/2)), TILE_SIZE * 1.5);
			} else {
				ctx.drawImage(img, TILE_SIZE*i, TILE_SIZE/2);
			}

			loaded++;

			emitter.emit('progress', {
				count: loaded
				, total: images.length
				, image: img
			});

			if(loaded >= images.length-1)  {
				emitter.emit('complete', canvas);
			}
		}
		img.src = tileUrl(tileBase, xy[0] - (tileCount/2) + i, xy[1], zoom);
	});

	return emitter;
}
