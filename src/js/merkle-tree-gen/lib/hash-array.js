(function () {
  'use strict'

    // This module hashes the elements in an array and returns a FastMap of the hashes

  // var hasha = require('hasha')
  var FastMap = require('collections/fast-map')

  var hashAlgorithm
  var hashlist
  var fastMap

    /**
     * Initialize the HashArray construtor
     *
     * @param {string} hA The hash function to be used
     * @param {boolean} hL True if the array contains hashes, and false if
     *                      and false by default (just a regular array)
     *
     */
  function HashArray (hA = 'sha256', hL = false) {
    hashAlgorithm = hA
    hashlist = hL
  }

    /**
     * Hashes each of the elements in an array
     *
     * @param {array} array The array containing all the elements to hash
     * @param {callback} cb The callback containing the populated fastMap
     *
     */
  HashArray.prototype.hashElements = function hashElements (array, cb) {
    fastMap = new FastMap()

    // If the array should be treated as a list of hashes
    if (hashlist) {
      // Iterate over each of the elements and add them to the fastMap
      for (let index = 0; index < array.length; index++) {
        const value = array[index]
        fastMap.add(value, index)
      }
    } else {
      // for (let index = 0; index < array.length; index++) {
      //   const value = array[index]
      //   fastMap.add(hasha(value, {algorithm: hashAlgorithm}), index)
      // }
    }

    return fastMap
  }

  module.exports = HashArray
})()
