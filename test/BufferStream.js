var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
require('../lib/BufferStream.js');
var BufferStream = iz.Module('BufferStream');

describe('BufferStream', function () {

    before(function() {
    });


    describe('Basic checks', function() {
        it('Can get a stream from a buffer', function(done) {
            var text = Buffer.from("A Long string of text and some more text. ");

            var output= Buffer.alloc(0);
            var bufferstream = new BufferStream({ buffer: text });

            bufferstream.on('end', function() {
                if (text.compare(output) != 0) {
                    assert.fail("Data received from stream doesn't match original data")
                }
                done();
            });
            bufferstream.on('data', function(chunk) {
                output = Buffer.concat([output, chunk]);
            });
        });

        it('Can read in paused mode', function(done) {
            var text = Buffer.from("A Long string of text and some more text. ");

            var output= Buffer.alloc(0);
            var bufferstream = new BufferStream({ buffer: text });

            bufferstream.on('readable', function() {
                var chunk;
                while (null !== (chunk = bufferstream.read(3))) {
                    output = Buffer.concat([output, chunk]);
                }
            });

            bufferstream.on('end', function() {
                if (text.compare(output) != 0) {
                    assert.fail("Data received from stream doesn't match original data")
                }
                done();
            });
        });
    });
});
