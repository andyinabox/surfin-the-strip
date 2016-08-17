var THREE = require('three');
var createOrbitViewer = require('three-orbit-viewer')(THREE);
var dat = require('exdat');
var geolocation = require('geolocation');
var KeyListener = require('key-listener');

var settings = require('./settings.json');

var tileGrabber = require('./tile-grabber');

var tileSources = {
	'landscape': 'http://a.tile.thunderforest.com/landscape/',
	// 'satellite': 'http://otile1.mqcdn.com/tiles/1.0.0/sat/',
	'osm' : 'http://a.tile.openstreetmap.org/',
	'toner' : 'http://a.tile.stamen.com/toner/',
	'watercolor' : 'http://c.tile.stamen.com/watercolor/',
	'bw-mapnik' : 'http://a.tiles.wmflabs.org/bw-mapnik/',
	'cartodb-light': 'http://a.basemaps.cartocdn.com/light_all/',
	'cartodb-dark': 'http://a.basemaps.cartocdn.com/dark_all/',
}

var keyHandler = new KeyListener();

var TILE_SIZE = 256;


var params = {
	gen: {
		rotation: true,
		reload: function() {
			updateGeometry();
			updateTexture();
		}
	},
	mob: {
		slices: 40,
		stacks: 40,
		radius: 4,
		stripWidth: 0.7,
		flatness: 0.1,
		wireframe: false		
	},
	map: {
		zoom: 6,
		lat: 0,
		lon: 0,
		getCurrent: getCurrentLocation,
		tileSource: tileSources['satellite'],
		tileCount: 32
	},
	text: {
		content: "",
		// content: "I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that I am that I am and that's all that ",
		size: 72,
		font: "Helvetica",
		color: [255, 255, 255]
	}

}


// setup gui
var gui = new dat.GUI({
 load: settings
 , preset: 'Default'
});
var guiGen = gui.addFolder('General');
guiGen.add(params.gen, 'rotation');
guiGen.add(params.gen, 'reload');
var guiMob = gui.addFolder('Geometry');
guiMob.add(params.mob, 'radius', 0, 10).onChange(updateGeometry);
guiMob.add(params.mob, 'stripWidth', 0, 10).onChange(updateGeometry);
guiMob.add(params.mob, 'flatness', 0, 1).onChange(updateGeometry);
guiMob.add(params.mob, 'slices', 1, 100).step(1).onChange(updateGeometry);
guiMob.add(params.mob, 'stacks', 1, 100).step(1).onChange(updateGeometry);
guiMob.add(params.mob, 'wireframe').onChange(updateGeometry)
var guiMap = gui.addFolder('Map Texture');
guiMap.add(params.map, 'zoom', 0, 32).step(1).listen().onChange(updateTexture);
guiMap.add(params.map, 'lat').step(.000001).listen().onChange(updateTexture);
guiMap.add(params.map, 'lon').step(.000001).listen().onChange(updateTexture);
guiMap.add(params.map, 'getCurrent');
guiMap.add(params.map, 'tileSource', tileSources).onChange(updateTexture);
guiMap.add(params.map, 'tileCount', 0, 32).step(2).onChange(updateTexture);
var guiText = gui.addFolder('Text');
guiText.add(params.text, "content").onChange(updateTexture);
guiText.add(params.text, "font").onChange(updateTexture);
guiText.add(params.text, "size", 1, 100).onChange(updateTexture);
guiText.addColor(params.text, "color").onChange(updateTexture);

gui.remember(params.mob);
gui.remember(params.map);
gui.remember(params.text);


// hide initially
gui.domElement.classList.toggle('hidden');

var app = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 1.0,
  fov: 45,
  position: new THREE.Vector3(0, 0, 15)
})

function mobius3d(u, t) {

		u *= Math.PI;
		t *= 2 * Math.PI;

		// make complete circle
		u = u * 2;

		// rotation around torus
		var phi = u / 2;
		// major radius
		var major = params.mob.radius;
		// "flatness"
		var a = params.mob.flatness;
		// surface width
		var b = params.mob.stripWidth;
		var x, y, z;
		x = a * Math.cos(t) * Math.cos(phi) - b * Math.sin(t) * Math.sin(phi);
		z = a * Math.cos(t) * Math.sin(phi) + b * Math.sin(t) * Math.cos(phi);
		y = (major + x) * Math.sin(u);
		x = (major + x) * Math.cos(u);
		return new THREE.Vector3(x, y, z);
	}
var canvas = document.createElement('canvas');
var tmpCanvas = document.createElement('canvas');
var texture = new THREE.Texture();
texture.minFilter = THREE.LinearFilter;
texture.generateMipmap = false;
texture.image = canvas;

updateTexture();

// // add a double-sided sphere
// var geo = new THREE.SphereGeometry(1, 84, 84)
var geo = new THREE.ParametricGeometry( mobius3d, params.mob.slices, params.mob.stacks );
var mat = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.DoubleSide,
  wireframe: params.mob.wireframe
})
var mobius = new THREE.Mesh(geo, mat)
app.scene.add(mobius)

app.on('tick', function() {
	if(params.gen.rotation) {
		mobius.rotateZ(Math.PI/360);
		mobius.rotateX(Math.PI/720);
		mobius.rotateY(-Math.PI/720);
		mobius.needsUpdate = true;
	}
});

keyHandler.addListener(document, 'g', function() {
  gui.domElement.classList.toggle('hidden');
});


getCurrentLocation();

function getCurrentLocation() {

	geolocation.getCurrentPosition(function (err, position) {
	  if(err) console.error(err);

	  params.map.lat = position.coords.latitude;
	  params.map.lon = position.coords.longitude;
		params.map.zoom = 17;
		updateTexture();
	});

}


function updateGeometry() {
	mobius.geometry = new THREE.ParametricGeometry(mobius3d, params.mob.slices, params.mob.stacks);
	mobius.material.wireframe = params.mob.wireframe;
	mobius.needsUpdate = true;
}

function updateTexture() {
	// updateMainCanvas();
	tileGrabber(
		tmpCanvas,
		params.map.lon,
		params.map.lat,
		params.map.zoom,
		TILE_SIZE,
		params.map.tileCount,
		params.map.tileSource
	)
	.on('progress', updateMainCanvas)
	.on('complete', updateMainCanvas);
}


function drawText() {
	var ctx = tmpCanvas.getContext("2d");
	ctx.font = params.text.size+"px "+params.text.font;
	var c = params.text.color;
	if(typeof c === 'string') {
		ctx.fillStyle = c;
	} else {
		ctx.fillStyle = "rgb("+c[0]+","+c[1]+","+c[2]+")";
	}
	ctx.fillText(params.text.content, 5, TILE_SIZE/2 + params.text.size/4); 
	ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
	ctx.lineWidth = 3;
	ctx.strokeText(params.text.content, 5, TILE_SIZE/2 + params.text.size/4)
}

function updateMainCanvas() {
	canvas.width = TILE_SIZE * (params.map.tileCount/2);
	canvas.height = TILE_SIZE * 2;

	drawText();

	var ctx = canvas.getContext("2d");
	// ctx.clearRect(0, 0, canvas.width, canvas.height);

	// draw first half in the middle
	ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height, 0, TILE_SIZE/2, canvas.width, canvas.height);

	// ctx.save();

	// 	// rotate 90deg
	// 	ctx.translate(canvas.width/2, canvas.height/2);
	// 	ctx.rotate(Math.PI);
	// 	ctx.translate(-canvas.width/2, -canvas.height/2);

		// draw second half
		ctx.drawImage(tmpCanvas, 
			canvas.width, 0,
			canvas.width, canvas.height,
			0, -TILE_SIZE/2,
			canvas.width, canvas.height
			);
		ctx.drawImage(tmpCanvas, 
			canvas.width, 0,
			canvas.width, canvas.height,
			0, TILE_SIZE * 1.5,
			canvas.width, canvas.height
			);
	// ctx.restore();

	texture.needsUpdate = true;


}

