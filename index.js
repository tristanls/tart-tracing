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
  * `options`: _Object_ _(Default: undefined)_ Optional overrides.  WARNING:
      Implementation of `enqueue` and `dequeue` are tightly coupled and should
      be overridden together.
    * `enqueue`: _Function_ `function (eventQueue, events){}` Function that
        enqueues the new `events` onto the `eventQueue` in place, causing
        side-effects _(Example: `function (eventQueue, events){
        Array.prototype.push.apply(eventQueue, events); }`)_.
    * `dequeue`: _Function_ `function (eventQueue){}` Function that returns next
        event to be dispatched given an `eventQueue`
        _(Example: `function (eventQueue){ return eventQueue.shift(); }`)_.
  * Return: _Object_ The tracing control object.
    * `dispatch`: _Function_ `function () {}` Function to call in order to
        dispatch a single event.
    * `history`: _Array_ An array of effects that represents the history of
        execution.
    * `effect`: _Object_ Accumulated effects not yet committed to history.
    * `sponsor`: _Function_ `function (behavior) {}` A capability to create
        new actors.
*/
module.exports.tracing = function tracing(options) {
    options = options || {};

    var events = [];
    var history = [];

    options.enqueue = options.enqueue || function enqueue(eventQueue, events) {
        eventQueue.push(events.slice());  // clone event batch
    };
    
    options.dequeue = options.dequeue || function dequeue(eventQueue) {
        while (eventQueue.length > 0) {
            var batch = eventQueue[0];
            if (batch.length > 0) {
                return batch.shift();  // return next event
            }
            eventQueue.shift();
        }
        return false;
    };
    
    /*
    Conditionally apply accumulated external effects.
    */
    var applyExternalEffect = function applyExternalEffect(effect) {
        var record = false;
        if (effect.sent.length > 0) {
            options.enqueue(events, effect.sent);
            record = true;
        }
        if (effect.created.length > 0) {
            record = true;
        }
        if (record) {
            recordEffect(effect);
        }
    };

    /*
    Apply effects from executing an actor behavior.
    */
    var applyBehaviorEffect = function applyBehaviorEffect(effect) {
        if (effect.sent.length > 0) {
            options.enqueue(events, effect.sent);
        }
        recordEffect(effect);
    };

    /*
    Record `effect` in `exports.history`
    and initialize a new `export.effect` object.
    */
    var recordEffect = function recordEffect(effect) {
        history.push(effect);
        exports.effect = {
            created: [],
            sent: []
        };
    };

    /*
      * Return: _Effect_ or `false`. Effect of dispatching the next `event` or
          `false` if no events exists for dispatch.
    */
    var tracingDispatch = function tracingDispatch() {
        applyExternalEffect(exports.effect);  // WARNING: may change `exports.effect`
        var event = options.dequeue(events);
        if (!event) {
            return false;
        }
        var effect = exports.effect;
        effect.event = event;
        try {
            var previous = event.context.behavior;
            event.context.behavior(event.message);  // execute actor behavior
            if (previous !== event.context.behavior) {
                effect.previous = previous;
            }
        } catch (exception) {
            effect.exception = exception;
        }
        applyBehaviorEffect(effect);  // WARNING: will change `exports.effect`
        return effect;
    };

    var unused = function unused() {
        throw new Error('This pluggable hook should not be called');
    };

    var constructConfig = function constructConfig(options) {
        var config = function create(behavior) {
            var actor = function send(message) {
                var event = {
                    cause: exports.effect.event,
                    message: message,
                    context: context
                };
                exports.effect.sent.push(event);
            };
            var context = {
                self: actor,
                behavior: behavior,
                sponsor: config
            };
            exports.effect.created.push(context);
            return actor;
        };
        return config;
    };

    var exports = {
        effect: {
            created: [],
            sent: []
        },
        history: history,
        dispatch: tracingDispatch,
        sponsor: tart.pluggable({
            constructConfig: constructConfig,
            dispatch: unused,
            deliver: unused
        })
    };
    return exports;
};