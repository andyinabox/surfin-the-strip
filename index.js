var THREE = require('three');
var createOrbitViewer = require('three-orbit-viewer')(THREE);
var dat = require('exdat');
var geolocation = require('geolocation');
var KeyListener = require('key-listener');

var settings = require('./settings.json');

var tileGrabber = require('./tile-grabber');

var tileSources = {
	'satellite': 'http://otile1.mqcdn.com/tiles/1.0.0/sat/',
	'osm' : 'http://a.tile.openstreetmap.org/',
	'toner' : 'http://a.tile.stamen.com/toner/',
	'watercolor' : 'http://c.tile.stamen.com/watercolor/',
	'bw-mapnik' : 'http://a.tiles.wmflabs.org/bw-mapnik/',
	'cartodb-light': 'http://a.basemaps.cartocdn.com/light_all/',
	'cartodb-dark': 'http://a.basemaps.cartocdn.com/dark_all/',
	'landscape': 'http://a.tile.thunderforest.com/landscape/'
}

var keyHandler = new KeyListener();


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
		stripWidth: 1,
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
	}

}

var presets = {
	equator: {
		mob: {
			slices: 40,
			stacks: 40,
			radius: 4,
			stripWidth: 1,
			flatness: 0.1,
			wireframe: false		
		},
		map: {
			zoom: 6,
			lat: 0,
			lon: 0,
			tileSource: tileSources['satellite'],
			tileCount: 32
		}		
	},
	la: {
		mob: {
			slices: 40,
			stacks: 40,
			radius: 4,
			stripWidth: 1,
			flatness: 0.1,
			wireframe: false		
		},
		map: {
			zoom: 6,
			lat: 0,
			lon: 0,
			tileSource: tileSources['satellite'],
			tileCount: 32
		}		
	},
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

gui.remember(params.mob);
gui.remember(params.map);

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
	tileGrabber(
		canvas,
		params.map.lon,
		params.map.lat,
		params.map.zoom,
		params.map.tileCount,
		params.map.tileSource
	).on('progress', function(evt) {
		texture.needsUpdate = true;
	})
	.on('complete', function() {
		texture.needsUpdate = true;
	})
}
