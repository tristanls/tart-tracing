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

**Public API**

_TODO_

## Sources

  * [Tiny Actor Run-Time (JavaScript)](https://github.com/organix/tartjs)