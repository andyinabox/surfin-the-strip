var Emitter = require('events').EventEmitter;
var tilebelt = require('tilebelt');

function tileUrl(base, x, y, z) {
	return base + z + '/' + x + '/' + y + '.png';
}

module.exports = function(canvas, lon, lat, zoom, tileSize, tileCount, tileBase) {
	var ctx
		, xy = tilebelt.pointToTile(lon, lat, zoom)
		, emitter = new Emitter()
		, images = [];

	// set canvas dimensions
	canvas.width = tileSize * tileCount;
	canvas.height = tileSize;
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

			ctx.drawImage(img, tileSize*i, 0);
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
