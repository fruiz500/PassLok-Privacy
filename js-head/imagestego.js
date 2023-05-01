//this code is closely related to that available at https://github.com/fruiz500/passlok-stego

//clean up some junk possibly left by JPG hiding functions
    delete localStorage['action'];
    delete localStorage['container'];
    delete localStorage['method'];
    delete localStorage['wikisafe'];

// load image for hiding text and open dialog
var importImage = function(e) {
    if(learnMode.checked){
        var reply = confirm("An image stored in this device will replace the current image. Cancel if this is not what you want.");
        if(!reply) return
    }

    var reader = new FileReader();

    reader.onload = function(event) {
        // set the preview
        previewImg.style.margin = 'auto';
        previewImg.style.display = 'block';
        previewImg.src = event.target.result
    }

    reader.readAsDataURL(e.target.files[0]);
    previewImg.onload = function(){
        //see if the password box can be pre-populated because there is only one recipient
        var lockArray = lockBox.innerHTML.replace(/\r\n/g,'<br>').replace(/<br>$/,'').replace(/<div>/g,'<br>').replace(/<\/div>/g,'').replace(/myself/,'').split('<br>').filter(Boolean);
        if(lockArray.length == 1){
            var lock = replaceByItem(lockArray[0]),
                locklen = lock.length;
            if(locklen == 43 || locklen == 50){					//Lock identified, compute shared Key
                if(!refreshKey()) return;
                if (locklen == 50) lock = changeBase(lock.toLowerCase().replace(/l/g,'L'), base36, base64, true);
                var lockBin = nacl.util.decodeBase64(lock);
                if(!lockBin) return false;
                imageBox.value = nacl.util.encodeBase64(makeShared(convertPub(lockBin),KeyDH)).replace(/=+$/,'')
            }else{													//not a Lock, so use it directly
                imageBox.value = lock
            }
        }else{
            imageBox.value = ''
        }

        updateCapacity();
        openClose('imageScr');
        openClose('shadow');
        imageBox.focus()
    }
};

//show how much text can be hidden in the image
function updateCapacity(){
    var	textsize = mainBox.textContent.length;

    imageMsg.style.color = '';
    blinkMsg(imageMsg);
    setTimeout(function(){																				//give it 2 seconds to complete
        if(imageMsg.textContent == 'PROCESSING') imageMsg.textContent = 'There was an error calculating the capacity, but the image is still usable'
    },2000)

setTimeout(function(){
    //start measuring png capacity. Subtract 4 bits used to encode k, 48 for the end marker
    var shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');
    shadowCanvas.style.display = 'none';

    shadowCanvas.width = previewImg.naturalWidth;
    shadowCanvas.height = previewImg.naturalHeight;
    shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);

    var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        opaquePixels = 0;
    for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
        if(imageData.data[i] == 255) opaquePixels++					//use pixels with full opacity only
    }
    var pngChars = Math.floor((opaquePixels * 3 - 270) / 6);

    //now measure jpeg capacity
    if(previewImg.src.slice(11,15) == 'jpeg' && !isiOS){					//true jpeg capacity calculation, gets stuck on iOS
        var lumaCoefficients = [],
            count = 0;
        jsSteg.getCoefficients(previewImg.src, function(coefficients){
            var subSampling = 1;
            for(var index = 1; index <= 3; index++){						//first luma, then chroma channels, index 0 is always empty
                lumaCoefficients = coefficients[index];
                if(lumaCoefficients){
                    if(index != 1) subSampling = Math.floor(coefficients[1].length / lumaCoefficients.length);
                      for (var i = 0; i < lumaCoefficients.length; i++) {
                        for (var j = 0; j < 64; j++) {
                            if(lumaCoefficients[i][j] != 0) count += subSampling		//if subsampled, multiply the count since it won't be upon re-encoding
                            }
                    }
                    if(index == 1) var firstCount = count
                }else{
                    count += firstCount													//repeat count if the channel appears not to exist (bug in js-steg)
                }
            }
            var jpgChars = Math.floor((count - 270) / 6);			//base64 version, 4 bits used to encode k, 48 for the end marker, 218 buffer for second message

            imageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, ' + jpgChars + ' as JPG. The main box has ' + textsize + ' characters'
        })
    }else{															//no jpeg, so estimate capacity
        var jpgChars = Math.floor(pngChars / 20);		//base64 version

        imageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, at least ' + jpgChars + ' as JPG. The main box has ' + textsize + ' characters'
    }
},30)
}

//put text into image, which turns into PNG
function encodePNG(){
    if(learnMode.checked){
        var reply = confirm("The text in the main box will be encoded into this image as a PNG, which can then be copied and sent to others. Cancel if this is not what you want.");
        if(!reply) return
    }
    var text = mainBox.textContent.trim();
    if(text.match('==')) text = text.split('==')[1].replace(/[-\s]/g,'').replace(/<(.*?)>/gi,"");			//remove end tags, spaces, newlines, and dashes from Locks

    //bail out if this is not a PassLok string, etc.
    if(!text){
        imageMsg.textContent = 'There is nothing to hide';
        return
    }
    if(!isBase64(text.replace(/=/g,''))){
        imageMsg.textContent = 'The text contains illegal characters for a PassLok string';
        return
    }
    if(previewImg.src.length < 100){											//no image loaded
        imageMsg.textContent = 'Please load an image before clicking this button';
        return
    }

    imageMsg.style.color = '';
    blinkMsg(imageMsg);

    var resultURI = encodePNGprocess(text);																//this is the main process, in next functions

    previewImg.src = resultURI;													//put result into page so it can be saved
    previewImg.onload = function(){
        imageMsg.textContent = 'Item hidden in the image. Save it now.'
    }
}

var imgEOF = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
//this function does the PNG encoding as LSB in all channels except alpha, which is kept with original values
function encodePNGprocess(text){
    var shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');
    shadowCanvas.style.display = 'none';

    shadowCanvas.width = previewImg.naturalWidth;
    shadowCanvas.height = previewImg.naturalHeight;
    shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);

    var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),			//get the image data
        indexBin = 0,
        length = imageData.data.length,
        alphaData = new Array(length / 4);

    allCoefficients = new Array(length / 4 * 3);				//global variable, initialized below

    //separate alpha channel
    var k = 0;														//counter for actual data used
    for(var i = 3; i < length; i += 4){
        alphaData[Math.floor(i / 4)] = imageData.data[i]				//contains the alpha channel data, which will be needed later
        if(imageData.data[i] == 255){
            for(var j = 0; j < 3; j++){
                allCoefficients[k] = imageData.data[i - 3 + j];		//use data for opaque pixels only
                k++
            }
        }
    }
    allCoefficients = allCoefficients.slice(0,k);			//cut off the space that wasn't used

    //now turn the base64 text into a binary array
    var msgBin = toBin(text).concat(imgEOF),							//also replace special characters with base64 and add 48-bit end marker
        pwdArray = imageBox.value.trim().replace(/\n/g,' ').split('|'),
        seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), length.toString() + 'png'));
    if(pwdArray.length == 3){
        var pwd2 = pwdArray[1].trim(),
            msgBin2 = toBin(LZString.compressToBase64(pwdArray[2].trim())).concat(imgEOF);						//for when there is a second message
    }

    shuffleCoefficients(seed,0);																					//scramble image data to unpredictable locations

    var lastIndex = encodeToCoefficients('png',msgBin,0);

    if(msgBin2){													//this is done only if there is a second message, to be added immediately after the main message
        msgBin2 = msgBin2.concat(imgEOF);

        var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, lastIndex.toString() + 'png'));  			//using Wisehash rather than built-in

        shuffleCoefficients(seed2,lastIndex + 1);							//shuffle only beyond the last index used

        encodeToCoefficients('png', msgBin2, lastIndex + 1);

        unShuffleCoefficients(lastIndex + 1);
        lastIndex = 0
    }

    unShuffleCoefficients(0);																		//return image data to their right places

    //put result back into image
    k = 0;															//already defined as local
    for(var i = 3; i < length; i += 4){
        var alphaIndex = Math.floor(i / 4);
        if(alphaData[alphaIndex] == 255){
            for(var j = 0; j < 3; j++){
                imageData.data[i - 3 + j] = allCoefficients[k];					//RGB data
                k++
            }
        }
    }
    permutation = [];				//reset global variables
    permutation2 = [];
    allCoefficients = [];
    imageBox.value = '';

    shadowCtx.putImageData(imageData, 0, 0);								//put in canvas so the dataURL can be produced
    return shadowCanvas.toDataURL()
}

//extract text from image
function decodeImage(){
    if(isiOS){
        imageMsg.textContent = 'On iOS, you can do PNG hide only';
        return
    }
    if(learnMode.checked){
        var reply = confirm("The text hidden in this image, if any, will be extracted and placed in the previous box, replacing its contents. This does not yet work on mobile devices. Cancel if this is not what you want.");
        if(!reply) return
    }

    imageMsg.style.color = '';
    blinkMsg(imageMsg);

setTimeout(function(){
    if(previewImg.src.slice(11,15) == 'png;'){							//two cases: png and jpeg
        decodePNG()
    }else if(previewImg.src.slice(11,15) == 'jpeg'){
        decodeJPG()
    }
},30)						//long timeout because decoding may take a while
}

//decodes data stored in PNG image
function decodePNG(){
    var shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');
    shadowCanvas.style.display = 'none';

    shadowCanvas.width = previewImg.naturalWidth;
    shadowCanvas.height = previewImg.naturalHeight;
    shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);

    var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        length = imageData.data.length;

    allCoefficients = new Array(length / 4 * 3);				//global variable

    //separate RGB data from alpha channel
    var k = 0;
    for(var i = 3; i < length; i += 4){
        if(imageData.data[i] == 255){										//use opaque pixels only
            for(var j = 0; j < 3; j++){
                allCoefficients[k] = imageData.data[i - 3 + j];
                k++
            }
        }
    }
    allCoefficients = allCoefficients.slice(0,k);

    var pwdArray = imageBox.value.trim().replace(/\n/g,' ').split('|'),
        seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), length.toString() + 'png'));
    if(pwdArray.length == 2) var pwd2 = pwdArray[1].trim();										//for when there is a second message

    shuffleCoefficients(seed,0);																	//scramble image data to unpredictable locations

    var result = decodeFromCoefficients('png',0);

    if(pwd2){													//extract hidden message if a second password is supplied
        var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, result[2].toString() + 'png'));
        shuffleCoefficients(seed2,result[2] + 1);
        var result2 = decodeFromCoefficients('png',result[2] + 1)
    }

    permutation = [];
    permutation2 = [];
    allCoefficients = [];
    var text = fromBin(result[0]);
    mainBox.innerHTML = decryptSanitizer(text.trim());
    image2main();
    imageBox.value = '';
    updateButtons();
    if(advancedMode.checked) main2extra();
    if(result2){
        mainMsg.textContent = 'Hidden message: ' + LZString.decompressFromBase64(fromBin(result2[0]))
    }else{
        mainMsg.textContent = 'This is what was hidden in the image'
    }
}

//this function gets the jpeg coefficients (first luma, then chroma) and extracts the hidden material. Stops when the 48-bit endText code is found
var allCoefficients, permutation, permutation2;

var decodeJPG = function(){
    jsSteg.getCoefficients(previewImg.src, function(coefficients){
        var length = coefficients[1].length;
        if(coefficients[2].length != length){							//there's chrome subsampling, therefore it was not made by this process
            imageMsg.textContent = 'This image does not contain anything, or perhaps the password is wrong';		//actually, just the former
            return
        }

        var	rawLength = 3*length*64,
            rawCoefficients = new Array(rawLength);

        for(var index = 1; index <= 3; index++){									//linearize the coefficients matrix into rawCoefficients
            for (var i = 0; i < length; i++) {
                for (var j = 0; j < 64; j++) {
                    rawCoefficients[index*length*64 + i*64 + j] = coefficients[index][i][j]
                }
            }
        }
        allCoefficients = removeZeros(rawCoefficients);							//get rid of zeros

        var pwdArray = imageBox.value.trim().replace(/\n/g,' ').split('|'),
            seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), allCoefficients.length.toString() + 'jpeg'));
        if(pwdArray.length == 2) var pwd2 = pwdArray[1].trim();						//for when there is a second message

        shuffleCoefficients(seed,0);															//scramble image data to unpredictable locations

        var result = decodeFromCoefficients('jpeg',0);

        if(pwd2){													//extract hidden message if a second password is supplied
            var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, result[2].toString() + 'jpeg'));
            shuffleCoefficients(seed2,result[2] + 1);
            var result2 = decodeFromCoefficients('png',result[2] + 1)
        }

        var text = fromBin(result[0]);
        mainBox.innerHTML = decryptSanitizer(text.trim());
        image2main();
        permutation = [];
        permutation2 = [];
        allCoefficients = [];
        imageBox.value = '';
        updateButtons();
        if(advancedMode.checked) main2extra();
        if(result2){
            mainMsg.textContent = 'Hidden message: ' + LZString.decompressFromBase64(fromBin(result2[0]))
        }else{
            mainMsg.textContent = 'This is what was hidden in the image'
        }
    })
}

//function to encode mainBox as coefficients in a jpeg image. Most of the work is done by modifyCoefficients, below
var encodeJPG = function(){
    if(learnMode.checked){
        var reply = confirm("The text in the main box will be encoded into this image as a JPG, which can then be copied and sent to others. Cancel if this is not what you want.");
        if(!reply) return
    }
    var text = mainBox.textContent.trim();
    if(text.match('==')) text = text.split('==')[1].replace(/[-\s]/g,'').replace(/<(.*?)>/gi,"");

    //bail out if this is not a PassLok string, etc.
    if(!text){
        imageMsg.textContent = 'There is nothing to hide';
        return
    }
    if(!isBase64(text.replace(/=/g,''))){
        imageMsg.textContent = 'The text contains illegal characters for a PassLok string';
        return
    }
    if(previewImg.src.length < 100){											//no image loaded
        imageMsg.textContent = 'Please load an image before clicking this button';
        return
    }

    imageMsg.style.color = '';
    blinkMsg(imageMsg);

setTimeout(function(){																			//the rest after a 30 ms delay
    if(previewImg.src.slice(11,15).match(/gif;|png;/)) transparent2white();		//first remove transparency

    jsSteg.reEncodeWithModifications(previewImg.src, modifyCoefficients, function (resultURI) {
        previewImg.src = resultURI;
        previewImg.onload = function(){
            imageMsg.textContent = 'Item hidden in the image. Save it now.'
        }
      })
},30)						//end of timeout
}

/**
 * Called when encoding a JPEG
 * - coefficients: coefficients[0] is an array of luminosity blocks, coefficients[1] and
 *   coefficients[2] are arrays of chrominance blocks. Each block has 64 "modes"
 */
var modifyCoefficients = function(coefficients) {
    var text = mainBox.textContent.trim();
    if(text.match('==')) text = text.split('==')[1].replace(/[-\s]/g,'').replace(/<(.*?)>/gi,"");
    var msgBin = toBin(text).concat(imgEOF);			//also replace special characters with base64 and add 48-bit end marker

    var length = coefficients[0].length,
        rawLength = 3*length*64,
        rawCoefficients = new Array(rawLength);

    for(var index = 0; index < 3; index++){									//linearize the coefficients matrix into rawCoefficients
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < 64; j++) {
                rawCoefficients[index*length*64 + i*64 + j] = coefficients[index][i][j]
            }
        }
    }
    allCoefficients = removeZeros(rawCoefficients);							//remove zeros and store in global variable

    var pwdArray = imageBox.value.trim().replace(/\n/g,' ').split('|'),
        seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), allCoefficients.length.toString() + 'jpeg'));
    if(pwdArray.length == 3){
        var pwd2 = pwdArray[1].trim(),
            msgBin2 = toBin(LZString.compressToBase64(pwdArray[2].trim())).concat(imgEOF);						//for when there is a second message
    }

    shuffleCoefficients(seed,0);										//scramble image data to unpredictable locations

    var lastIndex = encodeToCoefficients('jpeg', msgBin, 0);						//encoding step

    if(msgBin2){													//this is done only if there is a second message, to be added immediately after the main message
        var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, lastIndex.toString() + 'jpeg'));

        shuffleCoefficients(seed2,lastIndex + 1);							//shuffle only beyond the last index used

        encodeToCoefficients('jpeg', msgBin2, lastIndex + 1);

        unShuffleCoefficients(lastIndex + 1);
        lastIndex = 0
    }

    unShuffleCoefficients(0);							//get the coefficients back to their original places

    var j = 0;													//put the zeros back in their places
    for(var i = 0; i < rawLength; i++){
        if(rawCoefficients[i]){									//only non-zeros
            rawCoefficients[i] = allCoefficients[j];
            j++
        }
    }

    for(var index = 0; index < 3; index++){					//reshape coefficient array back to original form
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < 64; j++) {
                coefficients[index][i][j] = rawCoefficients[index*length*64 + i*64 + j]
            }
        }
    }
    permutation = [];
    permutation2 = [];
    allCoefficients = [];
    imageBox.value = ''
}

//calculates a random-walk permutation, as seeded by "seed" and shuffles the global array "allCoefficients" accordingly. "permutation" is also global
function shuffleCoefficients(seed,startIndex){
    isaac.seed(seed);		//re-seed the PRNG

    var	length = allCoefficients.length,
        permutedCoeffs = new Array(length);

    if(!startIndex){
        permutation = randPerm(length)		//pseudo-random but repeatable array containing values 0 to length-1
    }else{
        permutation2 = randPerm(length - startIndex)		//the PRNG should be re-initialized before this operation
    }

    if(!startIndex){
        for(var i = 0; i < length; i++){
            permutedCoeffs[i] = allCoefficients[permutation[i]]
        }
        for(var i = 0; i < length; i++){
            allCoefficients[i] = permutedCoeffs[i]
        }
    }else{
        for(var i = 0; i < length - startIndex; i++){
            permutedCoeffs[i] = allCoefficients[startIndex + permutation2[i]]
        }
        for(var i = 0; i < length - startIndex; i++){
            allCoefficients[startIndex + i] = permutedCoeffs[i]
        }
    }
}

//inverse of the previous function, assumes the data and permutation arrays are stored in global variables allCoefficients and permutation
function unShuffleCoefficients(startIndex){
    var	length = allCoefficients.length,
        permutedCoeffs = new Array(length),
        index;
    if(!startIndex){var inversePermutation = new Array(length)}else{var inversePermutation2 = new Array(length - startIndex)};

    if(!startIndex){
        for(var i = 0; i < length; i++){		//first make the inverse permutation array
            index = permutation[i];
            inversePermutation[index] = i
        }
    }else{
        for(var i = 0; i < length - startIndex; i++){
            index = permutation2[i];
            inversePermutation2[index] = i
        }
    }
    if(!startIndex){
        for(var i = 0; i < length; i++){
            permutedCoeffs[i] = allCoefficients[inversePermutation[i]]
        }
        for(var i = 0; i < length; i++){
            allCoefficients[i] = permutedCoeffs[i]
        }
    }else{
        for(var i = 0; i < length - startIndex; i++){
            permutedCoeffs[i] = allCoefficients[startIndex + inversePermutation2[i]]
        }
        for(var i = 0; i < length - startIndex; i++){
            allCoefficients[startIndex + i] = permutedCoeffs[i]
        }
    }
}

//obtain a random permutation using isaac re-seedable PRNG, for use in image steganography
function randPerm(n) {
  var result = new Array(n);
  result[0] = 0;

  for(var i = 1; i < n; ++i) {
    var idx = (isaac.random() * (i + 1)) | 0			//here is the call to the isaac PRNG library
    if(idx < i) {
      result[i] = result[idx]
    }
    result[idx] = i
  }
  return result
}

//convert binary array to decimal number
function binArray2dec(array){
    var length = array.length,
        output = 0,
        mult = 1;

    for(var i = 0; i < length; i++){
        output += array[length-1-i]*mult;
        mult = mult*2
    }
    return output
}

//to get the parity of a number. Positive: 0 if even, 1 if odd. Negative: 0 if odd, 1 if even. 0 is even
function stegParity(number){
    if(number >= 0){
        return number % 2
    }else{
        return -(number - 1) % 2
    }
}

//faster Boolean filter for array
function removeZeros(array){
    var length = array.length,
        nonZeros = 0;
    for(var i = 0; i < length; i++) if(array[i]) nonZeros++;

    var outArray = new Array(nonZeros),
        j = 0;

    for(var i = 0; i < length; i++){
        if(array[i]){
            outArray[j] = array[i];
            j++
        }
    }
    return outArray
}

//gets counts in the DCT AC histogram: 2's plus -2, 3's plus -3, outputs array containing the counts
function partialHistogram(array){
    var output = [0,0],
        length = array.length;

    for(var j = 0; j < length; j++){
        for(var i = 2; i <= 3; i++){
            if(array[j] == i || array[j] == -i) output[i-2]++
        }
    }
    return output
}

//matrix encoding of allCoefficients with variable k, which is prepended to the message. Selectable for png or jpeg encoding.
function encodeToCoefficients(type,inputBin,startIndex){
    //first decide what value to use for k
    var length = (startIndex == 0) ? allCoefficients.length - 222 : allCoefficients.length - startIndex - 4,	//extra slack the first time to have room for a hidden message
        rate = inputBin.length / length,				//necessary embedding rate
        k = 2;
    if(inputBin.length > length){
        imageMsg.textContent='This image can hide ' + (Math.floor(length/6) - 8).toString() + ' characters. But the main box has ' + (Math.floor(inputBin.length/6) - 8).toString() + ' characters';
        allCoefficients = [];
        permutation = [];
        permutation2 = [];
        imageBox.value = '';
        return
    }
    while( k / (Math.pow(2,k) - 1) > rate) k++;
    k--;
    if(k > 16) k = 16;											//so it fits in 4 bits at the start
    var kCode = new Array(4);									//k in 4-bit binary form
    for(var j = 0; j < 4; j++) kCode[3-j] = (k-1 >> j) & 1;	//actually, encode k-1 (0 to 15)
    if(type == 'jpeg'){
        var count2to3 = partialHistogram(allCoefficients.slice(startIndex + 4)),		//calculate histogram-adjusting frequencies
            y = count2to3[1]/(count2to3[0] + count2to3[1]),
            ones = 0,															//surplus 1's and -1's
            minusones = 0;
    }

    //now encode k into allCoefficients
    if(type == 'jpeg'){												//jpeg embedding
        for(var i = 0; i < 4; i++){
            if(allCoefficients[startIndex + i] > 0){									//positive same as for png
                if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){			//even made odd by going down one
                    allCoefficients[startIndex + i]--
                }else if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){		//odd made even by going down one, except if the value was 1, which is taken to -1
                    if(allCoefficients[startIndex + i] != 1){ allCoefficients[startIndex + i]-- }else{ allCoefficients[startIndex + i] = -1}
                }
            }else{														//negative coefficients are encoded in reverse
                if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){		//"odd" made even by going up one
                    allCoefficients[startIndex + i]++
                }else if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){			//"even" made odd by going up one, except if the value was -1, which is taken to 1
                    if(allCoefficients[startIndex + i] != -1){ allCoefficients[startIndex + i]++ }else{ allCoefficients[startIndex + i] = 1}
                }
            }
        }
    }else{																//png embedding
        for(var i = 0; i < 4; i++){
            if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){					//even made odd by going up one
                allCoefficients[startIndex + i]++
            }else if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){				//odd made even by going down one
                allCoefficients[startIndex + i]--
            }
        }
    }

    //encode the actual data
    var n = Math.pow(2,k) - 1,
        blocks = Math.ceil(inputBin.length / k);		//number of blocks that will be used

    var parityBlock = new Array(n),
        inputBlock = new Array(k),
        coverBlock = new Array(n),
        hash, inputNumber, outputNumber;						//decimal numbers
    while(inputBin.length % k) inputBin.push(0);				//pad msg with zeros so its length is a multiple of k

    for(var i = 0; i < blocks; i++){
        inputBlock = inputBin.slice(i*k, (i*k)+k);
        inputNumber = binArray2dec(inputBlock);						//convert the binary block to decimal
        coverBlock = allCoefficients.slice(startIndex + 4+i*n, startIndex + 4+(i*n)+n);		//first 4 were for encoding k
        for(var j = 0; j < n; j++) parityBlock[j] = stegParity(coverBlock[j]);		//get parity digit for each number

        hash = 0;
        for(var j = 1; j <= n; j++) hash = hash ^ (parityBlock[j-1]*j);		//hash-making step, as in F5, notice the xor operation
        outputNumber = inputNumber ^ hash;							//position in the cover block that needs to be flipped, if the position is 0 change none

        if(outputNumber){												//no change if the result is zero, but increment the counter anyway
            if(type == 'jpeg'){										//jpeg embedding
                if(coverBlock[outputNumber-1] > 0){			//positive, so change by going down (normally); if 1 or -1, switch to the other
                    if(coverBlock[outputNumber-1] == 1){		//whether to go up or down determined by whether there are too few or too many 1's and -1's
                        if(minusones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber] = -1; ones--; minusones++}else{allCoefficients[startIndex + 3+i*n+outputNumber] = 2; ones--}
                    }else if(coverBlock[outputNumber-1] == 2){
                        if(ones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber]--; ones++}else{allCoefficients[startIndex + 3+i*n+outputNumber]++}
                    }else{
                        if(Math.random() > y){allCoefficients[startIndex + 3+i*n+outputNumber]--}else{allCoefficients[startIndex + 3+i*n+outputNumber]++}
                    }
                }else if(coverBlock[outputNumber-1] < 0){	//negative, so change by going up
                    if(coverBlock[outputNumber-1] == -1){
                        if(ones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber] = 1; minusones--; ones++}else{allCoefficients[startIndex + 3+i*n+outputNumber] = -2; minusones--}
                    }else if(coverBlock[outputNumber-1] == -2){
                        if(minusones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber]++; minusones++}else{allCoefficients[startIndex + 3+i*n+outputNumber]--}
                    }else{
                        if(Math.random() > y){allCoefficients[startIndex + 3+i*n+outputNumber]++}else{allCoefficients[startIndex + 3+i*n+outputNumber]--}
                    }
                }													//if the coefficient was a zero, there is no change and the counter does not advance, so we repeat
            }else{														//png embedding
                if(coverBlock[outputNumber-1] % 2){					//odd made even by going down one
                    allCoefficients[startIndex + 3+i*n+outputNumber]--
                }else{													//even made odd by going up one
                    allCoefficients[startIndex + 3+i*n+outputNumber]++
                }
            }
        }
    }
    return startIndex + blocks * n + 3						//last index involved in the encoding
}

//matrix decode of allCoefficients, where k is extracted from the start of the message. Selectable for png or jpeg encoding.
function decodeFromCoefficients(type,startIndex){
    //first extract k
    var	length = (startIndex == 0) ? allCoefficients.length - 222 : allCoefficients.length - startIndex - 4,		//extra slack the first time
        kCode = new Array(4);										//contains k in 4-bit format
    for(var i = 0; i < 4; i++) kCode[i] = stegParity(allCoefficients[startIndex + i]);			//output is 1's and 0's
    var k = binArray2dec(kCode) + 1;

    //now decode the data
    var n = Math.pow(2,k) - 1,
        blocks = Math.floor(length / n);
    if(blocks == 0){										//cover does not contain even one block
        imageMsg.textContent = 'This image does not contain anything, or perhaps the password is wrong';
        allCoefficients = [];
        permutation = [];
        permutation2 = [];
        imageBox.value = '';
        return
    }

    var parityBlock = new Array(n),
        coverBlock = new Array(n),
        outputBin = new Array(k*blocks),
        hash;

    for(var i = 0; i < blocks; i++){
        coverBlock = allCoefficients.slice(startIndex + 4+i*n, startIndex + 4+(i*n)+n);
        for(var j = 0; j < n; j++) parityBlock[j] = stegParity(coverBlock[j]);		//0 if even, 1 if odd (reverse if negative, as in F5)

        hash = 0;
        for(var j = 1; j <= n; j++) hash = hash ^ (parityBlock[j-1]*j);		//hash-making step, as in F5, notice the xor operation
        for(var j = 0; j < k; j++) outputBin[i*k + k-1-j] = (hash >> j) & 1		//converts number to binary array and adds to output
    }

    var found = false,									//find the end marker after all the embedded bits are extracted, rather than after every block. This ends up being faster
        outLength = outputBin.length;
    for(var j = 0; j < outLength - 47; j++){
        found = true
        for(var l = 0; l < 48; l++){
            found = found && (imgEOF[47-l] == outputBin[outLength-l-j])
        }
        if(found){var fromEnd = j+47; break}
    }
    if(!found){
        imageMsg.textContent = 'The image does not contain anything, or perhaps the password is wrong';
        allCoefficients = [];
        permutation = [];
        imageBox.value = '';
        return
    }
    outputBin = outputBin.slice(0,-fromEnd);
    var blocksUsed = Math.ceil((outputBin.length + 48) / k);
    return [outputBin,'Reveal successful',startIndex + blocksUsed * n + 3]								//clean up the end
}

//gets the histogram of an array, in this format: 0, 1, -1, 2, -2, ..., n, -n. Inputs are the array and n, output is the histogram. For testing purposes.
function getHistogram(array, n){
    var output = new Array(2*n + 2),
        length = array.length,
        counter1 = 0,
        counter2 = 0;

    for(var i = 0; i <= n; i++){
        counter1 = counter2 = 0;
        for(var j = 0; j < length; j++){
            if(array[j] == i) counter1++;
            if(array[j] == -i) counter2++
        }
        output[2*i] = counter1;
        output[2*i+1] = counter2
    }
    return output.slice(1)
}

//remove transparency and turn background white
function transparent2white(){
    var shadowCanvas = document.createElement('canvas'),
        shadowCtx = shadowCanvas.getContext('2d');
    shadowCanvas.style.display = 'none';

    shadowCanvas.width = previewImg.naturalWidth;
    shadowCanvas.height = previewImg.naturalHeight;
    shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);

    var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
        opaquePixels = 0;
    for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
        if(imageData.data[i] == 0){
            for(var j = 0; j < 4; j++) imageData.data[i-j] = 255		//turn pure transparent to white
        }else{
            imageData.data[i] = 255									//if not pure transparent, turn opaque without changing color
        }
    }
    shadowCtx.putImageData(imageData, 0, 0);								//put in canvas so the dataURL can be produced
    previewImg.src = shadowCanvas.toDataURL()							//send to image element
}
