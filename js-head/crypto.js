//function that starts it all when the Decrypt button is pushed
function lockUnlock(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 10 ms delay
		Decrypt_Single();
		updateButtons();
	},10);						//end of timeout
};

//Encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
//This function handles short mode encryption only (no List). Otherwise, Encrypt_List() is called
function Encrypt_Single(){
	callKey = 'encrypt';
	var	name = lockMsg.innerHTML,
		clipped = false,
		lockBoxItem = lockBox.innerHTML.replace(/<br>$/,"").trim();		//this will be the encrypting Lock or shared Key (if it's a name, it will be replaced with value)
	if (lockBoxItem == ""){
		mainMsg.innerHTML = 'You must select a stored Lock or shared Key, or click <strong>Edit</strong> and enter one.';
		throw("Lock box empty");
	}

	else if(lockBoxItem.length*entropyPerChar > (mainBox.innerHTML.length+9)*8 && lockBoxItem.length > 43){		//special mode for long keys, first cut
		padEncrypt();
		return
	}

	var listArray = lockBoxItem.replace(/<div>/g,'<br>').replace(/<\/div>/g,'').split('<br>');		//see if this is actually several Locks rather than one
	
	if(longMode.checked){							//Encrypt_Single() handles only short and compatible modes, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray);
		return
	}
	if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainMsg.innerHTML = '<span style="color:orange">Short and Compatible modes not available for multiple recipients</span>';
		throw('multiple Locks for short mode')
	}
	var lockBoxNoVideo = listArray[0].trim(),					//strip video URL, if any
		lockBoxHold = lockBoxNoVideo,								//to hold it in case it is a name
		Lock = replaceByItem(lockBoxNoVideo);					//if it's the name of a stored item, use the decrypted item instead, if not and it isn't a Lock, there will be a warning. This function removes tags and non-base64 chars from true Locks only
	if(locDir[lockBoxNoVideo]) name = lockBoxNoVideo;
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase().replace(/l/g,'L'), base36, base64, true) 		//ezLok replaced by regular Lock
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim();
	if(shortMode.checked)	text = encodeURI(text).replace(/%20/g,' ');		//now we do the different encryption modes

	if(Lock.length != 43 && !onceMode.checked){				//shared Key-locked mode, if no true Lock is entered
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("sym encryption canceled");
		};
		var sharedKey = wiseHash(Lock,noncestr);		//use the nonce for stretching the user-supplied Key
		if(shortMode.checked){
			if (text.length > 94) clipped = true;  			//94-char capacity
			text = text.slice(0,94);
			while (text.length < 94) text = text + ' ';
		}
		var cipherstr = PLencrypt(text,nonce24,sharedKey,compatMode.checked);				//will compress if not a short message
		if (learnMode.checked){
			alert(name + " will need to place the same Key in the Locks box to decrypt the message in the main box.");
		};
		mainBox.innerText = "@" + noncestr + cipherstr;
		if(compatMode.checked) mainBox.innerText = 'PL23msg==' + mainBox.innerText + '==PL23msg'
	}

	else if (signedMode.checked){					//signed mode, make encryption key from secret Key and recipient's Lock
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("signed encryption canceled");
		};
		refreshKey();
		if(!locDir[name] && locDir[lockBoxHold]) name = lockBoxHold;				//get name from Lock area
		var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
		if(shortMode.checked){
			if (text.length > 94) clipped = true;  						//94-char capacity
			text = text.slice(0,94);
			while (text.length < 94) text = text + ' ';
		}
		var cipherstr = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if (learnMode.checked){
			alert(lockMsg + " will need your Lock and his/her secret Key to decrypt the message in the main box.");
		};
		mainBox.innerText = "?" + noncestr + cipherstr;
		if(compatMode.checked) mainBox.innerText = 'PL23mss==' + myezLock + mainBox.innerHTML + '==PL23mss'
	}

	else if (anonMode.checked){								//anonymous mode, using only the recipient's Lock
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted with the Lock in the Locks box and the result will be placed in the main box. This is irreversible. Cancel if this is not what you want.");
			if(!reply) throw("public encryption canceled");
		};
		if(name == '') name = "the recipient";
		var secdum = nacl.randomBytes(32),							//make dummy Key
			pubdumstr = makePubStr(secdum),							//matching dummy Lock
			sharedKey = makeShared(convertPubStr(Lock),secdum);
		if(shortMode.checked){
			if (text.length > 62) clipped = true;  			//62-char capacity because of the dummy Lock
			text = text.slice(0,62);
			while (text.length < 62) text = text + ' ';
		}
		var cipherstr = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if (learnMode.checked){
			alert(name + " will need to place his/her secret Key in the key box to decrypt the message in the main box.");
		}
		mainBox.innerText = '!' + noncestr + pubdumstr + cipherstr;
		if(compatMode.checked) mainBox.innerText = 'PL23msa==' + myezLock + mainBox.innerHTML + '==PL23msa'
	}

	else if (onceMode.checked){									//Read-once mode
		if(name == 'myself'){
			mainMsg.innerText = 'You cannot encrypt for yourself in Read-once mode';
		return
		}
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted so it can only be read once, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("Read-once encryption canceled");
		};
		if(locDir[name] == null){
			mainMsg.innerText = "In Read-once mode the recipient's Lock must be stored";
			throw('name not on locDir')
		}
		refreshKey();

		var lastKeyCipher = locDir[name][1],
			lastLockCipher = locDir[name][2],
			turnstring = locDir[name][3],
			secdum = nacl.randomBytes(32);

		if (lastKeyCipher){
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
		} else {													//use new dummy Key if stored dummy doesn't exist, warn user
			var lastKey = secdum;
			var pfsMessage = true;
		}

		if (lastLockCipher) {										//if dummy exists, decrypt it first
			var lastLock = keyDecrypt(lastLockCipher);
		} else {													//use permanent Lock if dummy doesn't exist
			if (Lock.length == 43){
				var lastLock = convertPubStr(Lock)					//Lock is actually a signing public key; must be converted
			}else{
				var lastLock = makePubStr(wiseHash(Lock,noncestr))		//if actually a shared Key, make the Lock deriving from it
			}
			var resetMessage = true;
		}
		var sharedKey = makeShared(lastLock,lastKey);

		if (turnstring != 'lock'){								//if out of turn don't change the dummy Key, this includes reset
			if(turnstring == 'reset'){var resetMessage = true }else{ var pfsMessage = true};
			if(lastLockCipher){
				if(Lock.length == 43){
					var newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,makeShared(lastLock,KeyDH));
				}else{
					var newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,makeShared(lastLock,wiseHash(Lock,noncestr)));
				}
			}else{
				var	dualKey = getDualKey(Lock,noncestr),
					newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,dualKey);
			}

		}else{														//normal Read-once algorithm
			var pubdumstr = makePubStr(secdum);
			if(lastLockCipher){
				if(lastKeyCipher){
					var newLockCipher = PLencrypt(pubdumstr,nonce24,sharedKey);
				}else{
					if(Lock.length == 43){
						var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,KeyDH));
					}else{
						var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,wiseHash(Lock,noncestr)));
					}
				}
			}else{
				var dualKey = getDualKey(Lock,noncestr),
					newLockCipher = PLencrypt(pubdumstr,nonce24,dualKey);
			}
		}

		if(turnstring == 'lock' || !lastKeyCipher){
			locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(secdum));			//new Key is stored in the permanent database, except if repeat
		}
		if(turnstring != 'reset') locDir[name][3] = 'unlock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){									//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

		if(shortMode.checked){
			if (text.length > 35) clipped = true;  			//35-char capacity
			text = text.slice(0,35);
			while (text.length < 35) text = text + ' ';
		}
		var cipherstr = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if (learnMode.checked){
			alert(name + " will need to select you in his/her directory to decrypt the message.");
		};
		if(resetMessage){
			mainBox.innerText = ":" + noncestr + newLockCipher + cipherstr;
		}else if(pfsMessage){
			mainBox.innerText = "*" + noncestr + newLockCipher + cipherstr;
		}else{
			mainBox.innerText = "$" + noncestr + newLockCipher + cipherstr;
		}
		if(compatMode.checked) mainBox.innerText = 'PL23mso==' + myezLock + mainBox.innerHTML + '==PL23mso'			//prepend ezLock in compatibility mode
	}

	mainMsg.innerText = 'Encryption successful';
	if (clipped) mainMsg.innerHTML = "<span style='color:orange'>The message has been truncated</span>";
	if (pfsMessage) mainMsg.innerText = "This message will become un-decryptable when it is replied to";
	if (resetMessage) mainMsg.innerText = "This message has no forward secrecy. The recipient will be advised to delete it after reading it";

	decoyText.value = "";
	decoyPwdIn.value = "";
	decoyPwdOut.value = "";
	callKey = '';
};

//makes the permanent shared Key. Used by PFS and Read-once modes
function getDualKey(Lock,noncestr){
	if (Lock.length == 43){
		return makeShared(convertPubStr(Lock),KeyDH);
	}else{
		return wiseHash(Lock,noncestr);					//"Lock" is actually a permanent shared Key, unstripped
	}
}

//encrypts for a list of recipients. First makes a 256-bit message key, then gets the Lock or shared Key for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's item, so he/she can find the right encrypted key
function Encrypt_List(listArray){
	if(shortMode.checked){
		mainMsg.innerHTML = '<span style="color:orange">Short mode not available for multiple recipients</span>';
		throw('short mode not available')
	}
	var lengthLimit = 71000;
	if(emailMode.checked && mainBox.innerHTML.length > lengthLimit){
		var agree = confirm("This item is too long to be transmited in an email body and likely will be clipped by the server, rendering it undecryptable. We suggest to cancel and encrypt to file instead, then attach the file to your email");
		if(!agree) throw('text is too long for encrypting to email')
	}
	var warningList = "",
		warningList2 = "";
	for (var index = 0; index < listArray.length; index++){		//scan lines and pop a warning if some are not names on DB or aren't Locks
		var name = listArray[index].trim();
		if (name.slice(0,4) == 'http') {
			listArray[index] = '';
			name = ''
		}
		if (name != ''){
			if(locDir[name] == null) {					//not on database; see if it's a Lock, and otherwise add to warning list
				var namestr = stripTags(name);
				if(namestr.length != 43 && namestr.length != 50){
					if (warningList == ""){warningList = name} else {warningList += '\n' + name}
				}
			}else if(stripTags(locDir[name][0]).length != 43 && stripTags(locDir[name][0]).length != 50 && emailMode.checked && name != 'myself'){	//email mode: shared Keys not allowed
				if (warningList2 == ""){warningList2 = name} else {warningList2 += '\n' + name};
				listArray[index] = ''
			}
		}
	}
	listArray = listArray.filter(Boolean);																						//remove empty elements
	if(emailMode.checked && signedMode.checked && listArray.indexOf('myself') == -1) listArray.push('myself');				//add 'myself' in email mode
	listArray = shuffle(listArray);																								//extra precaution
	
	if ((warningList != '') && (listArray.length > 1)){
		var agree = confirm('The names on the list below were not found in your local directory. If you click OK, they will be used as shared Keys for encrypting and decrypting the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	if (warningList2 != ''){
		var agree = confirm('The names on the list below are for shared Keys, not Locks, and are not allowed for encryption in Email mode. If you click OK, they will be ignored:\n\n' + warningList2);
		if (!agree) throw('list encryption terminated by user');		
	}
	if(listArray.length == 0){
		mainMsg.innerText = 'No valid recipients for this mode';
		throw('no valid recipients left');
	}
	
	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim(),
		isChatInvite = text.length == 107 && !text.slice(-43).match(' ');			//detect chat invitation, for final display
	if (anonMode.checked) {
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be anonymously encrypted with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list encryption canceled");
		}
		var outString = "!"
	} else if(onceMode.checked){
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted in Read-once mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. It will not encrypt for yourself. Cancel if this is not what you want.");
			if(!reply) throw("Read-once list encryption canceled");
		}
		var outString = "$";
		if(emailMode.checked) outString = myezLock + outString;
	} else {
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("signed list encryption canceled");
		}
		var outString = "?";
		if(emailMode.checked) outString = myezLock + outString;
	}

	if (anonMode.checked) {											//for anonymous mode, make dummy Lock. Make padding in all modes
		var secdum = nacl.randomBytes(32),
			secdumstr = nacl.util.encodeBase64(secdum),
			pubdumstr = makePubStr(secdum),
			padding = decoyEncrypt(59,nonce24,secdum);
	} else {
		refreshKey();
		var padding = decoyEncrypt(59,nonce24,KeyDH);
	}

	var cipher = PLencrypt(text,nonce24,msgKey,true);				//main encryption event including compression, but don't add the result yet
	outString += noncestr + padding;
	if (anonMode.checked) outString += pubdumstr;					//for anonymous mode, add the dummy Lock to the output string

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (var index = 0; index < listArray.length; index++){
		var name = listArray[index].trim();
		if (name != ''){
			var Lock = replaceByItem(name);							//returns item if the name is on directory. Locks are stripped
			if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase().replace(/l/g,'L'), base36, base64, true) 		//get Lock from ezLok
			if (Lock.length == 43  || onceMode.checked){				//if it's a Lock, do anonymous, Read-once or signed encryption, and add the result to the output. Same if, not being a Lock, Read-Once mode is selected. Shared Key case at the end of all this

				if (signedMode.checked){
					refreshKey();
					var sharedKey = makeShared(convertPubStr(Lock),KeyDH),
						cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,sharedKey);

				} else if (anonMode.checked){
					var sharedKey = makeShared(convertPubStr(Lock),secdum),
						cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,sharedKey);

				} else if (onceMode.checked){
					if(locDir[name] == null){
						if(locDir[lockMsg.innerHTML] != null && listArray.length == 1){
							name = lockMsg.innerHTML
						} else {
							mainMsg.innerText = "In Read-once mode, recipients' Locks must be stored";
							throw('name not on locDir')
						}
					}
					refreshKey();

				  if(name != 'myself'){								//can't do Read-once to myself
				  	var lastKeyCipher = locDir[name][1],
						lastLockCipher = locDir[name][2],				//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
						turnstring = locDir[name][3],
						secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						typeChar = '';
	
					if(turnstring == 'reset'){
						typeChar = 'r';
						var resetMessage = true
					}else if(turnstring == 'unlock'){
						typeChar = 'p';
						var pfsMessage = true
					}else{
						typeChar = 'o'
					}

					if (lastKeyCipher){
						var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
					} else {													//use new dummy Key if stored dummy doesn't exist
						var lastKey = secdum;
						if(!resetMessage){
							typeChar = 'p';
							var pfsMessage = true
						}
					}

					if(!turnstring){									//so that an initial message is seen the same as a reset mesage
						typeChar = 'r';
						var resetMessage = true
					}
					
					if (lastLockCipher) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher)
					} else {													//use permanent Lock if dummy doesn't exist
						if (Lock.length == 43){
							var lastLock = convertPubStr(Lock)
						}else{
							var lastLock = makePubStr(wiseHash(Lock,noncestr))	//if actually a shared Key, make the Lock deriving from it
						}
					}

					if(lastLockCipher){
						if(Lock.length == 43){
							var idKey = makeShared(lastLock,KeyDH);
						}else{
							var idKey = makeShared(lastLock,wiseHash(Lock,noncestr));
						}
					}else{
						var idKey = getDualKey(Lock,noncestr);
					}

					var sharedKey = makeShared(lastLock,lastKey);

					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,idKey);

					if(turnstring != 'lock'){															//if out of turn don't change the dummy Key, this includes reset
						var newLockCipher = PLencrypt(makePubStr(lastKey),nonce24,idKey);
					}else{
						var	newLockCipher = PLencrypt(makePubStr(secdum),nonce24,idKey);
					}
					
					if(turnstring == 'lock' || !lastKeyCipher){
						locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database, unless repeat or empty
					}
					if(turnstring != 'reset') locDir[name][3] = 'unlock';

					if(ChromeSyncOn && chromeSyncMode.checked){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
				  }else{
					if(listArray.length < 2){
						mainMsg.innerText = 'In Read-once mode, you must select recipients other than yourself.';
						throw('only myself for Read-once')
					}
				  }
				}

			} else {											//if it's not a Lock (and not PFS or Read-Once), do a symmetric encryption instead, with appropriate key stretching. ID tag based on the shared Key encrypted by itself (stretched)
				var sharedKey = wiseHash(Lock,noncestr),
					cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
					idTag = PLencrypt(Lock,nonce24,sharedKey);
			}

			//now add the idTag and encrypted strings to the output string, and go to the next recipient
			if (onceMode.checked){				//these include encrypted ephemeral Locks, not the other types
				if(name != 'myself') outString += '-' + idTag.slice(0,9) + '-' + newLockCipher + cipher2 + typeChar;
			} else {
				outString += '-' + idTag.slice(0,9) + '-' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString += '-' + cipher;
	var	rowsReg = new RegExp('.{1,' + Math.floor(mainBox.clientWidth / 8) + '}','g');
	if(anonMode.checked){
		if(fileMode.checked){
			mainBox.innerHTML = '<a download="PL23msa.txt" href="data:,==' + outString + '=="><b>PassLok 2.3 Anonymous message</b></a>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL23msa==" + outString + "==PL23msa").match(rowsReg).join("<br>") + "</pre>"
		}
	}else if(onceMode.checked){
		if(fileMode.checked){
			mainBox.innerHTML = '<a download="PL23mso.txt" href="data:,==' + outString + '=="><b>PassLok 2.3 Read-once message</b></a>'
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Read-once message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Read-once message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL23mso==" + outString + "==PL23mso").match(rowsReg).join("<br>") + "</pre>"
		}
	}else{
		if(fileMode.checked){
			mainBox.innerHTML = '<a download="PL23mss.txt" href="data:,==' + outString + '=="><b>PassLok 2.3 Signed message</b></a>'
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Signed message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Signed message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL23mss==" + outString + "==PL23mss").match(rowsReg).join("<br>") + "</pre>"
		}
	}
	if(isChatInvite){
		if(fileMode.checked){
			mainBox.innerHTML = '<a download="PL23chat.txt" href="data:,==' + outString + '=="><b>PassLok 2.3 Chat invitation</b></a>'
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Chat invitation encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Chat invitation encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerText = "PL23chat==" + outString + "==PL23chat"
		}
	}

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	mainMsg.innerText = 'Encryption successful. Select and copy.'
	if (pfsMessage) mainMsg.innerText = "Delayed forward secrecy for at least one recipient";
	if (resetMessage) mainMsg.innerText = "No forward secrecy for at least one recipient, who will be warned of the fact";
	callKey = '';
}

//just to shuffle the array containing the recipients' Locks
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
	return a
}

//encrypts a string with the secret Key, 12 char nonce, padding so length for ASCII input is the same no matter what
function keyEncrypt(plainstr){
	refreshKey();																		//make sure the Key is still alive
	plainstr = encodeURI(plainstr).replace(/%20/g,' ');
	while (plainstr.length < 43) plainstr = plainstr + ' ';
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce),
		cipherstr = PLencrypt(plainstr,nonce24,KeyDir).replace(/=+$/,'');
	return '~' + noncestr + cipherstr
}

//decrypts a string encrypted with the secret Key, 12 char nonce, removes padding. Returns original if not encrypted
function keyDecrypt(cipherstr){
	refreshKey();																		//make sure the Key is still alive
	if (cipherstr.charAt(0) == '~'){
		refreshKey();
		cipherstr = cipherstr.slice(1);							//take out the initial '~'
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		return decodeURI(PLdecrypt(cipherstr,nonce24,KeyDir,'key').trim())
	}else{
		return cipherstr
	}
}

//encrypts a hidden message into the padding included with list encryption, or makes a random padding also encrypted so it's indistinguishable
function decoyEncrypt(length,nonce24,seckey){
	if (decoyMode.checked){
		if (learnMode.checked){
			var reply = confirm("You are adding a hidden message in Decoy mode. Cancel if this is not what you want, then uncheck Decoy mode in Options.");
			if(!reply) throw("decoy encryption canceled");
		};
		if ((decoyPwdIn.value.trim() == "")||(decoyText.value.trim() == "")){ //stop to display the decoy entry form if there is no hidden message or key
			decoyIn.style.display = "block";				//display decoy form, and back shadow
			shadow.style.display = "block";
			if(!isMobile) decoyText.focus();
			throw ("stopped for decoy input")
		}
		var keystr = decoyPwdIn.value,
			text = encodeURI(decoyText.value.replace(/%20/g, ' '));
			keystr = replaceByItem(keystr);													//if in database, get the real item
		var keyStripped = stripTags(keystr);

		if (keyStripped.length == 43 || keyStripped.length == 50){							//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase(), base36, base64, true) //ezLok replaced by regular Lock
			var sharedKey = makeShared(convertPubStr(keyStripped),seckey);
		}else{
			var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));				//symmetric encryption for true shared key
		}

	} else {																					//no decoy mode, so salt comes from random text and key
		var sharedKey = nacl.randomBytes(32),
			text = nacl.util.encodeBase64(nacl.randomBytes(44)).replace(/=+$/,'');
	};
	while (text.length < length) text = text + ' ';											//add spaces to make the number of characters required
	text = text.slice(0,length);
	var cipher = PLencrypt(text,nonce24,sharedKey);
	decoyPwdIn.value = "";
	decoyText.value = "";
	return cipher;
};

//decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_Single as appropriate
function Decrypt_Single(){
	callKey = 'decrypt';
	keyMsg.innerText = "";
	mainMsg.innerText = "";
	if(lockBox.innerHTML.slice(0,1) == '~') decryptItem();			//if Lock or shared Key is encrypted, decrypt it
	var name = lockMsg.innerHTML,
//got to work on the line below
		cipherstr = mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'').replace(/<span(.*?)>/,'').replace(/<\/span>$/,''),		//fixes for Firefox
		lockBoxLines = lockBox.innerHTML.replace(/<br>$/,"").trim().replace(/<div>/g,"<br>").replace(/<\/div>/g,"").split('<br>'),
		lockBoxItem = lockBoxLines[0];
	if(cipherstr.match('==')) cipherstr = cipherstr.split('==')[1].replace(/<(.*?)>/gi,"");					//remove tags
	if (cipherstr == ""){
			mainMsg.innerText = 'Nothing to encrypt or decrypt';
			throw("main box empty");
	};
	if(cipherstr.charAt(50).match(/[?$@*:]/) && !cipherstr.slice(0,50).match(/[^0123456789abcdefghijkLmnopqrstuvwxyz]/)){	//if it comes from PassLok for Email or SeeOnce
		cipherstr = cipherstr.slice(50);										//remove initial ezLock
		var isCompressed = true;					//will be used to get the right encoding
	}
	
	if(cipherstr.slice(0,2) == '@@' && lockBox.innerHTML.replace(/<br>$/,"").trim().length > 43){padDecrypt();return}		//special encrypting mode for long keys

	//here detect if the message is for multiple recipients, and if so call the appropriate function
	var cipherArray = cipherstr.split('-');
	if(cipherArray.length > 3){
		if (cipherArray[1].length == 9){
			Decrypt_List(cipherArray);		
			openChat();					//will open a chat if that is what it is
			return
		}
	}

	if(cipherstr.charAt(0) == '@' && cipherstr.length != 160) var isCompressed = true;						//detect URSA message

	var strippedLockBox = stripTags(lockBoxItem);								//this holds a Lock or shared Key (or a name leading to it). if there is a video URL, it gets stripped, as well as any non-base64 chars
	var type = cipherstr.slice(0,1),											//get encryption type. !=anonymous, @=symmetric, #=signed, $=Read-once, *= PFS, := reset, ~=Key-encrypted
		cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64

	if(type == '@' || type == '?' || type == '$' || type == '*' || type == ':'){				//only one sender allowed
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.innerHTML = "<span style='color:orange'>Please select a single sender</span>";
				throw("too many lines in Lock box");
			}
		}
	}

	if (type == "~"){																//secret Key-encrypted item, such as a complete locDir database
		if (learnMode.checked){
			var reply = confirm("The message in the main box was encrypted with your secret Key, and will now be decrypted if your secret Key has been entered. If it is a database it will be placed in the Locks screen so you can merge it into the stored database. If it contains settings, they will replace your current setings, including the email/token.  Cancel if this is not what you want.");
			if(!reply) throw("secret Key decryption canceled");
		};
		cipherstr = '~' + cipherstr;													//add back the type indicator
		refreshKey();
		lockBox.innerHTML = keyDecrypt(cipherstr);
		if(lockBox.innerHTML.slice(0,6) == 'myself'){		//string contains settings; add them after confirmation
			var reply = confirm("If you click OK, the settings from the backup will replace the current settings, possibly including a random token. This cannot be undone.");
			if (!reply) throw("settings restore canceled");

			mergeLockDB();
			mainMsg.innerText = 'The settings have been replaced with those in this backup';
			lockBox.innerText = ''
		}else{																		//stored local directory; display so it can be edited
			if(!document.getElementById('advancedMode').checked) mode2adv();
			lockMsg.innerHTML = 'Extracted items. Click <strong>Merge</strong> to add them to the local directory.';
			main2lock();
		}
	}

	else if (type == "@"){							//symmetric decryption
		if (learnMode.checked){
			var reply2 = confirm("The message in the main box was encrypted with a shared Key, and will now be decrypted if the same Key is present in the Locks box. The result will replace the encrypted message. Cancel if this is not what you want.");
			if(!reply2) throw("sym decryption canceled");
		};		
		var noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
			cipherstr = cipherstr.slice(12);		
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:orange">Enter shared Key or select the sender</span>';
			throw("symmetric key empty");
		}
		lockBoxItem = replaceByItem(lockBoxItem);						//if it's a name in the box, get the real item
		var	keystr = lockBoxItem;
		if(keystr.length == 43){
			var sharedKey = nacl.util.decodeBase64(keystr)				//sender's Lock, likely from an invitation email
		}else if(keystr.length == 50){
			var sharedKey = nacl.util.decodeBase64(changeBase(keystr.toLowerCase().replace(/l/g,'L'),base36,base64))		//sender's ezLok, likely from an invitation email
		}else{
			var sharedKey = wiseHash(keystr,noncestr)					//real shared Key
		}
		if(keystr.length == 43 || keystr.length == 50 || isCompressed){	
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'symmetric',true)		
		}else{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'symmetric',false)
		}
		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())					//make sure non-allowed tags and attributes are disabled
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.innerText = 'Decryption successful';
																		//additional text to accompany an invitation
		if(keystr.length == 43 || keystr.length == 50){
			mainBox.innerHTML = "This is my message to you:<blockquote><em>" + mainBox.innerHTML + "</em></blockquote><br>PassLok is now ready to encrypt your reply so that only I can decrypt it.<br><br>To do this, click <strong>Clear</strong>, type your message, select my name in the directory, and then click <strong>Encrypt</strong>. Optionally, you can select a different encryption mode at the bottom of the screen before you click the button. Then you can copy and paste it into your favorite communications program or click <strong>Email</strong> to send it with your default email.<br><br>If this is a computer, you can use rich formatting if you click the <strong>Rich</strong> button.";
		}
	}

	else if (type == "?"){							//signed decryption
		if (learnMode.checked){
			var reply = confirm("The message in the main box was encrypted with your Lock and the sender's Key, and will now be decrypted, replacing the encrypted message, if your secret Key has been entered. Cancel if this is not what you want.");
			if(!reply) throw("signed decryption canceled");
		};
		if (strippedLockBox == ''){
			mainMsg.innerHTML = "<span style='color:orange'>Identify the sender or enter his/her Lock</span>";
			throw("Lock box empty");
		}
		refreshKey();
		if (locDir[name] == null){
			name = lockBoxItem;							//try again using the string in the lockBox as name, not stripped
		}
		strippedLockBox = replaceByItem(lockBoxItem);
		if (strippedLockBox.length == 50) strippedLockBox = changeBase(strippedLockBox.toLowerCase(), base36, base64, true) 		//replace ezLok with standard
		var sharedKey = makeShared(convertPubStr(strippedLockBox),KeyDH),
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'signed',isCompressed);
		if(!plain) failedDecrypt('signed');
		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.innerText = 'Decryption successful';
	}

	else if (type == "!"){					//short anonymous decryption
		if (learnMode.checked){
			var reply = confirm("The short message in the main box was encrypted with your personal Lock, and will now be decrypted if your secret Key has been entered, replacing the encrypted message. Cancel if this is not what you want.");
			if(!reply) throw("public decryption canceled");
		}
		refreshKey();
		var noncestr = cipherstr.slice(0,12),
			pubdumstr = cipherstr.slice(12,55),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			sharedKey = makeShared(pubdumstr,KeyDH);
		cipherstr = cipherstr.slice(55);
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'anon',isCompressed);
		if(!plain) failedDecrypt('anon');
		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.innerText = 'Decryption successful';
	}

	else if(type == "$" || type == "*" || type == ":"){			//Read-once and PFS decryption, may be SeeOnce
		if (learnMode.checked){
			var reply2 = confirm("The message in the main box was encrypted in Read-once mode, and will now be decrypted if the sender has been selected. The result will replace the encrypted message. Cancel if this is not what you want.");
			if(!reply2) throw("Read-once decryption canceled");
		};
		refreshKey();
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:orange">Select the sender</span>';
			throw("Read-once sender empty");
		}
		if(name == 'myself'){
			mainMsg.innerText = 'You cannot make a Read-once message to yourself. It must be from someone else';
			throw('Read-once message to myself')			
		}
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the Lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainMsg.innerText = 'The sender must be in the directory';
			throw('sender not in directory')
		}

		if(type == ':'){											//if a reset message, delete ephemeral data first, after recipient agrees
			var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
			if(!agree) throw('reset decrypt canceled');
			locDir[name][1] = locDir[name][2] = null;
			var isReset = true;
		}

		var Lock = replaceByItem(lockBoxItem);					//if it's a name in the box, get the real item
		if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase().replace(/l/g,'L'), base36, base64, true); 		//replace ezLok with standard
		var	keystr = lockBoxItem,
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			newLockCipher = cipherstr.slice(12,91);
		cipherstr = cipherstr.slice(91);

		var lastKeyCipher = locDir[name][1],												//retrieve dummy Key from storage
			turnstring = locDir[name][3];													//this strings says whose turn it is to encrypt
		if (turnstring=='lock' && type=='$'){
			window.setTimeout(function(){mainMsg.innerHTML = '<span style="color:orange">Read-once messages can be decrypted only once</span>'},2000)
		}

		if (lastKeyCipher) {
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
		} else {																	//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 43){
				var lastKey = KeyDH;
			}else{
				var lastKey = wiseHash(Lock,noncestr);								//shared Key: use directly
			}
		}

		if(type == '*' || type == ':'){												//PFS mode, also reset
			if(lastKeyCipher){
				if(Lock.length == 43){
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(Lock),lastKey),'read-once');
				}else{
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey),'read-once');
				}
			}else{
				var dualKey = getDualKey(Lock,noncestr);
				var newLock = PLdecrypt(newLockCipher,nonce24,dualKey,'read-once');
			}
			var	sharedKey = makeShared(newLock,lastKey);

		}else{																			//proper Read-once mode

			var lastLockCipher = locDir[name][2];										//read-once mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(keyDecrypt(lastLockCipher),lastKey),'read-once');
				}else{
					if(Lock.length == 43){
						var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(Lock),lastKey),'read-once');
					}else{
						var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey),'read-once');
					}
				}
			}else{
				var dualKey = getDualKey(Lock,noncestr);
				var newLock = PLdecrypt(newLockCipher,nonce24,dualKey,'read-once');
			}
			if (lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockCipher)
			} else {																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'read-once',isCompressed);
		if(!plain) failedDecrypt('read-once');
		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}

		locDir[name][2] = keyEncrypt(newLock);										//store the new dummy Lock
		locDir[name][3] = 'lock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){																//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
		setTimeout(function(){																	//give it some time before displaying this
			if(isReset){
				mainMsg.innerText = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'			
			}else if(type == '$'){
				mainMsg.innerText = 'Decryption successful. This message cannot be decrypted again'
			}else if(type == '*'){
				mainMsg.innerText = 'Decryption successful. This message will become un-decryptable after you reply'
			}else{
				mainMsg.innerText = 'Decryption successful'
			}	
		},10);
	}else{
		Encrypt_Single()													//none of the known encrypted types, therefore encrypt rather than decrypt
	};
	callKey = '';
};

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Anonymous, or Read-once. For Signed and Anonymous modes, it is possible that a shared Key has been used rather than a Lock.
function Decrypt_List(cipherArray){
	keyMsg.innerText = "";
	var name = lockMsg.innerHTML,
		type = cipherArray[0].charAt(0);													//type is 1st character	
	for (var i=0; i < cipherArray.length; i++){
		cipherArray[i] = cipherArray[i].replace(/[^a-zA-Z0-9+\/ ]+/g, '')				//take out anything that is not base64
	}
	var noncestr = cipherArray[0].slice(0,20);
	var	nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
	var padding = cipherArray[0].slice(20,120);
	var cipher = cipherArray[cipherArray.length - 1];
	if (type == '!') var pubdumstr = cipherArray[0].slice(120,163);
	var lockBoxItem = lockBox.innerHTML.replace(/<br>$/,"").trim().replace(/<div>/g,'<br>').replace(/<\/div>/g,'').split('<br>')[0],
		Lock = replaceByItem(lockBoxItem);					//if it's a name, replace it with the decrypted item. Locks are stripped of their tags in any case.
	if(!locDir[name] && locDir[lockBoxItem]) name = lockBoxItem;	//name placed in the box

	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase().replace(/l/g,'L'), base36, base64, true) 				//ezLok case
	if(locDir['myself'] == null && fullAccess) key2any();									//make this entry if it has been deleted

	if (decoyMode.checked){																			//decoy decryption of the padding
		if (type == '!'){
			decoyDecrypt(padding,nonce24,pubdumstr)
		}else{
			decoyDecrypt(padding,nonce24,convertPubStr(Lock))
		}
	}

	//now make the idTag to be searched for, depending on the type of encryption
	if(Lock.length == 43 || (Lock == '' && type == '!')){
		var stuffForId = myLock
	}else{
		var stuffForId = Lock
	}
	if (type == '$' && name == 'myself'){
		mainMsg.innerText = 'You cannot make a Read-once message to yourself. It must be from someone else';
		throw('Read-once message to myself')
	}
	if (type == '?'){											//signed mode first
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key, provided the sender's Lock or shared Key are selected on the directory, or entered directly after pressing Edit. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainMsg.innerHTML = "<span style='color:orange'>Enter the sender's Lock or shared Key</span>";
			throw("Lock box empty");
		}
		var lockBoxLines = lockBox.innerHTML.trim().split('<br>').filter(Boolean);
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.innerHTML = "<span style='color:orange'>Please select a single sender</span>";
				throw("too many lines in Lock box");
			}
		}
		refreshKey();
		if (Lock.length == 43){									//assuming this is a Lock, not a shared Key. See below for the other case
			if(!locDir[name] && locDir[lockBoxItem]) name = lockBoxItem;
			var sharedKey = makeShared(convertPubStr(Lock),KeyDH),
				idKey = sharedKey;
		} else {														//this when it's a regular shared Key in common with the sender
			var	sharedKey = wiseHash(Lock,noncestr),						//nonce is used as salt for regular shared Keys
				idKey = sharedKey;
		}

	} else if(type == '!'){										//anonymous mode
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list decryption canceled");
		}
		var LockSplit = Lock.split('\n');
		if(LockSplit.length > 1) var isVideo = (LockSplit[1].slice(0,4) == 'http');
		if (Lock.length == 43 || Lock == '' || isVideo){		//test for Lock, empty, video URL, in order to do anonymous Diffie-Hellman using the dummy Lock
			refreshKey();
			var	sharedKey = makeShared(pubdumstr,KeyDH),
				idKey = sharedKey;
		} else {																//looks like a shared Key in the Lock box: use it as is
			var	sharedKey = wiseHash(Lock,noncestr),
				idKey = sharedKey;
		}

	} else {													//PFS and Read-once modes
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key, provided the sender's Lock or shared Key are selected on the directory, or entered directly after pressing Enter. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainMsg.innerHTML = "<span style='color:orange'>Enter the sender's Lock or shared Key</span>";
			throw("Lock box empty");
		}
		refreshKey();
		if (locDir[name]){
			var	lastKeyCipher = locDir[name][1],
				lastLockCipher = locDir[name][2],
				turnstring = locDir[name][3];										//this strings says whose turn it is to encrypt
			if (turnstring == 'lock'){											//set message in case decryption fails
				window.setTimeout(function(){mainMsg.innerHTML = '<span style="color:orange">Read-once messages can be decrypted only once</span>'},2000)
			}
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
			if(Lock.length == 43){
				var idKey = makeShared(convertPubStr(Lock),lastKey);
			}else{
				var idKey = makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey);
			}
		} else {														//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 43){
				var lastKey = KeyDH;
			}else{
				var lastKey = wiseHash(Lock,noncestr);									//shared Key: use directly
			}
			var idKey = getDualKey(Lock,noncestr);
		}
	}
	var idTag = PLencrypt(stuffForId,nonce24,idKey).slice(0,9);

	//look for the id tag and return the string that follows it
	for (i = 1; i < cipherArray.length; i++){
		if (idTag == cipherArray[i]) {
			var msgKeycipher = cipherArray[i+1];
		}
	}

	if(typeof msgKeycipher == 'undefined'){							//may have been reset, so try again
		if(Lock){
			if (Lock.length == 43){
				lastKey = KeyDH;
			}else{
				lastKey = wiseHash(Lock,noncestr);
			}
			idKey = getDualKey(Lock,noncestr);
			idTag = PLencrypt(stuffForId,nonce24,idKey).slice(0,9);
			for (i = 1; i < cipherArray.length; i++){
				if (idTag == cipherArray[i]) {
					var msgKeycipher = cipherArray[i+1];
				}
			}
		}
		if(typeof msgKeycipher == 'undefined'){						//now really give up
			mainMsg.innerText = 'No message found for you';
			throw('idTag not found')
		}
	}

	//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
	if (type != '$'){					//anonymous and signed modes
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last character
	} else {
		var newLockCipher = msgKeycipher.slice(0,79),
			typeChar = msgKeycipher.slice(-1);
		msgKeycipher = msgKeycipher.slice(79,-1);
		var newLock = PLdecrypt(newLockCipher,nonce24,idKey,'read-once');

		if(typeChar == 'p'){															//PFS mode: last Key and new Lock
			var	sharedKey = makeShared(newLock,lastKey);

		}else if(typeChar == 'r'){														//reset. lastKey is the permanent
			var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
			if(!agree) throw('reset decrypt canceled');
			var	sharedKey = makeShared(newLock,KeyDH);
			locDir[name][1] = locDir[name][2] = null;									//if reset type, delete ephemeral data first

		}else{																			//Read-once mode: last Key and last Lock
			var lastLockCipher = locDir[name][2];
			if (lastLockCipher != null) {												//if stored dummy Lock exists, decrypt it
				var lastLock = keyDecrypt(lastLockCipher)
			} else {																	//use new dummy if no stored dummy
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt('read-once');
		locDir[name][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
		locDir[name][3] = 'lock';

		if(ChromeSyncOn && chromeSyncMode.checked){															//change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}

	//final decryption for the main message, plus decompression
	var plainstr = PLdecrypt(cipher,nonce24,msgKey,'',true);
	mainBox.innerHTML = safeHTML(plainstr);											//non-whitelisted tags and attributes disabled

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);				//everything OK, so store
	if (!decoyMode.checked){
		if(typeChar == 'r'){ 
			mainMsg.innerText = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
		}else if(typeChar == 'o'){
			mainMsg.innerText = 'Decryption successful. This message cannot be decrypted again'
		}else if(typeChar == 'p'){
			mainMsg.innerText = 'Decryption successful. This message will become un-decryptable after you reply'
		}else{
			mainMsg.innerText = 'Decryption successful'
		}
	}
	callKey = '';
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipherstr,nonce24,dummylock){
	if (learnMode.checked){
		var reply = confirm("Decoy mode is selected. If you go ahead, a dialog will ask you for the decoy Password. Cancel if this is not what you want.");
		if(!reply) throw("decoy decrypt canceled");
	}
	if (decoyPwdOut.value.trim() == ""){					//stop to display the decoy key entry form if there is no key entered
		decoyOut.style.display = "block";
		shadow.style.display = "block";
		if(!isMobile) decoyPwdOut.focus();
		throw ("stopped for decoy input")
	}
	var keystr = decoyPwdOut.value;
	keystr = replaceByItem(keystr);													//use stored item, if it exists
	decoyPwdOut.value = "";

	var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24)),				//try symmetric first
		cipher = nacl.util.decodeBase64(cipherstr),
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
	if(!plain){																			//try asymmetric
		var email = readEmail();
		sharedKey = makeShared(dummylock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keystr,email)).secretKey));
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
		if(!plain) failedDecrypt('decoy');											//now give up
	}
	mainMsg.innerHTML = 'Hidden message: <span style="color:blue">' + safeHTML(decodeURI(nacl.util.encodeUTF8(plain))) + '</span>'
};

//function that starts it all when the Seal/Unseal button is pushed
function signVerify(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		verifySignature();
		charsLeft();
	},20);						//end of timeout
};

//adds Schnorr signature to the contents of the main box
function applySignature(){
	callKey = 'sign';
	keyMsg.innerText = "";
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be sealed using your secret Key, so that others can verify its origin. The resulting item WILL NOT BE LOCKED. Cancel if this is not what you want.");
		if(!reply) throw("signature canceled");
	};
	refreshKey();
	var text = mainBox.innerHTML.trim();
	if(text.match('="data:')){
		var encodedText = nacl.util.decodeUTF8(text)
	}else{
		var encodedText = LZString.compressToUint8Array(text)
	}
	text = nacl.util.encodeBase64(nacl.sign(encodedText, KeySgn)).replace(/=+$/,'');
	var	rowsReg = new RegExp('.{1,' + Math.floor(mainBox.clientWidth / 8) + '}','g');
	if(fileMode.checked){
		mainBox.innerHTML = '<a download="PL23sld.txt" href="data:,==-' + text + '=="><b>PassLok 2.3 Sealed message</b></a>'
	}else{
		mainBox.innerHTML = "<pre>" + ('PL23sld==-' + text + '==PL23sld').match(rowsReg).join("<br>") + "</pre>";
	}
	mainMsg.innerHTML = 'The text has been sealed with your secret Key. It is <span class="blink">NOT LOCKED</span>';
	callKey = '';
};

//verifies the Schnorr signature of the plaintext, calls applySignature as appropriate.
function verifySignature(){
	keyMsg.innerText = "";
	var text = mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'');
	if (text == ""){																	//nothing in text box
		mainMsg.innerHTML = '<span style="color:orange">Nothing to sign or verify</span>';
		throw("no text")
	}
	if(lockBox.innerHTML.slice(0,1)=='~') decryptItem();
	if(text.match('==')) text = text.split('==')[1].replace(/<(.*?)>/gi,"");
	if (text.charAt(0) != '-'){															//no seal present, therefore make one
		applySignature();
		return
	}
	if(learnMode.checked){
		var reply = confirm("The item in the main box has been sealed with somebody's secret Key. I will now check the matching Lock, which should be selected on the local directory, and will display the unsealed message inside. Cancel if this is not what you want.");
		if(!reply) throw("seal verification canceled");
	}
	var	Lock = lockBox.innerText.trim();
	if (Lock == ""){
		setTimeout(function(){mainMsg.innerHTML = 'Please select the sealer first, then click <strong>Unseal</strong>';},500);
		return
	}
	var	Lockstripped = stripTags(Lock);
	if (Lockstripped.length != 43 && Lockstripped.length != 50){									//not a Lock, but maybe it's a name
		if (locDir[Lock]){
			var name = Lock;
			Lock = replaceByItem(Lock)
		}
	}else{
		var name = lockMsg.innerHTML;
		Lock = Lockstripped
	}
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase().replace(/l/g,'L'), base36, base64, true) 		//ezLok replaced by regular Lock
	if (Lock.length != 43){
		mainMsg.innerHTML = '<span style="color:orange">Enter a valid Lock</span>';
		throw("invalid public key")
	}											//unsealing of sealed message
	var sealedItem = nacl.util.decodeBase64(text.replace(/[^a-zA-Z0-9+\/ ]+/g,''));
	var result = nacl.sign.open(sealedItem, nacl.util.decodeBase64(Lock));
	if(result){
		if(result.join().match(",61,34,100,97,116,97,58,")){
			mainBox.innerHTML = safeHTML(nacl.util.encodeUTF8(result))
		}else{
			mainBox.innerHTML = safeHTML(LZString.decompressFromUint8Array(result))									//decompress and filter
		}
		mainMsg.innerHTML = '<span style="color:cyan"><strong>Seal ownership is VERIFIED for ' + name + '</strong></span>'
	}else{
		mainMsg.innerHTML = '<span style="color:magenta"><strong>The seal has FAILED to verify for ' + name + '</strong></span>'
	}
};

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8
//function for encrypting with long key
function padEncrypt(){
	var nonce = nacl.randomBytes(15),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim(),
		keyText = lockBox.innerHTML.replace(/<br>$/,"").trim();

	if(text.match('="data:')){
		var textBin = nacl.util.decodeUTF8(text)
	}else{
		var textBin = LZString.compressToUint8Array(text)
	}
	var	keyTextBin = nacl.util.decodeUTF8(keyText),
		keyLengthNeed = Math.ceil((textBin.length + 15) * 8 / entropyPerChar);
	if(keyLengthNeed > keyTextBin.length){
		mainMsg.innerText = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex),
		cipherstr = nacl.util.encodeBase64(cipherBin).replace(/=/g,''),
		macstr = padMac(textBin, keyTextBin, nonce, startIndex),
		rowsReg = new RegExp('.{1,' + Math.floor(mainBox.clientWidth / 8) + '}','g');
	if(fileMode.checked){
		mainBox.innerHTML = '<a download="PL23msp.txt" href="data:,==@@' + noncestr + macstr + cipherstr + '=="><b>PassLok 2.3 Pad encrypted message</b></a>'
	}else{
		mainBox.innerText = "<pre>" + ("PL23msp==@@" + noncestr + macstr + cipherstr + "==PL23msp").match(rowsReg).join("<br>") + "</pre>";
	}
		mainMsg.innerHTML = 'Encryption successful. Click <strong>Email</strong> or copy and send.';
}

//takes binary inputs and returns binary output. Same code for encrypt and decrypt
function padResult(textBin, keyTextBin, nonce, startIndex){
	var keyLength = Math.ceil(textBin.length * 8 / entropyPerChar);
	var keyBin = new Uint8Array(keyLength),
		i;
	if(startIndex + keyLength <= keyTextBin.length){								//fits without wrapping
		for(i = 0; i < keyLength; i++){
			keyBin[i] = keyTextBin[startIndex + i]
		}
	}else{																					//wrapping needed
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
		var hash = nacl.hash(inputArray);			//finally take the hash
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

//makes a 9-byte message authentication code; becomes 12 chars in Base64
function padMac(textBin, keyTextBin, nonce, startIndex){					//startIndex is the one from the prompt
	var textKeyLength = Math.ceil(textBin.length * 8 / entropyPerChar),
		macKeyLength = Math.ceil(9 * 8 / entropyPerChar);
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
	
	//take the SHA512 hash and return the first 12 Base64 characters
	return nacl.util.encodeBase64(nacl.hash(macBin)).slice(0,12)
}

//for decrypting with long key
function padDecrypt(){
	mainMsg.innerText = "";
	var keyText = lockBox.innerHTML.replace(/<br>$/,"").trim(),
		cipherstr = mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'');
	if(cipherstr.match('==')) cipherstr = cipherstr.split('==')[1].replace(/<(.*?)>/gi,"");
	if (cipherstr == ""){
		mainMsg.innerText = 'Nothing to encrypt or decrypt';
		throw("main box empty");
	}
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];				//remove tags
	cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64

	if (keyText == ''){
		mainMsg.innerHTML = '<span style="color:orange">Click <strong>Enter</strong> and enter long shared Key, then try again</span>';
		throw("symmetric key empty");
	}
	var	noncestr = cipherstr.slice(0,20),
		nonce = nacl.util.decodeBase64(noncestr),
		macstr = cipherstr.slice(20,32);
	cipherstr = cipherstr.slice(32);
	try{
		var cipherBin = nacl.util.decodeBase64(cipherstr),
			keyTextBin = nacl.util.decodeUTF8(keyText);
	}catch(err){
		mainMsg.innerText = "This is corrupt or not encrypted"
	}
	if(cipherBin.length > keyTextBin.length){
		mainMsg.innerText = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex);
	var macNew = padMac(plainBin, keyTextBin, nonce, startIndex);
	try{
		if(plainBin.join().match(",61,34,100,97,116,97,58,")){
			var plain = nacl.util.encodeUTF8(plainBin)
		}else{
			var plain = LZString.decompressFromUint8Array(plainBin)
		}
	}catch(err){
		mainMsg.innerText = "Decryption has failed"
	}
	if(plain){
		if(macstr == macNew){										//check authentication
			mainBox.innerHTML = safeHTML(plain);
			mainMsg.innerText = 'Decryption successful';
		}else{
			mainMsg.innerText = 'Message authentication has failed';
		}
		openChat()	
	}else{
		mainMsg.innerText = "Decryption has failed"
	}
}