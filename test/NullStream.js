var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
require('../lib/NullStream.js');
var NullStream = iz.Module('NullStream');

describe('NullStream', function () {
    
    before(function() {

    });
    
    describe('Basic checks', function() {
        it('finishes immediately as expected', function(done) {
            var nullstream = new NullStream();

            nullstream.on('end', function() {
                done();
            });

            nullstream.on('data', function(chunk) {
                // this should never happen
                assert.fail('Got a data chunk on a null stream');
            });
        });
        it('works in flowing mode', function(done) {
            var nullstream = new NullStream();

            nullstream.on('end', function() {
                done();
            });

            nullstream.on('readable', function(chunk) {
                // chunk is expected to be null
                while (null !== (chunk = nullstream.read(3))) {
                    // this should never happen
                    assert.fail('Got a data chunk on a null stream');
                }
            });
        });
    });
});
