(function () {
  'use strict'

    /**
     * fromArray()
     *
     * Generates a Merkle Tree from an array with the arguments passed in. The
     * array cannot be empty. It can contain either values to be hashed, or an
     * actual list of hashes.
     *
     * @param {object} args An object containing the arguments to construct
     *                      the Tree. See the README for more info.
     * @param {callback} cb An object containing the Merkle Tree. See
     *                      the README for more info.
     *
     */
  function fromArray (args, cb) {
    var array
    var hashalgo
    var hashlist

    if (!args.array || args.array.length === 0) {
      cb('An array with at least 1 element is required', null)
      return null
    } else {
      array = args.array

      hashalgo = 'md5'

      hashlist = true

      // Import dependencies
      var HashArray = require('./lib/hash-array')
      var genMerkle = require('./lib/merkle-gen')

      var arrayHasher = new HashArray(hashalgo, hashlist)

      const fastMap = arrayHasher.hashElements(array)//, function (fastMap) {

      // Generate a Merkle Tree from the leaves
      const tree = genMerkle(fastMap, hashalgo)//, function (tree) {
        
      let sortedTree
      for (var key in tree) {
        if (tree.hasOwnProperty(key)) {
          var element = tree[key]
          if (element.type === 'root' || element.type === 'node') {
            tree[key].children = {}
            tree[key].children[element.left] = tree[element.left]
            tree[key].children[element.right] = tree[element.right]
            if (element.type === 'root') {
              sortedTree = element
            }
          }
        }
      }
      return sortedTree
                // });
            // });
    }
  }

    // Export the fromArray() and fromFile() functions
  module.exports = {
    fromArray: fromArray
  }
})()
