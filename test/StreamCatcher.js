var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
require('../lib/StreamCatcher.js');
var StreamCatcher = iz.Module('StreamCatcher');

describe('StreamCatcher', function () {
    
    before(function() {

    });

    
    describe('Basic checks', function() {
        
        it('thing is good', function() {
            assert.equal('good', 'good');
        });
        

    });
});
