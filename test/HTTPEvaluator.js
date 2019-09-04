var iz = require('iz-objects');
//var ct = iz.Use('IRIS.thing');
var assert = require('assert');
var util = require('util');
require('../lib/HTTPEvaluator.js');
var HTTPEvaluator = iz.Module('HTTPEvaluator');

describe('HTTPEvaluator', function () {
    
    before(function() {

    });

    
    describe('Basic Checks', function() {
        
        it('Placeholder check', function() {
            assert.equal('good', 'good');
        });
        

    });
});
