var fs = require('fs');
var iz = require('iz-objects');
require('../lib/StreamSearcher.js');
var datafile = fs.readFileSync('stream_searcher_test_small.txt');

var SS = new iz.Module('StreamSearcher')();

var count = 0;

var search = SS.get_searcher('<!--IRIS', '-->', true, function(data, cb) {
    var new_data = fs.createReadStream('tiny.txt');
    //console.log('Data found in between was: [' + data + ']');
//        cb('[********** bob' + data.length +' *********]');
    setTimeout(function() { cb(new_data) }, 1500);


});

//datafile.pipe(search);

search.pipe(process.stderr);

var chunksize = datafile.length / 100;
var pos = 0;
var writedata = function(pos) {
    search.write(datafile.slice(pos, (pos+chunksize)));
    //console.log("-----> " + datafile.slice(pos, (pos+chunksize)).toString('utf8'));
    pos += chunksize;
    if (pos > datafile.length) {
        search.end();            
    } else {
        setTimeout(function() { 
            //console.log('writing data: ' + pos);
            writedata(pos);
        }, 200);    
    }
};

writedata(pos);
