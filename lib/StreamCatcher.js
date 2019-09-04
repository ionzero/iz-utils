var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');
var StreamRecorder = require('./StreamRecorder.js');
var StreamEater = require('./StreamEater.js');

// This needs testing.
module.exports = iz.Package('StreamCatcher', { extends: "StreamRecorder" }, function(Class, SUPER) {

    Class.has({'catch_only': { isa: 'boolean', default: false }});
    Class._on_object_create = function(args) {
        this.capture_data(true);
        this.capture_events(false);
        this.capture_time(false);
        SUPER(this, '_on_object_create')(args);
        if (this.catch_only()) {
            this.once('pipe', function() {
                this.catch_now();
            }.bind(this));
        }
    };

    Class.finish = function() {
        this.emit('finished', this.get_all_data());
    };

    // By default StreamCatcher catches the data as it
    // is routed to its destination.
    //
    // catch_now tells the StreamCatcher that it
    // is the final destination for this data
    Class.catch_now = function() {
        if (this.catching != true) {
            this.pipe(new StreamEater());
            this.catching = true;
        }
    };

    return Class;
});
