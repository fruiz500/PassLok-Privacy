//function that starts it all when the Seal/Unseal button is pushed
function signVerify(){
    blinkMsg(mainMsg);
    var array = getType(mainBox.innerHTML.trim()),
        lockBoxHTML = lockBox.innerHTML.replace(/\n/g,'<br>').replace(/<br>$/,"").trim();
    setTimeout(function(){																			//the rest after a 20 ms delay
        if(array[0] == 'l'){
            verifySignature(array[1],lockBoxHTML)
        }else{
            applySignature(array[1])
        }
        charsLeft()
    },20);						//end of timeout
}

//adds Schnorr signature to the contents of the main box
function applySignature(textStr){
    callKey = 'sign';
    pwdMsg.textContent = "";
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be sealed using your secret Key, so that others can verify its origin. The resulting item WILL NOT BE LOCKED. Cancel if this is not what you want.");
        if(!reply) return
    }
    if(!refreshKey()) return;

    // for decoy message
    var	padding = decoyEncrypt(75,KeyDH);

    if(textStr.match('="data:')){
        var encodedText = nacl.util.decodeUTF8(textStr)
    }else{
        var encodedText = LZString.compressToUint8Array(textStr)
    }

    //main signing instruction, prefix is l
    var sealedText = nacl.util.encodeBase64(concatUint8Arrays([150],concatUint8Arrays(padding,nacl.sign(encodedText,KeySgn)))).replace(/=+$/,'');

    mainBox.textContent = '';
    if(fileMode.checked){
        if(textMode.checked){
            var fileLink = document.createElement('a');
            fileLink.download = "PL24sld.txt";
            fileLink.href = "data:," + sealedText;
            fileLink.textContent = "PassLok 2.4 Sealed message (text file)"
        }else{
            var fileLink = document.createElement('a');
            fileLink.download = "PL24sld.plk";
            fileLink.href = "data:binary/octet-stream;base64," + sealedText;
            fileLink.textContent = "PassLok 2.4 Sealed message (binary file)"
        }
    }else{
        var fileLink = document.createElement('pre');
        fileLink.textContent = ("PL24sld==" + sealedText + "==PL24sld").match(/.{1,80}/g).join("\r\n")
    }
    mainBox.appendChild(fileLink);
    mainMsg.textContent = 'The text has been sealed with your secret Key. It is ';
    var blinker = document.createElement('span');
    blinker.className = "blink";
    blinker.textContent = "NOT LOCKED";
    mainMsg.appendChild(blinker);
    callKey = ''
};

//verifies the Schnorr signature of the plaintext, calls applySignature as appropriate.
function verifySignature(textStr,LockStr){
    pwdMsg.textContent = "";
    if (textStr == ""){																	//nothing in text box
        mainMsg.textContent = 'Nothing to sign or verify';
        return
    }
    if(lockBox.textContent.trim().charAt(0) == 'k') decryptItem();

    if(learnMode.checked){
        var reply = confirm("The item in the main box has been sealed with somebody's secret Key. I will now check the matching Lock, which should be selected on the local directory, and will display the unsealed message inside. Cancel if this is not what you want.");
        if(!reply) return
    }
    callKey = 'sign';												//needed in case there is a decoy decryption

    if (LockStr == ""){
        setTimeout(function(){mainMsg.textContent = 'Please select the sealer first, then click Unseal'},50);		//the wait time may need to be longer
        return
    }
    var	Lockstripped = stripTags(LockStr),
        index = searchStringInArrayDB(LockStr,lockNames);
    if (Lockstripped.length != 43 && Lockstripped.length != 50){									//not a Lock, but maybe it's a name
        if(index >= 0){
            var name = lockNames[index];
            LockStr = replaceByItem(LockStr)
        }else{
            mainMsg.textContent = "Sealer not recognized";
            return
        }
    }else{
        var name = lockNames[index];
        LockStr = Lockstripped
    }
    if (LockStr.length == 50) LockStr = changeBase(LockStr.toLowerCase().replace(/l/g,'L'), base36, base64, true); 		//ezLok replaced by regular Lock
    if (LockStr.length != 43){
        mainMsg.textContent = 'Enter a valid Lock';
        return
    }

    var Lock = nacl.util.decodeBase64(LockStr);
    if(!Lock) return false;
    var	sealedArray = nacl.util.decodeBase64(textStr);
    if(!sealedArray) return false;
    var	padding = sealedArray.slice(1,101);

    if(decoyMode.checked) decoyDecrypt(padding,convertPub(Lock));			//extract decoy message, uses DH version of the signing Lock

    var	sealedItem = sealedArray.slice(101),
        result = nacl.sign.open(sealedItem,Lock);								//unsealing of sealed message

    if(result){
        if(result.join().match(",61,34,100,97,116,97,58,")){
            mainBox.innerHTML = decryptSanitizer(nacl.util.encodeUTF8(result))
        }else{
            mainBox.innerHTML = decryptSanitizer(LZString.decompressFromUint8Array(result))									//decompress and filter
        }
        setTimeout(function(){if(!decoyMode.checked) mainMsg.textContent = 'Seal ownership is VERIFIED for: ' + name},500)				//apply a delay so this appears last
    }else{
        setTimeout(function(){if(!decoyMode.checked) mainMsg.textContent = 'The seal has FAILED to verify for: ' + name},500)
    }
    callKey = ''
}

//Now the Pad encryption mode

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8
//function for encrypting with long key
function padEncrypt(text){
    var keyText = lockBox.textContent.replace(/\n/g,' ').trim(),		//turn linefeeds into spaces for compatibility with PassLok for Email
        keyTextBin = nacl.util.decodeUTF8(keyText),
        clipped = false;

    if(shortMode.checked){
        text = encodeURI(text).replace(/%20/g,' ');
        if (text.length > 94) clipped = true;  						//94-char capacity in short mode
        text = text.slice(0,94);
        while (text.length < 94) text += ' ';							//ensure standard ciphertext length after encoding
        var nonce = nacl.randomBytes(9),
            textBin = nacl.util.decodeUTF8(text)
    }else{
        var nonce = nacl.randomBytes(15);
        if(text.match('="data:')){
            var textBin = nacl.util.decodeUTF8(text)
        }else{
            var textBin = LZString.compressToUint8Array(text)
        }
    }
    var	keyLengthNeed = Math.ceil((textBin.length + 64) * 8 / entropyPerChar)

    if(keyLengthNeed > keyTextBin.length){
        mainMsg.textContent = "The key Text is too short";
        return
    }
    while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
        var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
        if(reply == null){return}else{var startIndex = parseInt(reply)}
    }

    var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex),				//main encryption event
        macBin = padMac(textBin, keyTextBin, nonce, startIndex),						//make mac
        outStr = nacl.util.encodeBase64(concatUint8Arrays([116],concatUint8Arrays(nonce,concatUint8Arrays(macBin,cipherBin)))).replace(/=+$/,'');

    if(shortMode.checked){
        mainBox.textContent = outStr
    }else{
        mainBox.textContent = '';
        if(fileMode.checked){
            if(textMode.checked){
                var fileLink = document.createElement('a');
                fileLink.download = "PL24msp.txt";
                fileLink.href = "data:," + outStr;
                fileLink.textContent = "PassLok 2.4 Pad encrypted message (text file)"
            }else{
                var fileLink = document.createElement('a');
                fileLink.download = "PL24msp.plk";
                fileLink.href = "data:binary/octet-stream;base64," + outStr;
                fileLink.textContent = "PassLok 2.4 Pad encrypted message (binary file)"
            }
        }else if(emailMode.checked){
            var fileLink = document.createElement('pre');
            fileLink.textContent = "----------begin Pad mode message encrypted with PassLok--------==\r\n\r\n" + outString.match(/.{1,80}/g).join("\r\n") + "\r\n\r\n==---------end Pad mode message encrypted with PassLok-----------"
        }else{
            var fileLink = document.createElement('pre');
            fileLink.textContent = ("PL24msp==" + outStr + "==PL24msp").match(/.{1,80}/g).join("\r\n")
        }
        mainBox.appendChild(fileLink)
    }
    if(clipped){
        mainMsg.textContent = 'The message has been truncated'
    }else{
        mainMsg.textContent = 'Encryption successful. Click Email or copy and send.'
    }

    if(emailMode.checked) sendMail();

    callKey = ''
}

//This is the core of pad encryption. Takes binary inputs and returns binary output. Same code for encrypt and decrypt
function padResult(textBin, keyTextBin, nonce, startIndex){
    var keyLength = Math.ceil(textBin.length * 8 / entropyPerChar);
    var keyBin = new Uint8Array(keyLength),
        i;
    if(startIndex + keyLength <= keyTextBin.length){								//fits without wrapping
        for(i = 0; i < keyLength; i++){
            keyBin[i] = keyTextBin[startIndex + i]
        }
    }else{																				//wrapping needed
        for(i = 0; i < keyTextBin.length - startIndex; i++){
            keyBin[i] = keyTextBin[startIndex + i]
        }
        for(i = 0; i < keyLength - (keyTextBin.length - startIndex); i++){
            keyBin[keyTextBin.length - startIndex + i] = keyTextBin[i]
        }
    }

    //now take a whole bunch of hashes of the encoded key Text, in 64-byte groups and using the nonce and an index, to make the keystream
    var count = Math.ceil(textBin.length / 64),
        keyStream = new Uint8Array(count * 64);
    for(var index = 0; index < count; index++){
        var indexBin = nacl.util.decodeUTF8(index);
        var inputArray = new Uint8Array(keyBin.length + nonce.length + indexBin.length);

        //now concatenate the arrays
        for(i = 0; i < keyBin.length; i++){
            inputArray[i] = keyBin[i]
        }
        for(i = 0; i < nonce.length; i++){
            inputArray[keyBin.length + i] = nonce[i]
        }
        for(i = 0; i < indexBin.length; i++){
            inputArray[keyBin.length + nonce.length + i] = indexBin[i]
        }
        var hash = nacl.hash(inputArray);			//now take the hash
        for(i = 0; i < 64; i++){
            keyStream[index*64 + i] = hash[i]
        }
    }

    //and finally XOR the keystream and the text
    var cipherBin = new Uint8Array(textBin.length);
    for(i = 0; i < textBin.length; i++){
        cipherBin[i] = textBin[i] ^ keyStream[i]
    }
    return cipherBin
}

//makes a 16-byte message authentication code
function padMac(textBin, keyTextBin, nonce, startIndex){						//startIndex is the one from the prompt
    var textKeyLength = Math.ceil(textBin.length * 8 / entropyPerChar),
        macKeyLength = Math.ceil(64 * 8 / entropyPerChar);						//collect enough entropy so the probability of a positive is the same for correct and incorrect decryptions
    var macBin = new Uint8Array(textBin.length + macKeyLength + nonce.length),
        i;
    var macStartIndex = (startIndex + textKeyLength) % keyTextBin.length		//mod because it may have wrapped

    //now add a sufficient part of the key text to obfuscate 9 bytes
    if(macStartIndex + macKeyLength <= keyTextBin.length){								//fits without wrapping
        for(i = 0; i < macKeyLength; i++){
            macBin[i] = keyTextBin[macStartIndex + i]
        }
    }else{																					//wrapping needed
        for(i = 0; i < keyTextBin.length - macStartIndex; i++){
            macBin[i] = keyTextBin[macStartIndex + i]
        }
        for(i = 0; i < macKeyLength - (keyTextBin.length - macStartIndex); i++){
            macBin[keyTextBin.length - macStartIndex + i] = keyTextBin[i]
        }
    }

    //now add the nonce
    for(i = 0; i < nonce.length; i++){
        macBin[macKeyLength + i] = nonce[i]
    }

    //finish adding the plaintext. The rest will be left as zeroes
    for(i = 0; i < textBin.length; i++){
        macBin[macKeyLength + nonce.length + i] = textBin[i]
    }

    //take the SHA512 hash and keep the first 16 bytes
    return nacl.hash(macBin).slice(0,16)
}

//for decrypting with long key
function padDecrypt(cipherStr){
    mainMsg.textContent = "";
    var keyText = lockBox.textContent.replace(/\n/g,' ').trim();
    if (keyText == ''){
        mainMsg.textContent = 'Click Enter and enter long shared Key, then try again';
        return
    }
    try{
        var inputBin = nacl.util.decodeBase64(cipherStr);
        if(!inputBin) return false;
        var	keyTextBin = nacl.util.decodeUTF8(keyText);
        if(cipherStr.length == 160){									//short mode message
            var	nonce = inputBin.slice(1,10),
                macBin = inputBin.slice(10,26),
                cipherBin = inputBin.slice(26)
        }else{															//all other modes
            var	nonce = inputBin.slice(1,16),
                macBin = inputBin.slice(16,32),
                cipherBin = inputBin.slice(32)
        }

    }catch(err){
        mainMsg.textContent = "This is corrupt or not encrypted"
    }
    if(cipherBin.length > keyTextBin.length){
        mainMsg.textContent = "The key Text is too short";
        return
    }
    while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
        var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
        if(reply == null){return}else{var startIndex = parseInt(reply)}
    }

    var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex);		//decryption instruction

    try{
        if(cipherStr.length == 160){
            var plain = decodeURI(nacl.util.encodeUTF8(plainBin)).trim()
        }else{
            if(plainBin.join().match(",61,34,100,97,116,97,58,")){					//this when the result is a file, which uses no compression
                var plain = nacl.util.encodeUTF8(plainBin)
            }else{
                var plain = LZString.decompressFromUint8Array(plainBin)			//use compression in the normal case
            }
        }
    }catch(err){
        mainMsg.textContent = "Decryption has failed"
    }

    //so far so good. Now do MAC checking
    if(plain){
        var	macNew = padMac(plainBin, keyTextBin, nonce, startIndex),				//make mac of the result
            macChecks = true;
        for(var i = 0; i < 16; i++){
            macChecks = macChecks && (macBin[i] == macNew[i])
        }

        if(macChecks){																//check authentication and display result if passed
            mainBox.innerHTML = decryptSanitizer(plain);
            mainMsg.textContent = 'Decryption successful';
        }else{
            mainMsg.textContent = 'Message authentication has failed';
        }
        openChat()														//in case it was an encrypted chat
    }else{
        mainMsg.textContent = "Decryption has failed"
    }

    callKey = ''
}

//Finally, Human encryption mode

var	base26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

//makes the scrambled alphabet, starting from a string
function makeAlphabet(string){
    var result = '', alpha = "ZYXWVUTSRQPONMLKJIHGFEDCBA",
        stringLength = string.length;
    if(stringLength != 0){
        for(var i = 0; i < stringLength; i++){
            var letter = string.charAt(i);
            if(result.indexOf(letter) == -1){			//letter not picked yet
                result += letter;
                var reg = new RegExp(letter);
                alpha = alpha.replace(reg,'')
            }else{										//letter was picked, so take first letter before it in the alphabet that is still available
                var index = base26.indexOf(letter),
                    alphaLength = alpha.length;
                for(var j = 0; j < alphaLength; j++){
                    if(base26.indexOf(alpha.charAt(j)) < index){
                        result += alpha.charAt(j);
                        alpha = alpha.slice(0,j) + alpha.slice(j+1,alphaLength);
                        break
                    }else if(j == alphaLength - 1){
                        result += alpha.charAt(0);
                        alpha = alpha.slice(1)
                    }
                }
            }
        }
        var base26B = result + alpha
    }else{
        var base26B = base26							//use straight alphabet if the key is empty
    }
    var base26Barray = new Array(26),
        base26Binverse = new Array(26);
    for(var i = 0; i < 26; i++){
        base26Barray[i] = base26.indexOf(base26B.charAt(i));
        base26Binverse[i] = base26B.indexOf(base26.charAt(i))
    }
    return [base26Barray,base26Binverse]
}

//to remove accents etc.
String.prototype.removeDiacritics = function() {
    var diacritics = [
        [/[\300-\306]/g, 'A'],
        [/[\340-\346]/g, 'a'],
        [/[\310-\313]/g, 'E'],
        [/[\350-\353]/g, 'e'],
        [/[\314-\317]/g, 'I'],
        [/[\354-\357]/g, 'i'],
        [/[\322-\330]/g, 'O'],
        [/[\362-\370]/g, 'o'],
        [/[\331-\334]/g, 'U'],
        [/[\371-\374]/g, 'u'],
        [/[\321]/g, 'N'],
        [/[\361]/g, 'n'],
        [/[\307]/g, 'C'],
        [/[\347]/g, 'c'],
         [/[\337]/g, 'ss'],
    ];
    var s = this;
    for (var i = 0; i < diacritics.length; i++) {
        s = s.replace(diacritics[i][0], diacritics[i][1]);
    }
    return s;
}

//processes plaintext or ciphertext and does encryption (decryption if isEncrypt = false)
function humanEncrypt(text,isEncrypt){
    text = text.replace(/(<br>|<div>)/g,' ').replace(/<(.*?)>/g,'');																		//no tags allowed. pure text
    if(text.trim() == '') return;

    //text preparation. If encrypting, convert Qs into Ks and then spaces into Qs. Punctuation other than commas into QQ
    if(isEncrypt){
        text = text.replace(/[0-9]/g,function(match){return base26.charAt(match);}).trim();						//replace numbers with letters
        text = text.toUpperCase().removeDiacritics();																//remove accents and make upper case
        text = text.replace(/Q/g,'K').replace(/[.;:!?{}_()\[\]…—–―\-\s\n]/g,'Q').replace(/Q+$/,'')				//turn Q into K, spaces and punctuation into Q
    }
    text = text.replace(/[^A-Z]/g,'');																				//only base26 anyway

    var rawKeys = lockBox.textContent.trim().split('~');
    for(var i = 0; i < 3; i++) rawKeys[i] = rawKeys[i].toUpperCase().removeDiacritics().replace(/[^A-Z]/g,'');	//remove accents, spaces, and all punctuation

    var	base26B1arrays = makeAlphabet(compressKey(rawKeys[0],25)),
        base26B2arrays = makeAlphabet(compressKey(rawKeys[1],25)),
        base26BArray1 = base26B1arrays[0],
        base26BArray2 = base26B2arrays[0],
        base26Binverse1 = base26B1arrays[1],
        base26Binverse2 = base26B2arrays[1],
        seed = rawKeys[2] ? rawKeys[2] : rawKeys[0];			//if seed is empty, use key 1

    var seedLength = seed.length;
    seedArray = new Array(seedLength);				//this is actually the seed mask
    for(var i = 0; i < seedLength; i++){
        seedArray[i] = base26.indexOf(seed.charAt(i))
    }

    var isGoodSeed = false,							//so it calculates at least once. No iteration when decrypting
        extendedText = text;							//initialize for decryption
  while(!isGoodSeed){
    var	rndSeedArray = new Array(seedLength);
    if(isEncrypt){										//per-message random seed
        var	dummySeed = '',
            newIndex;
        for(var i = 0; i < seedLength; i++){
            newIndex = Math.floor(betterRandom()*26);	//avoid using Math.random() since this must be cryptographically secure
            rndSeedArray[i] = newIndex;					//this contains the random seed
            dummySeed += base26.charAt(newIndex)
        }
        extendedText = dummySeed + text
    }

    var	length = extendedText.length,
        textArray = new Array(length),
        cipherArray = new Array(length);

    //now fill row 1 with numbers representing letters; this will be a lot faster than doing string operations
    for(var i = 0; i < length; i++){
        textArray[i] = base26.indexOf(extendedText.charAt(i))
    }

    //if decrypting, extract the random seed
    if(!isEncrypt){
        for(var i = 0; i < seedLength; i++) rndSeedArray[i] = base26BArray2[(26 - base26Binverse1[textArray[i]] + seedArray[i]) % 26]
    }

    //main calculation. First make the keystream
    var stream = new Array(length);
    for(var i = 0; i < seedLength; i++){
        stream[i] = rndSeedArray[i]
    }
    for(var i = seedLength; i < length; i++){
        stream[i] = base26BArray1[(26 - base26Binverse2[stream[i-seedLength]] + stream[i-seedLength+1]) % 26]
    }

    //now test that the cipherstream obtained has sufficient quality, otherwise make another guess for the seed and repeat the process
    if(isEncrypt){
        var freqArray = frequencies(stream,26),											//first compute the frequency histogram
            chiNumber = chiSquared(stream,freqArray,26),									//single letter chi-squared. Must be smaller than 34.4
            corNumber = corrAtDistance(stream,freqArray,26,1);							//correlation chi-squared for consecutive letters. Must be smaller than 671

        isGoodSeed = (chiNumber < 34.4) && (corNumber < 671)							//this is the test for randomness of the keystream
    }else{
        isGoodSeed = true																	//automatic pass when decrypting
    }
  }																						//end of iteration for good seed

    stream = seedArray.concat(stream.slice(seedLength));											//replace random seed with original seed before the final operation

    //now combine the plaintext (ciphertext) and the keystream using the Tabula Prava, and convert back to letters
    for(var i = 0; i < length; i++) cipherArray[i] = isEncrypt ? base26.charAt(base26BArray1[(26 - base26Binverse2[textArray[i]] + stream[i]) % 26]) : base26.charAt(base26BArray2[(26 - base26Binverse1[textArray[i]] + stream[i]) % 26]);
    var cipherText = cipherArray.join('');

    if(!isEncrypt){
        cipherText = cipherText.slice(seedLength);										//remove dummy seed when decrypting
        cipherText = cipherText.replace(/QQ/g,'. ').replace(/Q/g,' ').replace(/KU([AEIO])/g,'QU$1')
    }

    if(shortMode.checked || !isEncrypt){
        mainBox.textContent = cipherText					//no tags in short mode or decrypting
    }else if(isEncrypt){
        mainBox.textContent = '';
        if(fileMode.checked){
            if(textMode.checked){
                var fileLink = document.createElement('a');
                fileLink.download = "PL24msh.txt";
                fileLink.href = "data:," + cipherText;
                fileLink.textContent = "PassLok 2.4 Human encrypted message (text file)"
            }else{
                var fileLink = document.createElement('a');
                fileLink.download = "PL24msh.plk";
                fileLink.href = "data:binary/octet-stream;base64," + cipherText;
                fileLink.textContent = "PassLok 2.4 Human encrypted message (binary file)"
            }
        }else if(emailMode.checked){
            var fileLink = document.createElement('pre');
            fileLink.textContent = "----------begin Human mode message encrypted with PassLok--------==\r\n\r\n" + outString.match(/.{1,80}/g).join("\r\n") + "\r\n\r\n==---------end Human mode message encrypted with PassLok-----------"
        }else{
            var fileLink = document.createElement('pre');
            fileLink.textContent = ("PL24msh==" + cipherText + "==PL24msh").match(/.{1,80}/g).join("\r\n")
        }
        mainBox.appendChild(fileLink)
    }
    if(isEncrypt){
        mainMsg.textContent = 'Human encryption done. Recipients can decrypt this by hand'
    }else{
        mainMsg.textContent = 'Human decryption done. Numbers turned into characters. Commas lost. Other punctuation rendered as periods'
    }

    if(emailMode.checked && isEncrypt) sendMail();

    callKey = ''
}

//alternative to Math.random based on nacl.randomBytes. Used to generate floating point numbers between 0 and 1. Uses 8 bytes as space, which is enough for double precision
function betterRandom(){
    var randomArray = nacl.randomBytes(8),
        integer = 0,
        maxInt = 18446744073709551616; 				//this is 256^8
    for(var i = 0; i < 8; i++) integer = integer * 256 + randomArray[i];
    return integer / maxInt
}

//makes a high-entropy base26 key of a given length from a piece of regular text
function compressKey(string,length){
    var indexArray = new Array(string.length),
        outputArray = new Array(length),
        rows = Math.ceil(string.length / length),
        outStr = '';

    for(var i = 0; i < string.length; i++) indexArray[i] = base26.indexOf(string.charAt(i));		//turn into index array

    for(var i = 0; i < length; i++){
        if(indexArray[i] != undefined) outputArray[i] = indexArray[i];									//do serpentine operations so long as there is more key material
        for(var j = 1; j < rows; j++){
            if(indexArray[i + length * j] != undefined) outputArray[i] = (26 - outputArray[i] + indexArray[i + length * j]) % 26
        }
    }

    for(var i = 0; i < length; i++) if(outputArray[i] != undefined) outStr += base26.charAt(outputArray[i]);
    return outStr
}

//counts frequency for each digit in the given base. The input array contains numbers from 0 to base - 1
function frequencies(array,base){
    var length = array.length,
        freqArray = new Array(base).fill(0);
    for(var i = 0; i < length; i++) freqArray[array[i]]++;
    return freqArray
}

//chi-squared statistic of a array in a given base
function chiSquared(array,freqArray,base){
    var	result = 0,
        length = array.length,
        expected = length / base,
        operand;
    for(var i = 0; i < base; i++){
        operand = freqArray[i] - expected;
        result += (operand * operand) / expected
    }
    return result
}

//two-digit test of dependence at different distance, for a given base. Minimum distance is 1
function corrAtDistance(array,freqArray,base,distance){
    var	length = array.length,
        highIndex = length - distance,
        result = 0,
        operand,
        expected,
        freqTable = new Array(base);
    for(var i = 0; i < base; i++) freqTable[i] = new Array(base).fill(0);
    for(var k = 0; k < highIndex; k++){			//fill the table with data
        freqTable[array[k]][array[k + distance]]++
    }
    for(var i = 0; i < base; i++){					//each first character
        for(var j = 0; j < base; j++){				//each second character
            expected = freqArray[i] * freqArray[j] / length;		//expected P(xy) = P(x)*P(y)
            if(expected > 0){										//in case a letter does not appear at all
                operand = freqTable[i][j] - expected;
                result += (operand * operand) / expected
            }
        }
    }
    return result
}
