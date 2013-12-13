/*

index.js - "tart-tracing": Tracing configuration implementation

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

var tart = require('tart');

/*
  * Return: _Object_ The tracing control object.
    * `dispatch`: _Function_ `function () {}` Function to call in order to
        dispatch a single event.
    * `history`: _Array_ An array of effects that represents the history of
        execution.
    * `initial`: _Object_ Initial effect prior to first dispatch.
    * `sponsor`: _Function_ `function (behavior) {}` A capability to create
        new actors.
*/
module.exports.tracing = function tracing(options) {
    options = options || {};

    var events = [];
    var history = [];
    var initial = {
        created: [],
        sent: []
    };
    var effect = initial;

    options.enqueue = options.enqueue || function enqueue(eventQueue, events) {
        Array.prototype.push.apply(eventQueue, events);
    };
    
    options.dequeue = options.dequeue || function dequeue(eventQueue) {
        return eventQueue.shift();
    };

    /*
      * Return: _Effect_ or `false`. Effect of dispatching the next `event` or
          `false` if no events exists for dispatch.
    */
    var tracingDispatch = function tracingDispatch() {
        if (effect === initial) {
            // mechanism for bootstrapping initial configuration state
            options.enqueue(events, effect.sent);
        }
        var event = options.dequeue(events);
        if (!event) {
            return false;
        }

        effect = {
            event: event,
            created: [],
            sent: []
        };
        try {
            var previous = event.context.behavior;
            event.context.behavior(event.message);
            if (previous !== event.context.behavior) {
                effect.previous = previous;
            }
            options.enqueue(events, effect.sent);
        } catch (exception) {
            effect.exception = exception;
        }
        history.push(effect);
        return effect;
    };

    var unused = function unused() {
        throw new Error('This pluggable hook should not be called');
    };

    var constructConfig = function constructConfig(options) {
        var config = function create(behavior) {
            var actor = function send(message) {
                var event = {
                    cause: effect.event,
                    message: message,
                    context: context
                };
                effect.sent.push(event);
            };
            var context = {
                self: actor,
                behavior: behavior,
                sponsor: config
            };
            effect.created.push(context);
            return actor;
        };
        return config;
    };

    return {
        initial: initial,
        history: history,
        dispatch: tracingDispatch,
        sponsor: tart.pluggable({
            constructConfig: constructConfig,
            dispatch: unused,
            deliver: unused
        })
    };
};