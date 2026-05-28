(function() {
    'use strict';
    const modules = {};
    const definitions = {};

    function require(path) {
        if (modules[path]) {
            return modules[path].exports;
        }
        const module = { exports: {} };
        modules[path] = module;
        definitions[path](module, module.exports, require);
        return module.exports;
    }

    // --- Definition for './src/gf256.js' (Official Source) ---
    definitions['./src/gf256.js'] = function(module, exports) {
        const add = (a, b) => a ^ b;
        const mul = (a, b) => {
            let res = 0;
            while (b > 0) {
                if ((b & 1) === 1) res ^= a;
                a <<= 1;
                if (a & 0x100) a ^= 0x11b; // 283 (irreducible polynomial)
                b >>= 1;
            }
            return res;
        };
        let div;
        (() => {
            const exp = new Uint8Array(256);
            const log = new Uint8Array(256);
            let x = 1;
            for (let i = 0; i < 255; i++) {
                exp[i] = x;
                log[x] = i;
                x = mul(x, 3);
            }
            div = (a, b) => {
                if (b === 0) throw new Error('Division by zero');
                if (a === 0) return 0;
                const logA = log[a];
                const logB = log[b];
                return exp[(logA - logB + 255) % 255];
            };
        })();
        exports.add = add;
        exports.mul = mul;
        exports.div = div;
    };

    // --- Definition for './src/browser-crypto.js' (Official Source) ---
    definitions['./src/browser-crypto.js'] = function(module, exports) {
        exports.randomBytes = function(size) {
            const bytes = new Uint8Array(size);
            window.crypto.getRandomValues(bytes);
            return bytes;
        };
    };

    // --- Definition for './src/index.js' (Official Source) ---
    definitions['./src/index.js'] = function(module, exports, require) {
        const { randomBytes } = require('./src/browser-crypto.js');
        const gf256 = require('./src/gf256.js');

        exports.split = function(secret, { shares, threshold }) {
            const secretBytes = Uint8Array.from(secret);
            const result = new Array(shares).fill(0).map(() => new Uint8Array(secretBytes.length + 1));
            for (let i = 0; i < shares; i++) {
                result[i][0] = i + 1; // Set the x-coordinate for this share
            }
            for (let i = 0; i < secretBytes.length; i++) {
                const coefficients = new Array(threshold).fill(0).map((_, j) => (j === 0 ? secretBytes[i] : randomBytes(1)[0]));
                for (let j = 0; j < shares; j++) {
                    const x = result[j][0];
                    // Evaluate the polynomial at x using Horner's method for efficiency and correctness.
                    let y = 0;
                    for (let k = coefficients.length - 1; k >= 0; k--) {
                        y = gf256.mul(y, x);
                        y = gf256.add(y, coefficients[k]);
                    }
                    result[j][i + 1] = y;
                }
            }
            return result;
        };

        exports.combine = function(shares) {
            const secret = new Uint8Array(shares[0].length - 1);
            for (let i = 0; i < secret.length; i++) {
                let y = 0;
                for (let j = 0; j < shares.length; j++) {
                    const x_j = shares[j][0];
                    const y_j = shares[j][i + 1];
                    // Calculate the j-th Lagrange basis polynomial evaluated at x=0
                    let L = 1;
                    for (let k = 0; k < shares.length; k++) {
                        const x_k = shares[k][0];
                        if (x_j !== x_k) {
                            const term = gf256.div(x_k, gf256.add(x_j, x_k));
                            L = gf256.mul(L, term);
                        }
                    }
                    y = gf256.add(y, gf256.mul(y_j, L));
                }
                secret[i] = y;
            }
            return secret;
        };
    };

    // --- Expose the library to the window ---
    window.shamir = require('./src/index.js');
})();
