var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
var StreamRecorder = require('../lib/StreamRecorder.js');
var checksums = require("./checksums.js");

describe('StreamRecorder', function () {
    
    var data_filename = './data/hundred-words.txt';
    var sums = {};

    before(function() {
        sums[data_filename] = checksums.hash_file('sha1', data_filename);
    });

    describe('Basic checks', function() {
        
        it('Event data is recorded as expected', function(done) {
            var recorder = new StreamRecorder({ capture_time: true, capture_events: true });

            recorder.on('finished', function() {
                var events = recorder.get_events();
                var found_events = {};
                for (var i = 0, len = events.length; i < len; i++) {
                    if (events[i].type == 'data') {
                        found_events['data'] = true;
                    } else {
                        found_events[events[i].event_name] = true;
                    }
                }
                // we should have at least seen all of these events
                assert.deepEqual(Object.keys(found_events).sort(),  [ 'data', 'drain', 'end', 'pipe', 'unpipe' ] );
                done();
            });

            var null_pipe = fs.createWriteStream('/dev/null');
            var filedata = fs.createReadStream('./data/american-english.txt');
            filedata.pipe(recorder).pipe(null_pipe); 

        });
        
        it('Data is recorded properly', function(done) {

            var recorder = new StreamRecorder({ capture_data: true, capture_time: false, capture_events: false });

            recorder.on('finished', function() {
                var data = recorder.get_all_data();
                var data_sum = checksums.hash_data('sha1', data);
                assert.equal(data_sum, sums[data_filename]);
                done();
            });

            var null_pipe = fs.createWriteStream('/dev/null');
            var filedata = fs.createReadStream(data_filename);
            filedata.pipe(recorder).pipe(null_pipe); 

        });

    });
});
