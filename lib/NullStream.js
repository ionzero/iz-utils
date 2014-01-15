var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');

// A NullStream is something that acts like a stream but ends immediately.
// Useful when something is expecting a stream but you have no stream data
// to give it.
module.exports = iz.Package('NullStream', { extends: stream.Readable }, function(Class, SUPER) {

	Class._on_object_create = function(args) {
		stream.Readable.call(this);
		//this.push('');
	};

	Class._read = function(size) {
		this.push(null);
	};

	return Class;
});