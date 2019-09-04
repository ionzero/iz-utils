var iz = require('iz-objects');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
var StreamSearcher = require('../lib/StreamSearcher.js');
var StreamCatcher = require('../lib/StreamCatcher.js');
var StreamEater = require('../lib/StreamEater.js');
var NullStream = require('../lib/NullStream.js');

describe('StreamSearcher', function () {
    
    var data_file = 'data/stream_searcher_test_data.txt';
    var result_data_file = 'data/stream_searcher_result_data.txt';
    var stream_result_file = 'data/stream_searcher_stream_result.txt';
    var null_result_file = 'data/stream_searcher_null_result.txt';
    var tiny_data_file = 'data/tiny.txt';

    before(function() {
    });

    
    describe('Basic checks', function() {
        
        it('Search with string replace works', function(done) {
            var datafile = fs.createReadStream(data_file);
            var expected_result_data = fs.readFileSync(result_data_file);
            var SS = new StreamSearcher();
            var streamcatcher = new StreamCatcher();

            var search = SS.get_searcher('<!--', '-->', false, function(data, cb) {
 //               console.log('Data found in between was: ' + data);
                cb('[********** bob *********]');
            });

            streamcatcher.on('finished', function(data) {
                assert.equal(expected_result_data.toString(), data.toString());
                done();
            });

            datafile.pipe(search);
            search.pipe(streamcatcher);
            streamcatcher.pipe(new StreamEater());
            //assert.equal('good', 'good');
        });
        
        it('Replace with stream content works', function(done) {
            var datafile = fs.createReadStream(data_file);
            var expected_result_data = fs.readFileSync(stream_result_file);
            var SS = new StreamSearcher();
            var streamcatcher = new StreamCatcher();

            var search = SS.get_searcher('<!--', '-->', false, function(data, cb) {
                var new_data = fs.createReadStream(tiny_data_file);
                cb(new_data);
            });

            streamcatcher.on('finished', function(data) {
                assert.equal(expected_result_data.toString(), data.toString());
                done();
            });

            datafile.pipe(search);
            search.pipe(streamcatcher);
            streamcatcher.pipe(new StreamEater());
            //assert.equal('good', 'good');
        });

        it('Replace with null stream works', function(done) {
            var datafile = fs.createReadStream(data_file);
            var expected_result_data = fs.readFileSync(null_result_file);
            var SS = new StreamSearcher();
            var streamcatcher = new StreamCatcher();

            var search = SS.get_searcher('<!--', '-->', true, function(data, cb) {
                var new_data = new NullStream();
                cb(new_data);
            });

            streamcatcher.on('finished', function(data) {
                assert.equal(expected_result_data.toString(), data.toString());
                done();
            });

            datafile.pipe(search);
            search.pipe(streamcatcher);
            streamcatcher.pipe(new StreamEater());
            //assert.equal('good', 'good');
        });
    });
});
