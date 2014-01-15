var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');

module.exports = iz.Package('StreamTee', { extends: stream.Transform }, function(Class) {

	Class.has({ output_streams: { isa: 'object', builder: function() { return []; }}
			  });

	Class._on_object_create = function(args) {
		stream.Transform.call(this);
		this.on('end', function() {
			var streams = this.output_streams();

			for (var i = streams.length - 1; i >= 0; i--) {
				//console.log('Stream is done.');
				streams[i].stream.end();
			}
		}.bind(this));
		//this.paused = 0;
	};

	Class.tee = function() {
		var readablestream = new stream.PassThrough();
		var output_stream = {
			chunks: [],
			stream: readablestream
		};
		this.output_streams().push(output_stream);
		return readablestream;
	}

/*	Class.start = function() {
		// As soon as we get connected to a pipe, start eating the data.
		this.once('pipe', function() {
			// with our magical 'eat everything' transform, this will cause
			// continuous read from our input until we hit EOF.
			this.read();
		}.bind(this));
	};
*/
	Class._transform = function(chunk, encoding, done_cb) {
		var streams = this.output_streams();
		for (var i = streams.length - 1; i >= 0; i--) {
			streams[i].stream.write(chunk, encoding);
			//console.log("Pushing " + chunk.length + "bytes to tee");
		};
		this.push(chunk);
		done_cb();
	};

	return Class;
});