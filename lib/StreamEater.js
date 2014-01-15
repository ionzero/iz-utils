var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');

// The StreamEater eats streams.  If you pipe something that produces data into it, it will
// mindlessly consume the data until there isn't any more.  This is useful when you have 
// something pumping out data and you no longer care about it.  Piping into a streameater
// will let you go about your business without worrying that resource will hang around waiting
// for something to consume it's data.
module.exports = iz.Package('StreamEater', { extends: stream.Transform }, function(Class) {

	Class._on_object_create = function(args) {
		stream.Transform.call(this);
		// As soon as we get connected to a pipe, start eating the data.
		this.once('pipe', function() {
			// with our magical 'eat everything' transform, this will cause
			// continuous read from our input until we hit EOF.
			this.read();
		}.bind(this));
	};

	Class._transform = function(chunk, encoding, done_cb) {
		done_cb();
	};

	return Class;
});