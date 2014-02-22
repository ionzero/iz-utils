var iz = require('iz-objects');
var izu = require('iz-utils');
var stream = require('stream');
var util = require('util');

iz.Package('StreamSearcher', function(Class, SUPER) {

//    iz.Use('NullStream');

/*    Class.has({
        begin_item: { isa: 'object'},
        end_item: { isa: 'object'},
        inclusive: { isa: 'boolean', default: false },
        tags_found: { isa: 'boolean', default: false },
        passthrough_mode: { isa: 'boolean', default: false },
        previous_chunk: { isa: 'object'},
        in_pipe: { isa: 'object'},
        buffers: { builder: function(meta) { return new Array(); } },
        data_transformed: { isa: 'number', default: 0 }
        //stream_processor: { isa: 'object' }
    });
*/

    // TODO: Buffers don't have an indexOf.  We need one.  When node
    // get's a native one, we will revisit this.
    function indexOf(haystack, needle, i) {
        if (!Buffer.isBuffer(needle)) needle = new Buffer(needle);
        if (typeof i === 'undefined') i = 0;
        var l = haystack.length - needle.length + 1;
        while (i<l) {
            var good = true;
            for (var j=0, n=needle.length; j<n; j++) {
                if (haystack[i+j] !== needle[j]) {
                  good = false;
                  break;
                }
            }
            if (good) return i;
            i++;
        }
        return -1;
    }

    Class._on_object_create = function(args) {
        // set ourselves up by calling Transform's constructor;
        // The bufferSize and highWaterMark are key to handling larger data blocks
        // need to add handling where if we don't find iris tags in the first 128k of response,
        // we assume we never will and just passthrough.  We want to be flexible... but at some point... really..
        // I mean... wtf.
        //        stream.Transform.call(this, { bufferSize: 128 * 1024, highWaterMark: 128 * 1024 });

        //stream.Transform.call(this, {});
    }

    // callback will be called with data that was found and a function to call when there is a replacement ready.

    Class.get_searcher = function(begin, end, inclusive, callback) {
        var begin_tag = begin;
        var end_tag = end;
        if (!Buffer.isBuffer(begin_tag)) {
            begin_tag = new Buffer(begin_tag);
        }
        if (!Buffer.isBuffer(end_tag)) {
            end_tag = new Buffer(end_tag);
        }

        var transformer = new stream.Transform();


        var search_args = {
            "waiting_for_replacement": false,
            "begin_tag": begin_tag,
            "end_tag": end_tag,
            "inclusive": true,
            "inbetween_buffers": [],
            "capturing_data": false,
            "searching_for": begin_tag,
            "previous_chunk": undefined
        };
        //console.log = function() {};

        transformer._transform = function(chunk, encoding, done_cb) {
            console.log("chunk == null " + (chunk == null));
            console.log("'" + chunk.toString('utf8') + "'");
            console.log('Transform being called with chunk of size ' + chunk.length);
            var search_in = chunk;
            var pre_found, found, pos
            var post_found, cut_point, buffers;
            var replace_callback = function(replacement_data) {
                console.log('pushing replacement data:' + replacement_data.length);
                this.push(replacement_data);
                search_args.waiting_for_replacement = false;
                //this.read();
            }.bind(transformer);

            var data_available = chunk.length;
            if (search_args.previous_chunk !== undefined) {
                data_available += search_args.previous_chunk.length;
            }
            console.log('data available: ' + data_available);
            
            // if we are waiting for replacement data already, or we don't have enough data
            // to scan, we push our new data onto previous chunk and wait till our next chance.
            if (search_args.waiting_for_replacement || data_available < search_args.searching_for.length ) {
                console.log("we are waiting for replacement data, or we don't have enough data to search");
                console.log(search_args.waiting_for_replacement + "--" + data_available + "--" + search_args.searching_for.length);
                if (typeof search_args.previous_chunk === 'undefined') {
                    search_args.previous_chunk = chunk;
                } else {
                    search_args.previous_chunk = Buffer.concat([ search_args.previous_chunk, chunk ]);
                }
                done_cb();
                return;
            }

            // if we get here, we have enough data in chunk + previous_chunk to at least do a search;
            if (search_args.previous_chunk !== undefined) {
                search_in = Buffer.concat([search_args.previous_chunk, chunk]);
                search_args.previous_chunk = undefined;
            }

            console.log('about to search');
//            var done = false;
            while(search_in !== undefined && search_in.length !== 0) {
                console.log('looking in ' +search_in.length);
/*                if (search_in == undefined || search_in.length == 0) {
                    return done_cb();
                }
*/
                pos = indexOf(search_in, search_args.searching_for);
                console.log("Found '" + search_args.searching_for.toString('utf8') + "' at position " + pos);
                if (pos != -1) {
                    // found is the beginning of the string. - Depending on if we are searching for the
                    // beginning, or searching for the end, and whether we have inclusive or not, we do
                    // different things.
                    if (search_args.capturing_data) {
                        // searching for end tag;
                        cut_point = pos;
                        if (search_args.inclusive) {
                            cut_point += search_args.searching_for.length;
                        }
                    } else {
                        // searching for start tag;
                        cut_point = pos;
                        if (!search_args.inclusive) {
                            cut_point += search_args.searching_for.length;
                        }
                    }

                    // we found the thing we were looking for... if its the start, we switch
                    // into consuming mode and search for the next thing.
                    pre_found = search_in.slice(0, cut_point);
                    console.log('Pre Found was: [pre]' + pre_found.toString('utf8') + '[/pre]');
                    post_found = search_in.slice(cut_point);
                    console.log('Post Found was: [post]' + post_found.toString('utf8') + '[/post]');
                    if (search_args.capturing_data) {
                        console.log('found the end tag');
                        // we have been searching for the end tag, we got the end tag,
                        // so we call our replace-me callback.
                        search_args.inbetween_buffers.push(pre_found);

                        search_args.waiting_for_replacement = true;
                        search_args.capturing_data = false;
                        search_in = post_found;
                        search_args.searching_for = begin_tag;
                        buffers = search_args.inbetween_buffers;
                        search_args.inbetween_buffers = [];
                        // callback for replacement.
                        callback(Buffer.concat(buffers), replace_callback);
                    } else {
                        console.log('found the begin tag.');

                        // we have been searching for the begin tag, we got the begin tag
                        // start storing data;
                        // push the pre_found out.
                        this.push(pre_found);
                        //search_args.previous_chunk = post_found;
                        search_in = post_found;
                        //search_args.inbetween_buffers.push(post_found);
                        search_args.capturing_data = true;
                        search_args.searching_for = end_tag;
                        //return done_cb();
                    }
                } else {
                    console.log("-==] Didn't find anything.");
                    // didn't find anything in our search buffer. add to our previous chunks

                    // we know that the combo of chunk and previous chunk - IE search_in - doesn't have our string in it.  
                    // so we grab the last searching_for.length-1 bytes for our previous chunk, and push the rest to wherever it's going.

                    if (search_in.length > search_args.searching_for.length) {
                        var to_push = search_in.slice(0, search_in.length - (search_args.searching_for.length - 1));
                        // put the rest in previous_chunk.
                        search_args.previous_chunk = search_in.slice(to_push.length);
                        console.log('-==] search_in bigger than searching_for: ' + search_in.length + " > " + search_args.searching_for.length);
                        if (search_args.capturing_data) {
                            search_args.inbetween_buffers.push(to_push);
                        } else {
                            this.push(to_push);
                        }
                    } else {
                        console.log('-==] data not big enough to search again, adding to previous chunk: ' + search_in.length + " + " + search_args.searching_for.length);
                        search_args.previous_chunk = search_in;
                    }
                    search_in = undefined;
                }
                console.log('Data is: ' + util.inspect(search_args, { depth: null}));
            }
            done_cb();
        };

        transformer._flush= function() {
            console.log('end of stream');
            if (search_args.inbetween_buffers.length > 0) {
                this.push(Buffer.concat(search_args.inbetween_buffers));
                search_args.inbetween_buffers = [];
            }
            if (search_args.previous_chunk !== undefined) {
                console.log('Pushing last chunk: ' + search_args.previous_chunk)
                this.push(search_args.previous_chunk);
//                done_cb();
            }
        };

        return transformer;
    };

    // search for first thing.  when found, toggle mode to search for second thing.
    // from found - stop push()ing until second thing found.  when second thing found,
    // fire callback with function ref.  when function_ref called with buffer, push
    // buffer onto stack
/*
    Class._transform = function(chunk, encoding, done_cb) {
        var start;

        //this.log_debug("_transform. tags_found: " + this.tags_found());
        if (this.tags_found() === false) {

            //this.log_debug('=StreamParser-Parse mode ' + chunk);

            // scan for open IRIS tag.  If we find one, call output_data on information found ahead of that.
            // then take the rest and load it into a buffer for complete parsing... and kick off a ComponentProcessor
            // TODO - handle the scenario of the IRIS tag being split across chunks.
            // PSEUDO - Don't send first chunk. On each chunk:
            //  Do we have a previous chunk? No, push current chunk into previous. done.
            //  Yes - Grab last 7 bytes of previous buffer. concat with first 7 bytes of current
            //  buffer.  Do we have IRIS open tag?
            //     No: return previous buffer. add current buffer to previous buffer done.
            //     Yes: push both chunks into this.buffers(), set tags_found.
            // Remember to check for 'previous buffer' when we get end of stream.
            var previous_chunk = this.previous_chunk();
            //var prev = previous_chunk !== undefined ? true : false;
            //this.log_debug("do we have a previous chunk? " + prev);
            if (previous_chunk !== undefined) {
                // we have to inspect the end of the previous chunk
                var bridge_buffer = Buffer.concat([
                                            previous_chunk.slice(previous_chunk.length - 7),
                                            chunk.slice(0, 7)
                                                  ]);
                if (indexOf(bridge_buffer, '<!--IRIS') !== -1)
                {
                    //this.log_debug("indexOf(bridge_buffer, '<!--IRIS') !== -1");
                    // we have a tag on the boundary between chunks. kick off processing mode
                    this.tags_found(true);
                    this.buffers().push(previous_chunk)
                    this.buffers().push(chunk);
                    this.previous_chunk(undefined);
                    done_cb();
                    return;
                } else {
                    //this.log_debug("No tag on the boundary. Return the previous chunk.");
                    // no tag on the boundary.  Return the previous chunk
                    // and proceed onto normal processing.
                    this.push(previous_chunk);
                    this.push(chunk);

                    this.previous_chunk(undefined);
                    done_cb();
                    return;
                }
            }
            start = indexOf(chunk,'<!--IRIS');
            // Hours long trying to find this bug. Must check for
            // previous_chunk(), otherwise done_cb will get called
            // twice which results in the "no writecb" error.
            if (start === -1) {
                // if we didn't find a tag, look at the last 7 bytes to see if we
                // have something that looks like it could start an IRIS tag.  If so,
                // we stash the chunk and handle it the next time round. othwerwise it's
                // safe to return.
                //this.log_debug('=StreamParser-Parsemode ');
                if (chunk !== null) {
                    //this.log_debug('Chunk is not null.');
                    if(indexOf(chunk.slice(chunk.length - 7), '<') !== -1)
                    {
                        // by the time we get here, previous_chunk will be empty.
                        if(this.previous_chunk()) {
                            this.push(this.previous_chunk());
                        }
                        this.previous_chunk(chunk);
                    } else {
                        if(this.previous_chunk()) {
                            this.push(this.previous_chunk());
                        }
                        this.push(chunk);
                    }
                }
                done_cb();
            } else {
                this.tags_found(true);
                // we found an IRIS tag... that means we need to load the rest of the data into a buffer for processing.
                //this.log_debug("we found an IRIS tag... that means we need to load the rest of the data into a buffer for processing.");
                this.buffers().push(chunk);
                done_cb();
            }
        } else if(this.passthrough_mode() === true) {
//            this.log_debug('passthrough_mode is true');
            // passthrough mode means we output exactly what comes in.  This is what we do when
            // we have found tags and we have attached our stream processor's readable stream to our transform.
            //this.log_debug('=StreamParser-Passthrough mode ' + chunk);
            //this.log_debug('pushing chunk ...');
            this.push(chunk);
            //this.log_debug('calling done_cb()');
            done_cb();
        } else {
            // we are no longer scanning. This means we found an IRIS tag and need to store up our results into
            // a buffer for later use. Once we get end of the original pipe, we will
            this.buffers().push(chunk);
            done_cb();
        }
    };

    // this is called when the input stream is finished.
    Class.input_pipe_finished = function(stream_processor, ctx, pipe, done_cb) {
        var IRIS = process.app;

        if (this.tags_found() !== false) {
            //this.log_debug('// streamparser done with tags');

            // if tags were found.  That means we need to parse our buffer and fire off our stream processor
            // and attach that to the input side of our pipe... then we can relax and let things happen.
            var parser = IRIS.parser();
            var results = parser.parse(Buffer.concat(this.buffers()));

            // we no longer need the buffered data, get rid of our reference;
            this.buffers(undefined);
            this.passthrough_mode(true);
            if (pipe.stream !== undefined) {
                pipe.stream.unpipe();
            }
            // input stream is usually null... but it can be pre-set....
            var input_stream = pipe.input_stream;
            if (input_stream === undefined) {
                input_stream = new iz.Module('NullStream')();
            }
            stream_processor.process(results, ctx, { meta: pipe.meta, stream: input_stream }, function(stream) {

                // the stream here has already received ready_to_respond or we would not get this callback
                // so we just emit 'ready_to_respond' here.
                this.emit('ready_to_respond');

                // this attaches the resultcontainer to the transform pipe.  End on the stream will kill end this too.
                stream.pipe(this, { end: true });

            }.bind(this));
        } else {
            //this.log_debug('// streamparser '+ this.get_iz_object_tag() + ' done without tags');
            if (pipe.stream !== undefined) {
                pipe.stream.unpipe();
            }
            this.emit('ready_to_respond');
            // this means end of input data and since we never found any IRIS tags, we just trigger end pipe.
            this.end();
        }
    };

*/
    return Class;
});