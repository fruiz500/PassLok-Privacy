//Encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
//This function handles short mode encryption only (no List). Otherwise, Encrypt_List() is called
function Encrypt_single(){
	callKey = 'encrypt';
	var shortOn = document.getElementById("shortmode").checked,
		tagsOff = document.getElementById("notags").checked,
		signedOn = document.getElementById("signedmode").checked,
		pfsOn = document.getElementById("pfsmode").checked,
		onceOn = document.getElementById("oncemode").checked,
		anonOn = document.getElementById("anonmode").checked,
		mainmsg = document.getElementById("mainmsg"),
		lockmsg = document.getElementById("lockmsg"),
		name = lockmsg.innerHTML,
		clipped = false,
		lockBoxItem = document.getElementById('lockBox').value.trim();			//this will be the encrypting Lock or shared Key (if it's a name, it will be replaced with value)
	if (lockBoxItem == ""){
		mainmsg.innerHTML = 'You must select a stored Lock or shared Key, or click <strong>Edit</strong> and enter one.';
		throw("lock box empty");
	}
	var listArray = lockBoxItem.split('\n');		//see if this is actually several Locks rather than one

	if(document.getElementById('mainBox').innerHTML.length == 107){		//same length as a chat invite. Give warning and stop
		mainmsg.innerHTML = 'This message can be mistaken for a chat invite<br>Make it shorter or longer';
		return
	}

	if(!shortOn){							//Encrypt_single() handles only short mode, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray);
		return
	}
	if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainmsg.innerHTML = '<span style="color:red">Short mode not available for multiple recipients</span>';
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
		text = encodeURI(document.getElementById('mainBox').innerHTML).replace(/%20/g,' ');		//now we do the different encryption modes

	if(Lock.length != 43 && !pfsOn && !onceOn){				//shared Key-locked mode, if no true Lock is entered
		if (learnOn){
			var reply3 = confirm("The contents of the main box will be locked with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply3==false) throw("sym encryption canceled");
		};
		var sharedKey = wiseHash(Lock,noncestr);		//use the nonce for stretching the user-supplied Key
		if (text.length > 94) clipped = true;  			//94-char capacity
		text = text.slice(0,94);
		while (text.length < 94) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnOn){
			alert(name + " will need to place the same Key in the Locks box to unlock the message in the main box.");
		};
		document.getElementById('mainBox').innerHTML = "@" + noncestr + cipherstr;		
	}

	else if (signedOn){					//signed mode, make encryption key from secret Key and recipient's Lock
		if (learnOn){
			var reply3 = confirm("The contents of the main box will be locked with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply3 == false) throw("signed encryption canceled");
		};
		readKey();
		if(!locDir[name] && locDir[lockBoxHold]) name = lockBoxHold;				//get name from Lock area
		if (locDir[name] && fullAccess){
			var sharedKeycipher = locDir[name][1];
		}
		if (sharedKeycipher != null && fullAccess){
			var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeycipher))
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
		if (learnOn){
			alert(lockmsg + " will need your Lock and his/her secret Key to unlock the message in the main box.");
		};
		document.getElementById('mainBox').innerHTML = "#" + noncestr + cipherstr;
	}

	else if (anonOn){								//anonymous mode, using only the recipient's Lock
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked with the Lock in the Locks box and the result will be placed in the main box. This is irreversible. Cancel if this is not what you want.");
			if(reply == false) throw("public encryption canceled");
		};
		if(name == '') name = "the recipient";		
		var secdum = nacl.randomBytes(32),							//make dummy Key
			pubdumstr = makePubStr(secdum),							//matching dummy Lock
			sharedKey = makeShared(convertPubStr(Lock),secdum);
		if (text.length > 62) clipped = true;  			//62-char capacity because of the dummy Lock
		text = text.slice(0,62);
		while (text.length < 62) text = text + ' ';
		var cipherstr = PLencrypt(text,nonce24,sharedKey);
		if (learnOn){
			alert(name + " will need to place his/her secret Key in the key box to unlock the message in the main box.");
		}
		document.getElementById('mainBox').innerHTML = '!' + noncestr + pubdumstr + cipherstr;
	}
	
	else if (pfsOn || onceOn){						//PFS and read-once modes
		if(name == 'myself'){
		mainmsg.innerHTML = 'You cannot lock short messages for yourself in PFS or Read-only modes.';
		return			
		}
		if (learnOn){
			var reply3 = confirm("The contents of the main box will be locked with forward secrecy, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply3==false) throw("PFS encryption canceled");
		};
		if(locDir[name] == null){
			mainmsg.innerHTML = 'In PFS and Read-once modes recipient Locks must be stored';
			throw('name not on locDir')
		}		
		readKey();
		var dualKeycipher = locDir[name][1],				//this is the permanent shared Key, we'll call it "dual" here to distinguish it from the current shared key, which is ephemeral
			turnstring = locDir[name][4];
		if (turnstring=='next unlock' && onceOn){				//don't allow a switch in read-once mode, since it corrupts the exchange
			mainmsg.innerHTML = 'In Read-once mode, you cannot lock a new message before receiving a reply from the recipient. Use PFS mode instead.';
			throw('read-once locking aborted')						
		}
		if (Lock.length == 43){
			if (dualKeycipher){
				var dualKey = nacl.util.decodeBase64(keyDecrypt(dualKeycipher));
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
		var lastLockcipher = locDir[name][3];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
		if (lastLockcipher) {								//if dummy exists, decrypt it first
			var lastLock = keyDecrypt(lastLockcipher);
		} else {													//use permanent Lock if dummy doesn't exist
			if (Lock.length == 43){
				var lastLock = convertPubStr(Lock)					//Lock is actually a signing public key; must be converted
			}else{
				var lastLock = makePubStr(wiseHash(Lock,noncestr))		//if actually a shared Key, make the Lock deriving from it
			}
		}
		var secdum = nacl.randomBytes(32),
			pubdumstr = makePubStr(secdum),
			newLockcipher = PLencrypt(pubdumstr,nonce24,dualKey);
			
		if (pfsOn){
			var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock
		}else{
			var lastKeycipher = locDir[name][2];						//read-once mode uses previous Key and previous Lock
			if (lastKeycipher){
				var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeycipher));
			} else {													//use new dummy Key if stored dummy doesn't exist
				var lastKey = secdum;
			}
			var sharedKey = makeShared(lastLock,lastKey);
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
		if (learnOn){
			alert(name + " will need to select you in his/her directory to unlock the message.");
		};
		if(pfsOn){
			document.getElementById('mainBox').innerHTML = "$" + noncestr + newLockcipher + cipherstr;
		}else{
			document.getElementById('mainBox').innerHTML = "*" + noncestr + newLockcipher + cipherstr;
		}
	}
	if(isMobile){															//get ready to put into SMS
		mainmsg.innerHTML = 'Locking successful. Copy and click SMS';
	}
	if (clipped) mainmsg.innerHTML = "<span style='color:orange'>The message has been truncated</span>"
	document.getElementById('decoyText').value = "";
	document.getElementById('decoyPwdIn').value = "";
	document.getElementById('decoyPwdOut').value = "";
	callKey = '';
};

//encrypts for a list of recipients. First makes a 256-bit message key, then gets the Lock or shared Key for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's item, so he/she can find the right encrypted key
function Encrypt_List(listArray){
	var shortOn = document.getElementById("shortmode").checked,
		tagsOff = document.getElementById("notags").checked,
		signedOn = document.getElementById("signedmode").checked,
		pfsOn = document.getElementById("pfsmode").checked,
		onceOn = document.getElementById("oncemode").checked,
		anonOn = document.getElementById("anonmode").checked,
		mainmsg = document.getElementById("mainmsg"),
		lockmsg = document.getElementById("lockmsg");
	if(shortOn){
		mainmsg.innerHTML = '<span style="color:red">Short mode not available for multiple recipients</span>';
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
	var	msgkey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = document.getElementById('mainBox').innerHTML;
	if (anonOn) {
		if (learnOn){
			var reply = confirm("The contents of the main box will be anonymously locked with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("anonymous list encryption canceled");
		}
		var outString = "!"
	} else if(pfsOn){
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked in PFS mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("PFS list encryption canceled");
		}
		var outString = "$"
	} else if(onceOn){
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked in Read-once mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("Read-once list encryption canceled");
		}
		var outString = "*"
	} else {
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("signed list encryption canceled");
		}
		var outString = "#"
	}
	
	if (anonOn) {											//for anonymous mode, make dummy Lock. Make padding in all modes
		var secdum = nacl.randomBytes(32),
			secdumstr = nacl.util.encodeBase64(secdum),
			pubdumstr = makePubStr(secdum);
		var padding = decoyEncrypt(59,nonce24,secdumstr,true);
	} else {
		var key = readKey();
		var padding = decoyEncrypt(59,nonce24,key,false);
	}
	
	if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);									//compress unless it's a file, which would grow on compression
	var cipher = PLencrypt(text,nonce24,msgkey);				//main encryption event, but don't add it yet
	outString = outString + noncestr + padding;
	if (anonOn) outString = outString + pubdumstr;				//for anonymous mode, add the dummy lock to the output string

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (var index = 0; index < listArray.length; index++){
		var name = listArray[index].trim();
		if (name != ''){
			var Lock = replaceByItem(name,false);				//returns item if the name is on directory. Locks are stripped
			if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//get Lock from ezLok
			if (Lock.length == 43  || pfsOn || onceOn){				//if it's a Lock, do anonymous, PFS or signed encryption, and add the result to the output. Same if, not being a Lock, PFS or Read-Once are selected. Shared Key case at the end of all this
			
				if (signedOn){
					if (key == null) readKey();
					if(locDir[name]!=null && fullAccess){
						var sharedKeycipher = locDir[name][1];			//permanent key shared with recipient, for encrypting the new dummy Lock
						if (sharedKeycipher != null){
							var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeycipher))
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
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgkey,nonce24,sharedKey)).replace(/=+$/,''),
						idtag = PLencrypt(Lock,nonce24,sharedKey);

				} else if (anonOn){
					var sharedKey = makeShared(convertPubStr(Lock),secdum),
						cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgkey,nonce24,sharedKey)).replace(/=+$/,''),
						idtag = PLencrypt(Lock,nonce24,sharedKey);						

				} else if (pfsOn || onceOn){
					if(locDir[name] == null){
						if(locDir[lockmsg.innerHTML] != null && listArray.length == 1){
							name = lockmsg.innerHTML
						} else {
							mainmsg.innerHTML = 'In PFS and Read-once modes, recipient Locks must be stored';
							throw('name not on locDir')
						}
					}
					if (key == null) readKey();
					var dualKeycipher = locDir[name][1],				//this is the permanent shared Key, we'll call it "dual" here t distinguish it from the current shared key, which is ephemeral
						turnstring = locDir[name][4];
					if (turnstring=='next unlock' && onceOn){			//don't allow a switch in read-once mode, since it corrupts the exchange
						mainmsg.innerHTML = 'In Read-once mode, you cannot lock a new message before receiving a reply from all recipients. Use PFS mode instead.';
						throw('read-once locking aborted')						
					}
					if (Lock.length == 43){
						if (dualKeycipher != null){
							var dualKey = nacl.util.decodeBase64(keyDecrypt(dualKeycipher));
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
				  if(name != 'myself'){								//can't do PFS or Read-once to myself, so do a signed one, below
					var lastLockcipher = locDir[name][3];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
					if (lastLockcipher != null) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockcipher);
					} else {													//use permanent Lock if dummy doesn't exist
						if (Lock.length == 43){
							var lastLock = convertPubStr(Lock)
						}else{
							var lastLock = makePubStr(wiseHash(Lock,noncestr))	//if actually a shared Key, make the Lock deriving from it
						}
					}
					var secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						pubdumstr = makePubStr(secdum);
					if (pfsOn){
						var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock
					}else{
						var lastKeycipher = locDir[name][2];						//read-once mode uses previous Key and previous Lock
						if (lastKeycipher != null){
							var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeycipher));
						} else {													//use new dummy Key if stored dummy doesn't exist
							var lastKey = secdum;
						}
						var sharedKey = makeShared(lastLock,lastKey);
					}
					locDir[name][2] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
					locDir[name][4] = 'next unlock';

					if(ChromeSyncOn){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgkey,nonce24,sharedKey)).replace(/=+$/,''),
						idtag = PLencrypt(Lock,nonce24,dualKey),
						newLockcipher = PLencrypt(pubdumstr,nonce24,dualKey);
						
				  }else{														//don't do PFS to 'myself'; use signed mode instead
					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgkey,nonce24,dualKey)).replace(/=+$/,''),
						idtag = PLencrypt(Lock,nonce24,dualKey),
						newLockcipher = PLencrypt(nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),nonce24,dualKey);		//just a filler that won't be used
				  }
				}
				
			} else {													//if it's not a Lock (and not PFS or Read-Once), do a symmetric encryption instead, with appropriate key stretching. ID tag based on the shared Key encrypted by itself (stretched)
				var sharedKey = wiseHash(Lock,noncestr),
					cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgkey,nonce24,sharedKey)).replace(/=+$/,''),
					idtag = PLencrypt(Lock,nonce24,sharedKey);
			}
			
			//now add the idtag and encrypted strings to the output string, and go to the next recipient
			if (pfsOn || onceOn){				//these include encrypted ephemeral Locks, not the other types
				outString = outString + '%' + idtag.slice(0,9) + '%' + newLockcipher + cipher2;
			} else {
				outString = outString + '%' + idtag.slice(0,9) + '%' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString = outString + '%' + cipher;
	if (tagsOff) {
			document.getElementById('mainBox').innerHTML = outString
	} else {
		outString = outString + calcRStag(outString);
		if(anonOn){
			document.getElementById('mainBox').innerHTML = triple("PL22msa=" + outString + "=PL22msa")
		} else if (pfsOn){
			document.getElementById('mainBox').innerHTML = triple("PL22msp=" + outString + "=PL22msp")
		} else if(onceOn){
			document.getElementById('mainBox').innerHTML = triple("PL22mso=" + outString + "=PL22mso")
		} else {
			document.getElementById('mainBox').innerHTML = triple("PL22mss=" + outString + "=PL22mss")
		}
	}
	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	smallOutput();
	mainmsg.innerHTML = 'Locking successful. Select and copy.';
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
function decoyEncrypt(length,nonce24,dummykey,isAnon){
	if (document.getElementById("decoymode").checked){
		if (learnOn){
			var reply = confirm("You are adding a hidden message in Decoy mode. Cancel if this is not what you want, then uncheck Decoy mode in Options.");
			if(!reply) throw("decoy encryption canceled");
		};
		if ((document.getElementById('decoyPwdIn').value.trim() == "")||(document.getElementById('decoyText').value.trim() == "")){ //stop to display the decoy entry form if there is no hidden message or key
			document.getElementById("decoyIn").style.display = "block";				//display decoy form, and back shadow
			document.getElementById("shadow").style.display = "block";
			if(!isMobile) document.getElementById('decoyText').focus();
			throw ("stopped for decoy input")
		}
		var keystr = document.getElementById('decoyPwdIn').value,
			text = encodeURI(document.getElementById('decoyText').value.replace(/%20/g, ' '));
			keystr = replaceByItem(keystr,false);													//if in database, get the real item
		var keyStripped = striptags(keystr);
		
		if (keyStripped.length == 43 || keyStripped.length == 50){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase(), BASE36, BASE64, true) //ezLok replaced by regular Lock			
			if (isAnon){												//anonymous mode, make shared key from given Lock and dummy key
				var sharedKey = makeShared(convertPubStr(keyStripped),nacl.util.decodeBase64(dummykey));
			}else{														//signed/PFS mode, make shared key from given Lock and regular Key
				var	sharedKey = makeShared(convertPubStr(keyStripped),KeyDH);
			}			
		}else{															//symmetric encryption
			var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));											//see comment above
		}
		
	} else {																		//no decoy mode, so salt comes from random text and key
		var sharedKey = nacl.randomBytes(32),
			text = nacl.util.encodeBase64(nacl.randomBytes(44)).replace(/=+$/,'');
	};
	while (text.length < length) text = text + ' ';				//add spaces to make the number of characters required
	text = text.slice(0,length);
	var cipher = PLencrypt(text,nonce24,sharedKey);
	document.getElementById('decoyPwdIn').value = "";
	document.getElementById('decoyText').value = "";
	return cipher;
};

//decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_single as appropriate
function Decrypt_single(){
	callKey = 'decrypt';
	var decoyOn = document.getElementById("decoymode").checked,
		keymsg = document.getElementById("keymsg"),
		mainmsg = document.getElementById("mainmsg"),
		lockmsg = document.getElementById("lockmsg");
	keymsg.innerHTML = "";
	mainmsg.innerHTML = "";
	if(document.getElementById('lockBox').value.slice(0,1) == '~') decryptItem();			//if Lock or shared Key is encrypted, decrypt it
	var name = lockmsg.innerHTML,
		cipherstr = XSSfilter(document.getElementById('mainBox').innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,'')),	//remove HTML tags that might have been introduced and extra spaces
		lockBoxItem = document.getElementById('lockBox').value.trim().split('\n')[0];
	if (cipherstr == ""){
			mainmsg.innerHTML = 'Nothing to lock or unlock';
			throw("main box empty");
	};
	cipherstr = bestOfThree(cipherstr);
	cipherstr = applyRScode(cipherstr,true);														//RS error correction													

	//here detect if the message is for multiple recipients, and if so call the appropriate function
	var cipherArray = cipherstr.split('%');
	if(cipherArray.length > 3){
		if (cipherArray[1].length == 9){
			Decrypt_List(cipherArray);
			
			var typetoken = document.getElementById('mainBox').innerHTML;
			if (typetoken.length == 107){											//chat invite detected, so open chat
				document.getElementById('mainBox').innerHTML = '';
				var date = typetoken.slice(0,43).trim();				//the first 43 characters are for the date and time etc.
				if(date != ''){
					var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
				}else{
					var msgStart = ""
				}
				var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location.");
				if(reply===false){
					document.getElementById('mainBox').innerHTML = '';
					throw("chat start canceled");
				}
				if(isSafari || isIE || isiOS){
					mainmsg.innerHTML = 'Sorry, but chat is not yet supported by your browser or OS';
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

	if (type == "~"){																//secret Key encrypted item, such as a complete locDir database
		if (learnOn){
			var reply = confirm("The message in the main box was locked with your secret Key, and will now be unlocked if your secret Key has been entered. If it is a database it will be placed in the Locks screen so you can merge it into the stored database. If it contains settings, they will replace your current setings, including the email/token.  Cancel if this is not what you want.");
			if(reply == false) throw("secret Key decryption canceled");
		};
		cipherstr = '~' + cipherstr;													//add back the type indicator, since RS code was made with it
		cipherstr = applyRScode(cipherstr,true);
		var key = readKey();
		document.getElementById('lockBox').value = keyDecrypt(cipherstr);
		if(document.getElementById('lockBox').value.slice(0,6) == 'myself'){		//string contains settings; add them after confirmation
			var reply = confirm("If you click OK, the settings from the backup will replace the current settings, possibly including a random token. This cannot be undone.");
			if (reply == false) throw("settings restore canceled");

			mergeLockDB();
			document.getElementById("mainmsg").innerHTML = 'The settings have been replaced with those in this backup';
			document.getElementById('lockBox').value = ''
		}else{																		//stored local directory; display so it can be edited
			if(document.getElementById('basicmode').checked) basic2adv();
			document.getElementById("lockmsg").innerHTML = 'Extracted items. Click <strong>Merge</strong> to add them to the local directory.';
			main2lock();
		}
	}

	else if (type == "@"){							//symmetric decryption
		if (learnOn){
			var reply2 = confirm("The message in the main box was locked with a shared Key, and will now be unlocked if the same Key is present in the Locks box. The result will replace the locked message. Cancel if this is not what you want.");
			if(reply2 == false) throw("sym decryption canceled");
		};
		if (lockBoxItem == ''){
			mainmsg.innerHTML = '<span style="color:red">Enter shared Key</span>';
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
			document.getElementById('mainBox').innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainmsg.innerHTML = 'Unlock successful';
	}
	
	else if (type == "#"){							//signed decryption
		if (learnOn){
			var reply = confirm("The message in the main box was locked with your Lock and the sender's Key, and will now be unlocked, replacing the locked message, if your secret Key has been entered. Cancel if this is not what you want.");
			if(reply == false) throw("signed decryption canceled");
		};
		if (strippedLockBox == ''){
			mainmsg.innerHTML = "<span style='color:red'>Identify the sender or enter his/her Lock</span>";
			throw("lock box empty");
		}
		readKey();
		if (locDir[name] == null){
			name = lockBoxItem;							//try again using the string in the lockBox as name, not stripped
		}
		if (locDir[name] && fullAccess) var sharedKeycipher = locDir[name][1];
		if (sharedKeycipher != null){
			var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeycipher))
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
			document.getElementById('mainBox').innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainmsg.innerHTML = 'Unlock successful';
	}

	else if (type == "!"){					//short anonymous decryption
		if (learnOn){
			var reply = confirm("The short message in the main box was locked with your personal Lock, and will now be unlocked if your secret Key has been entered, replacing the locked message. Cancel if this is not what you want.");
			if(reply == false) throw("public decryption canceled");
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
			document.getElementById('mainBox').innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()};
		mainmsg.innerHTML = 'Unlock successful';
	}
		
	else if(type == "$"|| type == "*"){			//PFS and read-once decryption
		if (learnOn){
			var reply2 = confirm("The message in the main box was locked in a forward secrecy mode, and will now be unlocked if the sender has been selected. The result will replace the locked message. Cancel if this is not what you want.");
			if(reply2 == false) throw("PFS decryption canceled");
		};
		readKey();
		if (lockBoxItem == ''){
			mainmsg.innerHTML = '<span style="color:red">Select the sender</span>';
			throw("PFS sender empty");
		}	
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainmsg.innerHTML = 'The sender must be in the directory';
			throw('sender not in directory')
		}
		var Lock = replaceByItem(lockBoxItem,false);					//if it's a name in the box, get the real item
		if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true); 		//replace ezLok with standard
		var	keystr = lockBoxItem,
			noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr)),
			newLockcipher = cipherstr.slice(12,91);
		cipherstr = cipherstr.slice(91);
		
		var lastKeycipher = locDir[name][2],												//retrieve dummy Key from storage
			turnstring = locDir[name][4];													//this strings says whose turn it is to encrypt
		if (turnstring=='next lock'){
			if(type == '*'){
				window.setTimeout(function(){mainmsg.innerHTML = 'Read-once messages can be unlocked only once'},2000)				
			}
		}
		
		if (lastKeycipher) {
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeycipher));
		} else {																	//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 43){
				var lastKey = KeyDH;
			}else{
				var lastKey = wiseHash(Lock,noncestr);								//shared Key: use directly
			}
		}
		
		if (Lock.length == 43){									//assuming this is a Lock, not a shared Key. See below for the other case
			if (locDir[name] && fullAccess){										//get permanent shared Key from storage, or make it if not stored
				var dualKeycipher = locDir[name][1];
			}else if(locDir[lockBoxItem] && fullAccess){							//get name from Lock box instead of message
				name = lockBoxItem;
				var dualKeycipher = locDir[name][1];
			}
			if (dualKeycipher != null){
				var dualKey = nacl.util.decodeBase64(keyDecrypt(dualKeycipher))
			} else {																//no shared key found, so making a new one
				var dualKey = makeShared(convertPubStr(Lock),KeyDH);
				if (locDir[name] && fullAccess) {
					locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(dualKey));
					localStorage[userName] = JSON.stringify(locDir);
					
					if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
				}
			}
		} else {														//this when it's a regular shared Key in common with the sender
			var	dualKey = wiseHash(Lock,noncestr);						//nonce is used as salt for regular shared Keys
		}
		var newLock = PLdecrypt(newLockcipher,nonce24,dualKey);
		
		if(type == '$'){																//PFS mode
			var	sharedKey = makeShared(newLock,lastKey);
		}else{																			//Read-once mode
																
			var lastLockcipher = locDir[name][3];										//read-once mode uses last Key and last Lock
			if (lastLockcipher) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockcipher)
			} else {																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		try{
			var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
			if(!plain) failedDecrypt();
			document.getElementById('mainBox').innerHTML = decodeURI(plain).trim();
		}catch(err){failedDecrypt()}
		mainmsg.innerHTML = 'Unlock successful';
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
	var decoyOn = document.getElementById("decoymode").checked,
		keymsg = document.getElementById("keymsg"),
		mainmsg = document.getElementById("mainmsg"),
		lockmsg = document.getElementById("lockmsg");
	keymsg.innerHTML = "";
	mainmsg.innerHTML = "";
	var name = lockmsg.innerHTML,
		type = cipherArray[0].slice(0,1);													//type is 1st character
	for (var i=0; i < cipherArray.length; i++){
		cipherArray[i] = cipherArray[i].replace(/[^a-zA-Z0-9+/ ]+/g, '')				//take out anything that is not base64
	}
	var noncestr = cipherArray[0].slice(0,20);
	var	nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
	var padding = cipherArray[0].slice(20,120);
	var cipher = cipherArray[cipherArray.length - 1];
	if (type == '!') var pubdumstr = cipherArray[0].slice(120,163);
	var	lockBoxItem = document.getElementById('lockBox').value.trim().split('\n')[0].trim(),	//should be single Lock or shared Key, maybe a name
		Lock = replaceByItem(lockBoxItem,false);			//if it's a name, replace it with the decrypted item, no warning. Locks are stripped of their tags in any case.

	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 				//ezLok case
	if(locDir['myself'] == null && fullAccess) key2any();									//make this entry if it has been deleted
	
	if (decoyOn){																			//decoy decryption of the padding
		if (type == '!'){
			decoyDecrypt(padding,nonce24,pubdumstr);
		}else{
			decoyDecrypt(padding,nonce24,myLock);
		}
	}
	
	//now make the idtag to be searched for, depending on the type of encryption. First the shared Key that encrypts the idtag

	if (type == '#' || type == '$' || type == '*'){				//signed mode first, PFS and Read-once are the same at this point: 'sharedKey' is called 'dualKey' for PFS and Read-once, and is used for making the idtag
		if (learnOn){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key, provided the sender's Lock or shared Key are in the in the Locks box. Cancel if this is not what you want.");
			if(reply == false) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainmsg.innerHTML = "<span style='color:red'>Enter the sender's Lock or shared Key</span>";
			throw("lock box empty");
		}
		readKey();
		if (Lock.length == 43){									//assuming this is a Lock, not a shared Key. See below for the other case
			if (locDir[name] && fullAccess){										//get permanent shared Key from storage, or make it if not stored
				var sharedKeycipher = locDir[name][1];
			}else if(locDir[lockBoxItem] && fullAccess){							//get name from Lock box instead of message
				name = lockBoxItem;
				var sharedKeycipher = locDir[name][1];
			}
			if (sharedKeycipher != null){
				var sharedKey = nacl.util.decodeBase64(keyDecrypt(sharedKeycipher))
			} else {																//no shared key found, so making a new one
				var sharedKey = makeShared(convertPubStr(Lock),KeyDH);
				if (locDir[name] && fullAccess) {
					locDir[name][1] = keyEncrypt(nacl.util.encodeBase64(sharedKey));

					if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
				}
			}
			var stuffForId = myLock;
		} else {														//this when it's a regular shared Key in common with the sender
			var	stuffForId = Lock,
				sharedKey = wiseHash(Lock,noncestr);						//nonce is used as salt for regular shared Keys
		}

	} else {										//anonymous mode
		if (learnOn){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key. Cancel if this is not what you want.");
			if(reply===false) throw("anonymous list decryption canceled");
		}
		if (Lock.length == 43 || Lock == '' || Lock.split('\n').length > 1){		//test for Lock, empty, multiline(video URL, since Lists have been filtered by now) in Lock box, in order to do anonymous Diffie-Hellman using the dummy Lock
			readKey();
			var	sharedKey = makeShared(pubdumstr,KeyDH),
				stuffForId = myLock;
		} else {																//looks like a shared Key in the Lock box: use it as is
			var	stuffForId = Lock,
				sharedKey = wiseHash(Lock,noncestr);
		}
	}
	var idtag = PLencrypt(stuffForId,nonce24,sharedKey).slice(0,9);
	
	//look for the id tag and return the string that follows it
	for (i = 1; i < cipherArray.length; i++){
		if (idtag == cipherArray[i]) {
			var msgkeycipher = cipherArray[i+1];
		}
	}
	if(typeof msgkeycipher == 'undefined'){
		mainmsg.innerHTML = 'No message found for you';
		throw('idtag not found')
	}
	//got the encrypted message key, now decrypt it, and finally the main message. The process for PFS and read-once modes is more involved.
try{
	if (Lock.length != 43 && Lock.length != 0 && type != '$' && type != '*'){
		var msgkey = nacl.secretbox.open(nacl.util.decodeBase64(msgkeycipher),nonce24,sharedKey);
		if(!msgkey) failedDecrypt();
		
	} else if (type != '$' && type != '*'){
		var msgkey = nacl.secretbox.open(nacl.util.decodeBase64(msgkeycipher),nonce24,sharedKey);
		if(!msgkey) failedDecrypt();

	} else if(name == 'myself'){		//encrypted to 'myself' in PFS or Read-once mode is actually in signed mode, but there is a dummy Lock to get rid of first
		msgkeycipher = msgkeycipher.slice(79);
		var msgkey = nacl.secretbox.open(nacl.util.decodeBase64(msgkeycipher),nonce24,sharedKey);
		if(!msgkey) failedDecrypt();
		
//for PFS mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key
	} else {
		var newLockcipher = msgkeycipher.slice(0,79);
		msgkeycipher = msgkeycipher.slice(79);
		var newLock = PLdecrypt(newLockcipher,nonce24,sharedKey);
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainmsg.innerHTML = 'The sender must be in the directory';
			throw('sender not in directory')
		}
		var lastKeycipher = locDir[name][2],												//retrieve dummy Key from storage
			turnstring = locDir[name][4];													//this strings says whose turn it is to encrypt
		if (turnstring=='next lock'){
			if(type == '*'){
				window.setTimeout(function(){mainmsg.innerHTML = 'Read-once messages can be unlocked only once'},2000)				
			}
		}
		if (lastKeycipher != null) {
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeycipher));
		} else {																		//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 43){
				var lastKey = KeyDH;
			}else{
				var lastKey = wiseHash(Lock,noncestr);									//shared Key: use directly
			}
		}
		if(type == '$'){																//PFS mode
			var	sharedKey = makeShared(newLock,lastKey);
		}else{																			//Read-once mode
																
			var lastLockcipher = locDir[name][3];										//read-once mode uses last Key and last Lock
			if (lastLockcipher != null) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockcipher)
			} else {																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}
		var msgkey = nacl.secretbox.open(nacl.util.decodeBase64(msgkeycipher),nonce24,sharedKey);
		if(!msgkey) failedDecrypt();
		locDir[name][3] = keyEncrypt(newLock);										//store the new dummy Lock
		locDir[name][4] = 'next lock';

		if(ChromeSyncOn){																//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}
	
	//final decryption for the main message
	var plainstr = PLdecrypt(cipher,nonce24,msgkey);
	
}catch(err){failedDecrypt()}

	if(XSSfilter(plainstr).slice(0,9) != 'filename:') plainstr = LZString.decompressFromBase64(plainstr);		//encoded files are not compressed
	document.getElementById('mainBox').innerHTML = plainstr;
	
	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	if (!decoyOn) mainmsg.innerHTML = 'Unlock successful';
	callKey = '';
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,nonce24,dummylock){
	var mainmsg = document.getElementById("mainmsg");
	mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("Decoy mode is selected. If you go ahead, a dialog will ask you for the decoy Password. Cancel if this is not what you want.");
		if(reply == false) throw("decoy decrypt canceled");
	}
	if (document.getElementById('decoyPwdOut').value.trim() == ""){					//stop to display the decoy key entry form if there is no key entered
		document.getElementById("decoyOut").style.display = "block";
		document.getElementById("shadow").style.display = "block";
		if(!isMobile) document.getElementById('decoyPwdOut').focus();
		throw ("stopped for decoy input")
	}
	var keystr = document.getElementById('decoyPwdOut').value;
	keystr = replaceByItem(keystr,false);											//use stored item, if it exists
	document.getElementById('decoyPwdOut').value = ""
	if(!document.getElementById('shareddecOut').checked){							//asymmetric mode, so now make the real encryption key
		dummylock = replaceByItem(dummylock,false);
		var lockstripped = striptags(dummylock);
		if (lockstripped.length == 50) lockstripped = changeBase(lockstripped.toLowerCase(), BASE36, BASE64, true);	
		var email = readEmail();
		var sharedKey = makeShared(lockstripped,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keystr,email)).secretKey));
	}else{
		var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));
	}
	try{
		var plain = PLdecrypt(cipher,nonce24,sharedKey);
		mainmsg.innerHTML = 'Hidden message: <span style="color:blue">' + decodeURI(plain) + '</span>'
	}catch(err){failedDecrypt()}
};

//adds Schnorr signature to the contents of the main box 
function applySignature(){
	callKey = 'sign';
	var keymsg = document.getElementById("keymsg"),
		mainmsg = document.getElementById("mainmsg"),
		mainBox = document.getElementById('mainBox');
		keymsg.innerHTML = "";
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("A signature matching the contents of the main box will be made using your secret Key, and the resulting signature will be added to the end of the main box. Cancel if this is not what you want.");
		if(reply == false) throw("signature canceled");
	};
	readKey();
	var text = reallyTrim(document.getElementById('mainBox').innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,''));
	var outString = '%';
	if(document.getElementById('attached').checked){
		outString = outString + nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(text), KeySgn)).replace(/=+$/,'')
		if (!document.getElementById("notags").checked){
			if(document.getElementById('ReedSol').checked){
				mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple("PL22sig=" + outString + calcRStag(outString) + "=PL22sig")
			}else{
				mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple("PL22sig=" + outString + "=PL22sig")
			}
		}else{
			mainBox.innerHTML = mainBox.innerHTML + "<br><br>" + triple(outString)
		}
		mainmsg.innerHTML = 'Signature attached to text'
	}else{
		if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);
		var outString = outString + nacl.util.encodeBase64(nacl.sign(nacl.util.decodeUTF8(text), KeySgn)).replace(/=+$/,'')
		if (!document.getElementById("notags").checked){
			if(document.getElementById('ReedSol').checked){
				mainBox.innerHTML = triple("PL22sld=" + outString + calcRStag(outString) + "=PL22sld")
			}else{
				mainBox.innerHTML = triple("PL22sld=" + outString + "=PL22sld")
			}
		}else{
			mainBox.innerHTML = triple(outString)
		}
		mainmsg.innerHTML = 'The text has been sealed with your secret Key. It is <span class="blink">NOT LOCKED</span>'
	}
	callKey = '';
};

//verifies the Schnorr signature of the plaintext, calls applySignature as appropriate.
function verifySignature(){
	var keymsg = document.getElementById("keymsg"),
		lockmsg = document.getElementById("lockmsg"),
		mainmsg = document.getElementById("mainmsg");
		keymsg.innerHTML = "";
		mainmsg.innerHTML = "";
	var text = document.getElementById('mainBox').innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,'').trim();					//newline-related formatting is ignored
	if (text == ""){																	//nothing in text box
		mainmsg.innerHTML = '<span style="color:red">Nothing to sign or verify</span>';
		throw("no text")
	}
	if(document.getElementById('lockBox').value.slice(0,1)=='~') decryptItem();
	var	sigstr = text.split(/\r?\n/);
		sigstr = sigstr[sigstr.length-1];										//this is a signature if added as last line of text
		sigstr = XSSfilter(sigstr).replace(/&[^;]+;/g,'').replace(/\s/g,'');	//remove HTML tags and special characters, spaces that might have been added
		sigstr = bestOfThree(sigstr);
	var sigstr = applyRScode(sigstr,true);
	if (sigstr.charAt(0) != '%'){															//no signature present, therefore make one
		applySignature();
		return
	}
	if (learnOn && sigstr.length == 87){
		var reply = confirm("The text in the main box has been signed with somebody's secret Key. I will now verify if the signature is correct for this text and the matching Lock, which should be selected on the local directory, and will display the result as a message. Cancel if this is not what you want.");
		if(reply == false) throw("signature verification canceled");
	} else if(learnOn){
		var reply = confirm("The item in the main box has been sealed with somebody's secret Key. I will now check the matching Lock, which should be selected on the local directory, and will display the unsealed message inside. Cancel if this is not what you want.");
		if(reply == false) throw("seal verification canceled");
	}
	var	Lock = document.getElementById('lockBox').value.trim();
	if (Lock == ""){
		mainmsg.innerHTML = 'Select a Lock to verify or unseal an item';
		throw("no Lock present")
	}
		Lock = striptags(Lock);
	if (Lock.length != 43 && Lock.length != 50){											//not a Lock, but maybe it's a name
		if (locDir[Lock]){
			var name = Lock;
			Lock = replaceByItem(Lock,false)
		}
	}else{
		var name = document.getElementById('lockmsg').innerHTML
	}
	if (Lock.length == 50) Lock = changeBase(Lock.toLowerCase(), BASE36, BASE64, true) 		//ezLok replaced by regular Lock
	if (Lock.length != 43){
		mainmsg.innerHTML = '<span style="color:red">Enter a valid Lock</span>';
		throw("invalid public key")
	}
	var signature = nacl.util.decodeBase64(sigstr.slice(1));
	if(sigstr.length == 87){						//verification of detached signature
		text = text.replace(/\r?\n?[^\r\n]*$/, "");												//remove last line; next do the checking
		var check = nacl.sign.detached.verify(nacl.util.decodeUTF8(reallyTrim(text)), signature, nacl.util.decodeBase64(Lock));
		if (check) {
			mainmsg.innerHTML = '<span style="color:green"><strong>The signature is VERIFIED for ' + name + '</strong></span>'
		} else {
			mainmsg.innerHTML = '<span style="color:magenta"><strong>The signature has FAILED verification for ' + name + '</strong></span>'
		}
	}else{											//unsealing of sealed message
		var result = nacl.sign.open(signature, nacl.util.decodeBase64(Lock));
		if(result){
			mainmsg.innerHTML = '<span style="color:green"><strong>Seal ownership is VERIFIED for ' + name + '</strong></span>'
		}else{
			mainmsg.innerHTML = '<span style="color:magenta"><strong>The seal has FAILED to verify for ' + name + '</strong></span>'
		}
	}
	if(result){
		var resultstr = nacl.util.encodeUTF8(result);
		if(XSSfilter(resultstr).slice(0,9) != 'filename:') resultstr = LZString.decompressFromBase64(resultstr);
		document.getElementById('mainBox').innerHTML = resultstr;
	}
};

//remove non-breaking spaces as well as spaces when trimming; useful for signatures
function reallyTrim(string){
	return string.trim().replace(/^(\&nbsp; )+/,'').replace(/(\&nbsp;)+$/,'').trim().replace(/^(\&nbsp;)+/,'').replace(/( \&nbsp;)+$/,'').trim()
}