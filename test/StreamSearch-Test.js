var fs = require('fs');
var iz = require('iz-objects');
require('../lib/StreamSearcher.js');
var datafile = fs.createReadStream('stream_searcher_test_data.txt');

var SS = new iz.Module('StreamSearcher')();

var search = SS.get_searcher('<!--', '-->', false, function(data, cb) {
    console.log('Data found in between was: ' + data);
    cb('[********** bob *********]');
});

datafile.pipe(search);
search.pipe(process.stderr);