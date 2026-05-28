/**
 * Privacy Bar
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

// Based on xoshiro128** - much better than RC4. Made by Claude AI, retrieved 2025. 
var SeededPRNG = (function() {
    var state = new Uint32Array(4);
    
    // Seed from string using SHA-256-like hash
    function hashString(str) {
        var h = new Uint32Array([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476]);
        
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            h[0] = (h[0] + c) | 0;
            h[0] = (h[0] << 7 | h[0] >>> 25) ^ h[1];
            h[1] = (h[1] + c) | 0;
            h[1] = (h[1] << 9 | h[1] >>> 23) ^ h[2];
            h[2] = (h[2] + c) | 0;
            h[2] = (h[2] << 13 | h[2] >>> 19) ^ h[3];
            h[3] = (h[3] + c) | 0;
            h[3] = (h[3] << 15 | h[3] >>> 17) ^ h[0];
        }
        
        return h;
    }
    
    function seed(seedStr) {
        var hash = hashString(seedStr);
        state[0] = hash[0];
        state[1] = hash[1];
        state[2] = hash[2];
        state[3] = hash[3];
        
        // Ensure non-zero state
        if ((state[0] | state[1] | state[2] | state[3]) === 0) {
            state[0] = 1;
        }
    }
    
    function rotl(x, k) {
        return (x << k) | (x >>> (32 - k));
    }
    
    function next() {
        var result = rotl(state[1] * 5, 7) * 9;
        var t = state[1] << 9;
        
        state[2] ^= state[0];
        state[3] ^= state[1];
        state[1] ^= state[2];
        state[0] ^= state[3];
        state[2] ^= t;
        state[3] = rotl(state[3], 11);
        
        return result >>> 0;
    }
    
    function random() {
        return next() / 0x100000000;
    }
    
    function rand() {
        return next() & 1; // Return 0 or 1
    }
    
    function prng(count) {
        for (var i = 0; i < count; i++) {
            next();
        }
    }
    
    return {
        seed: seed,
        random: random,
        rand: rand,
        prng: prng
    };
})();