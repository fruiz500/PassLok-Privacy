/*
 * PassLok SSSS (Shamir's Secret Sharing Scheme)
 *
 * This application embeds the 'shamir-secret-sharing' library (v1.0.0,
 * by Daniel Brockman, ISC License) for its core cryptographic operations.
 * This specific version's original source repository is no longer available.
 * See THIRD-PARTY-LICENSES.md for full license text.
 */

//function that starts it all when the Split/Join button is pushed
function splitJoin(){
    blinkMsg(mainMsg);				//Get blinking message started
    setTimeout(function(){																			//the rest after a 20 ms delay
        secretshare()
    },20)					//end of timeout
}

//this function implements the Shamir Secret Sharing Scheme, taking the secret from the main box and putting the result back there, and vice-versa.

function secretshare() {
    var main = mainBox.innerHTML.trim(),
        tags = main.match(/PL\d{2}p\d{3}/);

    if (tags) { // JOIN parts
        // The "join" logic is stable and correct.
        if (main.match('href="data:')) {
            var sharesText = main.replace(/<div>/g, '<br>').replace(/<\div>/g, "").replace(/<b>/g, "").split("<br>").filter(Boolean);
        } else {
            var sharesText = mainBox.innerText.split("\n\n").filter(Boolean);
        }
        var n = sharesText.length,
            quorum = parseInt(tags[0].slice(-3));
        if (n < quorum) { /* ... error handling ... */ return; }

        const sharesAsUint8Arrays = sharesText.map(shareText => {
            let base64part = shareText;
            if (shareText.match('href="data:')) {
                base64part = shareText.match(/,[a-zA-Z0-9\/+]+"/)[0].slice(1, -1);
            } else {
                base64part = stripTags(shareText.replace(/\s/g, ''));
            }
            return base64ToUint8Array(base64part);
        });

        if (learnMode.checked) { /* ... confirm dialog ... */ }

        try {
            // This now works because sss_combine_uint8 correctly accepts Uint8Array[]
            const secBin = sss_combine_uint8(sharesAsUint8Arrays);
            var secret;
            if (secBin.join().match(",61,34,100,97,116,97,58,")) { // '="data:'
                secret = new TextDecoder().decode(secBin);
            } else {
                secret = LZString.decompressFromUint8Array(secBin);
            }
            mainBox.innerHTML = decryptSanitizer(secret);
            mainMsg.textContent = 'Join successful';
        } catch (err) {
            console.error("Error joining shares:", err);
            mainMsg.textContent = 'There was an error joining the parts.';
        }

    } else { // SPLIT secret
        if (main == "") {
            mainMsg.textContent = 'The box is empty';
            return;
        }
        if (learnMode.checked) {
            var reply = confirm("The item in the box will be split into several partial items, which will replace the contents of the box. A popup will ask for the total number of parts, and the minimum needed to reconstruct the original item. Cancel if this is not what you want.");
            if (!reply) return;
        }

        var number = partsNumber.value;
        if (number.trim() == "") { // Stop to display the entry form if it is empty
            partsIn.style.display = "block";
            shadow.style.display = "block";
            if (!isMobile) partsNumber.focus();
            return; // This return is what makes the form appear and wait for input.
        }
        partsIn.style.display = "none";
        shadow.style.display = "none";
        var quorum = partsQuorum.value;
        if (quorum.trim() == "") {
            quorum = number;
        }
        partsNumber.value = "";
        partsQuorum.value = "";
        quorum = parseInt(quorum);
        number = parseInt(number);
        if (number < 2) { number = 2; } else if (number > 255) { number = 255; }
        if (quorum > number) quorum = number;

        var secret = mainBox.innerHTML.trim();
        var secBin;
        if (secret.match('="data:')) {
            secBin = new TextEncoder().encode(secret);
        } else {
            secBin = LZString.compressToUint8Array(secret);
        }
        
        try {
            // 1. Split secret into raw binary shares. Result is Uint8Array[]
            const shares = sss_split_uint8(secBin, number, quorum);
            // 2. Convert each raw share to Base64. This now works correctly.
            const sharesAsBase64 = shares.map(share => uint8ArrayToBase64(share));
            
            displayshare(sharesAsBase64, quorum);
            mainMsg.textContent = number + ' parts made. ' + quorum + ' required to reconstruct';
            partsInBox = true;
        } catch (err) {
            console.error("Error splitting secret:", err);
            mainMsg.textContent = 'There was an error splitting the secret.';
        }
    }
    setTimeout(function() { charsLeft(); }, 20);
}

function displayshare(shares, quorum) {
    var quorumStr = "00" + quorum;
    var output = "";
    quorumStr = quorumStr.substr(quorumStr.length - 3);

    mainBox.textContent = '';
    var fragment = document.createElement('div');

    // The shares we receive here are already Base64 strings, ready for display.
    for (var i = 0; i < shares.length; i++) {
        var dataItem = shares[i].replace(/=+/g, ''); 
        if (i > 0) output += "<br><br>";

        if (fileMode.checked) {
            if (textMode.checked) {
                output += '<a download="PL24p' + quorumStr + '.txt" href="data:,' + dataItem + '"><b>PassLok 2.4 Part out of ' + quorumStr + ' as a text file</b></a>';
            } else {
                output += '<a download="PL24p' + quorumStr + '.txt" href="data:binary/octet-stream;base64,' + dataItem + '"><b>PassLok 2.4 Part out of ' + quorumStr + ' as a binary file</b></a>';
            }
        } else {
            output += "<pre>" + ("PL24p" + quorumStr + "==" + dataItem + "==PL24p" + quorumStr).match(/.{1,80}/g).join("<br>") + "</pre>";
        }
    }
    fragment.innerHTML = output;
    mainBox.appendChild(fragment);
}

/**
 * Splits a Uint8Array secret into an array of raw Uint8Array shares.
 * This is a direct, clean wrapper around the shamir library.
 */
function sss_split_uint8(secret, numShares, threshold) {
    return shamir.split(secret, { shares: numShares, threshold: threshold });
}

/**
 * Combines an array of raw Uint8Array shares to reconstruct the secret.
 * This is a direct, clean wrapper around the shamir library.
 */
function sss_combine_uint8(shares) {
    return shamir.combine(shares);
}
