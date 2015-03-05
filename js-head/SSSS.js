//this function implements the Shamir Secret Sharing Scheme, taking the secret from the main box and putting the result back there, and vice-versa.
function secretshare(){
	var mainmsg = document.getElementById("mainmsg"),
		main = XSSfilter(document.getElementById('mainBox').innerHTML.replace(/\&nbsp;/g,'').replace(/<br>/gi,"\n").replace(/<div>/gi,"\n").replace(/<blockquote>/gi,"\n")).trim();
	if((main.slice(0,8).match(/p\d{3}/) && main.slice(0,2)=='PL') || (main.match(/\n\nA/) && main.slice(0,1)=='A')){		//main box has parts: join parts
		var shares = main.replace(/\n\s*\n/g, '\n').split("\n"),					//go from newline-containing string to array
			n = shares.length,
			quorumarr = main.match(/p\d{3}/);															//quorum in tags is "p" plus 3 digits in a row, first instance
		if(quorumarr == null) {var quorum = n} else {var quorum = parseInt(quorumarr[0].slice(1,4))};	//if tags are missing, ignore quorum, otherwise read it form tags
		if(n < quorum){																//not enough parts
			mainmsg.innerHTML = '<span style="color:red">According to the tags, you need ' + (quorum - n) + ' more parts in the box</span>'
		};
		for (var i=0; i < shares.length; i++) {
			shares[i] = bestOfThree(shares[i]);										//undo triples, if any
			shares[i] = applyRScode(shares[i],false);								//RS error correction
			shares[i] = "8" + sjcl.codec.hex.fromBits(sjcl.codec.base64.toBits(shares[i].replace(/[^a-zA-Z0-9+/ ]+/g, '')));	//retrieve from base64 back to hex and add initial "8" to each item
		};
		if (learnOn){
			var reply = confirm("The parts in the main box will be joined to retrieve the original item, which will be placed in this box. Please make sure that there are enough parts. Cancel if this is not what you want.");
			if(reply===false) throw("SSSS join canceled");
		};
		if(n === 1){
			mainmsg.innerHTML = '<span style="color:red">Only one part in main box</span>';
			throw("insufficient parts")
		};
		var	sechex = secrets.combine(shares),
			secret = sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(sechex));
			if(XSSfilter(secret).slice(0,9) != 'filename:') secret = LZString.decompressFromBase64(secret);
		document.getElementById('mainBox').innerHTML = secret;
		mainmsg.innerHTML = 'Join successful';
	} else {																		//parts not detected, split instead
		if (main == "") {
			mainmsg.innerHTML = '<span style="color:red">The box is empty</span>';
			throw("No key in the key box")
		};
		if (learnOn){
			var reply = confirm("The item in the box will be split into several partial items, which will replace the contents of the box. A popup will ask for the total number of parts, and the minimum needed to reconstruct the original item. Cancel if this is not what you want.");
			if(reply===false) throw("SSSS split canceled");
		};
		var number = document.getElementById('partsNumber').value;
		if (number.trim() == ""){													//stop to display the entry form if it is empty
			document.getElementById("partsIn").style.display = "block";
			document.getElementById("shadow").style.display = "block";
			if(!isMobile) document.getElementById('partsNumber').focus();
			throw ("stopped for # of parts input")
		}
		var quorum = document.getElementById('partsQuorum').value;					//this value defaults to the total number if empty
		if (quorum.trim() == ""){
			quorum = number
		}
		document.getElementById('partsNumber').value = "";							//on re-execution, read the box and reset it
		document.getElementById('partsQuorum').value = "";
		quorum = parseInt(quorum);
		number = parseInt(number);
		if(number < 2){number = 2} else if(number > 255) {number = 255};
		if (quorum > number) quorum = number;
		var secret = document.getElementById('mainBox').innerHTML.trim();
		if(XSSfilter(secret).slice(0,9) != 'filename:') secret = LZString.compressToBase64(secret);
		var	sechex = sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits(secret)),
			shares = secrets.share(sechex,number,quorum);
		displayshare(shares,quorum);
		mainmsg.innerHTML = number + ' parts made. ' + quorum + ' required to reconstruct';
		partsInBox = true
	};
	document.getElementById("partsIn").style.display = "none";
	document.getElementById("shadow").style.display = "none"
};

function displayshare(shares,quorum){
	var length = shares[0].length,
		quorumst = "00" + quorum,
		tagsOff = document.getElementById("notags").checked;
		quorumst = quorumst.substr(quorumst.length-3);

	//strip initial "8" and display each share in a new line, base 64, with tags
	if(!tagsOff){
		var dataitem = sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(shares[0].slice(1,length))).replace(/=+/g, '');
		var	output = triple("PL21p" + quorumst + "=" + dataitem + '=' + calcRScode(dataitem) + "=PL21p" + quorumst);

	//trim final "=" and display with tags
	}else{
		var	output = triple(sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(shares[0].slice(1,length))).replace(/=+/g, ''))
	}
	for (var i=1; i < shares.length; i++) {
		if(!tagsOff){
			dataitem = sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(shares[i].slice(1,length))).replace(/=+/g, '');
			output = output + "<br><br>" + triple("PL21p" + quorumst + "=" + dataitem + '=' + calcRScode(dataitem) + "=PL21p" + quorumst);
		}else{
			output = output + "<br><br>" + triple(sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(shares[i].slice(1,length))).replace(/=+/g, ''))
		}
	};
	document.getElementById('mainBox').innerHTML = output;
	smallOutput();
};