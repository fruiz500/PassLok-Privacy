//function that starts it all when the Decrypt button is pushed
function lockUnlock(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		Decrypt_Single();
		charsLeft();
	},20);						//end of timeout
};

//Encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
//This function handles short mode encryption only (no List). Otherwise, Encrypt_List() is called
function Encrypt_Single(){
	callKey = 'encrypt';
	var	name = lockMsg.innerHTML,
		clipped = false,
		lockBoxItem = lockBox.value.trim();			//this will be the encrypting Lock or shared Key (if it's a name, it will be replaced with value)
	if (lockBoxItem == ""){
		mainMsg.innerHTML = 'You must select a stored Lock or shared Key, or click <strong>Edit</strong> and enter one.';
		throw("Lock box empty");
	}

	else if(lockBoxItem.length*entropyPerChar > (mainBox.innerHTML.length+9)*8 && lockBoxItem.length > 43){		//special mode for long keys, first cut
		if(entropycalc(lockBoxItem) > (mainBox.innerHTML.length+9)*8){												//more proper entropy test, to detect repetitions in key text
			padEncrypt();
			return
		}
	}
	
	var listArray = lockBoxItem.split('\n');		//see if this is actually several Locks rather than one
	
	if(!shortMode.checked){							//Encrypt_Single() handles only short mode, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray);
		return
	}
	if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainMsg.innerHTML = '<span style="color:orange">Short mode not available for multiple recipients</span>';
		throw('multiple Locks for short mode')
	}
	var lockBoxNoVideo = listArray[0].trim(),						//strip video URL, if any
		lockBoxHold = lockBoxNoVideo,								//to hold it in case it is a name
		Lock = replaceByItem(lockBoxNoVideo,true);			//if it's the name of a stored item, use the decrypted item instead, if not and it isn't a Lock, there will be a warning. This function removes tags and non-base64 chars from true Locks only
	if(locDir[lockBoxNoVideo]) name = lockBoxNoVideo;
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//ezLok replaced by regular Lock
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = encodeURI(mainBox.innerHTML).replace(/%20/g,' ');		//now we do the different encryption modes

	if(Lock.length != 43 && !onceMode.checked){				//shared Key-locked mode, if no true Lock is entered
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("sym encryption canceled");
		};
		var sharedKey = wiseHash(Lock,noncestr);		//use the nonce for stretching the user-supplied Key
		if (text.length > 94) clipped = true;  			//94-char capacity
		text = text.slice(0,94);
		while (text.length < 94) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(name + " will need to place the same Key in the Locks box to decrypt the message in the main box.");
		};
		mainBox.innerHTML = "@" + noncestr + cipherstr;
	}

	else if (signedMode.checked){					//signed mode, make encryption key from secret Key and recipient's Lock
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("signed encryption canceled");
		};
		refreshKey();
		if(!locDir[name] && locDir[lockBoxHold]) name = lockBoxHold;				//get name from Lock area
		var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
		if (text.length > 94) clipped = true;  						//94-char capacity
		text = text.slice(0,94);
		while (text.length < 94) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(lockMsg + " will need your Lock and his/her secret Key to decrypt the message in the main box.");
		};
		mainBox.innerHTML = "#" + noncestr + cipherstr;
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
		if (text.length > 62) clipped = true;  			//62-char capacity because of the dummy Lock
		text = text.slice(0,62);
		while (text.length < 62) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(name + " will need to place his/her secret Key in the key box to decrypt the message in the main box.");
		}
		mainBox.innerHTML = '!' + noncestr + pubdumstr + cipherstr;
	}

	else if (onceMode.checked){									//Read-once mode
		if(name == 'myself'){
			mainMsg.innerHTML = 'You cannot encrypt for yourself in Read-once mode';
		return
		}
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted so it can only be read once, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("Read-once encryption canceled");
		};
		if(locDir[name] == null){
			mainMsg.innerHTML = "In Read-once mode the recipient's Lock must be stored";
			throw('name not on locDir')
		}
		refreshKey();
		var	turnstring = locDir[name][3];
		var lastLockCipher = locDir[name][2];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
		if (lastLockCipher) {										//if dummy exists, decrypt it first
			var lastLock = keyDecrypt(lastLockCipher);
		} else {													//use permanent Lock if dummy doesn't exist
			if (Lock.length == 43){
				var lastLock = convertPubStr(Lock)					//Lock is actually a signing public key; must be converted
			}else{
				var lastLock = makePubStr(wiseHash(Lock,noncestr))		//if actually a shared Key, make the Lock deriving from it
			}
			var firstMessage = true;								//to warn user
		}
		var secdum = nacl.randomBytes(32),
			pubdumstr = makePubStr(secdum);

		if (turnstring != 'lock'){								//use PFS mode if out of turn, with new dummy Key and stored Lock, warn user
			if(turnstring == 'reset'){var resetMessage = true }else{ var pfsMessage = true};
			var sharedKey = makeShared(lastLock,secdum);ƒ
			if(lastLockCipher){
				if(Lock.length == 43){
					var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,KeyDH));
				}else{
					var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,wiseHash(Lock,noncestr)));
				}
			}else{												//1st message in the series is not forward-secret
				var dualKey = getDualKey(Lock,noncestr);
				var	newLockCipher = PLencrypt(pubdumstr,nonce24,dualKey);
			}

		}else{
			var lastKeyCipher = locDir[name][1];						//proper Read-once mode uses previous Key and previous Lock
			if (lastKeyCipher){
				var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
			} else {													//use new dummy Key if stored dummy doesn't exist, warn user
				var lastKey = secdum;
				var pfsMessage = true;
			}
			var sharedKey = makeShared(lastLock,lastKey);
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
				var dualKey = getDualKey(Lock,noncestr);
				var	newLockCipher = PLencrypt(pubdumstr,nonce24,dualKey);
			}
		}
		locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
		if(turnstring != 'reset') locDir[name][3] = 'unlock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){									//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

		if (text.length > 35) clipped = true;  			//35-char capacity
		text = text.slice(0,35);
		while (text.length < 35) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(name + " will need to select you in his/her directory to decrypt the message.");
		};
		if(pfsMessage){
			mainBox.innerHTML = "*" + noncestr + newLockCipher + cipherstr;
		}else if(resetMessage){
			mainBox.innerHTML = "**" + noncestr + newLockCipher + cipherstr;
		}else{
			mainBox.innerHTML = "$" + noncestr + newLockCipher + cipherstr;
		}
	}

	mainMsg.innerHTML = 'Encryption successful';
	if (clipped) mainMsg.innerHTML = "<span style='color:orange'>The message has been truncated</span>";
	if (pfsMessage) mainMsg.innerHTML = "This message will become un-decryptable when it is replied to";
	if (firstMessage || resetMessage) mainMsg.innerHTML = "This message has no forward secrecy";

	if(!isMobile) selectMain();
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
				var namestr = striptags(name);
				if(namestr.length != 43 && namestr.length != 50){
					if (warningList == ""){warningList = name} else {warningList += '\n' + name}
				}
			}else if(locDir[name][0].length != 43 && locDir[name][0].length != 50 && emailMode.checked && name != 'myself'){	//email mode: shared Keys not allowed
					if (warningList2 == ""){warningList2 = name} else {warningList2 += '\n' + name};
					listArray[index] = ''
			}
		}
	}
	listArray = listArray.filter(Boolean);									//remove empty elements
	
	if ((warningList != '') && (listArray.length > 1)){
		var agree = confirm('The names on the list below were not found in your local directory. If you click OK, they will be used as shared Keys for encrypting and decrypting the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	if (warningList2 != ''){
		var agree = confirm('The names on the list below are for shared Keys, not Locks, and are not allowed for encryption in Email mode. If you click OK, they will be ignored:\n\n' + warningList2);
		if (!agree) throw('list encryption terminated by user');		
	}
	if(listArray.length == 0){
		mainMsg.innerHTML = 'No valid recipients for this mode';
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
		if(emailMode.checked) outString = myezLock.replace(/l/g,'L') + outString;
	} else {
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("signed list encryption canceled");
		}
		var outString = "#";
		if(emailMode.checked) outString = myezLock.replace(/l/g,'L') + outString;
	}

	if (anonMode.checked) {											//for anonymous mode, make dummy Lock. Make padding in all modes
		var secdum = nacl.randomBytes(32),
			secdumstr = nacl.util.encodeBase64(secdum),
			pubdumstr = makePubStr(secdum);
		var padding = decoyEncrypt(59,nonce24,secdum);
	} else {
		refreshKey();
		var padding = decoyEncrypt(59,nonce24,KeyDH);
	}
	if(!text.toLowerCase().match('data:;')) text = LZString.compressToBase64(text).replace(/=/g,'');								//compress unless it's a file, which would grow on compression
//	if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text).replace(/=/g,'');								//compress unless it's a file, which would grow on compression
	var cipher = PLencrypt(text,nonce24,msgKey);				//main encryption event, but don't add it yet
	outString = outString + noncestr + padding;
	if (anonMode.checked) outString = outString + pubdumstr;				//for anonymous mode, add the dummy Lock to the output string

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (var index = 0; index < listArray.length; index++){
		var name = listArray[index].trim();
		if (name != ''){
			var Lock = replaceByItem(name,false);				//returns item if the name is on directory. Locks are stripped
			if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//get Lock from ezLok
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
							mainMsg.innerHTML = "In Read-once mode, recipients' Locks must be stored";
							throw('name not on locDir')
						}
					}
					refreshKey();
					var	turnstring = locDir[name][3];

				  if(name != 'myself'){								//can't do Read-once to myself
					var lastLockCipher = locDir[name][2];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
					if (lastLockCipher) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher)
					} else {													//use permanent Lock if dummy doesn't exist
						if (Lock.length == 43){
							var lastLock = convertPubStr(Lock)
						}else{
							var lastLock = makePubStr(wiseHash(Lock,noncestr))	//if actually a shared Key, make the Lock deriving from it
						}
						var firstMessage = true;						//to warn user
					}
					var secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						pubdumstr = makePubStr(secdum);

					if(lastLockCipher){
						if(Lock.length == 43){
							var idKey = makeShared(lastLock,KeyDH);
						}else{
							var idKey = makeShared(lastLock,wiseHash(Lock,noncestr));
						}
					}else{
						var idKey = getDualKey(Lock,noncestr);
					}

					if (turnstring!='lock'){								//out of sequence, use PFS mode
						if(turnstring == 'reset'){
							var typeChar = 'r';
							var resetMessage = true
						}else{
							var typeChar = 'p';
							var pfsMessage = true
						};
						var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock

					}else{													//in sequence, proper Read-once mode
						var typeChar = 'o';
						var lastKeyCipher = locDir[name][1];						//Read-once mode uses previous Key and previous Lock
						if (lastKeyCipher){
							var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
						} else {													//use new dummy Key if stored dummy doesn't exist
							var lastKey = secdum;
							typeChar = 'p';
							var pfsMessage = true
						}
						var sharedKey = makeShared(lastLock,lastKey);
					}

					locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
					if(turnstring != 'reset') locDir[name][3] = 'unlock';

					if(ChromeSyncOn && chromeSyncMode.checked){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,idKey),
						newLockCipher = PLencrypt(pubdumstr,nonce24,idKey);

				  }else{
					if(listArray.length < 2){
						mainMsg.innerHTML = 'In Read-once mode, you must select recipients other than yourself.';
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
				if(name != 'myself') outString = outString + '%' + idTag.slice(0,9) + '%' + newLockCipher + cipher2 + typeChar;
			} else {
				outString = outString + '%' + idTag.slice(0,9) + '%' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString = outString + '%' + cipher;
	if(anonMode.checked){
		mainBox.innerHTML = "PL23msa==" + outString + "==PL23msa"
	} else if(onceMode.checked){
		if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Read-once message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Read-once message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "PL23mso==" + outString + "==PL23mso"
		}
	} else {
		if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Signed message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Signed message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "PL23mss==" + outString + "==PL23mss"
		}
	}
	if(isChatInvite){
		if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Chat invitation encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Chat invitation encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "PL23chat==" + outString + "==PL23chat"
		}
	}

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	if(!isMobile) selectMain();
	mainMsg.innerHTML = 'Encryption successful. Select and copy.';
	if (pfsMessage) mainMsg.innerHTML = "Delayed forward secrecy for at least one recipient";
	if (firstMessage || resetMessage) mainMsg.innerHTML = "No forward secrecy for at least one recipient";
	callKey = '';
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
			keystr = replaceByItem(keystr,false);													//if in database, get the real item
		var keyStripped = striptags(keystr);

		if (keyStripped.length == 43 || keyStripped.length == 50){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase(), BASE36, BASE64, true) //ezLok replaced by regular Lock
			var sharedKey = makeShared(convertPubStr(keyStripped),seckey);
		}else{
			var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));			//symmetric encryption for true shared key
		}

	} else {																		//no decoy mode, so salt comes from random text and key
		var sharedKey = nacl.randomBytes(32),
			text = nacl.util.encodeBase64(nacl.randomBytes(44)).replace(/=+$/,'');
	};
	while (text.length < length) text = text + ' ';				//add spaces to make the number of characters required
	text = text.slice(0,length);
	var cipher = PLencrypt(text,nonce24,sharedKey);
	decoyPwdIn.value = "";
	decoyText.value = "";
	return cipher;
};

//decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_Single as appropriate
function Decrypt_Single(){
	callKey = 'decrypt';
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	if(lockBox.value.slice(0,1) == '~') decryptItem();			//if Lock or shared Key is encrypted, decrypt it
	var name = lockMsg.innerHTML,
		cipherstr = XSSfilter(mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'')),	//remove HTML tags that might have been introduced and extra spaces
		lockBoxLines = lockBox.value.trim().split('\n'),
		lockBoxItem = lockBoxLines[0];
	if (cipherstr == ""){
			mainMsg.innerHTML = 'Nothing to encrypt or decrypt';
			throw("main box empty");
	};
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];				//remove tags
	if(cipherstr.charAt(50).match(/[#$@]/)){										//if it comes from PassLok for Email
		cipherstr = cipherstr.slice(50);										//remove initial ezLock
	}
	
	if(cipherstr.slice(0,2) == '@@' && lockBox.value.length > 43){padDecrypt();return}					//special encrypting mode for long keys

	//here detect if the message is for multiple recipients, and if so call the appropriate function
	var cipherArray = cipherstr.split('%');
	if(cipherArray.length > 3){
		if (cipherArray[1].length == 9){
			Decrypt_List(cipherArray);		
			openChat();					//will open a chat if that is what it is
			return
		}
	}

	var strippedLockBox = striptags(lockBoxItem);								//this holds a Lock or shared Key (or a name leading to it). if there is a video URL, it gets stripped, as well as any non-base64 chars
	var type = cipherstr.slice(0,1),											//get encryption type. !=anonymous, @=symmetric, #=signed, $=Read-once, *= PFS, ~=Key-encrypted
		type2 = cipherstr.slice(1,2),											//used by reset messages, should be '*' if reset
		cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64

	if(type == '@' || type == '#' || type == '$' || type == '*'){				//only one sender allowed
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.innerHTML = "<span style='color:orange'>Please select a single sender</span>";
				throw("too many lines in Lock box");
			}
		}
	}

	if (type == "~"){																//secret Key encrypted item, such as a complete locDir database
		if (learnMode.checked){
			var reply = confirm("The message in the main box was encrypted with your secret Key, and will now be decrypted if your secret Key has been entered. If it is a database it will be placed in the Locks screen so you can merge it into the stored database. If it contains settings, they will replace your current setings, including the email/token.  Cancel if this is not what you want.");
			if(!reply) throw("secret Key decryption canceled");
		};
		cipherstr = '~' + cipherstr;													//add back the type indicator
		refreshKey();
		lockBox.value = keyDecrypt(cipherstr);
		if(lockBox.value.slice(0,6) == 'myself'){		//string contains settings; add them after confirmation
			var reply = confirm("If you click OK, the settings from the backup will replace the current settings, possibly including a random token. This cannot be undone.");
			if (!reply) throw("settings restore canceled");

			mergeLockDB();
			mainMsg.innerHTML = 'The settings have been replaced with those in this backup';
			lockBox.value = ''
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
		
		if(cipherstr.length == 159){						//real short messages
			var noncestr = cipherstr.slice(0,12);
			cipherstr = cipherstr.slice(12);
		}else{												//invitations
			var noncestr = cipherstr.slice(0,20);
			cipherstr = cipherstr.slice(20);				//the '%' character was filtered out earlier
		}
		
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:orange">Enter shared Key or select the sender</span>';
			throw("symmetric key empty");
		}
		lockBoxItem = replaceByItem(lockBoxItem,false);					//if it's a name in the box, get the real item
		var	keystr = lockBoxItem,
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		if(keystr.length == 43){
			var sharedKey = nacl.util.decodeBase64(keystr)				//sender's Lock, likely from an invitation email
		}else if(keystr.length == 50){
			var sharedKey = nacl.util.decodeBase64(changeBase(keystr,BASE36,BASE64))		//sender's ezLok, likely from an invitation email
		}else{
			var sharedKey = wiseHash(keystr,noncestr)					//real shared Key
		}
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'symmetric');
		if(!plain) failedDecrypt('symmetric');
		if(!plain.toLowerCase().match('data:;') && (keystr.length == 43 || keystr.length == 50)){
			mainBox.innerHTML = LZString.decompressFromBase64(plain)
		}else{
			mainBox.innerHTML = decodeURI(plain).trim()
		}
		mainMsg.innerHTML = 'Decryption successful';
																		//additional text to accompany an invitation
		if(keystr.length == 43 || keystr.length == 50){
			mainBox.innerHTML = "This is my message to you:<blockquote><em>" + mainBox.innerHTML + "</em></blockquote><br>PassLok is now ready to encrypt your reply so that only I can decrypt it.<br><br>To do this, click <strong>Clear</strong>, type your message, select my name in the directory, and then click <strong>Encrypt</strong>. Optionally, you can select a different encryption mode at the bottom of the screen before you click the button. Then you can copy and paste it into your favorite communications program or click <strong>Email</strong> to send it with your default email.<br><br>If this is a computer, you can use rich formatting if you click the <strong>Rich</strong> button.";
		}
	}

	else if (type == "#"){							//signed decryption
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
		strippedLockBox = replaceByItem(lockBoxItem,false);
		if (strippedLockBox.length == 50) strippedLockBox = changeBase(strippedLockBox.toLowerCase(), BASE36, BASE64, true) 		//replace ezLok with standard
		var sharedKey = makeShared(convertPubStr(strippedLockBox),KeyDH),
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'signed');
		if(!plain) failedDecrypt('signed');
		mainBox.innerHTML = decodeURI(plain).trim();
		mainMsg.innerHTML = 'Decryption successful';
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
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'anon');
		if(!plain) failedDecrypt('anon');
		mainBox.innerHTML = decodeURI(plain).trim();
		mainMsg.innerHTML = 'Decryption successful';
	}

	else if(type == "$"|| type == "*"){			//PFS and Read-once decryption
		if (learnMode.checked){
			var reply2 = confirm("The message in the main box was encrypted in Read-once mode, and will now be decrypted if the sender has been selected. The result will replace the encrypted message. Cancel if this is not what you want.");
			if(!reply2) throw("Read-once decryption canceled");
		};
		refreshKey();
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:orange">Select the sender</span>';
			throw("Read-once sender empty");
		}
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the Lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainMsg.innerHTML = 'The sender must be in the directory';
			throw('sender not in directory')
		}

		if(type2 == '*'){											//if reset message, delete ephemeral data first
			locDir[name][1] = locDir[name][2] = null
		}

		var Lock = replaceByItem(lockBoxItem,false);					//if it's a name in the box, get the real item
		if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true); 		//replace ezLok with standard
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

		if(type == '*'){												//PFS mode, also reset
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
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey,'read-once');
		if(!plain) failedDecrypt('read-once');
		mainBox.innerHTML = decodeURI(plain).trim();

		if(type == '$'){
			mainMsg.innerHTML = 'Decryption successful. This message cannot be decrypted again'
		}else if(type == '*'){
			mainMsg.innerHTML = 'Decryption successful. It will become un-decryptable after you reply'
		}else{
			mainMsg.innerHTML = 'Decryption successful'
		}

		locDir[name][2] = keyEncrypt(newLock);										//store the new dummy Lock
		locDir[name][3] = 'lock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){																//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

	}else{
		Encrypt_Single()													//none of the known encrypted types, therefore encrypt rather than decrypt
	};
	callKey = '';
};

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Anonymous, or Read-once. For Signed and Anonymous modes, it is possible that a shared Key has been used rather than a Lock.
function Decrypt_List(cipherArray){
	keyMsg.innerHTML = "";
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
	var	lockBoxItem = lockBox.value.trim().split('\n')[0].trim(),	//should be single Lock or shared Key, maybe a name
		Lock = replaceByItem(lockBoxItem,false);			//if it's a name, replace it with the decrypted item, no warning. Locks are stripped of their tags in any case.
	if(!locDir[name] && locDir[lockBoxItem]) name = lockBoxItem;	//name placed in the box

	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 				//ezLok case
	if(locDir['myself'] == null && fullAccess) key2any();									//make this entry if it has been deleted

	if (decoyMode.checked){																			//decoy decryption of the padding
		if (type == '!'){
			decoyDecrypt(padding,nonce24,pubdumstr)
		}else{
			decoyDecrypt(padding,nonce24,convertPubStr(myLock))
		}
	}

	//now make the idTag to be searched for, depending on the type of encryption
	if(Lock.length == 43 || (Lock == '' && type == '!')){
		var stuffForId = myLock
	}else{
		var stuffForId = Lock
	}
	if (type == '#' || (type == '$' && name == 'myself')){				//signed mode first
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key, provided the sender's Lock or shared Key are selected on the directory, or entered directly after pressing Edit. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainMsg.innerHTML = "<span style='color:orange'>Enter the sender's Lock or shared Key</span>";
			throw("Lock box empty");
		}
		var lockBoxLines = lockBox.value.trim().split('\n');
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
		if (Lock.length == 43 || Lock == '' || Lock.split('\n').length > 1){		//test for Lock, empty, multiline(video URL, since Lists have been filtered by now) in Lock box, in order to do anonymous Diffie-Hellman using the dummy Lock
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
			mainMsg.innerHTML = 'No message found for you';
			throw('idTag not found')
		}
	}

	//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
	if (type != '$'){					//anonymous and signed modes
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();

	} else if(name == 'myself'){		//encrypted to 'myself' in Read-once mode is actually in signed mode, but there is a dummy Lock to get rid of first
		msgKeycipher = msgKeycipher.slice(79);
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last character
	} else {
		var newLockCipher = msgKeycipher.slice(0,79),
			typeChar = msgKeycipher.slice(-1);
		msgKeycipher = msgKeycipher.slice(79,-1);
		var newLock = PLdecrypt(newLockCipher,nonce24,idKey,'read-once');

		if(typeChar == 'r'){											//if reset type, delete ephemeral data first
			locDir[name][1] = locDir[name][2] = null;
		}

		if(typeChar == 'p'){															//PFS mode: last Key and new Lock
			var	sharedKey = makeShared(newLock,lastKey);

		}else if(typeChar == 'r'){														//reset. lastKey is the permanent
			var	sharedKey = makeShared(newLock,KeyDH);

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

	//final decryption for the main message
	var plainstr = PLdecrypt(cipher,nonce24,msgKey);
	if(!plainstr.toLowerCase().match('data:;')) plainstr = LZString.decompressFromBase64(plainstr);		//encoded files are not compressed
	mainBox.innerHTML = plainstr;

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);				//everything Ok, so store
	if (!decoyMode.checked) mainMsg.innerHTML = 'Decryption successful';
	callKey = '';
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,nonce24,dummylock){
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
	keystr = replaceByItem(keystr,false);											//use stored item, if it exists
	decoyPwdOut.value = ""
	if(!sharedDecoyOut.checked){							//asymmetric mode, so now make the real encryption key
		var email = readEmail(),
			sharedKey = makeShared(dummylock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keystr,email)).secretKey));
	}else{																				//symmetric mode
		var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));
	}
	var plain = PLdecrypt(cipher,nonce24,sharedKey,'decoy');
	mainMsg.innerHTML = 'Hidden message: <span style="color:blue">' + decodeURI(plain) + '</span>'
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
	keyMsg.innerHTML = "";
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be sealed using your secret Key, so that others can verify its origin. The resulting item WILL NOT BE LOCKED. Cancel if this is not what you want.");
		if(!reply) throw("signature canceled");
	};
	refreshKey();
	var text = mainBox.innerHTML.trim();
	if(!text.toLowerCase().match('data:;')) text = LZString.compressToBase64(text).replace(/=/g,'');
	mainBox.innerHTML = 'PL23sld==%' + nacl.util.encodeBase64(nacl.sign(nacl.util.decodeUTF8(text), KeySgn)).replace(/=+$/,'') + '==PL23sld';
	if(!isMobile) selectMain();
	mainMsg.innerHTML = 'The text has been sealed with your secret Key. It is <span class="blink">NOT LOCKED</span>';
	callKey = '';
};

//verifies the Schnorr signature of the plaintext, calls applySignature as appropriate.
function verifySignature(){
	keyMsg.innerHTML = "";
	var text = mainBox.innerHTML.trim();
	if (text == ""){																	//nothing in text box
		mainMsg.innerHTML = '<span style="color:orange">Nothing to sign or verify</span>';
		throw("no text")
	}
	if(lockBox.value.slice(0,1)=='~') decryptItem();
	text = XSSfilter(text).replace(/&[^;]+;/g,'').replace(/\s/g,'');	//remove HTML tags and special characters, spaces that might have been added
	text = text.split("=").sort(function (a, b) { return b.length - a.length; })[0];				//remove tags
	if (text.charAt(0) != '%'){															//no seal present, therefore make one
		applySignature();
		return
	}
	if(learnMode.checked){
		var reply = confirm("The item in the main box has been sealed with somebody's secret Key. I will now check the matching Lock, which should be selected on the local directory, and will display the unsealed message inside. Cancel if this is not what you want.");
		if(!reply) throw("seal verification canceled");
	}
	var	Lock = lockBox.value.trim();
	if (Lock == ""){
		setTimeout(function(){mainMsg.innerHTML = 'Please select the sealer first, then click <strong>Unseal</strong>';},500);
		return
	}
	var	Lockstripped = striptags(Lock);
	if (Lockstripped.length != 43 && Lockstripped.length != 50){									//not a Lock, but maybe it's a name
		if (locDir[Lock]){
			var name = Lock;
			Lock = replaceByItem(Lock,false)
		}
	}else{
		var name = lockMsg.innerHTML;
		Lock = Lockstripped
	}
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//ezLok replaced by regular Lock
	if (Lock.length != 43){
		mainMsg.innerHTML = '<span style="color:orange">Enter a valid Lock</span>';
		throw("invalid public key")
	}											//unsealing of sealed message
	var sealedItem = nacl.util.decodeBase64(text.replace(/[^a-zA-Z0-9+\/ ]+/g,''));
	var result = nacl.sign.open(sealedItem, nacl.util.decodeBase64(Lock));
	if(result){
		setTimeout(function(){mainMsg.innerHTML = '<span style="color:cyan"><strong>Seal ownership is VERIFIED for ' + name + '</strong></span>'}, 0);
	}else{
		setTimeout(function(){mainMsg.innerHTML = '<span style="color:magenta"><strong>The seal has FAILED to verify for ' + name + '</strong></span>'}, 0);
	}
	if(result){
		var resultstr = nacl.util.encodeUTF8(result);
		if(!resultstr.toLowerCase().match('data:;')) resultstr = LZString.decompressFromBase64(resultstr);
		mainBox.innerHTML = resultstr;
	}
};

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8
//function for encrypting with long key
function padEncrypt(){
	var nonce = nacl.randomBytes(15),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML.trim(),
		keyText = lockBox.value.trim().replace(/\n/g,' ');
	if(!text.toLowerCase().match('data:;')) text = LZString.compressToBase64(text).replace(/=/g,'');

	var textBin = nacl.util.decodeBase64(text),
		keyTextBin = nacl.util.decodeUTF8(keyText),
		keyLengthNeed = Math.ceil((textBin.length + 15) * 8 / entropyPerChar);
	if(keyLengthNeed > keyTextBin.length){
		mainMsg.innerHTML = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex);
	var cipherstr = nacl.util.encodeBase64(cipherBin).replace(/=/g,'');
	var macstr = padMac(textBin, keyTextBin, nonce, startIndex);
	mainBox.innerHTML = "PL23msp==@@" + noncestr + macstr + cipherstr + "==PL23msp";

	mainMsg.innerHTML = 'Encryption successful. Click <strong>Email</strong> or copy and send.';
	if(!isMobile) selectMain();
	updateButtons();
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
	mainMsg.innerHTML = "";
	var keyText = lockBox.value.trim().replace(/\n/g,' '),
		cipherstr = XSSfilter(mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,''));	//remove HTML tags that might have been introduced and extra spaces
	if (cipherstr == ""){
		mainMsg.innerHTML = 'Nothing to encrypt or decrypt';
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
		mainMsg.innerHTML = "This is corrupt or not encrypted"
	}
	if(cipherBin.length > keyTextBin.length){
		mainMsg.innerHTML = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex);
	var macNew = padMac(plainBin, keyTextBin, nonce, startIndex);
	try{
		var plain = nacl.util.encodeBase64(plainBin).replace(/=/g,'');
	}catch(err){
		mainMsg.innerHTML = "Decryption has failed"
	}
	if(plain){
		if(!plain.toLowerCase().match('data:;')) plain = LZString.decompressFromBase64(plain);
		if(plain){
			if(macstr == macNew){										//check authentication
				mainBox.innerHTML = plain;
				mainMsg.innerHTML = 'Decryption successful';
			}else{
				mainMsg.innerHTML = 'Message authentication has failed';
			}
		}else{
			mainMsg.innerHTML = 'Decryption has failed';
		}
		updateButtons();
		openChat()	
	}else{
		mainMsg.innerHTML = "Decryption has failed"
	}
}