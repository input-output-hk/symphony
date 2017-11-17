'use strict';

var _populate = require('./populate');

var functions = require('firebase-functions');


exports.checkForNewBlocks = functions.https.onRequest(function (req, res) {
  (0, _populate.checkForNewBlocks)().then(function (blockresponse) {
    return res.status(200).send(blockresponse);
  });
});