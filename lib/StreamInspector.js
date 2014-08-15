var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');
var uuid = require('node-uuid')

/* 
    
Class: StreamInspector
  
Creates a passthrough stream transform that will inform you of what is happening on a stream. An inspected stream will
log to the console all activity including read activity and event activity.

Overview:

(code)
    var inspector = new iz.Module('StreamInspector')();
    inspector.inspect(originalstream, 'original stream');
    callback(null, inspector);
(end)

*/


module.exports = iz.Package('StreamInspector', { extends: stream.Transform }, function (Class) {
   
    iz.Use('IRIS.Logger');
    Class.mixin('IRIS.Logger');

    Class.has({
        'name': { isa: 'string', default: 'unknown stream' },
        'uuid': { isa: 'string', builder: function() { return uuid.v4(); } },
        'detail': { isa: 'boolean', default: false}
    });
   
    
/* 
method: inspect()
    
Attaches the inspector to the stream it should inspect.

Parameters:
    wrappedstream - Stream to inspect
    name - name to be used in debugging
    detail - boolean indicating whether data should be dumped to console during inspection

Returns:
    <StreamInspector> instance.
    
*/
    Class.inspect = function(wrappedstream, name, detail) {
        stream.Transform.call(this, {});
        if (name !== undefined) {
            this.name(name);
        }
        if (detail !== undefined) {
            this.detail(detail);
        }
        wrappedstream.pipe(this);

        wrappedstream.on('end', function() {
            this.log_debug('StreamInspector ' + this.name() + ' uuid: ' + this.uuid() + " received 'end' ");
        }.bind(this));
        wrappedstream.on('close', function() {
            this.log_debug('StreamInspector ' + this.name() + ' uuid: ' + this.uuid() + " received 'close' ");
        }.bind(this));
        wrappedstream.on('error', function() {
            this.log_debug('StreamInspector ' + this.name() + ' uuid: ' + this.uuid() + " received 'error' ");
        }.bind(this));
        this.log_debug('StreamInspector ' + this.name() + ' uuid: ' + this.uuid() + " wrapped");
        return this;
    }
   
    Class._transform = function(chunk, encoding, done_cb) {
        this.log_debug('StreamInspector ' + this.name() + ' uuid: ' + this.uuid() + " received data of length " + chunk.length);
        if (this.detail()) {
            this.log_debug(chunk.toString('utf8'));
        }
        this.push(chunk);
        done_cb();
    }
    

    return Class;
});