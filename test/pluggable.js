/*

pluggable.js - pluggable configuration test

The MIT License (MIT)

Copyright (c) 2013 Dale Schumacher, Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var tart = require('../index.js');

var test = module.exports = {};

test['tracing allows for alternate constructConfig mechanism'] = function (test) {
    test.expect(3);
    var newBeh = function newBeh(message) {
        test.equal(message, 'foo');
        test.done();
    };

    var constructConfig = function constructConfig(options) {
        test.ok(options);
        var config = function create(behavior) {
            test.strictEqual(behavior, newBeh);
            var actor = function send(message) {
                var event = {
                    cause: options.tracing.effect.event,
                    message: message,
                    context: context
                };
                options.tracing.effect.sent.push(event);
            };
            var context = {
                self: actor,
                behavior: behavior,
                sponsor: config
            };
            options.tracing.effect.created.push(context);
            return actor;
        };
        return config;
    };

    var controls = tart.tracing({constructConfig: constructConfig});

    var actor = controls.sponsor(newBeh);
    actor('foo');
    while (controls.dispatch() !== false) // run to completion
        ;
};

test['tracing default actor annotation is simple serial number'] = function (test) {
    test.expect(2);

    var sponsor = tart.tracing().sponsor;

    var noop = function () {};
    var foo = sponsor(noop);
    var bar = sponsor(noop);

    test.equal('@0', foo.toString());
    test.equal('@1', bar.inspect());

    test.done();
};
