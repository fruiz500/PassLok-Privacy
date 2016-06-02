//function that starts it all when the Split/Join button is pushed
function splitJoin(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		secretshare();
	},20);						//end of timeout
};

//this function implements the Shamir Secret Sharing Scheme, taking the secret from the main box and putting the result back there, and vice-versa.
function secretshare(){
	var	main = mainBox.innerHTML.replace(/\&nbsp;/g,'').replace(/<\/div>/gi,"").replace(/<div>/gi,"<br>").replace(/<blockquote>/gi,"<br>").trim();
	if((main.slice(0,8).match(/p\d{3}/) && main.slice(0,2)=='PL') || (main.match(/p\d{3}/) && main.match('.txt'))){		//main box has parts: join parts
		var shares = main.split("<br>").filter(Boolean),												//go from newline-containing string to array
			n = shares.length,
			quorumarr = shares[0].slice(0,8).match(/p\d{3}/);															//quorum in tags is "p" plus 3 digits in a row, first instance
		if(quorumarr == null)	quorumarr = shares[0].slice(-13).match(/ \d{3}/);										//maybe packaged; get quorum at end of label
		if(quorumarr == null) {var quorum = n} else {var quorum = parseInt(quorumarr[0].slice(1,4))};					//if tags are missing, ignore quorum, otherwise read it from tags
		if(n < quorum){																//not enough parts
			mainMsg.innerHTML = '<span style="color:orange">According to the tags, you need ' + (quorum - n) + ' more parts in the box</span>';
			throw("insufficient parts")
		};
		for (var i=0; i < shares.length; i++) {
			shares[i] = "8" + charArray2hex(nacl.util.decodeBase64(striptags(shares[i])));
		};
		if (learnMode.checked){
			var reply = confirm("The parts in the main box will be joined to retrieve the original item, which will be placed in this box. Please make sure that there are enough parts. Cancel if this is not what you want.");
			if(!reply) throw("SSSS join canceled");
		};
		if(n === 1){
			mainMsg.innerHTML = '<span style="color:orange">Only one part in main box</span>';
			throw("insufficient parts")
		};
try{
		var	sechex = secrets.combine(shares),
			secret = LZString.decompressFromUint8Array(hex2charArray(sechex));
		mainBox.innerHTML = secret;
		mainMsg.innerHTML = 'Join successful';
}catch(err){
	//the encodeUTF8 is the likely culprit
	mainMsg.innerHTML = 'There was an error.';
}
	} else {																		//parts not detected, split instead
		if (main == "") {
			mainMsg.innerHTML = '<span style="color:orange">The box is empty</span>';
			throw("No key in the key box")
		};
		if (learnMode.checked){
			var reply = confirm("The item in the box will be split into several partial items, which will replace the contents of the box. A popup will ask for the total number of parts, and the minimum needed to reconstruct the original item. Cancel if this is not what you want.");
			if(!reply) throw("SSSS split canceled");
		};
		var number = partsNumber.value;
		if (number.trim() == ""){													//stop to display the entry form if it is empty
			partsIn.style.display = "block";
			shadow.style.display = "block";
			if(!isMobile) partsNumber.focus();
			throw ("stopped for # of parts input")
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
		var secret = mainBox.innerHTML.trim(),
			sechex = charArray2hex(LZString.compressToUint8Array(secret)),
			shares = secrets.share(sechex,number,quorum);
		displayshare(shares,quorum);
		mainMsg.innerHTML = number + ' parts made. ' + quorum + ' required to reconstruct';
		partsInBox = true
	};
	setTimeout(function(){charsLeft();},20)
};

function displayshare(shares,quorum){
	var length = shares[0].length,
		quorumStr = "00" + quorum;
	quorumStr = quorumStr.substr(quorumStr.length-3);

	var dataItem = nacl.util.encodeBase64(hex2charArray(shares[0].slice(1,length))).replace(/=+/g, '');
	if(fileMode.checked){
		var	output = '<a download="PL23p' + quorumStr + '.txt" href="data:,==' + dataItem + '=="><b>PassLok 2.3 Part out of '+ quorumStr +'</b>&nbsp;&nbsp;<button onClick="followLink(this);">Save</button></a>'
	}else{
		var	output = "PL23p" + quorumStr + "==" + dataItem + "==PL23p" + quorumStr;
	}

	for (var i=1; i < shares.length; i++) {
		dataItem = nacl.util.encodeBase64(hex2charArray(shares[i].slice(1,length))).replace(/=+/g, '');
		if(fileMode.checked){
			output += "<br><br>" + '<a download="PL23p' + quorumStr + '.txt" href="data:,==' + dataItem + '=="><b>PassLok 2.3 Part out of '+ quorumStr +'</b>&nbsp;&nbsp;<button onClick="followLink(this);">Save</button></a>'
		}else{
			output += "<br><br>" + "PL23p" + quorumStr + "==" + dataItem + "==PL23p" + quorumStr;
		}
	};
	mainBox.innerHTML = output;
};

//convert an array of 8-bit decimal codes into a hexadecimal string
function charArray2hex(charArray){
	var output = '';
	for(var i = 0;i < charArray.length; i++){
		var newstring = charArray[i].toString(16);
		if (newstring.length < 2) newstring = '0' + newstring;
		output = output + newstring
	};
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
	};
	return output
}