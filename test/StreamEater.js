var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
require('../lib/StreamEater.js');
var StreamEater = iz.Module('StreamEater');

describe('StreamEater', function () {
    
    var data_filename = './data/hundred-words.txt';

    before(function() {

    });

    
    describe('Basic checks', function() {

        it('Eats Streams', function(done) {
            var rs = fs.createReadStream(data_filename);
            var eater = new StreamEater();
            rs.on('end', function() {
                // this won't happen unless something eats the stream
                done();
            });
            rs.pipe(eater);
            // assert.equal('good', 'good');
        });
        it('Fires the finish event', function(done) {
            var rs = fs.createReadStream(data_filename);
            var eater = new StreamEater();
            eater.on('finish', function() {
                // this won't happen unless something eats the stream
                done();
            });
            rs.pipe(eater);
            // assert.equal('good', 'good');
        });
        

    });
});
