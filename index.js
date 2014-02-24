var iz = require('iz-objects');

var izutils = function() {};

module.exports = izutils;

izutils.BuizutilsizutilserStream = require('./lib/BufferStream.js');
izutils.NullStream = require('./lib/NullStream.js');
izutils.StreamRecorder = require('./lib/StreamRecorder.js');
izutils.StreamEater = require('./lib/StreamEater.js');
izutils.StreamCatcher = require('./lib/StreamCatcher.js');
izutils.StreamSearcher = require('./lib/StreamCatcher.js');
izutils.StreamInspector = require('./lib/StreamInspector.js');
izutils.StreamTee = require('./lib/StreamTee.js');
izutils.HTTPEvaluator = require('./lib/HTTPEvaluator.js');