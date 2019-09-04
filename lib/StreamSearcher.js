'use strict';
var iz = require('iz-objects');
var stream = require('stream');
var util = require('util');

module.exports = iz.Package('StreamSearcher', function(Class, SUPER) {

    // TODO: early versions of node had Buffers that don't have an indexOf.
    // We need one. If we have a native one, we use it, otherwise we do it
    // manually
    function indexOf(haystack, needle, i) {
        if (!Buffer.isBuffer(needle)) needle = Buffer.from(needle);
        if (typeof haystack.indexOf == 'function') {
            return haystack.indexOf(needle, i);
        } else {
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
    }

    // callback will be called with data that was found and a function to call when there is a replacement ready.
    Class.get_searcher = function(begin, end, inclusive, callback) {
        var begin_tag = begin;
        var end_tag = end;
        if (!Buffer.isBuffer(begin_tag)) {
            begin_tag = Buffer.from(begin_tag);
        }
        if (!Buffer.isBuffer(end_tag)) {
            end_tag = Buffer.from(end_tag);
        }

        var transformer = new stream.Transform();

        var search_args = {
            "waiting_for_replacement": false,
            "begin_tag": begin_tag,
            "end_tag": end_tag,
            "inclusive": inclusive,
            "replacement_data": [],
            "inbetween_buffers": [],
            "capturing_data": false,
            "searching_for": begin_tag,
            "ready_for_push": [],
            "unprocessed_chunks": [],
            "unprocessed_buffer_length": 0
        };

        transformer._search = function() {

            var pre_found, found, pos;
            var post_found, cut_point, buffers, search_in, some_data;

            if (search_args.unprocessed_chunks.length === 0 || search_args.unprocessed_buffer_length < search_args.searching_for.length) {
                return search_args.unprocessed_buffer_length;
            }

            search_in = Buffer.concat(search_args.unprocessed_chunks);

            while(search_in !== undefined && search_in.length !== 0) {
                pos = indexOf(search_in, search_args.searching_for);
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
                    post_found = search_in.slice(cut_point);

                    if (search_args.capturing_data) {
                        // we have been searching for the end tag, we got the end tag,
                        // so we call our replace-me callback.
                        search_args.inbetween_buffers.push(pre_found);

                        search_args.waiting_for_replacement = true;
                        search_args.capturing_data = false;
                        search_args.searching_for = begin_tag;
                        buffers = search_args.inbetween_buffers;
                        search_args.inbetween_buffers = [];
                        search_args.unprocessed_chunks = [ post_found ];
                        search_args.unprocessed_buffer_length = post_found.length;

                        callback(Buffer.concat(buffers), function(replacement_data) {
                                        if (typeof replacement_data ==='string' || Buffer.isBuffer(replacement_data)) {
                                            //console.log('pushing replacement data:' + replacement_data.length);
                                            if (typeof replacement_data === 'string') {
                                                this.push(Buffer.from(replacement_data));
                                            } else {
                                                this.push(replacement_data);
                                            }
                                            search_args.waiting_for_replacement = false;
                                            this._search();
                                        } else {
                                            // We have a stream, I think.
                                            // I don't actually know if this stream-handling code
                                            // works, it's not tested anywhere.
                                            //console.log('Readable Stream given');
                                            var my_data = replacement_data.read();
                                            if (my_data !== null) {
                                                //console.log('my_data is not null');
                                                search_args.replacement_data.push(my_data);
                                            }
                                            replacement_data.on('readable', function() {
                                                //console.log('data ready');
                                                var data;
                                                while( data = replacement_data.read() ) {
                                                    //console.log('adding replacement data ' + util.inspect(data));
                                                    if (data !== null) {
                                                        search_args.replacement_data.push(data);
                                                    }
                                                }
                                            }.bind(this));
                                            replacement_data.on('end', function() {
                                                //console.log('end of stream ' + util.inspect(search_args.replacement_data));
                                                search_args.waiting_for_replacement = false;
                                                this.push(Buffer.concat(search_args.replacement_data));
                                                search_args.replacement_data = [];
                                                this._search();
                                            }.bind(this));
                                        }
                                    }.bind(transformer)
                                );
                        return;
                    } else {

                        // we have been searching for the begin tag, we got the begin tag
                        // push the pre_found out.  let the post-found be handled the next time through the loop

                        this.push(pre_found);
                        search_in = post_found;
                        search_args.capturing_data = true;
                        search_args.searching_for = end_tag;
                    }
                } else {
                    // didn't find anything in our search buffer. add to our unprocessed chunks
                    if (search_in.length > search_args.searching_for.length) {
                        var to_push = search_in.slice(0, search_in.length - (search_args.searching_for.length - 1));
                        search_args.unprocessed_chunks = [ search_in.slice(to_push.length) ];
                        search_args.unprocessed_buffer_length = search_args.unprocessed_chunks[0].length;

                        if (search_args.capturing_data) {
                            search_args.inbetween_buffers.push(to_push);
                        } else {
                            search_args.ready_for_push.push(to_push);
                        }
                    } else {
                        search_args.unprocessed_chunks = [ search_in ];
                        search_args.unprocessed_buffer_length = search_in.length;
                    }
                    search_in = undefined;
                }
            }

            // now we push whatever is available to push, as long as we are not waiting for replacement.
            if (!search_args.waiting_for_replacement) {
                while( some_data = search_args.ready_for_push.shift()) {
                    this.push(some_data);
                }

                if (search_args.end_of_input && search_args.unprocessed_buffer_length < search_args.searching_for.length) {
                    // if we are here, we've hit end of input, we are not waiting on replacement data, and we don't have
                    // any unprocessed chunks, then we are really at end of file.
                    this._push_remaining_data();
                }
            }

        }

        transformer._push_remaining_data = function() {
            var some_data;
            while( some_data = search_args.inbetween_buffers.shift()) {
                this.push(some_data);
            }
            while( some_data = search_args.unprocessed_chunks.shift()) {
                this.push(some_data);
            }
            this.push(null);
        };

        transformer._transform = function(chunk, encoding, done_cb) {

            var pre_found, found, pos
            var post_found, cut_point, buffers;

            search_args.unprocessed_chunks.push(chunk);
            search_args.unprocessed_buffer_length += chunk.length;

            // if we aren't waiting for replacement data, and we have enough data to search, then we search.
            if (!search_args.waiting_for_replacement && (search_args.unprocessed_buffer_length >= search_args.searching_for.length )) {
                this._search();
            }
            done_cb();
        };

        transformer._flush= function() {
            search_args.end_of_input = true;
            if (search_args.waiting_for_replacement !== true) {
                this._push_remaining_data();
            }
        };

        return transformer;
    };

    return Class;
});
