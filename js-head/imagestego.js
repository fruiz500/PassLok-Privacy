//this code is closely related to that available at https://github.com/fruiz500/passlok-stego
//Updated to utilize the unified post-quantum steganography engine (plstego.js / prng.js)

//clean up some junk possibly left by legacy JPG hiding functions
localStorage.removeItem('action');
localStorage.removeItem('container');
localStorage.removeItem('method');
localStorage.removeItem('wikisafe');

// load image for hiding text and open dialog
var importImage = function(e) {
    if(learnMode && learnMode.checked){
        var reply = confirm("An image stored in this device will replace the current image. Cancel if this is not what you want.");
        if(!reply) return;
    }

    var reader = new FileReader();

    reader.onload = function(event) {
        // set the preview
        previewImg.style.margin = 'auto';
        previewImg.style.display = 'block';
        previewImg.src = event.target.result;
    };

    reader.readAsDataURL(e.target.files[0]);
    previewImg.onload = function(){
        //see if the password box can be pre-populated because there is only one recipient
        var lockArray = lockBox.innerHTML
            .replace(/\r\n/g,'<br>')
            .replace(/<br>$/,'')
            .replace(/<div>/g,'<br>')
            .replace(/<\/div>/g,'')
            .replace(/myself/,'')
            .split('<br>')
            .map(item => item.trim()) // Destroy stray DOM whitespace
            .filter(Boolean);
            
        if(lockArray.length == 1){
            var lock = replaceByItem(lockArray[0]),
                locklen = lock.length;
            if(locklen == 43 || locklen == 50){                 //Lock identified, compute shared Key
                if(!refreshKey()) return;
                if (locklen == 50) lock = changeBase(lock.toLowerCase().replace(/l/g,'L'), base36, base64, true);
                var lockBin = base64ToUint8Array(lock);
                if(!lockBin) return false;
                imageBox.value = uint8ArrayToBase64(makeShared(convertPub(lockBin),KeyDH)).replace(/=+$/,'');
            }else{                                                  //not a Lock, so use it directly
                imageBox.value = lock;
            }
        }else{
            imageBox.value = '';
        }

        updateCapacity();
        openClose('imageScr');
        openClose('shadow');
        imageBox.focus();
        
        // KILL THE LISTENER SO IT DOESN'T FIRE AFTER ENCODING
        previewImg.onload = null; 
    };
};

//show how much text can be hidden in the image
function updateCapacity(){
    var textsize = mainBox.textContent.length;
    var totalPixels = previewImg.naturalWidth * previewImg.naturalHeight;

    var pngBytes = Math.floor((totalPixels * 3) / 8);
    var jpgBytes = Math.floor(totalPixels * 0.1);

    // Subtract EOF marker overhead
    pngBytes = Math.max(0, pngBytes - 6);
    jpgBytes = Math.max(0, jpgBytes - 6);

    // Approximate Base64 characters capacity
    var pngChars = Math.floor(pngBytes * (4 / 3));
    var jpgChars = Math.floor(jpgBytes * (4 / 3));

    imageMsg.style.color = '';
    imageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, at least ' + jpgChars + ' as JPG. The main box has ' + textsize + ' characters';
}

// Packages the main box content into a typed byte array for the plstego engine
function getUnifiedPayload() {
    var rawContent = mainBox.textContent.trim();
    if (!rawContent) return null;

    var cleanContent = rawContent;
    if (cleanContent.match('==')) {
        cleanContent = cleanContent.split('==')[1].replace(/[-\s]/g,'').replace(/<(.*?)>/gi,"");
    }

    var b64Regex = /^[A-Za-z0-9+/]+$/;
    if (cleanContent.length > 50 && b64Regex.test(cleanContent)) {
        try {
            var binaryData = base64ToUint8Array(cleanContent);
            var payload = new Uint8Array(binaryData.length + 1);
            payload[0] = 0x01; // 0x01: Encrypted Base64 Blob
            payload.set(binaryData, 1);
            return payload;
        } catch (e) {
            // Fall back to text mode if decoding fails
        }
    }

    var compressed = LZString.compressToUint8Array(rawContent);
    var payloadText = new Uint8Array(compressed.length + 1);
    payloadText[0] = 0x00; // 0x00: LZ-Compressed Text Marker
    payloadText.set(compressed, 1);
    
    return payloadText;
}

// Wrapper to encode payload into PNG via plstego.js
async function handleEncodePNG(){
    var learnMode = document.getElementById('learnMode');
    var imageMsg = document.getElementById('imageMsg');
    var previewImg = document.getElementById('previewImg');
    var imageBox = document.getElementById('imageBox');

    if(learnMode && learnMode.checked){
        var reply = confirm("The text in the main box will be encoded into this image as a PNG, which can then be copied and sent to others. Cancel if this is not what you want.");
        if(!reply) return;
    }
    
    var payload = getUnifiedPayload();
    if(!payload){
        imageMsg.textContent = 'There is nothing to hide';
        return;
    }

    if(previewImg.src.length < 100){
        imageMsg.textContent = 'Please load an image before clicking this button';
        return;
    }

    imageMsg.style.color = '';
    if (typeof blinkMsg === 'function') blinkMsg(imageMsg);

    var rawPassword = imageBox.value.trim();
    var password = "";

    if (rawPassword) {
        var stretched = wiseHash(rawPassword, '');
        password = encodeBase64(stretched).replace(/=+$/, ''); 
    }

    try {
        await window.encodePNG({
            image: previewImg,
            data: payload,
            password: password,
            skipEncrypt: false,
            iterations: 1 
        });
        
        imageMsg.textContent = 'Item hidden in the image. Save it now.';
    } catch (error) {
        imageMsg.textContent = error.message || 'Error encoding image.';
    }
}

// Wrapper to encode payload into JPG via plstego.js
async function handleEncodeJPG(){
    var learnMode = document.getElementById('learnMode');
    var imageMsg = document.getElementById('imageMsg');
    var previewImg = document.getElementById('previewImg');
    var imageBox = document.getElementById('imageBox');

    if(learnMode && learnMode.checked){
        var reply = confirm("The text in the main box will be encoded into this image as a JPG, which can then be copied and sent to others. Cancel if this is not what you want.");
        if(!reply) return;
    }

    var payload = getUnifiedPayload();
    if(!payload){
        imageMsg.textContent = 'There is nothing to hide';
        return;
    }

    if(previewImg.src.length < 100){
        imageMsg.textContent = 'Please load an image before clicking this button';
        return;
    }

    imageMsg.style.color = '';
    if (typeof blinkMsg === 'function') blinkMsg(imageMsg);

    var rawPassword = imageBox.value.trim();
    var password = "";

    if (rawPassword) {
        var stretched = wiseHash(rawPassword, '');
        password = encodeBase64(stretched).replace(/=+$/, ''); 
    }

    try {
        await window.encodeJPG({
            image: previewImg,
            data: payload,
            password: password,
            skipEncrypt: false,
            iterations: 1
        });
        imageMsg.textContent = 'Item hidden in the image. Save it now.';
    } catch (error) {
        imageMsg.textContent = error.message || 'Error encoding JPG.';
    }
}

// Wrapper to extract payload from image via plstego.js
async function handleDecodeImage(){
    var learnMode = document.getElementById('learnMode');
    var imageMsg = document.getElementById('imageMsg');
    var previewImg = document.getElementById('previewImg');
    var imageBox = document.getElementById('imageBox');
    var mainBox = document.getElementById('mainBox');
    var mainMsg = document.getElementById('mainMsg');
    var advancedMode = document.getElementById('advancedMode');

    if(typeof isiOS !== 'undefined' && isiOS){
        imageMsg.textContent = 'On iOS, you can do PNG hide only';
        return;
    }
    if(learnMode && learnMode.checked){
        var reply = confirm("The text hidden in this image, if any, will be extracted and placed in the previous box, replacing its contents. This does not yet work on mobile devices. Cancel if this is not what you want.");
        if(!reply) return;
    }

    imageMsg.style.color = '';
    if (typeof blinkMsg === 'function') blinkMsg(imageMsg);

    var rawPassword = imageBox.value.trim();
    var password = "";

    if (rawPassword) {
        var stretched = wiseHash(rawPassword, '');
        password = encodeBase64(stretched).replace(/=+$/, ''); 
    }

    try {
        const result = await window.decodeImage({
            image: previewImg,
            password: password,
            skipEncrypt: false,
            iterations: 1
        });

        let extractedBytes;

        if (result && result.primary) {
            extractedBytes = result.primary;
        } else if (Array.isArray(result) && result[0] instanceof Uint8Array) {
            extractedBytes = result[0];
        } else if (result instanceof Uint8Array) {
            extractedBytes = result;
        }

        if (!extractedBytes || extractedBytes.length === 0) {
            throw new Error('Reveal failed: The payload is undefined or does not match expected extraction.');
        }

        var typeByte = extractedBytes[0];
        var payloadData = extractedBytes.subarray(1);

        if (typeByte === 0) {
            mainBox.innerHTML = decryptSanitizer(LZString.decompressFromUint8Array(payloadData));
            mainMsg.textContent = 'Text extracted from image.';
        } else if (typeByte === 1) {
            var b64 = uint8ArrayToBase64(payloadData);
            mainBox.innerHTML = decryptSanitizer(b64);
            mainMsg.textContent = 'Extraction successful. Use "Decrypt" to read.';
        } else {
            throw new Error("Unknown payload type byte: " + typeByte);
        }

        if (typeof image2main === 'function') image2main();
        imageBox.value = '';
        if (typeof updateButtons === 'function') updateButtons();
        
        if(advancedMode && advancedMode.checked && typeof main2extra === 'function'){
            main2extra();
        }

    } catch (error) {
        imageMsg.textContent = error.message || 'The image does not contain anything, or perhaps the password is wrong';
        imageBox.value = '';
    }
}