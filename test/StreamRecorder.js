var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
require('../lib/StreamRecorder.js');
var StreamRecorder = iz.Module('StreamRecorder');

describe('StreamRecorder', function () {
    
    before(function() {

    });

    describe('basic pipe functions', function() {
        
        it('thing is good', function(done) {
	    var events_to_record = new Array('end', 'close', 'drain', 'pipe', 'unpipe');
            var recorder = new StreamRecorder({ capture_time: true, capture_events: true, devents_to_record: events_to_record });

            recorder.on('finished', function() {
                console.log('Event log:' + util.inspect(recorder.get_events()));
                assert.equal('good', 'good');
                done();
            });

            var null_pipe = fs.createWriteStream('/dev/null');
            var filedata = fs.createReadStream('./data/american-english')
            filedata.pipe(recorder).pipe(null_pipe); 

        });
        

    });
});
