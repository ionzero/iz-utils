var fs = require('fs');
var iz = require('iz-objects');
require('../lib/StreamSearcher.js');
var datafile = fs.readFileSync('stream_searcher_test_small.txt');

var SS = new iz.Module('StreamSearcher')();

var count = 0;
var search = SS.get_searcher('[!--IRIS', '--]', true, function(data, cb) {
    console.log('Data found in between was: [' + data + ']');
//        cb('[********** bob' + data.length +' *********]');
    cb('[' + data + count++ + ']');


});

//datafile.pipe(search);

search.pipe(process.stderr);

var chunksize = datafile.length / 100;
var pos = 0;
for (var i = 0; i < 101; i++) {
    search.write(datafile.slice(pos, (pos+chunksize)));
    //console.log("-----> " + datafile.slice(pos, (pos+chunksize)).toString('utf8'));
    pos += chunksize;
};
search.end();