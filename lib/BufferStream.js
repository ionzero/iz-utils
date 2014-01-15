var iz = require('iz-objects');
var util = require('util');
var stream = require('stream');

iz.Package('BufferStream', { extends : stream.Readable }, function (Class, SUPER) {

    Class.has({
        'buffer': { isa: 'object', builder: function() { return new Buffer(1024) } },
        'read_position': { isa: 'number', default: 0}
    });

    Class._on_object_create = function(args) {
        stream.Readable.call(this);
    };
 
    Class._read = function(size) {
        if (this.read_position() >= this.buffer().length) {
            this.push(null); //cb(null,null);
        } else {
            var data_left = this.buffer().length - this.read_position();
            if(size > data_left) {
                size = data_left;
            }
            var new_buf = this.buffer().slice(this.read_position(), this.read_position() + size);
            this.read_position(this.read_position() + size);
            this.push(new_buf); // cb(null, new_buf);
            if (this.read_position() >= this.buffer().length) {
                this.push(null); // cb(null,null);
            }
        }
    };

    return Class;
});