var THREE = require('three');
var createOrbitViewer = require('three-orbit-viewer')(THREE);
var dat = require('exdat');

var ParametricGeometries = require('./ParametricGeometries.js')(THREE);

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

var params = {
	gen: {

	},
	mob: {
		slices: 40,
		stacks: 10,
		radius: 3,
		stripWidth: 1,
		flatness: 0.125,
		wireframe: true		
	},
	map: {
		zoom: 17,
		lat: 40.657521,
		lon: -73.959439,
		tileSource: tileSources['satellite'],
		tileCount: 2,	
	}

}

// setup gui
var gui = new dat.GUI();
var guiGen = gui.addFolder('General');
var guiMob = gui.addFolder('Mobius');
guiMob.add(params.mob, 'radius', 0, 10);
guiMob.add(params.mob, 'stripWidth', 0, 10);
guiMob.add(params.mob, 'flatness', 0, 1);
guiMob.add(params.mob, 'slices', 1, 100).step(1);
guiMob.add(params.mob, 'stacks', 1, 100).step(1);
guiMob.add(params.mob, 'wireframe')
var guiMap = gui.addFolder('Map');
guiMap.add(params.map, 'zoom', 0, 32).step(1);
guiMap.add(params.map, 'lat').step(.000001);
guiMap.add(params.map, 'lon').step(.000001);
guiMap.add(params.map, 'tileSource', tileSources);
guiMap.add(params.map, 'tileCount', 0, 30).step(2);

var app = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 1.0,
  fov: 45,
  position: new THREE.Vector3(0, 0, 10)
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

// var texture = new THREE.Texture()
// texture.minFilter = THREE.LinearFilter
// texture.generateMipmap = false

// // transparent canvas to start (white)
// var canvas = document.createElement('canvas')
// texture.needsUpdate = true
// texture.image = img
// img.onload = function() {
//   texture.needsUpdate = true;
// }


// // add a double-sided sphere
// var geo = new THREE.SphereGeometry(1, 84, 84)
var geo = new THREE.ParametricGeometry( mobius3d, params.mob.slices, params.mob.stacks );
var mat = new THREE.MeshBasicMaterial({
  // map: texture,
  side: THREE.DoubleSide,
  wireframe: params.mob.wireframe
})
var mobius = new THREE.Mesh(geo, mat)
app.scene.add(mobius)

app.on('tick', function() {
	var m = app.scene.children[0];

	m.geometry = new THREE.ParametricGeometry(mobius3d, params.mob.slices, params.mob.stacks);
	m.material.wireframe = params.mob.wireframe;
	m.needsUpdate = true;

});
