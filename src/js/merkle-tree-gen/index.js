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
  var array

  // Import dependencies
  var genMerkle = require('./lib/merkle-gen')

  function fromArray (args, cb) {
    array = args.array

    const fastMap = array

    // Generate a Merkle Tree from the leaves
    const treeObj = genMerkle(fastMap)

    let sortedTree
    const tree = []
    for (var key in treeObj) {
      if (treeObj.hasOwnProperty(key)) {
        var element = treeObj[key]
        if (element.type === 'root') {
          element.parent = null
        } else if (element.type === 'node' || element.type === 'leaf') {
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
        tree.push(element)
      }
    }

    // Get a flat hierachy sorted by depth
    tree.sort((a, b) => b.level - a.level)

    return { tree, sortedTree }
  }

  module.exports = {
    fromArray: fromArray
  }
})()
