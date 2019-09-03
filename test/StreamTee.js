var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
require('../lib/StreamTee.js');
var StreamTee = iz.Module('StreamTee');

describe('StreamTee', function () {
    
    before(function() {

    });

    
    describe('Basic checks', function() {
        
        it('thing is good', function() {
            assert.equal('good', 'good');
        });
        

    });
});
