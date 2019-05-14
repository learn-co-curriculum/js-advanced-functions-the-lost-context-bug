# Title

## Learning Goals

-SWBAT 1
-SWBAT 2

## Introduction

## SWBAT 1

## SWBAT 2

## Conclusion

## Resources
# JavaScript Advanced Functions: Debug-Along: The Lost Context Bug

## Introduction

In the previous lessons we've learned about record-oriented programming and
how, by using methods like `call`, `apply`, and `bind`, we can change the
default context of a function from the global context (`window` in the
browser, `global` in NodejS) as we see fit. That's an awesome power.

However, sometimes the rules of function execution interact in a way that
leads to ***one particularly surprising bug***: the lost context bug. It's
impossible to list _all_ the places where this bug could be triggered, but if
you encounter something "strange" like we describe below, you'll know how to
proceed.

## Scenario

It's the All-Father Odin's birthday. His sons, Thor and Loki, would like to
print him a birthday greeting using JavaScript. They know how to define
`Object`s and `function`s, so they've written a simple function that takes an
configuration `Object` as the _execution context_ and prints a JavaScript
greeting card.

The `Object` looks like this:

```js
let configuration = {
    frontContent: "Happy Birthday, Odin One-Eye!",
    insideContent: "From Asgard to Nifelheim, you're the best all-father ever.\n\nLove,",
    closing: {
        "Thor": "Admiration, respect, and love",
        "Loki": "Your son"
    },
    signatories: [
        "Thor",
        "Loki"
    ]
}
```

To display this, they wrote the following function:

```js
let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)

    this.signatories.forEach(function(signatory){
        let message = `${this.closing[signatory]}, ${signatory}`
        console.log(message)
    })
}

printCard.call(configuration)
```

This doesn't work as planned. They get an error like the following:

```shell
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
/Users/heimdall/git_checkouts/fi/jscontext/unnamed/card.js:20
        let message = `${this.closing[signatory]}, ${signatory}`
                                     ^

TypeError: Cannot read property 'Thor' of undefined
    at /Users/heimdall/git_checkouts/fi/jscontext/unnamed/card.js:20:38
    at Array.forEach (<anonymous>)
    at Object.printCard (/Users/heimdall/git_checkouts/fi/jscontext/unnamed/card.js:19:22)
    at Object.<anonymous> (/Users/heimdall/git_checkouts/fi/jscontext/unnamed/card.js:25:11)
    at Module._compile (internal/modules/cjs/loader.js:799:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:810:10)
    at Module.load (internal/modules/cjs/loader.js:666:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:606:12)
    at Function.Module._load (internal/modules/cjs/loader.js:598:3)
    at Function.Module.runMain (internal/modules/cjs/loader.js:862:12)
```

What is going on here?" A quick debug shows that there **very much** is a
property called `"Thor"` in `configuration.closing`:

```js
console.log(configuration.closing.Thor) //=> "Admiration, respect, and love"
```

What we have here is one of the most boggling problems in JavaScript: the
surprise that function expressions and declarations inside of other functions
***do not automatically*** use the same context. Forgetting or not quite fully
*appreciating JavaScript's rules around execution contexts can create this
*bug: the lost context bug.

## Debugging: Discovering the Nature of the Lost Context Bug

As a first step in getting this code working, let's add some `console.log()`
calls so we can see what `this` is.

```js
let configuration = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)

    console.log("Debug Before forEach: " + this)
    this.signatories.forEach(function(signatory){
        console.log("Debug Inside: " + this)
        // let message = `${this.closing[signatory]}, ${signatory}`
        console.log(message)
    })
}
```

```text
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
Debug Before forEach: [object Object]
Debug Inside: [object global]
Debug Inside: [object global]
```

The `console.log()` statements reveal the bug. _Inside_ the `forEach`, the
execution context **is not** the configuration object we used as a `this`
argument when calling the function `printCard`. Instead, the `this` _inside_
the function expression passed to `forEach` is the global object.

Remember the rules of function invocation. A function defaults to getting the
global scope as _execution context_. It **does not** get its parent
function's _execution context_ automatically. There are many ways for the
programmers to solve this problem. The three most common are:

1. Pass a `thisArg`
2. Use a closure
3. Use (something new) the arrow function expression

## Solution 1: Pass forEach a `thisArg`

Per the [forEach documentation][fed], we could pass a `thisArg` argument to
`forEach` as its second argument, after the function expression, and things
should work. And they do.

> **ASIDE***: This pattern works for `forEach` as well as `map`, `reduce` and
> all the other collection-processing methods.

```js
let configuration = {
    frontContent: "Happy Birthday, Odin One-Eye!",
    insideContent: "From Asgard to Nifelheim, you're the best all-father ever.\n\nLove,",
    closing: {
        "Thor": "Admiration, respect, and love",
        "Loki": "Your son"
    },
    signatories: [
        "Thor",
        "Loki"
    ]
}

let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)

    this.signatories.forEach(function(signatory){
        let message = `${this.closing[signatory]}, ${signatory}`
        console.log(message)
    }, this)
}

printCard.call(configuration)
/*
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
Admiration, respect, and love, Thor
Your son, Loki
*/
```

In the call to `forEach` we tell it to use for its context the context that
`printCard` has as `this`.

A slight variation on this idea would be to invoke `bind` on the function
expression in the `forEach`:

```js
let configuration = {
    frontContent: "Happy Birthday, Odin One-Eye!",
    insideContent: "From Asgard to Nifelheim, you're the best all-father ever.\n\nLove,",
    closing: {
        "Thor": "Admiration, respect, and love",
        "Loki": "Your son"
    },
    signatories: [
        "Thor",
        "Loki"
    ]
}

let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)
    let contextBoundForEachExpr = function(signatory){
        let message = `${this.closing[signatory]}, ${signatory}`
        console.log(message)
    }.bind(this)

    this.signatories.forEach(contextBoundForEachExpr)
}

printCard.call(configuration)
/*
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
Admiration, respect, and love, Thor
Your son, Loki
*/
```

### Solution 2: Use a Closure

In the previous section we noted that we were going to take the `this` that
`printCard` has access to and re-pass it either as a `thisArg` to `forEach`
**or** as the context for `bind`. Since we have an ability to "point to" that
context, we could assign that value to a variable and leverage function-level
scope and _closures_ to regain access to the outer context.

```js
let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)

    let outerContext = this

    this.signatories.forEach(function(signatory){
        let message = `${outerContext.closing[signatory]}, ${signatory}`
        console.log(message)
    })
}

printCard.call(configuration)
/*
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
Admiration, respect, and love, Thor
Your son, Loki
*/
```

Many JavaScript developers even go so far to call the variable we called
`outerContext` by the name `self` which sure is confusing for Ruby
programmers!

What we would _really_ like is for there to be a way to tell the `function`
inside of `forEach` to

1. _Not_ declare its own context **but also**
2. _Not_ require us to do some extra work with using `bind` or a `thisArg`.

In ES6, JavaScript gave us an answer: the "arrow function expression."

### The Arrow Function Expression

The arrow function expression is simply (yet) another way of writing a
function expression. They look different from each other, true, but the
***most important difference*** is that the arrow function ***does indeed
inherit the context of its parent containing `function`***. An arrow function
looks like this:

```js
let greeter = (nameToGreet) => {
    let messasge = `Good morning ${nameToGreet}`
    console.log(message)
    return "Greeted: " + nameToGreet
}
let result = greeter("Max") //=> "Greeted: Max"
```

Which, excluding context-switching differences, is the exact same as:

```js
let greeter = function(nameToGreet) {
    let messasge = `Good morning ${nameToGreet}`
    console.log(message)
    return "Greeted: " + nameToGreet
}
let result = greeter("Max Again") //=> "Greeted: Max Again"
```

Because arrow functions are _so often used_ to take a value, do a single
operation with it, and return the result, arrow functions have two shortcuts:

* If you pass only one argument, you don't have to wrap the single parameter in `()`
* If there is only one expression, you don't need to wrap it in `{}` and the result of that expression is automatically returned.

As a result, this longer expression (with context shift):

```js
[1,2,3].reduce(function(memo, elem){
    return memo + elem * 10
}, 0) //=> 60
```

Can become this much shorter call:

```js
[1,2,3].reduce((memo, elem) => memo + elem * 10, 0) //=> 60
```
Thus Thor and Loki can fix their problem and wish their father a happy
birthday most elegantly with the following code:

```js

let configuration = {
    frontContent: "Happy Birthday, Odin One-Eye!",
    insideContent: "From Asgard to Nifelheim, you're the best all-father ever.\n\nLove,",
    closing: {
        "Thor": "Admiration, respect, and love",
        "Loki": "Your son"
    },
    signatories: [
        "Thor",
        "Loki"
    ]
}

let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)
    this.signatories.forEach(s => console.log(`${this.closing[s]}, ${s}`)
    )
}

printCard.call(configuration)
/*
Happy Birthday, Odin One-Eye!
From Asgard to Nifelheim, you're the best all-father ever.

Love,
Admiration, respect, and love, Thor
Your son, Loki
*/
```

## Conclusion

You've now learned how to both spot and how to counteract the lost context
bug using some very interesting tools. We think of this as a way to help
protect you as you start to build your own applications.

The arrow function expression that we introduced here is a very important
piece of syntax. While it lets us type less, and _yes_ that is a very good
thing, its most important feature is that ***it carries its parent's context
as its own***. We're going to review the arrow function by itself in a lab or
two, just to make sure you're comfotable with its syntax.



[fed]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach