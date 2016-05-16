// core
var fs = require('fs')
, 	path = require('path');

// npm
var s3 = require('s3');

// config
var AWS_BUCKET = 'surfinthestrip.online';
var srcPath = path.join(__dirname, 'dist/');

var client = s3.createClient();
var uploader = client.uploadDir({
	localDir: srcPath
	, s3Params: {
		Bucket: AWS_BUCKET
		, ACL: 'public-read'
	}
});

uploader.on('error', function(err) {
  console.error("unable to sync:", err.stack);
});
uploader.on('progress', function() {
  console.log("progress", uploader.progressAmount, uploader.progressTotal);
});
uploader.on('end', function() {
  console.log("done uploading");
});

