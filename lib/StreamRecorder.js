var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');


// The stream Recorder captures everything that occurs on a stream.  This can be simple 'watch the events and record their order'
// all the way through to recording a complete log of everything done along with data dump. 

module.exports = iz.Package('StreamRecorder', { extends: stream.Transform }, function(Class) {
	
	var event_history_prv = Class.has('event_history', { isa: 'array', builder: function() { return new Array(); } });
	var buffers_prv = Class.has('buffers', { isa: 'array', builder: function() { return new Array(); } });


	Class.has({
		'completed': { isa: 'boolean', default: false },
		'capture_time': { isa: 'boolean', default: false },
		'capture_events': { isa: 'boolean', default: false },
		'capture_data': { isa: 'boolean', default: false },
		'events_to_record': { isa: 'array', builder: function() { return new Array('readable', 'end', 'close', 'drain', 'pipe', 'unpipe'); }},
		'transform_args': { isa: 'object', builder: function() { return {} }}
	});

	Class._on_object_create = function(args) {
		stream.Transform.call(this, this.transform_args());
		// set up event watching
		if (this.capture_events()) {
			var events = this.events_to_record();
			var i;
			for (i = 0; i < events.length; i++) {
				//console.log('StreamRecorder recording ' + events[i]);
				this.on(events[i], function(i) {
					var event_name = events[i];
					var new_event = { name: event_name };
					this.record_event('event', new_event);
				}.bind(this, i) );
			}

		}
		this.on('end', function() {
			//console.log("FREAKY");
			this.finish()
		}.bind(this));
	};

	Class.finish = function() {
		this.completed(true);
		this.emit('finished');
	}

	Class._transform = function(chunk, encoding, done_cb) {
		this.record_event('data',chunk);
		this.push(chunk);
		done_cb();
	};

	Class.record_event = function(type, event_details) {
		var events = event_history_prv.bind(this);
		var buffers = buffers_prv.bind(this);

		var event_record = {};
		if (this.capture_time()) {
			var d = new Date();
			event_record.timestamp = d.valueOf();
		}
		if (type === 'data') {
			event_record.type = 'data';
			event_record.size = event_details.length;
			if (this.capture_data()) {
				event_record.data = event_details;
				buffers().push(event_details);
			}
		} else if (type === 'event') {
			event_record.type = 'event';
			event_record.event_name = event_details.name;
//			console.log(event_details.name + " event recorded");
			if (event_details.args !== undefined) {
				event_record.event_args = event_details.args;
			};
		} else {
			event_record.type = 'unknown';
			event_record.details = event_details;
		}
		events().push(event_record);	
	};

	Class.get_events = function() {
		var events = event_history_prv.bind(this);

		// return a copy of the array, not the array.  No sneaky messing with the events list.
		return events().slice(0);
	};

	Class.get_all_data = function() {
		var buffers = buffers_prv.bind(this);
		if (buffers().length !== 0) {
			return Buffer.concat(buffers());
		} else {
			return Buffer('');
		}
	};

	Class.clear_captured_data = function() {
		var buffers = buffers_prv.bind(this);
		var buffer_list = buffers();
		for (var i = 0; i < buffer_list.length; i++) {
			delete buffer_list[i];
		};
	}

	return Class;
});
