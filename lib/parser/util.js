"use strict"

/**
 * Find last match element
 * @template {any[] | string} A
 * @param {A} arr array
 * @param {(element: A extends (infer U)[] ? U : string) => boolean} callback callback
 * @returns {(A extends (infer U)[] ? U : string) | undefined} element
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
 * @template {any[] | string} A
 * @param {A} arr array
 * @param {(element: A extends (infer U)[] ? U : string) => boolean} callback callback
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
 * @template {any[] | string} A
 * @param {A} arr array
 * @param {(element: A extends (infer U)[] ? U : string) => boolean} callback callback
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
