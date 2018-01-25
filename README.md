# Symphony
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An interactive, visual and auditory exploration of BitCoin, Cryptocurrency and Blockchain technology. A singular aim, to help bring about greater understanding of both Blockchain technology and the ever expanding (and contracting) Cryptocurrency marketplace. 

![The Blockchain](./static/assets/cylindar.png)

## API

Symphony as a scriptable API to navigate through the blockchain, focus on specific blocks and retrieve information about the blockchain.



# Initialisation

`orpheus() Promise` is an asynchronous global function that returns a promise which resolves to the symphony api

```javascript
const api = await orpheus()
```
Once you have your api object you can call the following methods

# setDate

Navigates to the requested `Date` object in the block chain. For example to navigate to the genesis block call `api.setDate(new Date(2009, 0, 3))`. This method returns a Promise which rejects if the date requested is outside the available range, for example, in the futureu, or before the beginning of the blockchain.

```javascript
setDate(Date)Promise
```

# goToBlock

Accepts a string indicating a block hash and navigates to the relavent block in the block chain. The method returns a promise which rejects if the block doesn't exist, or is invalid

```javascript
goToBlock(hash String) Promise
```

# goToNextBlock, goToPreviousBlock

Whilst viewing a block, calling `goToNextBlock()` or `PreviousBlock()` will navigate to the relative block in the chain

# setSize

Call `setSize(w, h)` to set the size of canvas syphony renders to

# destroy

Call `destroy()` to stop the application and free memory. The app cannot be run after this.

# Feature Detection

The library requires certain platform features to run. We've bundled these checks under a flag which can be queried using `orpheus.canRun`

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# Run Standard.js test over code
npm run test
```

## Code Style

[![standard][standard-image]][standard-url]

This repository uses [`standard`][standard-url] to maintain code style and consistency,
and to avoid style arguments. `npm test` runs `standard` automatically, so you don't have
to!

[standard-image]: https://cdn.rawgit.com/standard/standard/master/badge.svg
[standard-url]: https://github.com/standard/standard
