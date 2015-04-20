//function that starts it all when the Lock/Unlock button is pushed
function lockUnlock(){
	mainMsg.innerHTML = '<span class="blink" style="color:blue">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		Decrypt_single();
	},20);						//end of timeout
};

//Encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
//This function handles short mode encryption only (no List). Otherwise, Encrypt_List() is called
function Encrypt_single(){
	callKey = 'encrypt';
	var	name = lockMsg.innerHTML,
		clipped = false,
		lockBoxItem = lockBox.value.trim();			//this will be the encrypting Lock or shared Key (if it's a name, it will be replaced with value)
	if (lockBoxItem == ""){
		mainMsg.innerHTML = 'You must select a stored Lock or shared Key, or click <strong>Edit</strong> and enter one.';
		throw("lock box empty");
	}
	var listArray = lockBoxItem.split('\n');		//see if this is actually several Locks rather than one

	if(mainBox.innerHTML.length == 107){		//same length as a chat invite. Give warning and stop
		mainMsg.innerHTML = 'This message can be mistaken for a chat invite<br>Make it shorter or longer';
		return
	}

	if(!shortMode.checked){							//Encrypt_single() handles only short mode, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray);
		return
	}
	if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainMsg.innerHTML = '<span style="color:red">Short mode not available for multiple recipients</span>';
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

	if(Lock.length != 43 && !pfsMode.checked && !onceMode.checked){				//shared Key-locked mode, if no true Lock is entered
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be locked with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("sym encryption canceled");
		};
		var sharedKey = wiseHash(Lock,noncestr);		//use the nonce for stretching the user-supplied Key
		if (text.length > 94) clipped = true;  			//94-char capacity
		text = text.slice(0,94);
		while (text.length < 94) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(name + " will need to place the same Key in the Locks box to unlock the message in the main box.");
		};
		mainBox.innerHTML = "@" + noncestr + cipherstr;		
	}

	else if (signedMode.checked){					//signed mode, make encryption key from secret Key and recipient's Lock
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be locked with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("signed encryption canceled");
		};
		readKey();
		if(!locDir[name] && locDir[lockBoxHold]) name = lockBoxHold;				//get name from Lock area
		if (locDir[name] && fullAccess){
			var sharedKeyCipher = locDir[name][1];
		}
		if (sharedKeyCipher != null && fullAccess){
			var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeyCipher))
		} else {
			var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
			if (locDir[name] && fullAccess){
				locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(sharedKey));
				localStorage[userName] = JSON.stringify(locDir);

				if(ChromeSyncOn){											//if Chrome sync is available, change in sync storage
					syncChromeLock(name,JSON.stringify(locDir[name]))
				}
			}
		}
		if (text.length > 94) clipped = true;  			//94-char capacity
		text = text.slice(0,94);
		while (text.length < 94) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(lockMsg + " will need your Lock and his/her secret Key to unlock the message in the main box.");
		};
		mainBox.innerHTML = "#" + noncestr + cipherstr;
	}

	else if (anonMode.checked){								//anonymous mode, using only the recipient's Lock
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be locked with the Lock in the Locks box and the result will be placed in the main box. This is irreversible. Cancel if this is not what you want.");
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
			alert(name + " will need to place his/her secret Key in the key box to unlock the message in the main box.");
		}
		mainBox.innerHTML = '!' + noncestr + pubdumstr + cipherstr;
	}
	
	else if (pfsMode.checked || onceMode.checked){						//PFS and read-once modes
		if(name == 'myself'){
			mainMsg.innerHTML = 'You cannot lock short messages for yourself in PFS or Read-only mode';
		return			
		}
		if (learnMode.checked){
			var reply3 = confirm("The contents of the main box will be locked with forward secrecy, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("PFS encryption canceled");
		};
		if(locDir[name] == null){
			mainMsg.innerHTML = 'In PFS and Read-once modes recipient Locks must be stored';
			throw('name not on locDir')
		}		
		readKey();
		var dualKeyCipher = locDir[name][1],				//this is the permanent shared Key, we'll call it "dual" here to distinguish it from the current shared key, which is ephemeral
			turnstring = locDir[name][4];
		if (turnstring=='next unlock' && onceMode.checked){				//don't allow a switch in read-once mode, since it corrupts the exchange
			mainMsg.innerHTML = 'In Read-once mode, you cannot lock a new message before receiving a reply from the recipient. Use PFS mode instead.';
			throw('read-once locking aborted')						
		}
		var lastLockCipher = locDir[name][3];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
		if (lastLockCipher) {								//if dummy exists, decrypt it first
			var lastLock = keyDecrypt(lastLockCipher);
		} else {													//use permanent Lock if dummy doesn't exist
			if (Lock.length == 43){
				var lastLock = convertPubStr(Lock)					//Lock is actually a signing public key; must be converted
			}else{
				var lastLock = makePubStr(wiseHash(Lock,noncestr))		//if actually a shared Key, make the Lock deriving from it
			}
		}
		var secdum = nacl.randomBytes(32),
			pubdumstr = makePubStr(secdum);		
			
		if (pfsMode.checked){
			var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock
			if(lastLockCipher){
				if(Lock.length == 43){
					var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,KeyDH));
				}else{
					var newLockCipher = PLencrypt(pubdumstr,nonce24,makeShared(lastLock,wiseHash(Lock,noncestr)));
				}
			}else{
				var dualKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
				var	newLockCipher = PLencrypt(pubdumstr,nonce24,dualKey);
			}
		}else{
			var lastKeyCipher = locDir[name][2];						//read-once mode uses previous Key and previous Lock
			if (lastKeyCipher){
				var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
			} else {													//use new dummy Key if stored dummy doesn't exist
				var lastKey = secdum;
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
				var dualKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
				var	newLockCipher = PLencrypt(pubdumstr,nonce24,dualKey);
			}
		}
		locDir[name][2] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
		locDir[name][4] = 'next unlock';

		if(ChromeSyncOn){										//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
			
		if (text.length > 35) clipped = true;  			//35-char capacity
		text = text.slice(0,35);
		while (text.length < 35) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnMode.checked){
			alert(name + " will need to select you in his/her directory to unlock the message.");
		};
		if(pfsMode.checked){
			mainBox.innerHTML = "$" + noncestr + newLockCipher + cipherstr;
		}else{
			mainBox.innerHTML = "*" + noncestr + newLockCipher + cipherstr;
		}
	}
	if(isMobile){															//get ready to put into SMS
		mainMsg.innerHTML = 'Locking successful. Copy and click SMS';
	}
	if (clipped) mainMsg.innerHTML = "<span style='color:orange'>The message has been truncated</span>"
	decoyText.value = "";
	decoyPwdIn.value = "";
	decoyPwdOut.value = "";
	callKey = '';
};

//gets the permanent shared key from storage, or makes it and stores it. Used by PFS and Read-once modes
function getDualKey(name,Lock,noncestr,dualKeyCipher){
	if (Lock.length == 43){
		if (dualKeyCipher){
			var dualKey = nacl.util.decodeBase64(keyDecrypt(dualKeyCipher));
		} else {
			var dualKey = makeShared(convertPubStr(Lock),KeyDH);
			locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(dualKey));
						
			if(ChromeSyncOn){
				syncChromeLock(name,JSON.stringify(locDir[name]))
			}
		}
	}else{											//recipient has a shared Key in common with sender. Stretch it first. Use the padding as salt
		var dualKey = wiseHash(Lock,noncestr);		//"Lock" is actually a permanent shared Key, unstripped
	}
	return dualKey
}

//encrypts for a list of recipients. First makes a 256-bit message key, then gets the Lock or shared Key for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's item, so he/she can find the right encrypted key
function Encrypt_List(listArray){
	if(shortMode.checked){
		mainMsg.innerHTML = '<span style="color:red">Short mode not available for multiple recipients</span>';
		throw('short mode not available')
	}
	var warningList = "";
	for (var index = 0; index < listArray.length; index++){		//scan lines and pop a warning if some are not names on DB or aren't Locks
		var name = listArray[index].trim();
		if (name.slice(0,4)=='http') {
			listArray[index] = '';
			name = ''
		}
		if (name != ''){
			if(locDir[name] == null) {					//not on database; see if it's a Lock, and otherwise add to warning list
				var namestr = striptags(name);
				if(namestr.length != 43 && namestr.length != 50){
					if (warningList==""){warningList = name} else {warningList = warningList + '\n' + name}
				}
			}
		}
	}
	if ((warningList != '') && (listArray.length > 1)){
		var agree = confirm('The names on the list below were not found in your local directory. If you click OK, they will be used as shared Keys for locking and unlocking the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = mainBox.innerHTML;
	if (anonMode.checked) {
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be anonymously locked with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list encryption canceled");
		}
		var outString = "!"
	} else if(pfsMode.checked){
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be locked in PFS mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("PFS list encryption canceled");
		}
		var outString = "$"
	} else if(onceMode.checked){
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be locked in Read-once mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("Read-once list encryption canceled");
		}
		var outString = "*"
	} else {
		if (learnMode.checked){
			var reply = confirm("The contents of the main box will be locked with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("signed list encryption canceled");
		}
		var outString = "#"
	}
	
	if (anonMode.checked) {											//for anonymous mode, make dummy Lock. Make padding in all modes
		var secdum = nacl.randomBytes(32),
			secdumstr = nacl.util.encodeBase64(secdum),
			pubdumstr = makePubStr(secdum);
		var padding = decoyEncrypt(59,nonce24,secdum);
	} else {
		readKey();
		var padding = decoyEncrypt(59,nonce24,KeyDH);
	}
	
	if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);									//compress unless it's a file, which would grow on compression
	var cipher = PLencrypt(text,nonce24,msgKey);				//main encryption event, but don't add it yet
	outString = outString + noncestr + padding;
	if (anonMode.checked) outString = outString + pubdumstr;				//for anonymous mode, add the dummy lock to the output string

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (var index = 0; index < listArray.length; index++){
		var name = listArray[index].trim();
		if (name != ''){
			var Lock = replaceByItem(name,false);				//returns item if the name is on directory. Locks are stripped
			if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//get Lock from ezLok
			if (Lock.length == 43  || pfsMode.checked || onceMode.checked){				//if it's a Lock, do anonymous, PFS or signed encryption, and add the result to the output. Same if, not being a Lock, PFS or Read-Once are selected. Shared Key case at the end of all this
			
				if (signedMode.checked){
					readKey();
					if(locDir[name]!=null && fullAccess){
						var sharedKeyCipher = locDir[name][1];			//permanent key shared with recipient, for encrypting the new dummy Lock
						if (sharedKeyCipher != null){
							var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeyCipher))
						} else {
							var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
							locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(sharedKey));
							
							if(ChromeSyncOn){
								syncChromeLock(name,JSON.stringify(locDir[name]))
							}
						}
					} else {											//if the name is not in the directory, make it fresh
						var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
					}
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,sharedKey);

				} else if (anonMode.checked){
					var sharedKey = makeShared(convertPubStr(Lock),secdum),
						cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,sharedKey);						

				} else if (pfsMode.checked || onceMode.checked){
					if(locDir[name] == null){
						if(locDir[lockMsg.innerHTML] != null && listArray.length == 1){
							name = lockMsg.innerHTML
						} else {
							mainMsg.innerHTML = 'In PFS and Read-once modes, recipient Locks must be stored';
							throw('name not on locDir')
						}
					}
					readKey();
					var dualKeyCipher = locDir[name][1],				//this is the permanent shared Key, we'll call it "dual" here to distinguish it from the current shared key, which is ephemeral
						turnstring = locDir[name][4];
					if (turnstring=='next unlock' && onceMode.checked){			//don't allow a switch in read-once mode, since it corrupts the exchange
						mainMsg.innerHTML = 'In Read-once mode, you cannot lock a new message before receiving a reply from all recipients. Use PFS mode instead.';
						throw('read-once locking aborted')						
					}

				  if(name != 'myself'){								//can't do PFS or Read-once to myself, so do a signed one, below
					var lastLockCipher = locDir[name][3];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
					if (lastLockCipher != null) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher)
					} else {													//use permanent Lock if dummy doesn't exist
						if (Lock.length == 43){
							var lastLock = convertPubStr(Lock)
						}else{
							var lastLock = makePubStr(wiseHash(Lock,noncestr))	//if actually a shared Key, make the Lock deriving from it
						}
					}
					var secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						pubdumstr = makePubStr(secdum);
					if (pfsMode.checked){
						var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock
						
						if(lastLockCipher){
							if(Lock.length == 43){
								var idKey = makeShared(lastLock,KeyDH)		//key used for the ID and new dummy Lock
							}else{
								var idKey = makeShared(lastLock,wiseHash(Lock,noncestr));
							}
						}else{
							var idKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
						}
					}else{
						var lastKeyCipher = locDir[name][2];						//read-once mode uses previous Key and previous Lock
						if (lastKeyCipher != null){
							var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
						} else {													//use new dummy Key if stored dummy doesn't exist
							var lastKey = secdum;
						}
						var sharedKey = makeShared(lastLock,lastKey);
						
						if(lastLockCipher){
							if(lastKeyCipher){
								var idKey = sharedKey;
							}else{
								if(Lock.length == 43){
									var idKey = makeShared(lastLock,KeyDH);
								}else{
									var idKey = makeShared(lastLock,wiseHash(Lock,noncestr));
								}
							}
						}else{
							var idKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
						}
					}
					
					locDir[name][2] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
					locDir[name][4] = 'next unlock';

					if(ChromeSyncOn){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,idKey),
						newLockCipher = PLencrypt(pubdumstr,nonce24,idKey);
						
				  }else{														//don't do PFS to 'myself'; use signed mode instead
				  	var idKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,idKey)).replace(/=+$/,''),
						idTag = PLencrypt(Lock,nonce24,idKey),
						newLockCipher = PLencrypt(nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),nonce24,idKey);		//just a filler that won't be used
				  }
				}
				
			} else {													//if it's not a Lock (and not PFS or Read-Once), do a symmetric encryption instead, with appropriate key stretching. ID tag based on the shared Key encrypted by itself (stretched)
				var sharedKey = wiseHash(Lock,noncestr),
					cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
					idTag = PLencrypt(Lock,nonce24,sharedKey);
			}
			
			//now add the idTag and encrypted strings to the output string, and go to the next recipient
			if (pfsMode.checked || onceMode.checked){				//these include encrypted ephemeral Locks, not the other types
				outString = outString + '%' + idTag.slice(0,9) + '%' + newLockCipher + cipher2;
			} else {
				outString = outString + '%' + idTag.slice(0,9) + '%' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString = outString + '%' + cipher;
	if (noTagsMode.checked) {
			mainBox.innerHTML = outString
	} else {
		outString = outString + calcRStag(outString);
		if(anonMode.checked){
			mainBox.innerHTML = triple("PL22msa=" + outString + "=PL22msa")
		} else if (pfsMode.checked){
			mainBox.innerHTML = triple("PL22msp=" + outString + "=PL22msp")
		} else if(onceMode.checked){
			mainBox.innerHTML = triple("PL22mso=" + outString + "=PL22mso")
		} else {
			mainBox.innerHTML = triple("PL22mss=" + outString + "=PL22mss")
		}
	}
	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	smallOutput();
	mainMsg.innerHTML = 'Locking successful. Select and copy.';
	callKey = '';
}

//encrypts a string with the secret Key, 12 char nonce, padding so length for ASCII input is the same no matter what
function keyEncrypt(plainstr){
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
	if (cipherstr.charAt(0) == '~'){
		readKey();
		cipherstr = cipherstr.slice(1);							//take out the initial '~'
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			cipherstr = cipherstr.slice(12);
		try{
			return decodeURI(PLdecrypt(cipherstr,nonce24,KeyDir).trim())
		}catch(err){failedDecrypt()}
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

//decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_single as appropriate
function Decrypt_single(){
	callKey = 'decrypt';
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	if(lockBox.value.slice(0,1) == '~') decryptItem();			//if Lock or shared Key is encrypted, decrypt it
	var name = lockMsg.innerHTML,
		cipherstr = XSSfilter(mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'')),	//remove HTML tags that might have been introduced and extra spaces
		lockBoxLines = lockBox.value.trim().split('\n'),
		lockBoxItem = lockBoxLines[0];
	if (cipherstr == ""){
			mainMsg.innerHTML = 'Nothing to lock or unlock';
			throw("main box empty");
	};
	cipherstr = bestOfThree(cipherstr);
	cipherstr = applyRScode(cipherstr,true);														//RS error correction													
	
	//here detect if the message is for multiple recipients, and if so call the appropriate function
	var cipherArray = cipherstr.split('%');
	if(cipherArray.length > 3){
		if (cipherArray[1].length == 9){
			Decrypt_List(cipherArray);
			
			var typetoken = mainBox.innerHTML;
			if (typetoken.length == 107){											//chat invite detected, so open chat
				mainBox.innerHTML = '';
				var date = typetoken.slice(0,43).trim();				//the first 43 characters are for the date and time etc.
				if(date != ''){
					var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
				}else{
					var msgStart = ""
				}
				var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location.");
				if(!reply){
					mainBox.innerHTML = '';
					throw("chat start canceled");
				}
				if(isSafari || isIE || isiOS){
					mainMsg.innerHTML = 'Sorry, but chat is not yet supported by your browser or OS';
					throw('browser does not support webRTC')
				}
				main2chat(typetoken.slice(43));
			}			
			return
		}
	}

	var strippedLockBox = striptags(lockBoxItem);								//this holds a Lock or shared Key (or a name leading to it). if there is a video URL, it gets stripped, as well as any non-base64 chars
	var type = cipherstr.slice(0,1),											//get encryption type. !=anonymous, @=symmetric, #=signed, $=PFS, ~=Key-encrypted
		cipherstr = cipherstr.replace(/[^a-zA-Z0-9+/ ]+/g, '');					//remove anything that is not base64

	if(type == '@' || type == '#' || type == '$' || type == '*'){				//only one sender allowed
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.innerHTML = "<span style='color:red'>Please select a single sender</span>";
				throw("too many lines in lock box");
			}
		}
	}
	
	if (type == "~"){																//secret Key encrypted item, such as a complete locDir database
		if (learnMode.checked){
			var reply = confirm("The message in the main box was locked with your secret Key, and will now be unlocked if your secret Key has been entered. If it is a database it will be placed in the Locks screen so you can merge it into the stored database. If it contains settings, they will replace your current setings, including the email/token.  Cancel if this is not what you want.");
			if(!reply) throw("secret Key decryption canceled");
		};
		cipherstr = '~' + cipherstr;													//add back the type indicator, since RS code was made with it
		cipherstr = applyRScode(cipherstr,true);
		var key = readKey();
		lockBox.value = keyDecrypt(cipherstr);
		if(lockBox.value.slice(0,6) == 'myself'){		//string contains settings; add them after confirmation
			var reply = confirm("If you click OK, the settings from the backup will replace the current settings, possibly including a random token. This cannot be undone.");
			if (!reply) throw("settings restore canceled");

			mergeLockDB();
			mainMsg.innerHTML = 'The settings have been replaced with those in this backup';
			lockBox.value = ''
		}else{																		//stored local directory; display so it can be edited
			if(document.getElementById('basicMode').checked) basic2adv();
			lockMsg.innerHTML = 'Extracted items. Click <strong>Merge</strong> to add them to the local directory.';
			main2lock();
		}
	}

	else if (type == "@"){							//symmetric decryption
		if (learnMode.checked){
			var reply2 = confirm("The message in the main box was locked with a shared Key, and will now be unlocked if the same Key is present in the Locks box. The result will replace the locked message. Cancel if this is not what you want.");
			if(!reply2) throw("sym decryption canceled");
		};
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:red">Enter shared Key</span>';
			throw("symmetric key empty");
		}
		lockBoxItem = replaceByItem(lockBoxItem,false);					//if it's a name in the box, get the real item
		var	keystr = lockBoxItem,
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		var sharedKey = wiseHash(keystr,noncestr);
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			mainBox.innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainMsg.innerHTML = 'Unlock successful';
	}
	
	else if (type == "#"){							//signed decryption
		if (learnMode.checked){
			var reply = confirm("The message in the main box was locked with your Lock and the sender's Key, and will now be unlocked, replacing the locked message, if your secret Key has been entered. Cancel if this is not what you want.");
			if(!reply) throw("signed decryption canceled");
		};
		if (strippedLockBox == ''){
			mainMsg.innerHTML = "<span style='color:red'>Identify the sender or enter his/her Lock</span>";
			throw("lock box empty");
		}
		readKey();
		if (locDir[name] == null){
			name = lockBoxItem;							//try again using the string in the lockBox as name, not stripped
		}
		if (locDir[name] && fullAccess) var sharedKeyCipher = locDir[name][1];
		if (sharedKeyCipher != null){
			var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeyCipher))
		} else {
			strippedLockBox = replaceByItem(lockBoxItem,false);
			if (strippedLockBox.length == 50) strippedLockBox = changeBase(strippedLockBox.toLowerCase(), BASE36, BASE64, true) 		//replace ezLok with standard
			var sharedKey = makeShared(convertPubStr(strippedLockBox),KeyDH);
			if (locDir[name] && fullAccess) {
				locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(sharedKey));
				localStorage[userName] = JSON.stringify(locDir);

				if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
					syncChromeLock(name,JSON.stringify(locDir[name]))
				}
			}
		}
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			mainBox.innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainMsg.innerHTML = 'Unlock successful';
	}

	else if (type == "!"){					//short anonymous decryption
		if (learnMode.checked){
			var reply = confirm("The short message in the main box was locked with your personal Lock, and will now be unlocked if your secret Key has been entered, replacing the locked message. Cancel if this is not what you want.");
			if(!reply) throw("public decryption canceled");
		}
		readKey();
		var noncestr = cipherstr.slice(0,12),
			pubdumstr = cipherstr.slice(12,55),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			sharedKey = makeShared(pubdumstr,KeyDH);
		cipherstr = cipherstr.slice(55);
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			mainBox.innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainMsg.innerHTML = 'Unlock successful';
	}
		
	else if(type == "$"|| type == "*"){			//PFS and read-once decryption
		if (learnMode.checked){
			var reply2 = confirm("The message in the main box was locked in a forward secrecy mode, and will now be unlocked if the sender has been selected. The result will replace the locked message. Cancel if this is not what you want.");
			if(!reply2) throw("PFS decryption canceled");
		};
		readKey();
		if (lockBoxItem == ''){
			mainMsg.innerHTML = '<span style="color:red">Select the sender</span>';
			throw("PFS sender empty");
		}	
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainMsg.innerHTML = 'The sender must be in the directory';
			throw('sender not in directory')
		}
		var Lock = replaceByItem(lockBoxItem,false);					//if it's a name in the box, get the real item
		if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true); 		//replace ezLok with standard
		var	keystr = lockBoxItem,
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			newLockCipher = cipherstr.slice(12,91);
		cipherstr = cipherstr.slice(91);
		
		var lastKeyCipher = locDir[name][2],												//retrieve dummy Key from storage
			turnstring = locDir[name][4];													//this strings says whose turn it is to encrypt
		if (turnstring=='next lock'){
			if(type == '*'){
				window.setTimeout(function(){mainMsg.innerHTML = 'Read-once messages can be unlocked only once'},2000)				
			}
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
		if (locDir[name]) var dualKeyCipher = locDir[name][1];
		if(type == '$'){																//PFS mode
			if(lastKeyCipher){
				if(Lock.length == 43){
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(Lock),lastKey));
				}else{
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey));
				}
			}else{
				var dualKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
				var newLock = PLdecrypt(newLockCipher,nonce24,dualKey);
			}
			var	sharedKey = makeShared(newLock,lastKey);
		}else{																			//Read-once mode
																
			var lastLockCipher = locDir[name][3];										//read-once mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(keyDecrypt(lastLockCipher),lastKey));
				}else{
					if(Lock.length == 43){
						var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(convertPubStr(Lock),lastKey));
					}else{
						var newLock = PLdecrypt(newLockCipher,nonce24,makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey));
					}
				}
			}else{
				var dualKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
				var newLock = PLdecrypt(newLockCipher,nonce24,dualKey);
			}
			if (lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockCipher)
			} else {																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			mainBox.innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()}
		mainMsg.innerHTML = 'Unlock successful';
		locDir[name][3] = keyEncrypt(newLock);										//store the new dummy Lock
		locDir[name][4] = 'next lock';

		if(ChromeSyncOn){																//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}	
		
	}else{
		Encrypt_single()													//none of the known encrypted types, therefore encrypt rather than decrypt
	};
	callKey = '';
};

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Anonymous, PFS, or Read-once. For Signed and Anonymous modes, it is possible that a shared Key has been used rather than a Lock.
function Decrypt_List(cipherArray){
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	var name = lockMsg.innerHTML,
		type = cipherArray[0].slice(0,1);													//type is 1st character
	for (var i=0; i < cipherArray.length; i++){
		cipherArray[i] = cipherArray[i].replace(/[^a-zA-Z0-9+/ ]+/g, '')				//take out anything that is not base64
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
	if (type == '#' || ((type == '$' || type == '*') && name == 'myself')){				//signed mode first
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key, provided the sender's Lock or shared Key are in the in the Locks box. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainMsg.innerHTML = "<span style='color:red'>Enter the sender's Lock or shared Key</span>";
			throw("lock box empty");
		}
		var lockBoxLines = lockBox.value.trim().split('\n');
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.innerHTML = "<span style='color:red'>Please select a single sender</span>";
				throw("too many lines in lock box");
			}
		}
		readKey();
		if (Lock.length == 43){									//assuming this is a Lock, not a shared Key. See below for the other case
			if (locDir[name] && fullAccess){										//get permanent shared Key from storage, or make it if not stored
				var sharedKeyCipher = locDir[name][1];
			}else if(locDir[lockBoxItem] && fullAccess){							//get name from Lock box instead of message
				name = lockBoxItem;
				var sharedKeyCipher = locDir[name][1];
			}
			if (sharedKeyCipher != null){
				var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeyCipher))
			} else {																//no shared key found, so making a new one
				var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
				if (locDir[name] && fullAccess) {
					locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(sharedKey));

					if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
				}
			}
			var	idKey = sharedKey;
		} else {														//this when it's a regular shared Key in common with the sender
			var	sharedKey = wiseHash(Lock,noncestr),						//nonce is used as salt for regular shared Keys
				idKey = sharedKey;
		}
		
	} else if(type == '!'){										//anonymous mode
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list decryption canceled");
		}
		if (Lock.length == 43 || Lock == '' || Lock.split('\n').length > 1){		//test for Lock, empty, multiline(video URL, since Lists have been filtered by now) in Lock box, in order to do anonymous Diffie-Hellman using the dummy Lock
			readKey();
			var	sharedKey = makeShared(pubdumstr,KeyDH),
				idKey = sharedKey;
		} else {																//looks like a shared Key in the Lock box: use it as is
			var	sharedKey = wiseHash(Lock,noncestr),
				idKey = sharedKey;
		}
		
	} else {													//PFS and Read-once modes
		if (learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key, provided the sender's Lock or shared Key are in the in the Locks box. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainMsg.innerHTML = "<span style='color:red'>Enter the sender's Lock or shared Key</span>";
			throw("lock box empty");
		}
		readKey();		
		if (locDir[name]){
			var dualKeyCipher = locDir[name][1],
				lastKeyCipher = locDir[name][2],
				lastLockCipher = locDir[name][3],
				turnstring = locDir[name][4];										//this strings says whose turn it is to encrypt
			if (turnstring=='next lock'){											//it will fail, so prepare a message
				if(type == '*'){
					window.setTimeout(function(){mainMsg.innerHTML = 'Read-once messages can be unlocked only once'},2000)				
				}
			}
		}
		if(lastKeyCipher){
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
		} else {																		//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 43){
				var lastKey = KeyDH;
			}else{
				var lastKey = wiseHash(Lock,noncestr);									//shared Key: use directly
			}
		}
		if(type == '$'){																//PFS mode uses permanent Lock for idTag
			if(lastKeyCipher){
				if(Lock.length == 43){
					var idKey = makeShared(convertPubStr(Lock),lastKey);
				}else{
					var idKey = makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey);
				}
			}else{
				var idKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
			}
		}else{																			//Read-once mode uses lastLock if available
			if(lastKeyCipher){
				if(lastLockCipher){
					var idKey = makeShared(keyDecrypt(lastLockCipher),lastKey);
				}else{
					if(Lock.length == 43){
						var idKey = makeShared(convertPubStr(Lock),lastKey);
					}else{
						var idKey = makeShared(makePubStr(wiseHash(Lock,noncestr)),lastKey);
					}
				}
			}else{
				var idKey = getDualKey(name,Lock,noncestr,dualKeyCipher);
			}
		}

	}
	var idTag = PLencrypt(stuffForId,nonce24,idKey).slice(0,9);
	
	//look for the id tag and return the string that follows it
	for (i = 1; i < cipherArray.length; i++){
		if (idTag == cipherArray[i]) {
			var msgKeycipher = cipherArray[i+1];
		}
	}
	if(typeof msgKeycipher == 'undefined'){
		mainMsg.innerHTML = 'No message found for you';
		throw('idTag not found')
	}
	
	//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and read-once modes is more involved.
try{
	if (type != '$' && type != '*'){	//anonymous and signed modes
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();

	} else if(name == 'myself'){		//encrypted to 'myself' in PFS or Read-once mode is actually in signed mode, but there is a dummy Lock to get rid of first
		msgKeycipher = msgKeycipher.slice(79);
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();
		
//for PFS mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key
	} else {
		var newLockCipher = msgKeycipher.slice(0,79);
		msgKeycipher = msgKeycipher.slice(79);
		var newLock = PLdecrypt(newLockCipher,nonce24,idKey);

		if(type == '$'){																//PFS mode: last Key and new Lock
			var	sharedKey = makeShared(newLock,lastKey);
		}else{																			//Read-once mode: last Key and last Lock																
			var lastLockCipher = locDir[name][3];
			if (lastLockCipher != null) {												//if stored dummy Lock exists, decrypt it
				var lastLock = keyDecrypt(lastLockCipher)
			} else {																	//use new dummy if no stored dummy
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt();
		locDir[name][3] = keyEncrypt(newLock);										//store the new dummy Lock
		locDir[name][4] = 'next lock';

		if(ChromeSyncOn){															//change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}
	
	//final decryption for the main message
	var plainstr = PLdecrypt(cipher,nonce24,msgKey);
	
}catch(err){failedDecrypt()}

	if(XSSfilter(plainstr).slice(0,9) != 'filename:') plainstr = LZString.decompressFromBase64(plainstr);		//encoded files are not compressed
	mainBox.innerHTML = plainstr;
	
	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	if (!decoyMode.checked) mainMsg.innerHTML = 'Unlock successful';
	callKey = '';
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,nonce24,dummylock){
	mainMsg.innerHTML = "";
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
	try{
		var plain = PLdecrypt(cipher,nonce24,sharedKey);
		mainMsg.innerHTML = 'Hidden message: <span style="color:blue">' + decodeURI(plain) + '</span>'
	}catch(err){failedDecrypt()}
};

//adds Schnorr signature to the contents of the main box 
function applySignature(){
	callKey = 'sign';
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	if (learnMode.checked){
		var reply = confirm("A signature matching the contents of the main box will be made using your secret Key, and the resulting signature will be added to the end of the main box. Cancel if this is not what you want.");
		if(!reply) throw("signature canceled");
	};
	readKey();
	var text = reallyTrim(mainBox.innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,''));
	var outString = '%';
	if(attachedMode.checked){
		outString = outString + nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(text), KeySgn)).replace(/=+$/,'')
		if (!noTagsMode.checked){
			if(ReedSolMode.checked){
				mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple("PL22sig=" + outString + calcRStag(outString) + "=PL22sig")
			}else{
				mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple("PL22sig=" + outString + "=PL22sig")
			}
		}else{
			mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple(outString)
		}
		mainMsg.innerHTML = 'Signature attached to text'
	}else{
		if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);
		var outString = outString + nacl.util.encodeBase64(nacl.sign(nacl.util.decodeUTF8(text), KeySgn)).replace(/=+$/,'')
		if (!noTagsMode.checked){
			if(ReedSolMode.checked){
				mainBox.innerHTML = triple("PL22sld=" + outString + calcRStag(outString) + "=PL22sld")
			}else{
				mainBox.innerHTML = triple("PL22sld=" + outString + "=PL22sld")
			}
		}else{
			mainBox.innerHTML = triple(outString)
		}
		mainMsg.innerHTML = 'The text has been sealed with your secret Key. It is <span class="blink">NOT LOCKED</span>'
	}
	callKey = '';
};

//verifies the Schnorr signature of the plaintext, calls applySignature as appropriate.
function verifySignature(){
	keyMsg.innerHTML = "";
	mainMsg.innerHTML = "";
	var text = mainBox.innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,'').trim();					//newline-related formatting is ignored
	if (text == ""){																	//nothing in text box
		mainMsg.innerHTML = '<span style="color:red">Nothing to sign or verify</span>';
		throw("no text")
	}
	if(lockBox.value.slice(0,1)=='~') decryptItem();
	var	sigstr = text.split(/\r?\n/);
		sigstr = sigstr[sigstr.length-1];										//this is a signature if added as last line of text
		sigstr = XSSfilter(sigstr).replace(/&[^;]+;/g,'').replace(/\s/g,'');	//remove HTML tags and special characters, spaces that might have been added
		sigstr = bestOfThree(sigstr);
	var sigstr = applyRScode(sigstr,true);
	if (sigstr.charAt(0) != '%'){															//no signature present, therefore make one
		applySignature();
		return
	}
	if (learnMode.checked && sigstr.length == 87){
		var reply = confirm("The text in the main box has been signed with somebody's secret Key. I will now verify if the signature is correct for this text and the matching Lock, which should be selected on the local directory, and will display the result as a message. Cancel if this is not what you want.");
		if(!reply) throw("signature verification canceled");
	} else if(learnMode.checked){
		var reply = confirm("The item in the main box has been sealed with somebody's secret Key. I will now check the matching Lock, which should be selected on the local directory, and will display the unsealed message inside. Cancel if this is not what you want.");
		if(!reply) throw("seal verification canceled");
	}
	var	Lock = lockBox.value.trim();
	if (Lock == ""){
		mainMsg.innerHTML = 'Select a Lock to verify or unseal an item';
		throw("no Lock present")
	}
		Lock = striptags(Lock);
	if (Lock.length != 43 && Lock.length != 50){											//not a Lock, but maybe it's a name
		if (locDir[Lock]){
			var name = Lock;
			Lock = replaceByItem(Lock,false)
		}
	}else{
		var name = lockMsg.innerHTML
	}
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//ezLok replaced by regular Lock
	if (Lock.length != 43){
		mainMsg.innerHTML = '<span style="color:red">Enter a valid Lock</span>';
		throw("invalid public key")
	}
	var signature = nacl.util.decodeBase64(sigstr.slice(1));
	if(sigstr.length == 87){						//verification of detached signature
		text = text.replace(/\r?\n?[^\r\n]*$/, "");												//remove last line; next do the checking
		var check = nacl.sign.detached.verify(nacl.util.decodeUTF8(reallyTrim(text)), signature, nacl.util.decodeBase64(Lock));
		if (check) {
			mainMsg.innerHTML = '<span style="color:green"><strong>The signature is VERIFIED for ' + name + '</strong></span>'
		} else {
			mainMsg.innerHTML = '<span style="color:magenta"><strong>The signature has FAILED verification for ' + name + '</strong></span>'
		}
	}else{											//unsealing of sealed message
		var result = nacl.sign.open(signature, nacl.util.decodeBase64(Lock));
		if(result){
			mainMsg.innerHTML = '<span style="color:green"><strong>Seal ownership is VERIFIED for ' + name + '</strong></span>'
		}else{
			mainMsg.innerHTML = '<span style="color:magenta"><strong>The seal has FAILED to verify for ' + name + '</strong></span>'
		}
	}
	if(result){
		var resultstr = nacl.util.encodeUTF8(result);
		if(XSSfilter(resultstr).slice(0,9) != 'filename:') resultstr = LZString.decompressFromBase64(resultstr);
		mainBox.innerHTML = resultstr;
	}
};

//remove non-breaking spaces as well as spaces when trimming; useful for signatures
function reallyTrim(string){
	return string.trim().replace(/^(\&nbsp; )+/,'').replace(/(\&nbsp;)+$/,'').trim().replace(/^(\&nbsp;)+/,'').replace(/( \&nbsp;)+$/,'').trim()
}