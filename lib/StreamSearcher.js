var iz = require('iz-objects');
var izu = require('iz-utils');
var stream = require('stream');
var util = require('util');

iz.Package('StreamSearcher', function(Class, SUPER) {

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
            "inclusive": inclusive,
            "inbetween_buffers": [],
            "capturing_data": false,
            "searching_for": begin_tag,
            "previous_chunk": undefined
        };

        transformer._transform = function(chunk, encoding, done_cb) {
//            console.log("chunk == null " + (chunk == null));
//            console.log("'" + chunk.toString('utf8') + "'");
//            console.log('Transform being called with chunk of size ' + chunk.length);
            var search_in = chunk;
            var pre_found, found, pos
            var post_found, cut_point, buffers;
            var replace_callback = function(replacement_data) {
                //console.log('pushing replacement data:' + replacement_data.length);
                this.push(replacement_data);
                search_args.waiting_for_replacement = false;
            }.bind(transformer);

            var data_available = chunk.length;
            if (search_args.previous_chunk !== undefined) {
                data_available += search_args.previous_chunk.length;
            }
//            console.log('data available: ' + data_available);
            
            // if we are waiting for replacement data already, or we don't have enough data
            // to scan, we push our new data onto previous chunk and wait till our next chance.
            if (search_args.waiting_for_replacement || data_available < search_args.searching_for.length ) {
//                console.log("we are waiting for replacement data, or we don't have enough data to search");
//                console.log(search_args.waiting_for_replacement + "--" + data_available + "--" + search_args.searching_for.length);
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
//                    console.log('Pre Found was: [pre]' + pre_found.toString('utf8') + '[/pre]');
                    post_found = search_in.slice(cut_point);
//                    console.log('Post Found was: [post]' + post_found.toString('utf8') + '[/post]');
                    if (search_args.capturing_data) {
//                        console.log('found the end tag');
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
//                        console.log('found the begin tag.');

                        // we have been searching for the begin tag, we got the begin tag
                        // start storing data;
                        // push the pre_found out.
                        this.push(pre_found);
                        search_in = post_found;
                        search_args.capturing_data = true;
                        search_args.searching_for = end_tag;
                    }
                } else {
                    // didn't find anything in our search buffer. add to our previous chunks

                    // we know that the combo of chunk and previous chunk - IE search_in - doesn't have our string in it.  
                    // so we grab the last searching_for.length-1 bytes for our previous chunk, and push the rest to wherever it's going.

                    if (search_in.length > search_args.searching_for.length) {
                        var to_push = search_in.slice(0, search_in.length - (search_args.searching_for.length - 1));
                        // put the rest in previous_chunk.
                        search_args.previous_chunk = search_in.slice(to_push.length);
//                        console.log('-==] search_in bigger than searching_for: ' + search_in.length + " > " + search_args.searching_for.length);
                        if (search_args.capturing_data) {
                            search_args.inbetween_buffers.push(to_push);
                        } else {
                            this.push(to_push);
                        }
                    } else {
//                        console.log('-==] data not big enough to search again, adding to previous chunk: ' + search_in.length + " + " + search_args.searching_for.length);
                        search_args.previous_chunk = search_in;
                    }
                    search_in = undefined;
                }
            }
            done_cb();
        };

        transformer._flush= function() {
            if (search_args.inbetween_buffers.length > 0) {
                this.push(Buffer.concat(search_args.inbetween_buffers));
                search_args.inbetween_buffers = [];
            }
            if (search_args.previous_chunk !== undefined) {
                this.push(search_args.previous_chunk);
            }
        };

        return transformer;
    };

    return Class;
});