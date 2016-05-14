
/*
  Creates an image grid where each click loads
  a new StreetView panorama.
 */

var GoogleMaps = require('google-maps')
var THREE = require('three')
var equirect = require('google-panorama-equirectangular')
var panorama = require('google-panorama-by-location')
var createOrbitViewer = require('three-orbit-viewer')(THREE)
var getBestZoom = require('./max-ram-zoom')
var ParametricGeometries = require('./ParametricGeometries.js')(THREE);
var streetview = require('awesome-streetview')

GoogleMaps.KEY = 'AIzaSyCuKjnJWCoUMRLbVFNEkJoFVD0I73u_xJo';

GoogleMaps.load(function(google) {

var img = new Image();
img.src = 'assets/map.png';


var app = createOrbitViewer({
  clearColor: 0x000000,
  clearAlpha: 1.0,
  fov: 45,
  position: new THREE.Vector3(0, 0, 10)
})

var texture = new THREE.Texture()
texture.minFilter = THREE.LinearFilter
texture.generateMipmap = false

// transparent canvas to start (white)
var canvas = document.createElement('canvas')
texture.needsUpdate = true
texture.image = img
img.onload = function() {
  texture.needsUpdate = true;
}


// add a double-sided sphere
// var geo = new THREE.SphereGeometry(1, 84, 84)
geo = new THREE.ParametricGeometry( ParametricGeometries.mobius3d, 40, 40 );
var mat = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.DoubleSide
})
var mobius = new THREE.Mesh(geo, mat)
app.scene.add(mobius)

// flip the texture along X axis
// sphere.scale.x = -1

// var location = [78.235865,15.4900308]
// panorama(streetview(), {radius: 1000}, function (err, result) {
//   if (err) throw err

//   // load the equirectangular image
//   equirect(result.id, {
//     tiles: result.tiles,
//     canvas: canvas,
//     crossOrigin: 'Anonymous',
//     zoom: getBestZoom()
//   })
//     .on('complete', function (image) {
//       texture.needsUpdate = true
//     })
//     .on('progress', function (ev) {
//       texture.needsUpdate = true
//     })
// })

});