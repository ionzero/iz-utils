var iz = require('iz-objects');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
var StreamCatcher = require('../lib/StreamCatcher.js');
var StreamEater = require('../lib/StreamEater.js');
var checksums = require("./checksums.js");

describe('StreamCatcher', function () {
   
    var sums = {};
    var data_filename = './data/hundred-words.txt';
    var data_filename2 = './data/hundred-fifty-words.txt';
    
    before(function() {
        sums[data_filename] = checksums.hash_file('sha1', data_filename);
        sums[data_filename2] = checksums.hash_file('sha1', data_filename2);
    });
    
    describe('Basic checks', function() {
        
        it('full data received', function(done) {

            var rs = fs.createReadStream(data_filename);

            var catcher = new StreamCatcher();
            catcher.on('end', function() {
                var data = catcher.get_all_data();
                var data_sum = checksums.hash_data('sha1', data);
                assert.equal(data_sum, sums[data_filename]);
                done();
            });
            catcher.pipe(new StreamEater());
            rs.pipe(catcher);
        });
        
        it('full data via finished event', function(done) {

            var rs = fs.createReadStream(data_filename2);

            var catcher = new StreamCatcher();
            catcher.on('finished', function(data) {
                var data_sum = checksums.hash_data('sha1', data);
                assert.equal(data_sum, sums[data_filename2]);
                done();
            });
            catcher.pipe(new StreamEater());
            rs.pipe(catcher);
        });

        it('catch_only catches data without needing an output pipe', function(done) {

            var rs = fs.createReadStream(data_filename2);

            var catcher = new StreamCatcher({ catch_only: true });
            catcher.on('finished', function(data) {
                var data_sum = checksums.hash_data('sha1', data);
                assert.equal(data_sum, sums[data_filename2]);
                done();
            });
            rs.pipe(catcher);
        });

        it('catch_now after creation works without needing an output pipe', function(done) {

            var rs = fs.createReadStream(data_filename2);

            var catcher = new StreamCatcher();
            catcher.on('finished', function(data) {
                var data_sum = checksums.hash_data('sha1', data);
                assert.equal(data_sum, sums[data_filename2]);
                done();
            });
            rs.pipe(catcher);
            catcher.catch_now();
        });
    });
});
