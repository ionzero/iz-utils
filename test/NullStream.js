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
        
        it('thing is good', function() {
            assert.equal('good', 'good');
        });
        

    });
});
