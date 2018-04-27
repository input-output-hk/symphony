
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

An interactive, visual and auditory exploration of Bitcoin, Cryptocurrency and Blockchain technology. A singular aim, to help bring about greater understanding of both Blockchain technology and the ever expanding (and contracting) Cryptocurrency marketplace.

## URL

Latest build on [symphony.iohk.io](//symphony.iohk.io)

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




## API

Symphony as a scriptable API to navigate through the blockchain, focus on specific blocks and retrieve information about the blockchain.


### Initialisation

#### WebGL support check

Use `orpheusApp.canRun` to detect WebGL.

```javascript
if (!orpheusApp.canRun) {
  console.log("No webgl support");
}
```



#### Create the Orpeus App

Create the Orpeus App and pass `path` variable for Symphony static assets.

```javascript
orpheusApp({ path: './static/assets/' }).then( app => {
  window.app = app
  ...
})
```



### Functions

#### setSize

Call `setSize` to resize or adapt the canvas.

```javascript
app.setSize(window.innerWidth, window.innerHeight)
window.addEventListener('resize', () => app.setSize(window.innerWidth, window.innerHeight))
```

#### setDate

Call `setDate` to start from particular date.

```javascript
app.setDate(date)
```

#### goToPrevBlock

Call `goToPrevBlock` to navigate to previous block.

```javascript
app.goToPrevBlock()
```

#### goToNextBlock

Call `goToNextBlock` to navigate to next block.

```javascript
app.goToNextBlock()
```

#### resetDayView

Call `resetDayView` cancel block selection.

```javascript
app.resetDayView()
```

#### destroy

Call `destroy()` to stop the application and free memory. The app cannot be run after this.

```javascript
app.destroy()
```



### Events

#### dayChanged

Event called when day gets changed.

```javascript
app.on('dayChanged', ({ date, input, output, fee }) => {
  console.log('dayChanged');
  console.log('date: '+date+', input '+input+', output: '+output+', fee: '+fee+'');
})
```

#### blockSelected

Event called when a block is selected.

```javascript
app.on('blockSelected', ({ bits, fee, feeToInputRatio, hash, height, input, n_tx, output, size, time }) => {
  console.log('blockSelected');
  console.log('bits: '+bits+', fee '+fee+', feeToInputRatio: '+feeToInputRatio+', hash: '+hash+', height: '+height+', input: '+input+', n_tx: '+n_tx+', output: '+output+', size: '+size+', time: '+time+'');
})
```

#### blockUnselected

Event called when a block is deselected.

```javascript
app.on('blockUnselected', _ => {
  ...
})
```

#### blockMouseOver

Event called when a mouse pointer is over one block.

```javascript
app.on('blockMouseOver', data => {
  console.log('blockMouseOver');
  console.log(data);
})
```

#### blockMouseOut

Event called when a mouse pointer leaves block.

```javascript
app.on('blockMouseOut', _ => {
  ...
})
```








## Code Style

[![standard][standard-image]][standard-url]

This repository uses [`standard`][standard-url] to maintain code style and consistency,
and to avoid style arguments. `npm test` runs `standard` automatically, so you don't have
to!

[standard-image]: https://cdn.rawgit.com/standard/standard/master/badge.svg
[standard-url]: https://github.com/standard/standard
