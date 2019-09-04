var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
var checksums = require('./checksums.js');
var StreamTee = require('../lib/StreamTee.js');
var StreamCatcher = require('../lib/StreamCatcher.js');
var StreamEater = require('../lib/StreamCatcher.js');

describe('StreamTee', function () {

    var sums = {};
    var data_filename = './data/hundred-words.txt';

    before(function() {
        sums[data_filename] = checksums.hash_file('sha1', data_filename);
        sums[data_filename2] = checksums.hash_file('sha1', data_filename2);
    });

    describe('Basic checks', function() {

        it('Two-way tee works', function(done) {
            var rs = fs.createReadStream(data_filename);
            var streamtee = new StreamTee();
            var tee_out = streamtee.tee();

            var catcher_1 = new StreamCatcher();
            var catcher_2 = new StreamCatcher();
            catcher_2.on('end', function() {
                var data1 = catcher_1.get_all_data();
                var data1_sum = checksums.hash_data('sha1', data1);

                var data2 = catcher_2.get_all_data();
                var data2_sum = checksums.hash_data('sha1', data2);

                assert.equal(data1_sum, sums[data_filename]);
                assert.equal(data2_sum, sums[data_filename]);
                done();
            });
            catcher_1.pipe(new StreamEater());
            catcher_2.pipe(new StreamEater());
            rs.pipe(streamtee);
            streamtee.pipe(catcher_1);
            tee_out.pipe(catcher_2);
        });

        it('Three-way tee works', function(done) {
            var rs = fs.createReadStream(data_filename);
            var streamtee = new StreamTee();
            var tee_out = streamtee.tee();
            var tee_out2 = streamtee.tee();

            var catcher_1 = new StreamCatcher();
            var catcher_2 = new StreamCatcher();
            var catcher_3 = new StreamCatcher();

            catcher_3.on('end', function() {
                var data1 = catcher_1.get_all_data();
                var data1_sum = checksums.hash_data('sha1', data1);

                var data2 = catcher_2.get_all_data();
                var data2_sum = checksums.hash_data('sha1', data2);

                var data3 = catcher_3.get_all_data();
                var data3_sum = checksums.hash_data('sha1', data3);

                assert.equal(data1_sum, sums[data_filename]);
                assert.equal(data2_sum, sums[data_filename]);
                assert.equal(data3_sum, sums[data_filename]);

                done();
            });
            catcher_1.pipe(new StreamEater());
            catcher_2.pipe(new StreamEater());
            catcher_3.pipe(new StreamEater());

            rs.pipe(streamtee);
            streamtee.pipe(catcher_1);
            tee_out.pipe(catcher_2);
            tee_out2.pipe(catcher_3);
        });

    });
});
