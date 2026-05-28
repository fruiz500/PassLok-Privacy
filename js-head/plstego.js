/**
 * Privacy Bar
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

const imgEOF = new Uint8Array([0, 0, 0, 255, 255, 255]); //end of encoded message marker, chosen to be unlikely to appear in the data, and also to be easy to identify in the decoding process. The first four zeros are needed because the encoding is done in RGB channels, and the last 255 is needed because only opaque pixels are used for encoding

// Add this helper function at the top of plstego.js, by Claude AI
function createOptimizedCanvas(width, height) {
	// Use OffscreenCanvas if available (better performance)
	if (typeof OffscreenCanvas !== 'undefined') {
		return new OffscreenCanvas(width, height);
	}
	// Fallback to regular canvas
	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

//this function does the PNG encoding as LSB in all channels except alpha, which is kept with original values

/**
 * Encodes a message into a PNG image using LSB steganography.
 * @param {Object} options - Encoding options
 * @param {HTMLImageElement} options.image - Cover image element
 * @param {Uint8Array} options.data - Binary data to embed
 * @param {string} options.password - Primary stego password
 * @param {boolean} [options.skipEncrypt=false] - Skip noise addition
 * @param {number} [options.iterations=1] - PRNG iterations
 * @param {Uint8Array} [options.data2] - Optional second message
 * @param {string} [options.password2] - Optional second password
 * @param {number} [options.iterations2=1] - Second PRNG iterations
 * @returns {Promise<string>} - Data URI of the stego image
 */
async function encodePNG({
	image,
	data,
	password,
	skipEncrypt = false,
	iterations = 1,
	data2,
	password2,
	iterations2 = 1
}) {
	return new Promise((resolve, reject) => {
		let msgBytes = data;

		try {
			// 1. Setup Canvas
			if (!image || !image.naturalWidth) {
				throw new Error('Invalid image element provided');
			}

			const shadowCanvas = document.createElement('canvas');
			const shadowCtx = shadowCanvas.getContext('2d', { willReadFrequently: true });

			if (!shadowCtx) {
				throw new Error('Failed to get canvas context');
			}

			shadowCanvas.width = image.naturalWidth;
			shadowCanvas.height = image.naturalHeight;
			shadowCtx.drawImage(image, 0, 0, shadowCanvas.width, shadowCanvas.height);

			const imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height);
			const length = imageData.data.length;

			// 2. Extract RGB coefficients from opaque pixels
			const alphaData = new Uint8Array(length / 4);
			let k = 0;
			let coefficients = new Uint8Array(length / 4 * 3);

			for (let i = 3; i < length; i += 4) {
				const alphaIndex = Math.floor(i / 4);
				alphaData[alphaIndex] = imageData.data[i];
				if (imageData.data[i] === 255) {
					for (let j = 0; j < 3; j++) {
						coefficients[k++] = imageData.data[i - 3 + j];
					}
				}
			}
			coefficients = coefficients.slice(0, k);

			// 3. Prepare Message (Append EOF)
			const finalMsgBytes = new Uint8Array(msgBytes.length + imgEOF.length);
			finalMsgBytes.set(msgBytes);
			finalMsgBytes.set(imgEOF, msgBytes.length);

			// 4. Stego Logic (PRNG & Shuffle)
			const seed = password + length.toString() + 'png';
			seedPRNG(seed, iterations);

			const myPermutation = shuffleCoefficients(coefficients, 0);

			let processedBytes = skipEncrypt ? finalMsgBytes : addNoise(finalMsgBytes);

			// encodeToCoefficients expects legacy bits
			const legacyMsgBin = uint8ArrayToLegacyBits(processedBytes);

			const lastIndex = encodeToCoefficients('png', legacyMsgBin, 0, coefficients, (msg) => {
				if (msg) throw new Error(msg);
			});

			// 5. Handle Second Message (Optional)
			if (data2) {
				let msgBytes2 = data2;
				const finalMsgBytes2 = new Uint8Array(msgBytes2.length + imgEOF.length);
				finalMsgBytes2.set(msgBytes2);
				finalMsgBytes2.set(imgEOF, msgBytes2.length);

				const seed2 = password2 + lastIndex.toString() + 'png';
				seedPRNG(seed2, iterations2);

				const myPermutation2 = shuffleCoefficients(coefficients, lastIndex + 1);

				let processedBytes2 = skipEncrypt ? finalMsgBytes2 : addNoise(finalMsgBytes2);
				const legacyMsgBin2 = uint8ArrayToLegacyBits(processedBytes2);

				encodeToCoefficients('png', legacyMsgBin2, lastIndex + 1, coefficients, (msg) => {
					if (msg) throw new Error(msg);
				});

				unShuffleCoefficients(coefficients, myPermutation2, lastIndex + 1);
			}

			unShuffleCoefficients(coefficients, myPermutation, 0);

			// 6. Reconstruct Image
			k = 0;
			for (let i = 3; i < length; i += 4) {
				const alphaIndex = Math.floor(i / 4);
				if (alphaData[alphaIndex] === 255) {
					for (let j = 0; j < 3; j++) {
						imageData.data[i - 3 + j] = coefficients[k++];
					}
				}
			}

			shadowCtx.putImageData(imageData, 0, 0);

			// 7. Finalize Output
			const dataUrl = shadowCanvas.toDataURL('image/png');
			image.src = dataUrl;

			resolve(dataUrl);

		} catch (error) {
			console.error('encodePNG error:', error);
			reject(error);
		}
	});
}

//decodes data stored in PNG image

/**
 * Decodes a message from a PNG image.
 * @param {Object} options - Decoding options
 * @param {HTMLImageElement} options.image - Stego image element
 * @param {string} options.password - Primary stego password
 * @param {number} [options.iterations=1] - PRNG iterations
 * @param {string} [options.password2] - Optional second password
 * @param {number} [options.iterations2=1] - Second PRNG iterations
 * @returns {Promise<Object>} - Decoded payload { primary: Uint8Array, secondary: Uint8Array|null }
 */
async function decodePNG({
	image,
	password,
	iterations = 1,
	password2,
	iterations2 = 1
}) {
	return new Promise((resolve, reject) => {
		try {
			// 1. Setup Canvas
			if (!image || !image.naturalWidth) {
				throw new Error('Invalid image element provided');
			}

			const shadowCanvas = document.createElement('canvas');
			const shadowCtx = shadowCanvas.getContext('2d', { willReadFrequently: true });

			if (!shadowCtx) {
				throw new Error('Failed to get canvas context');
			}

			shadowCanvas.width = image.naturalWidth;
			shadowCanvas.height = image.naturalHeight;
			shadowCtx.drawImage(image, 0, 0, shadowCanvas.width, shadowCanvas.height);

			const imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height);
			const length = imageData.data.length;

			// 2. Extract RGB coefficients from opaque pixels
			let k = 0;
			let coefficients = new Uint8Array(length / 4 * 3);

			for (let i = 3; i < length; i += 4) {
				if (imageData.data[i] === 255) {
					for (let j = 0; j < 3; j++) {
						coefficients[k++] = imageData.data[i - 3 + j];
					}
				}
			}
			coefficients = coefficients.slice(0, k);

			// 3. Stego Logic (PRNG & Shuffle)
			const seed = password + length.toString() + 'png';
			seedPRNG(seed, iterations);

			const myPermutation = shuffleCoefficients(coefficients, 0);

			// 4. Extract Primary Message
			// decodeFromCoefficients returns [Uint8Array, errorMsg, lastIndex]
			const result = decodeFromCoefficients('png', 0, coefficients);

			if (result[1] && result[1] !== 'Reveal successful') {
				throw new Error(result[1]);
			}

			const primaryData = result[0];
			const lastIndex = result[2];
			let secondaryData = null;

			// 5. Handle Second Message (Optional)
			if (password2) {
				const seed2 = password2 + lastIndex.toString() + 'png';
				seedPRNG(seed2, iterations2);

				const myPermutation2 = shuffleCoefficients(coefficients, lastIndex + 1);

				const result2 = decodeFromCoefficients('png', lastIndex + 1, coefficients);
				if (!result2[1]) {
					secondaryData = result2[0];
				}

				unShuffleCoefficients(coefficients, myPermutation2, lastIndex + 1);
			}

			// Cleanup
			unShuffleCoefficients(coefficients, myPermutation, 0);

			resolve({
				primary: primaryData,
				secondary: secondaryData
			});

		} catch (error) {
			console.error('decodePNG error:', error);
			reject(error);
		}
	});
}

// Global variables for js-steg compatibility
var globalBin, jpgPassword, jpgIter, showError, skipEncrypt, globalBin2, jpgPassword2, jpgIter2;

/**
 * Encodes a message into a JPEG image using F5-like steganography.
 * @param {Object} options - Encoding options
 * @param {HTMLImageElement} options.image - Cover image element
 * @param {Uint8Array} options.data - Binary data to embed
 * @param {string} options.password - Primary stego password
 * @param {boolean} [options.skipEncrypt=false] - Skip noise addition
 * @param {number} [options.iterations=1] - PRNG iterations
 * @param {Uint8Array} [options.data2] - Optional second message
 * @param {string} [options.password2] - Optional second password
 * @param {number} [options.iterations2=1] - Second PRNG iterations
 * @returns {Promise<string>} - Data URI of the stego image
 */
async function encodeJPG({
	image,
	data,
	password,
	skipEncrypt = false,
	iterations = 1,
	data2,
	password2,
	iterations2 = 1
}) {
	return new Promise((resolve, reject) => {
		// Set globals for js-steg compatibility
		globalBin = data;
		globalBin2 = data2;
		jpgPassword = password;
		jpgPassword2 = password2;
		jpgIter = iterations;
		jpgIter2 = iterations2;
		skipEncrypt = skipEncrypt;
		showError = (msg) => reject(new Error(msg)); // Use reject for error handling

		const startEncoding = () => {
			try {
				if (!image || !image.src) throw new Error('No image provided');

				if (image.src.slice(11, 15).match(/gif;|png;/)) {
					transparent2white(image);
				}

				jsSteg.reEncodeWithModifications(image.src, modifyCoefficients, (resultURI) => {
					image.src = resultURI;
					// Cleanup globals
					globalBin = null;
					globalBin2 = null;
					jpgPassword = '';
					jpgPassword2 = '';
					showError = null;
					resolve(resultURI);
				});
			} catch (error) {
				console.error('encodeJPG error:', error);
				reject(error);
			}
		};

		if (image.complete && image.naturalWidth !== 0) {
			startEncoding();
		} else {
			image.onload = startEncoding;
			image.onerror = () => reject(new Error('Failed to load image for JPEG encoding'));
		}
	});
}

//this function gets the jpeg coefficients (first luma, then chroma) and extracts the hidden material. Stops when the 48-bit endText code is found
/**
 * Decodes a message from a JPEG image.
 * @param {Object} options - Decoding options
 * @param {HTMLImageElement} options.image - Stego image element
 * @param {string} options.password - Primary stego password
 * @param {number} [options.iterations=1] - PRNG iterations
 * @param {string} [options.password2] - Optional second password
 * @param {number} [options.iterations2=1] - Second PRNG iterations
 * @returns {Promise<Object>} - Decoded payload { primary: Uint8Array, secondary: Uint8Array|null }
 */
async function decodeJPG({
	image,
	password,
	iterations = 1,
	password2,
	iterations2 = 1
}) {
	return new Promise((resolve, reject) => {
		// Start the async process
		jsSteg.getCoefficients(image.src, function (coefficients) {
			try {
				// 1. Validate coefficients
				if (!coefficients || !coefficients[1] || !coefficients[2]) {
					throw new Error('Invalid JPEG coefficients.');
				}

				const length = coefficients[1].length;
				if (coefficients[2].length !== length) {
					throw new Error('This image does not contain anything, or perhaps the password is wrong');
				}

				// 2. Linearize coefficients into a typed array
				const rawLength = 3 * length * 64;
				const rawCoefficients = new Int16Array(rawLength);

				for (let index = 1; index <= 3; index++) {
					const planeOffset = (index - 1) * length * 64;
					const currentPlane = coefficients[index];
					for (let i = 0; i < currentPlane.length; i++) {
						const blockOffset = i * 64;
						for (let j = 0; j < 64; j++) {
							rawCoefficients[planeOffset + blockOffset + j] = currentPlane[i][j];
						}
					}
				}

				// 3. Remove zeros and prepare for decoding
				let allCoefficients = removeZeros(rawCoefficients);

				// 4. Seed PRNG and shuffle for primary message
				const seed = password + allCoefficients.length.toString() + 'jpeg';
				seedPRNG(seed, iterations);
				const myPermutation = shuffleCoefficients(allCoefficients, 0);

				// 5. Decode primary message
				const result = decodeFromCoefficients('jpeg', 0, allCoefficients);

				if (result[1] && result[1] !== 'Reveal successful') {
					throw new Error(result[1]);
				}

				const primaryData = result[0];
				const lastIndex = result[2];
				let secondaryData = null;

				// 6. Handle second message if password2 is provided
				if (password2) {
					const seed2 = password2 + lastIndex.toString() + 'jpeg';
					seedPRNG(seed2, iterations2);
					const myPermutation2 = shuffleCoefficients(allCoefficients, lastIndex + 1);

					const result2 = decodeFromCoefficients('jpeg', lastIndex + 1, allCoefficients);
					if (result2[1] && result2[1] !== 'Reveal successful') {
						throw new Error(result2[1]);
					}
					if (result2[0]) {
						secondaryData = result2[0];
					}

					unShuffleCoefficients(allCoefficients, myPermutation2, lastIndex + 1);
				}

				// 7. Cleanup
				unShuffleCoefficients(allCoefficients, myPermutation, 0);
				allCoefficients = null;

				resolve({
					primary: primaryData,
					secondary: secondaryData
				});

			} catch (error) {
				// This ensures any error inside the callback leads to a reject
				console.error('decodeJPG error:', error);
				reject(error);
			}
		});
	});
}

/**
 * Called when encoding a JPEG
 * - coefficients: coefficients[0] is an array of luminosity blocks, coefficients[1] and
 *   coefficients[2] are arrays of chrominance blocks. Each block has 64 "modes"
 */
/**
 * Modifies JPEG DCT coefficients to embed a message.
 * Called by js-steg during re-encoding.
 * @param {Array<Array<Int16Array>>} coefficients - 3D array of DCT coefficients
 */
function modifyCoefficients(coefficients) {
	// Validate global state (required for js-steg compatibility)
	if (!globalBin) throw new Error("No message data provided to stego encoder");

	// 1. Convert input message to bytes
	let msgBytes;
	if (Array.isArray(globalBin)) {
		msgBytes = legacyBitsToUint8Array(globalBin);
	} else if (globalBin instanceof Uint8Array) {
		msgBytes = globalBin;
	} else {
		throw new Error("Data must be Uint8Array or legacy bit array");
	}

	// 2. Append EOF as bytes
	const finalMsgBytes = new Uint8Array(msgBytes.length + imgEOF.length);
	finalMsgBytes.set(msgBytes);
	finalMsgBytes.set(imgEOF, msgBytes.length);

	const length = coefficients[0].length;
	const rawLength = 3 * length * 64;

	// 3. Linearize coefficients into typed array
	const rawCoefficients = new Int16Array(rawLength);
	for (let index = 0; index < 3; index++) {
		const planeOffset = index * length * 64;
		for (let i = 0; i < length; i++) {
			const blockOffset = i * 64;
			for (let j = 0; j < 64; j++) {
				rawCoefficients[planeOffset + blockOffset + j] = coefficients[index][i][j];
			}
		}
	}

	// 4. Remove zeros and prepare for stego
	let allCoefficients = removeZeros(rawCoefficients);

	// 5. Seed PRNG and shuffle for primary message
	const seed = jpgPassword + allCoefficients.length.toString() + 'jpeg';
	seedPRNG(seed, jpgIter);
	let myPermutation = shuffleCoefficients(allCoefficients, 0);

	// 6. Add noise (byte-based)
	let processedBytes = skipEncrypt ? finalMsgBytes : addNoise(finalMsgBytes);

	// 7. Convert to legacy bits for encodeToCoefficients
	const legacyMsgBin = uint8ArrayToLegacyBits(processedBytes);

	const lastIndex = encodeToCoefficients('jpeg', legacyMsgBin, 0, allCoefficients, (msg) => {
		if (showError) showError(msg);
		throw new Error('insufficient cover image capacity');
	});

	// 8. Handle second message (if any)
	if (globalBin2) {
		let msgBytes2;
		if (Array.isArray(globalBin2)) {
			msgBytes2 = legacyBitsToUint8Array(globalBin2);
		} else if (globalBin2 instanceof Uint8Array) {
			msgBytes2 = globalBin2;
		} else {
			throw new Error("Second data must be Uint8Array or legacy bit array");
		}

		const finalMsgBytes2 = new Uint8Array(msgBytes2.length + imgEOF.length);
		finalMsgBytes2.set(msgBytes2);
		finalMsgBytes2.set(imgEOF, msgBytes2.length);

		const seed2 = jpgPassword2 + lastIndex.toString() + 'jpeg';
		seedPRNG(seed2, jpgIter2);

		let myPermutation2 = shuffleCoefficients(allCoefficients, lastIndex + 1);

		let processedBytes2 = skipEncrypt ? finalMsgBytes2 : addNoise(finalMsgBytes2);
		const legacyMsgBin2 = uint8ArrayToLegacyBits(processedBytes2);

		encodeToCoefficients('jpeg', legacyMsgBin2, lastIndex + 1, allCoefficients, (msg) => {
			if (showError) showError(msg);
			throw new Error('insufficient cover image capacity');
		});

		unShuffleCoefficients(allCoefficients, myPermutation2, lastIndex + 1);
	}

	// 9. Unshuffle and reconstruct image
	unShuffleCoefficients(allCoefficients, myPermutation, 0);

	let j = 0;
	for (let i = 0; i < rawLength; i++) {
		if (rawCoefficients[i] !== 0) {
			rawCoefficients[i] = allCoefficients[j++];
		}
	}

	for (let index = 0; index < 3; index++) {
		const planeOffset = index * length * 64;
		for (let i = 0; i < length; i++) {
			const blockOffset = i * 64;
			for (let j = 0; j < 64; j++) {
				coefficients[index][i][j] = rawCoefficients[planeOffset + blockOffset + j];
			}
		}
	}

	// Clear local refs to prevent memory leaks
	allCoefficients = null;
	myPermutation = null;
}

//seeds the PRNG and adds spurious computations according to Password weakness
function seedPRNG(seed, iter) {
	SeededPRNG.seed(seed);										//re-seed the PRNG
	if (iter) SeededPRNG.prng(Math.pow(2, iter) - 1)					//spurious computations, the more the worse the password
}

/**
 * Shuffles the provided array in-place.
 * @param {Uint8Array|Int8Array} coeffs - The array to shuffle.
 * @param {number} startIndex - Optional start index.
 * @returns {Array} The permutation array generated (to be stored locally by the caller).
 */
function shuffleCoefficients(coeffs, startIndex = 0) {
	const length = coeffs.length;
	const subLength = length - startIndex;
	const perm = randPerm(subLength);

	// We still need a temporary buffer for the shuffle step to avoid overwriting 
	// values before they are moved, but we keep it local.
	const temp = new coeffs.constructor(subLength);

	for (let i = 0; i < subLength; i++) {
		temp[i] = coeffs[startIndex + perm[i]];
	}

	// Copy back into the original array (In-place modification)
	for (let i = 0; i < subLength; i++) {
		coeffs[startIndex + i] = temp[i];
	}

	return perm; // Return the permutation so the caller can save it locally
}

/**
 * Un-shuffles the provided array in-place using a saved permutation.
 * @param {Uint8Array|Int8Array} coeffs - The array to un-shuffle.
 * @param {Array} perm - The permutation array returned by shuffleCoefficients.
 * @param {number} startIndex - Optional start index.
 */
function unShuffleCoefficients(coeffs, perm, startIndex = 0) {
	const length = coeffs.length;
	const subLength = length - startIndex;
	const inversePerm = new Array(subLength);
	const temp = new coeffs.constructor(subLength);

	// Create inverse permutation
	for (let i = 0; i < subLength; i++) {
		inversePerm[perm[i]] = i;
	}

	for (let i = 0; i < subLength; i++) {
		temp[i] = coeffs[startIndex + inversePerm[i]];
	}

	// Copy back into the original array (In-place modification)
	for (let i = 0; i < subLength; i++) {
		coeffs[startIndex + i] = temp[i];
	}
}

//obtain a random permutation using isaac re-seedable PRNG, for use in image steganography
function randPerm(n) {
	var result = new Array(n);
	result[0] = 0;

	for (var i = 1; i < n; ++i) {
		var idx = (SeededPRNG.random() * (i + 1)) | 0;			//here is the call to the PRNG library, floating point version
		if (idx < i) {
			result[i] = result[idx]
		}
		result[idx] = i
	}
	return result
}

function addNoise(byteArray) {
	const length = byteArray.length;
	for (let i = 0; i < length; i++) {
		let noisyByte = 0;
		for (let bit = 0; bit < 8; bit++) {
			// Generate a random bit (0 or 1)
			const randBit = SeededPRNG.rand(); 
			const originalBit = (byteArray[i] >> (7 - bit)) & 1;
			const newBit = originalBit ^ randBit;
			noisyByte |= (newBit << (7 - bit));
		}
		byteArray[i] = noisyByte;
	}
	return byteArray;
}

//convert binary array to decimal number
/**
 * Converts a bit array (0s and 1s) to a decimal number.
 * @param {Array|Uint8Array} array - Array of bits
 * @returns {number} - Decimal representation
 */
function binArray2dec(array) {
	const length = array.length;
	let output = 0;
	let mult = 1;

	for (let i = 0; i < length; i++) {
		output += array[length - 1 - i] * mult;
		mult *= 2;
	}
	return output;
}

//to get the parity of a number. Positive: 0 if even, 1 if odd. Negative: 0 if odd, 1 if even. 0 is even
/**
 * Calculates the steganographic parity of a coefficient.
 * @param {number} number - The coefficient value
 * @returns {number} - 0 or 1
 */
function stegParity(number) {
	if (number >= 0) {
		return number % 2;
	} else {
		// Specific F5 logic for negative coefficients
		return -(number - 1) % 2;
	}
}

/**
 * Filters out all zero values from a coefficient array.
 * @param {Int16Array|Array} array - The source coefficients
 * @returns {Int16Array} - A new array containing only non-zero values
 */
function removeZeros(array) {
	const length = array.length;
	let nonZeros = 0;

	for (let i = 0; i < length; i++) {
		if (array[i] !== 0) nonZeros++;
	}

	const outArray = new Int16Array(nonZeros);
	let j = 0;

	for (let i = 0; i < length; i++) {
		if (array[i] !== 0) {
			outArray[j++] = array[i];
		}
	}
	return outArray;
}

//gets counts in the DCT AC histogram: 2's plus -2, 3's plus -3, outputs array containing the counts
/**
 * Counts occurrences of values 2, 3, -2, -3 in an array.
 * @param {Int16Array|Array} array - Array of coefficients
 * @returns {Array<number>} - [count of 2/-2, count of 3/-3]
 */
function partialHistogram(array) {
	const output = [0, 0];
	const length = array.length;

	for (let j = 0; j < length; j++) {
		const val = array[j];
		if (val === 2 || val === -2) {
			output[0]++;
		} else if (val === 3 || val === -3) {
			output[1]++;
		}
	}

	return output;
}

//matrix encoding of allCoefficients with variable k, which is prepended to the message. Selectable for png or jpeg encoding.

/**
 * Encodes a message into JPEG/PNG coefficients using matrix encoding.
 * @param {string} type - 'jpeg' or 'png'
 * @param {Array<number>} inputBin - Message bits to encode (0/1 array)
 * @param {number} startIndex - Starting index in coefficients array
 * @param {Uint8Array|Int16Array} coefficients - Coefficients to modify
 * @param {Function} onError - Callback for errors (used by legacy code)
 * @returns {number} - Last index used in coefficients
 */
function encodeToCoefficients(type, inputBin, startIndex, coefficients, onError) {
	// Validate inputs
	if (!coefficients || !coefficients.length) {
		onError("No coefficients provided");
		return startIndex;
	}

	const maxBits = (startIndex === 0) ? coefficients.length - 222 : coefficients.length - startIndex - 4;

	if (inputBin.length > maxBits) {
		const errorMsg = startIndex === 0
			? `This image can hide ${maxBits} bits. But the box contains ${inputBin.length} bits`
			: `This image can add a hidden message ${maxBits} bits long. But the hidden message in the box has ${inputBin.length} bits`;
		onError(errorMsg);
		return startIndex;
	}

	// Determine k for matrix encoding
	const rate = inputBin.length / maxBits;
	let k = 2;
	while (k / (Math.pow(2, k) - 1) > rate) k++;
	k = Math.min(k - 1, 16); // Cap at 16

	const kCode = [];
	for (let j = 0; j < 4; j++) {
		kCode[3 - j] = (k - 1 >> j) & 1;
	}

	// JPEG-specific setup
	let y = 0, ones = 0, minusones = 0;
	if (type === 'jpeg') {
		const count2to3 = partialHistogram(coefficients.slice(startIndex + 4));
		y = count2to3[1] / (count2to3[0] + count2to3[1]);
	}

	// Encode k into coefficients
	if (type === 'jpeg') {
		for (let i = 0; i < 4; i++) {
			const coeff = coefficients[startIndex + i];
			if (coeff > 0) {
				if (kCode[i] === 1 && stegParity(coeff) === 0) {
					coefficients[startIndex + i]--;
				} else if (kCode[i] === 0 && stegParity(coeff) !== 0) {
					if (coeff !== 1) {
						coefficients[startIndex + i]--;
					} else {
						coefficients[startIndex + i] = -1;
					}
				}
			} else {
				if (kCode[i] === 0 && stegParity(coeff) !== 0) {
					coefficients[startIndex + i]++;
				} else if (kCode[i] === 1 && stegParity(coeff) === 0) {
					if (coeff !== -1) {
						coefficients[startIndex + i]++;
					} else {
						coefficients[startIndex + i] = 1;
					}
				}
			}
		}
	} else {
		for (let i = 0; i < 4; i++) {
			if (kCode[i] === 1 && stegParity(coefficients[startIndex + i]) === 0) {
				coefficients[startIndex + i]++;
			} else if (kCode[i] === 0 && stegParity(coefficients[startIndex + i]) !== 0) {
				coefficients[startIndex + i]--;
			}
		}
	}

	// Encode the actual data
	const n = Math.pow(2, k) - 1;
	const blocks = Math.ceil(inputBin.length / k);

	// Pad input to fit blocks
	while (inputBin.length % k) inputBin.push(0);

	for (let i = 0; i < blocks; i++) {
		const inputBlock = inputBin.slice(i * k, (i * k) + k);
		const inputNumber = binArray2dec(inputBlock);
		const coverBlock = coefficients.slice(startIndex + 4 + i * n, startIndex + 4 + (i * n) + n);
		const parityBlock = coverBlock.map(stegParity);
		let hash = 0;
		for (let j = 1; j <= n; j++) hash ^= (parityBlock[j - 1] * j);
		const outputNumber = inputNumber ^ hash;

		if (outputNumber) {
			const coeffIndex = startIndex + 3 + i * n + outputNumber;
			const coeff = coefficients[coeffIndex];

			if (type === 'jpeg') {
				if (coeff > 0) {
					if (coeff === 1) {
						if (minusones <= 0) {
							coefficients[coeffIndex] = -1;
							ones--;
							minusones++;
						} else {
							coefficients[coeffIndex] = 2;
							ones--;
						}
					} else if (coeff === 2) {
						if (ones <= 0) {
							coefficients[coeffIndex]--;
							ones++;
						} else {
							coefficients[coeffIndex]++;
						}
					} else {
						if (Math.random() > y) {
							coefficients[coeffIndex]--;
						} else {
							coefficients[coeffIndex]++;
						}
					}
				} else if (coeff < 0) {
					if (coeff === -1) {
						if (ones <= 0) {
							coefficients[coeffIndex] = 1;
							minusones--;
							ones++;
						} else {
							coefficients[coeffIndex] = -2;
							minusones--;
						}
					} else if (coeff === -2) {
						if (minusones <= 0) {
							coefficients[coeffIndex]++;
							minusones++;
						} else {
							coefficients[coeffIndex]--;
						}
					} else {
						if (Math.random() > y) {
							coefficients[coeffIndex]++;
						} else {
							coefficients[coeffIndex]--;
						}
					}
				}
			} else {
				// PNG LSB
				if (coeff % 2) {
					coefficients[coeffIndex]--;
				} else {
					coefficients[coeffIndex]++;
				}
			}
		}
	}

	return startIndex + blocks * n + 3;
}

//matrix decode of allCoefficients, where k is extracted from the start of the message. Selectable for png or jpeg encoding.

/**
 * Decodes a message from JPEG/PNG coefficients using matrix decoding.
 * @param {string} type - 'jpeg' or 'png'
 * @param {number} startIndex - Starting index in coefficients array
 * @param {Uint8Array|Int16Array} coefficients - Coefficients to decode from
 * @returns {Array} - [Uint8Array data, string errorMsg, number lastIndex]
 */
function decodeFromCoefficients(type, startIndex, coefficients) {
	// 1. Extract k
	const length = (startIndex === 0)
		? coefficients.length - 222
		: coefficients.length - startIndex - 4;

	let kVal = 0;
	for (let i = 0; i < 4; i++) {
		const bit = stegParity(coefficients[startIndex + i]);
		kVal |= (bit << (3 - i)); // Inline binArray2dec
	}
	const k = kVal + 1;

	const n = Math.pow(2, k) - 1;
	const blocks = Math.floor(length / n);

	if (blocks === 0) {
		// Caller should handle cleanup of globals if needed
		return ['', 'This image does not contain anything, or perhaps the password is wrong', 0];
	}

	// 2. Decode the data into a bit-stream (Uint8Array of 0s and 1s)
	let outputBits = new Uint8Array(k * blocks);

	for (let i = 0; i < blocks; i++) {
		let hash = 0;
		const blockOffset = startIndex + 4 + (i * n);

		for (let j = 1; j <= n; j++) {
			const coeff = coefficients[blockOffset + (j - 1)];
			hash ^= (stegParity(coeff) * j);
		}

		// Store bits in outputBits
		for (let j = 0; j < k; j++) {
			outputBits[i * k + (k - 1 - j)] = (hash >> j) & 1;
		}
	}

	// NEW: Convert the entire bit-stream to bytes BEFORE searching for EOF
	let outputBytes = packBitsToBytes(outputBits);

	// 3. Subtract noise if applicable
	if (!skipEncrypt) {
		outputBytes = addNoise(outputBytes);
	}

	// 4. Find EOF marker (Searching FORWARD in the BYTE array)
	let found = false;
	let eofByteIndex = 0;
	const eofLen = imgEOF.length; // 6 bytes

	for (let i = 0; i <= outputBytes.length - eofLen; i++) {
		let match = true;
		for (let l = 0; l < eofLen; l++) {
			if (outputBytes[i + l] !== imgEOF[l]) {
				match = false;
				break;
			}
		}
		if (match) {
			found = true;
			eofByteIndex = i;
			break;
		}
	}

	if (!found) {
		return [null, 'This image does not contain anything, or perhaps the password is wrong', 0];
	}

	// 5. Finalize results
	const actualDataBytes = outputBytes.subarray(0, eofByteIndex);

	// Calculate how many blocks were actually used (for the return index)
	const bitsUsed = (actualDataBytes.length + eofLen) * 8;
	const blocksUsed = Math.ceil(bitsUsed / k);

	return [actualDataBytes, null, startIndex + (blocksUsed * n) + 3];
}

//extract text from either tye of image

/**
 * Dispatches decoding with all available stego options.
 * @param {Object} options - Decoding options
 * @param {HTMLImageElement} options.image - Stego image element
 * @param {string} options.password - Primary stego password
 * @param {boolean} [options.skipEncrypt=false] - If true, skips noise removal
 * @param {number} [options.iterations=1] - PRNG iterations for primary
 * @param {string} [options.password2] - Optional second password
 * @param {number} [options.iterations2=1] - PRNG iterations for secondary
 */
async function decodeImage({
	image,
	password,
	skipEncrypt = false,
	iterations = 1,
	password2 = null,
	iterations2 = 1
}) {
	// Set the global skipEncrypt so decodeFromCoefficients knows whether to remove noise
	window.skipEncrypt = skipEncrypt;

	const imgType = image.src.slice(11, 15);

	const decodeOptions = {
		image,
		password,
		iterations,
		password2,
		iterations2
	};

	if (imgType === 'png;') {
		return await decodePNG(decodeOptions);
	} else if (imgType === 'jpeg') {
		return await decodeJPG(decodeOptions);
	} else {
		throw new Error("Unsupported image type for decoding");
	}
}

//remove transparency and turn background white
function transparent2white(imageElement) {
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = imageElement.naturalWidth;
	shadowCanvas.height = imageElement.naturalHeight;
	shadowCtx.drawImage(imageElement, 0, 0, shadowCanvas.width, shadowCanvas.height);

	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		opaquePixels = 0;
	for (var i = 3; i < imageData.data.length; i += 4) {				//look at alpha channel values
		if (imageData.data[i] == 0) {
			for (var j = 0; j < 4; j++) imageData.data[i - j] = 255		//turn pure transparent to white
		} else {
			imageData.data[i] = 255									//if not pure transparent, turn opaque without changing color
		}
	}
	shadowCtx.putImageData(imageData, 0, 0);								//put in canvas so the dataURL can be produced
	imageElement.src = shadowCanvas.toDataURL()							//send to image element	
}

/**
 * Get a single bit from a Uint8Array at the specified bit index.
 * Bits are indexed from MSB (bit 7) of byte 0 onwards.
 *
 * @param {Uint8Array} uint8Array - The byte array to read from
 * @param {number} bitIndex - Zero-based index of the bit to get
 * @returns {number} The bit value (0 or 1)
 */
function getBit(uint8Array, bitIndex) {
	const byteIndex = Math.floor(bitIndex / 8);
	const bitPosition = 7 - (bitIndex % 8); // MSB is bit 7
	return (uint8Array[byteIndex] >> bitPosition) & 1;
}

/**
 * Set a single bit in a Uint8Array at the specified bit index.
 * Modifies the array in place.
 *
 * @param {Uint8Array} uint8Array - The byte array to modify
 * @param {number} bitIndex - Zero-based index of the bit to set
 * @param {number} value - The bit value to set (0 or 1)
 */
function setBit(uint8Array, bitIndex, value) {
	const byteIndex = Math.floor(bitIndex / 8);
	const bitPosition = 7 - (bitIndex % 8); // MSB is bit 7
	if (value) {
		uint8Array[byteIndex] |= (1 << bitPosition);
	} else {
		uint8Array[byteIndex] &= ~(1 << bitPosition);
	}
}

/**
 * Get a sequence of bits as a new Uint8Array.
 *
 * @param {Uint8Array} source - Source byte array
 * @param {number} startBit - Starting bit index (inclusive)
 * @param {number} lengthInBits - Number of bits to extract
 * @returns {Uint8Array} New byte array containing the extracted bits (zero-padded at end if needed)
 */
function getBits(source, startBit, lengthInBits) {
	const outLength = Math.ceil(lengthInBits / 8);
	const result = new Uint8Array(outLength);
	for (let i = 0; i < lengthInBits; i++) {
		const bit = getBit(source, startBit + i);
		setBit(result, i, bit);
	}
	return result;
}

/**
 * Set a sequence of bits from a Uint8Array into another.
 *
 * @param {Uint8Array} dest - Destination byte array
 * @param {number} startBit - Starting bit index in destination
 * @param {Uint8Array} sourceBits - Source bits as a byte array
 * @param {number} lengthInBits - Number of bits to copy
 */
function setBits(dest, startBit, sourceBits, lengthInBits) {
	for (let i = 0; i < lengthInBits; i++) {
		const bit = getBit(sourceBits, i);
		setBit(dest, startBit + i, bit);
	}
}

/**
 * Converts a bit array (Uint8Array of 0s and 1s) into a byte array (Uint8Array).
 * @param {Uint8Array} bits - Array of 0s and 1s
 * @returns {Uint8Array} - Byte array
 */
function packBitsToBytes(bits) {
	const byteCount = Math.floor(bits.length / 8);
	const bytes = new Uint8Array(byteCount);

	for (let i = 0; i < byteCount; i++) {
		let byte = 0;
		for (let j = 0; j < 8; j++) {
			if (bits[i * 8 + j]) {
				byte |= (1 << (7 - j));
			}
		}
		bytes[i] = byte;
	}

	return bytes;
}

// Converts Uint8Array to legacy [1,0,1,...] format
function uint8ArrayToLegacyBits(uint8Array) {
	const bits = [];
	for (let i = 0; i < uint8Array.length; i++) {
		for (let j = 7; j >= 0; j--) {
			bits.push((uint8Array[i] >> j) & 1);
		}
	}
	return bits;
}

// Converts legacy [1,0,1,...] back to Uint8Array
function legacyBitsToUint8Array(bits) {
	const byteCount = Math.floor(bits.length / 8);
	const bytes = new Uint8Array(byteCount);
	for (let i = 0; i < byteCount; i++) {
		let b = 0;
		for (let j = 0; j < 8; j++) {
			if (bits[i * 8 + j]) b |= (1 << (7 - j));
		}
		bytes[i] = b;
	}
	return bytes;
}