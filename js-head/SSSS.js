//function that starts it all when the Split/Join button is pushed
function splitJoin(){
    blinkMsg(mainMsg);				//Get blinking message started
    setTimeout(function(){																			//the rest after a 20 ms delay
        secretshare()
    },20)					//end of timeout
}

//this function implements the Shamir Secret Sharing Scheme, taking the secret from the main box and putting the result back there, and vice-versa.
function secretshare(){
    var main = mainBox.innerHTML.trim(),																//innerHTML to preserve links
        tags = main.match(/PL\d{2}p\d{3}/);
    if(tags){																	//main box has parts: join parts
        if(main.match('href="data:')){										//parts in links
            var shares = main.replace(/<div>/g,'<br>').replace(/<\div>/g,"").replace(/<b>/g,"").split("<br>").filter(Boolean)				//go from newline-containing string to array
        }else{
            var shares = mainBox.innerText.split("\n\n").filter(Boolean)							//split when double spaced
        }
        var	n = shares.length,
            quorum = parseInt(tags[0].slice(-3));														//quorum in tags is "p" plus 3 digits in a row, first instance
        if(n < quorum){																//not enough parts
            mainMsg.textContent = 'According to the tags, you need ' + (quorum - n) + ' more parts in the box';
            return
        }
        if(n < quorum){																//not enough parts
            mainMsg.textContent = 'According to the tags, you need ' + (quorum - n) + ' more parts in the box';
            return
        }
        //extract shares from links, condition shares for combination
        for (var i = 0; i < shares.length; i++) {
            if(shares[i].match('href="data:')){										//share is in link
                shares[i] = shares[i].match(/,[a-zA-Z0-9\/+]+"/)[0].slice(1,-1)
            }else{																		//share as text, just remove tags and extra spaces
                shares[i] = stripTags(shares[i].replace(/\s/g,''))
            }
            var shareBin = nacl.util.decodeBase64(shares[i]);
            if(!shareBin) return false;
            shares[i] = "8" + charArray2hex(shareBin)				//convert to hex
        }
        if(learnMode.checked){
            var reply = confirm("The parts in the main box will be joined to retrieve the original item, which will be placed in this box. Please make sure that there are enough parts. Cancel if this is not what you want.");
            if(!reply) return
        }
        if(n === 1){
            mainMsg.textContent = 'Only one part in main box';
            return
        }
try{
        var	sechex = secrets.combine(shares),
            secBin = hex2charArray(sechex);
        if(secBin.join().match(",61,34,100,97,116,97,58,")){
            var secret = nacl.util.encodeUTF8(secBin)
        }else{
            var secret = LZString.decompressFromUint8Array(secBin)
        }
        mainBox.innerHTML = decryptSanitizer(secret);									//disable non-whitelisted tags and attributes
        mainMsg.textContent = 'Join successful'
}catch(err){
    mainMsg.textContent = 'There was an error'									//the encodeUTF8 is the likely culprit
}
    }else{																		//parts not detected, split instead
        if(main == "") {
            mainMsg.textContent = 'The box is empty';
            return
        }
        if(learnMode.checked){
            var reply = confirm("The item in the box will be split into several partial items, which will replace the contents of the box. A popup will ask for the total number of parts, and the minimum needed to reconstruct the original item. Cancel if this is not what you want.");
            if(!reply) return
        }
        var number = partsNumber.value;
        if(number.trim() == ""){													//stop to display the entry form if it is empty
            partsIn.style.display = "block";
            shadow.style.display = "block";
            if(!isMobile) partsNumber.focus();
            return
        }
        partsIn.style.display = "none";
        shadow.style.display = "none";
        var quorum = partsQuorum.value;					//this value defaults to the total number if empty
        if (quorum.trim() == ""){
            quorum = number
        }
        partsNumber.value = "";							//on re-execution, read the box and reset it
        partsQuorum.value = "";
        quorum = parseInt(quorum);
        number = parseInt(number);
        if(number < 2){number = 2} else if(number > 255) {number = 255};
        if (quorum > number) quorum = number;
        var secret = mainBox.innerHTML.trim();
        if(secret.match('="data:')){									//no compression if it includes a file
            var secBin = nacl.util.decodeUTF8(secret)
        }else{
            var secBin = LZString.compressToUint8Array(secret)
        }
        var	sechex = charArray2hex(secBin),
            shares = secrets.share(sechex,number,quorum);
        displayshare(shares,quorum);
        mainMsg.textContent = number + ' parts made. ' + quorum + ' required to reconstruct';
        partsInBox = true
    }
    setTimeout(function(){charsLeft();},20)
}

function displayshare(shares,quorum){
    var length = shares[0].length,
        quorumStr = "00" + quorum,
        output = "";
    quorumStr = quorumStr.substr(quorumStr.length-3);

    mainBox.textContent = '';
    var fragment = document.createElement('div');

    for (var i = 0; i < shares.length; i++) {
        var dataItem = nacl.util.encodeBase64(hex2charArray(shares[i].slice(1,length))).replace(/=+/g, '');
        if(i > 0) output += "<br><br>";
        if(fileMode.checked){
            if(textMode.checked){
                output +=  '<a download="PL24p' + quorumStr + '.txt" href="data:,' + dataItem + '"><b>PassLok 2.4 Part out of ' + quorumStr + ' as a text file</b></a>'
            }else{
                output += '<a download="PL24p' + quorumStr + '.txt" href="data:binary/octet-stream;base64,' + dataItem + '"><b>PassLok 2.4 Part out of ' + quorumStr + ' as a binary file</b></a>'
            }
        }else{
            output += "<pre>" + ("PL24p" + quorumStr + "==" + dataItem + "==PL24p" + quorumStr).match(/.{1,80}/g).join("<br>") + "</pre>"
        }
    };
    fragment.innerHTML = output;				//must use innerHTML because building the list of links with linefeeds in between with the appendChild method does not work in Chrome (bug?)
    mainBox.appendChild(fragment)
}

//convert an array of 8-bit decimal codes into a hexadecimal string
function charArray2hex(charArray){
    var output = '';
    for(var i = 0;i < charArray.length; i++){
        var newstring = charArray[i].toString(16);
        if (newstring.length < 2) newstring = '0' + newstring;
        output += newstring
    }
    return output
}

//convert a hexadecimal string (two characters per byte) into an array of decimal codes. Wrong codes marked as -1
function hex2charArray(string){
    var output = [];
    for(var i = 0;i < string.length; i=i+2){
        var a = parseInt(string.slice(i,i+2),16);
        if(isNaN(a)){
            output[i/2] = -1
        }else{
            output[i/2] = a
        }
    }
    return output
}
