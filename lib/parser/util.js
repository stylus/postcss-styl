"use strict"

/**
 * Find last match element
 * @param {Array|string} arr array
 * @param {function} callback callback
 * @returns {*} element
 */
function findLast(arr, callback) {
    const index = findLastIndex(arr, callback)
    if (index > -1) {
        return arr[index]
    }
    return undefined
}

/**
 * Find match index
 * @param {Array|string} arr array
 * @param {function} callback callback
 * @param {number} initIndex find start index
 * @returns {number} index
 */
function findIndex(arr, callback, initIndex = 0) {
    for (let index = initIndex; index < arr.length; index++) {
        const element = arr[index]
        if (callback(element)) {
            return index
        }
    }
    return -1
}

/**
 * Find last match index
 * @param {Array|string} arr array
 * @param {function} callback callback
 * @param {number} initIndex find start index
 * @returns {number} last index
 */
function findLastIndex(arr, callback, initIndex = arr.length - 1) {
    for (let index = initIndex; index >= 0; index--) {
        const element = arr[index]
        if (callback(element)) {
            return index
        }
    }
    return -1
}

module.exports = {
    findLast,
    findIndex,
    findLastIndex,
}
