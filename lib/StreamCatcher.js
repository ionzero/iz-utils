var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');
var StreamRecorder = require('./StreamRecorder.js');

// This needs testing.
module.exports = iz.Package('StreamCatcher', { extends: "StreamRecorder" }, function(Class, SUPER) {

    Class._on_object_create = function(args) {
        this.capture_data(true);
        this.capture_events(false);
        this.capture_time(false);
        SUPER(this, '_on_object_create')(args);
    };

    Class.finish = function() {
        this.emit('finished', this.get_all_data());
    };

    return Class;
});
