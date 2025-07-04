'use strict';

/**
 * Converts a Base64 string to a Uint8Array.
 * @param {string} b64 The base64-encoded string.
 * @returns {Uint8Array} The decoded binary data.
 */
function base64ToUint8Array(b64) {
    try {
        const binary_string = window.atob(b64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Failed to decode base64 string:", e);
        return new Uint8Array(0);
    }
}

/**
 * Converts a Uint8Array to a Base64 string.
 * @param {Uint8Array} bytes The binary data to encode.
 * @returns {string} The base64-encoded string.
 */
function uint8ArrayToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Converts a string to a Uint8Array using the modern TextEncoder API.
 * This correctly handles all UTF-8 characters.
 * @param {string} str The string to encode.
 * @returns {Uint8Array} The UTF-8 encoded binary data.
 */
function stringToUint8Array(str) {
    return new TextEncoder().encode(str);
}

/**
 * Converts a Uint8Array back to a string using the modern TextDecoder API.
 * This correctly handles all UTF-8 characters.
 * @param {Uint8Array} bytes The binary data to decode.
 * @returns {string} The decoded string.
 */
function uint8ArrayToString(bytes) {
    return new TextDecoder().decode(bytes);
}
