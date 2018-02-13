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
      const treeObj = genMerkle(fastMap, hashalgo)//, function (tree) {
        
      let sortedTree
      for (var key in treeObj) {
        if (treeObj.hasOwnProperty(key)) {
          var element = treeObj[key]
          if( element.type === 'root' ){
             element.parent = null
          } else if (element.type === 'node' || element.type === 'leaf' ) {
            element.parent = treeObj[element.parent]
          }
          if (element.type === 'root' || element.type === 'node') {
            
            element.children = {}
            element.children.left = treeObj[element.left]
            element.children.right = treeObj[element.right]
            if (element.type === 'root') {
              sortedTree = element
            }
          }
        }
      }

      // Get a flat heirachy sorted by depth
      let tree = Object.values(treeObj)
      tree.sort((a, b) => b.level - a.level)

      return { tree, sortedTree }

    }
  }

    // Export the fromArray() and fromFile() functions
  module.exports = {
    fromArray: fromArray
  }
})()
