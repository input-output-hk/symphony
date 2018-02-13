# Orpheus-Node
Orpheus runs on a blockchain that is cached onto a [Firestore Database](https://console.firebase.google.com/u/0/project/iohk-orpheus/database/firestore/data~2Fblocks~2F1625362). This allows front end clients to query the data using the [firebase client](https://www.npmjs.com/package/firebase)

## Getting started

### Deploy
Deploy to Firestore - TODO

Deploy to Firestore - TODO


## Web api
All the block data can be queried using firebase, but there are a few other queries that return time based data

### `getValueTimeSeries(from, to = Date.now())` - TODO
Returns the block values as Numbers over a time interval

### `getFeesTimeSeries(from, to = Date.now())` - TODO
Returns the block fees as Numbers over a time interval


## Server api
To maintain an up to date cache of the blocks, there are couple of methods

### `populate`
This is a node function that populates the database with all the block from the current block to the first block.
*This is a super long process. It takes days to populate the BTC blockchain*
`npm run populate`

### `checkForNewBlocks`
This is a HTTP Cloud function that checks for any new blocks since the last one in the database and adds them to Firestore

## Data

### Block

```javascript
{
  hash: Number,
  height: Number,
  time: Date | String,
  numTransactions: Number,
  value: Number,
  fee: Number,
  previous: Number
}
```

### Transaction

```javascript
{
  block: Number,
  hash: Number,
  time: Date | String,
  value: Number,
  fee: Number
}
```
