# tart-tracing

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/tart-tracing.png)](http://npmjs.org/package/tart-tracing)

Tracing configuration implementation for [Tiny Actor Run-Time in JavaScript](https://github.com/organix/tartjs).

## Contributors

[@dalnefre](https://github.com/dalnefre), [@tristanls](https://github.com/tristanls)

## Overview

Tracing configuration implementation for [Tiny Actor Run-Time in JavaScript](https://github.com/organix/tartjs).

  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)
  * [Sources](#sources)

## Usage

To run the below example run:

    npm run readme

```javascript
"use strict";

var tart = require('../index.js');
var util = require('util');

var tracing = tart.tracing();

var createdBeh = function createdBeh(message) {};
var becomeBeh = function becomeBeh(message) {};

var oneTimeBeh = function oneTimeBeh(message) {
    var actor = this.sponsor(createdBeh); // create
    actor('foo'); // send
    this.behavior = becomeBeh; // become
};

var actor = tracing.sponsor(oneTimeBeh);
actor('bar');

var effect;

console.log('tracing:');
console.log(util.inspect(tracing, {depth: null}));
while ((effect = tracing.dispatch()) != false) {
    console.log('effect:');
    console.log(util.inspect(effect, {depth: null}));
};
console.log('tracing:');
console.log(util.inspect(tracing, {depth: null}));
```

## Tests

    npm test

## Documentation

### Events

An `event` is an abstraction around the concept of a `message` being delivered to the actor. It is a tuple of a `message`, `context`, and `cause`. When an `event` is dispatched, the actor `context` is bound to `this` parameter and the behavior is executed given the `message`. The result of processing the `message` is an `effect`.

An `event` has the following attributes:

  * `cause`: _Event_ _(Default: undefined)_ The `event` that caused this event to happen. Will be `undefined` if this event is result of bootstrapping and no prior events were dispatched.
  * `context`: _Object_ Actor context the message was delivered to.
  * `message`: _Any_ Message that was delivered.

### Effects

An `effect` is an _Object_ that is the _effect_ of dispatching an `event`. It has the following attributes:

  * `created`: _Array_ An array of created contexts. A context is the execution context of an actor behavior (the value of _this_ when the behavior executes).
  * `event`: _Object_ The event that is the cause of this `effect`.
  * `exception`: _Error_ _(Default: undefined)_ If dispatching the `event` caused an exception, that exception is stored here.
  * `previous`: _Function_ _(Default: undefined)_ `function (message) {}` If the actor changed its behavior as a result of processing a `message`, the previous behavior is referenced here. The new actor behavior is in `event.context.behavior`.
  * `sent`: _Array_ An array of `events` that represent messages sent by the actor as a result of processing a `message`.

**Public API**

  * [tart.tracing(\[options\])](#tarttracingoptions)
  * [tracing.dispatch()](#tracingdispatch)
  * [tracing.sponsor(behavior)](#tracingsponsorbehavior)

### tart.tracing(options)

  * `options`: _Object_ _(Default: undefined)_ Optional overrides.  WARNING: Implementation of `enqueue` and `dequeue` are tightly coupled and should be overridden together.
    * `enqueue`: _Function_ `function (eventQueue, events){}` Function that enqueues the new `events` onto the `eventQueue` in place, causing side-effects _(Example: `function (eventQueue, events){ Array.prototype.push.apply(eventQueue, events); }`)_.
    * `dequeue`: _Function_ `function (eventQueue){}` Function that returns next event to be dispatched given an `eventQueue` _(Example: `function (eventQueue){ return eventQueue.shift(); }`)_.
  * Return: _Object_ The tracing control object.
    * `dispatch`: _Function_ `function () {}` Function to call in order to
        dispatch a single event.
    * `history`: _Array_ An array of effects that represents the history of
        execution.
    * `initial`: _Object_ Initial effect prior to first dispatch.
    * `sponsor`: _Function_ `function (behavior) {}` A capability to create
        new actors.

Returns the tracing control object.

### tracing.dispatch()

  * Return: _Effect_ or `false`. Effect of dispatching the next `event` or `false` if no events exists for dispatch.

Dispatch the next `event`.

```javascript
var tart = require('tart-tracing');
var tracing = tart.tracing();

var effect = tracing.initial;
while ((effect = tracing.dispatch()) !== false) {
    console.dir(effect);
}
```

### tracing.sponsor(behavior)

  * `behavior`: _Function_ `function (message) {}` Actor behavior to invoke every time an actor receives a message.
  * Return: _Function_ `function (message) {}` Actor reference in form of a capability that can be invoked to send the actor a message.

Creates a new (traceable) actor and returns the actor reference in form of a capability to send that actor a message.

```javascript
var tart = require('tart-tracing');
var tracing = tart.tracing();
var actor = tracing.sponsor(function (message) {
    console.log('got message', message);
    console.log(this.self);
    console.log(this.behavior);
    console.log(this.sponsor); 
});
```

## Sources

  * [Tiny Actor Run-Time (JavaScript)](https://github.com/organix/tartjs)
