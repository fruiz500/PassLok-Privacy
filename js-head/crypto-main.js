﻿//function that starts it all when the Decrypt button is pushed
function lock(lockBoxHTML,plainText){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 10 ms delay
		Encrypt_Single(lockBoxHTML,plainText);
		updateButtons()
	},10);
}

//function that starts it all when the Decrypt button is pushed
function unlock(type,cipherText,lockBoxHTML){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 10 ms delay
		Decrypt_Single(type,cipherText,lockBoxHTML);
		updateButtons()
	},10);
}

//Encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
//This function handles short mode encryption only (no List). Otherwise, Encrypt_List() is called
function Encrypt_Single(lockBoxItem,text){
	callKey = 'encrypt';
	if(lockBoxItem == ""){
		mainMsg.textContent = 'You must select a stored Lock or shared Key, or click Edit and enter one.';
		throw("Lock box empty")
	}

	if(lockBoxItem.length*entropyPerChar > (mainBox.textContent.length+9)*8 && lockBoxItem.length > 43){		//special mode for long keys, first cut
		padEncrypt(text);
		return
	}

	var listArray = lockBoxItem.replace(/<div>/g,'<br>').replace(/<\/div>/g,'').split('<br>');		//see if this is actually several Locks rather than one

	var lockBoxNoVideo = listArray[0].trim(),					//strip video URL, if any
		lockBoxHold = lockBoxNoVideo,								//to hold it in case it is a name
		LockStr = replaceByItem(lockBoxNoVideo),				//if it's the name of a stored item, use the decrypted item instead, if not and it isn't a Lock, there will be a warning. This function removes tags and non-base64 chars from true Locks only
		name = lockMsg.textContent;
	
	if(LockStr.split('|').length == 3){																//key is three strings separated by bars: human-computable encryption
		lockBox.textContent = LockStr;
		humanEncrypt(text,true);
		return
	}	
	
	if(longMode.checked){							//Encrypt_Single() handles only short and compatible modes, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray,text);
		return
	}else if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainMsg.textContent = 'Short and Compatible modes not available for multiple recipients';
		throw('multiple Locks for short mode')
	}	

	if(locDir[lockBoxNoVideo]) name = lockBoxNoVideo;
	if (LockStr.length == 50) LockStr = changeBase(LockStr.toLowerCase().replace(/l/g,'L'), base36, base64, true); 		//ezLok replaced by regular Lock
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		nonceStr = nacl.util.encodeBase64(nonce),
		clipped = false;
	if(shortMode.checked){
		text = encodeURI(text).replace(/%20/g,' ')
	}
	
		//now we do the different encryption modes
	if(LockStr.length != 43 && !onceMode.checked){				//shared Key-locked mode, if no true Lock is entered
		if(learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("sym encryption canceled")
		}
		var sharedKey = wiseHash(LockStr,nonceStr);		//use the nonce for stretching the user-supplied Key
		if(shortMode.checked){
			if (text.length > 94) clipped = true;  			//94-char capacity
			text = text.slice(0,94);
			while (text.length < 94) text += ' '
		}
		var cipher = PLencrypt(text,nonce24,sharedKey,compatMode.checked);				//will compress if not a short message
		if(learnMode.checked){
			alert(name + " will need to place the same Key in the Locks box to decrypt the message in the main box.")
		}	

		var outString = nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'');			//1st character is g
		if(compatMode.checked){
			if(fileMode.checked){
				if(textMode.checked){
					mainBox.innerHTML = '<a download="PL24msg.txt" href="data:,' + outString + '"><b>PassLok 2.4 shared Key encrypted message (text file)</b></a>'
				}else{
					mainBox.innerHTML = '<a download="PL24msg.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok 2.4 shared Key encrypted message (binary file)</b></a>'
				}
			}else{
				mainBox.innerHTML = "<pre>" + ("PL24msg==" + outString + "==PL24msg").match(/.{1,80}/g).join("<br>") + "</pre>"
			}
		}else{
			mainBox.textContent = outString
		}
	}

	else if(signedMode.checked){					//signed mode, make encryption key from secret Key and recipient's Lock
		if(learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("signed encryption canceled")
		}
		refreshKey();
		if(!locDir[name] && locDir[lockBoxHold]) name = lockBoxHold;				//get name from Lock area
		var sharedKey = makeShared(convertPub(nacl.util.decodeBase64(LockStr)),KeyDH);
		if(shortMode.checked){
			if (text.length > 94) clipped = true;  						//94-char capacity
			text = text.slice(0,94);
			while (text.length < 94) text += ' '
		}
		var cipher = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if(learnMode.checked){
			alert(lockMsg + " will need your Lock and his/her secret Key to decrypt the message in the main box.");
		}

		var outString = nacl.util.encodeBase64(concatUint8Arrays([176],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'');			//1st character is s
		if(compatMode.checked){
			if(fileMode.checked){
				if(textMode.checked){
					mainBox.innerHTML = '<a download="PL24mss.txt" href="data:,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Signed message (text file)</b></a>'
				}else{
					mainBox.innerHTML = '<a download="PL24msg.plk" href="data:binary/octet-stream;base64,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Signed message (binary file)</b></a>'
				}
			}else{
				mainBox.innerHTML = "<pre>" + ("PL24mss==" + myezLock + '//////' + outString + "==PL24mss").match(/.{1,80}/g).join("<br>") + "</pre>"
			}
		}else{
			mainBox.textContent = outString
		}
	}

	else if(anonMode.checked){								//anonymous mode, using only the recipient's Lock
		if(learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted with the Lock in the Locks box and the result will be placed in the main box. This is irreversible. Cancel if this is not what you want.");
			if(!reply) throw("public encryption canceled")
		}
		if(name == '') name = "the recipient";
		var secdum = nacl.randomBytes(32),							//make dummy Key
			pubdum = makePub(secdum),							//matching dummy Lock
			sharedKey = makeShared(convertPub(nacl.util.decodeBase64(LockStr)),secdum);
		if(shortMode.checked){
			if (text.length > 62) clipped = true;  			//62-char capacity because of the dummy Lock
			text = text.slice(0,62);
			while (text.length < 62) text += ' '
		}
		var cipher = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if(learnMode.checked){
			alert(name + " will need to place his/her secret Key in the key box to decrypt the message in the main box.");
		}

		var outString = nacl.util.encodeBase64(concatUint8Arrays([104],concatUint8Arrays(nonce,concatUint8Arrays(pubdum,cipher)))).replace(/=+$/,'');			//1st character is a
		if(compatMode.checked){
			if(fileMode.checked){
				if(textMode.checked){
					mainBox.innerHTML = '<a download="PL24msa.txt" href="data:,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Anonymous message (text file)</b></a>'
				}else{
					mainBox.innerHTML = '<a download="PL24msa.plk" href="data:binary/octet-stream;base64,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Signed message (binary file)</b></a>'
				}
			}else{
				mainBox.innerHTML = "<pre>" + ("PL24msa==" + myezLock + '//////' + outString + "==PL24msa").match(/.{1,80}/g).join("<br>") + "</pre>"
			}
		}else{
			mainBox.textContent = outString
		}
	}

	else if(onceMode.checked){									//Read-once mode
		if(name == 'myself'){
			mainMsg.textContent = 'You cannot encrypt for yourself in Read-once mode';
			return
		}
		if(learnMode.checked){
			var reply3 = confirm("The contents of the main box will be encrypted so it can only be read once, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply3) throw("Read-once encryption canceled")
		};
		if(locDir[name] == null){
			mainMsg.textContent = "In Read-once mode the recipient's Lock must be stored";
			throw('name not on locDir')
		}
		refreshKey();

		var lastKeyCipher = locDir[name][1],
			lastLockCipher = locDir[name][2],
			turnstring = locDir[name][3],
			secdum = nacl.randomBytes(32);

		if(lastKeyCipher){
			var lastKey = keyDecrypt(lastKeyCipher,true)		//use array output option
		}else{													//use new dummy Key if stored dummy doesn't exist, warn user
			var lastKey = secdum,
				pfsMessage = true
		}

		if(lastLockCipher){										//if dummy exists, decrypt it first
			var lastLock = keyDecrypt(lastLockCipher,true);
		}else{													//use permanent Lock if dummy doesn't exist
			if(LockStr.length == 43){
				var lastLock = convertPub(nacl.util.decodeBase64(LockStr))					//Lock is actually a signing public key; must be converted
			}else{
				var lastLock = makePub(wiseHash(LockStr,nonceStr))		//if actually a shared Key, make the Lock deriving from it
			}
			var resetMessage = true
		}
		var sharedKey = makeShared(lastLock,lastKey);

		if (turnstring != 'lock'){								//if out of turn don't change the dummy Key, this includes reset
			if(turnstring == 'reset'){var resetMessage = true }else{ var pfsMessage = true};
			if(lastLockCipher){
				if(LockStr.length == 43){
					var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,makeShared(lastLock,KeyDH))
				}else{
					var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,makeShared(lastLock,wiseHash(LockStr,nonceStr)))
				}
			}else{
				var	dualKey = getDualKey(LockStr,nonceStr),
					newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,dualKey)
			}

		}else{														//normal Read-once algorithm
			var pubdum = makePub(secdum);
			if(lastLockCipher){
				if(lastKeyCipher){
					var newLockCipher = nacl.secretbox(pubdum,nonce24,sharedKey)
				}else{
					if(LockStr.length == 43){
						var newLockCipher = nacl.secretbox(pubdum,nonce24,makeShared(lastLock,KeyDH))
					}else{
						var newLockCipher = nacl.secretbox(pubdum,nonce24,makeShared(lastLock,wiseHash(LockStr,nonceStr)))
					}
				}
			}else{
				var dualKey = getDualKey(LockStr,nonceStr),
					newLockCipher = nacl.secretbox(pubdum,nonce24,dualKey)
			}
		}

		if(turnstring == 'lock' || !lastKeyCipher){
			locDir[name][1] = keyEncrypt(secdum);			//new Key is stored in the permanent database, except if repeat
		}
		if(turnstring != 'reset') locDir[name][3] = 'unlock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){									//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

		if(shortMode.checked){
			if (text.length > 46) clipped = true;  			//46-character capacity
			text = text.slice(0,46);
			while (text.length < 46) text += ' '
		}
		var cipher = PLencrypt(text,nonce24,sharedKey,compatMode.checked);
		if(learnMode.checked){
			alert(name + " will need to select you in his/her directory to decrypt the message.")
		};
		if(resetMessage){						//1st character is r
			var outString = nacl.util.encodeBase64(concatUint8Arrays([172],concatUint8Arrays(nonce,concatUint8Arrays(newLockCipher,cipher)))).replace(/=+$/,'')
		}else if(pfsMessage){					//1st character is p
			var outString = nacl.util.encodeBase64(concatUint8Arrays([164],concatUint8Arrays(nonce,concatUint8Arrays(newLockCipher,cipher)))).replace(/=+$/,'')
		}else{									//1st character is o
			var outString = nacl.util.encodeBase64(concatUint8Arrays([160],concatUint8Arrays(nonce,concatUint8Arrays(newLockCipher,cipher)))).replace(/=+$/,'')
		}

		if(compatMode.checked){				//prepend ezLock in compatibility mode
			if(fileMode.checked){
				if(textMode.checked){
					mainBox.innerHTML = '<a download="PL24mso.txt" href="data:,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Read-once message (text file)</b></a>'
				}else{
					mainBox.innerHTML = '<a download="PL24mso.plk" href="data:binary/octet-stream;base64,' + myezLock + '//////' + outString + '"><b>PassLok 2.4 Read-once message (binary file)</b></a>'
				}
			}else{
				mainBox.innerHTML = "<pre>" + ("PL24mso==" + myezLock + '//////' + outString + "==PL24mso").match(/.{1,80}/g).join("<br>") + "</pre>"
			}
		}else{
			mainBox.textContent = outString
		}
	}

	mainMsg.textContent = 'Encryption successful';
	if (clipped) mainMsg.textContent = "The message has been truncated";
	if (pfsMessage) mainMsg.textContent = "This message will become un-decryptable when it is replied to";
	if (resetMessage) mainMsg.textContent = "This message has no forward secrecy. The recipient will be advised to delete it after reading it";

	decoyText.value = "";
	decoyPwdIn.value = "";
	decoyPwdOut.value = "";
	callKey = ''
}

//concatenates two uint8 arrays, normally used right before displaying the output
function concatUint8Arrays(array1,array2){
	var result = new Uint8Array(array1.length + array2.length);
	result.set(array1,0);
	result.set(array2,array1.length);
	return result
}

//makes the permanent shared Key. Used by PFS and normal Read-once modes
function getDualKey(LockStr,nonceStr){
	if (LockStr.length == 43){
		return makeShared(convertPub(nacl.util.decodeBase64(LockStr)),KeyDH)
	}else{
		return wiseHash(LockStr,nonceStr)					//"Lock" is actually a permanent shared Key, unstripped
	}
}

//encrypts for a list of recipients. First makes a 256-bit message key, then gets the Lock or shared Key for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 64 bits of an encrypted form of the recipient's item, so he/she can find the right encrypted key
function Encrypt_List(listArray,text){
	if(shortMode.checked){
		mainMsg.textContent = 'Short mode not available for multiple recipients';
		throw('short mode not available')
	}
	var lengthLimit = 71000;
	if(emailMode.checked && mainBox.textContent.length > lengthLimit){
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
			if(locDir[name] == null) {					//not on database; see if it's a Lock, and if not add to warning list
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
	var recipients = listArray.length;
	
	if ((warningList != '') && (recipients > 1)){
		var agree = confirm('The names on the list below were not found in your local directory. If you click OK, they will be used as shared Keys for encrypting and decrypting the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	if (warningList2 != ''){
		var agree = confirm('The names on the list below are for shared Keys, not Locks, and are not allowed for encryption in Email mode. If you click OK, they will be ignored:\n\n' + warningList2);
		if (!agree) throw('list encryption terminated by user')	
	}
	if(recipients == 0){
		mainMsg.textContent = 'No valid recipients for this mode';
		throw('no valid recipients left')
	}else if(recipients > 255){
		mainMsg.textContent = 'Maximum number of recipients is 255';
		throw('too many recipients')
	}
	
	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		nonceStr = nacl.util.encodeBase64(nonce),
		isChatInvite = text.length == 107 && !text.slice(-43).match(' ');			//detect chat invitation, for final display
	if (anonMode.checked) {
		if(learnMode.checked){
			var reply = confirm("The contents of the main box will be anonymously encrypted with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list encryption canceled");
		}
		var outArray = new Uint8Array(2);	
		outArray[0] = 0;												//will become "A" in base64
		outArray[1] = recipients
		
	} else if(onceMode.checked){
		if(learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted in Read-once mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. It will not encrypt for yourself. Cancel if this is not what you want.");
			if(!reply) throw("Read-once list encryption canceled")
		}
		var outArray = new Uint8Array(2);	
		outArray[0] = 56;												//will become "O" in base64
		outArray[1] = recipients
	} else {
		if(learnMode.checked){
			var reply = confirm("The contents of the main box will be encrypted with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(!reply) throw("signed list encryption canceled")
		}
		var outArray = new Uint8Array(2);	
		outArray[0] = 72;												//will become "S" in base64
		outArray[1] = recipients
	}

	if(anonMode.checked) {											//for anonymous mode, make dummy Lock. Make padding in all modes
		var secdum = nacl.randomBytes(32),
			pubdum = makePub(secdum)
	}else{
		refreshKey()
	}
	
	if(anonMode.checked){
		var padding = decoyEncrypt(75,secdum)				//fits a complete ezLock; results in 100 bytes
	}else{
		var padding = decoyEncrypt(75,KeyDH)					//won't work for a recipient defined by a shared Key, who won't have the sender's Lock loaded (matching KeyDH)
	}

	var cipher = PLencrypt(text,nonce24,msgKey,true);				//main encryption event including compression, but don't add the result yet

	outArray = concatUint8Arrays(outArray,concatUint8Arrays(nonce,padding));

	if(anonMode.checked) outArray = concatUint8Arrays(outArray,pubdum);					//for anonymous mode, add the dummy Lock now

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext obtained when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for(var index = 0; index < recipients; index++){
		var name = listArray[index].trim();
		if(name != ''){
			var LockStr = replaceByItem(name);							//returns item if the name is on directory. Locks are stripped
			if(LockStr.length == 50) LockStr = changeBase(LockStr.toLowerCase().replace(/l/g,'L'), base36, base64, true) 		//get Lock from ezLok

	//if it's a Lock, do anonymous, Read-once or signed encryption, and add the result to the output. Same if, not being a Lock, Read-Once mode is selected. Shared Key case at the end of all this
			if(LockStr.length == 43  || onceMode.checked){
				if(LockStr.length == 43) var Lock = nacl.util.decodeBase64(LockStr);
				if(signedMode.checked){
					var sharedKey = makeShared(convertPub(Lock),KeyDH),
						cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
						idTag = nacl.secretbox(Lock,nonce24,sharedKey).slice(0,8)

				}else if (anonMode.checked){
					var sharedKey = makeShared(convertPub(Lock),secdum),
						cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
						idTag = nacl.secretbox(Lock,nonce24,sharedKey).slice(0,8)

				}else if (onceMode.checked){
					if(locDir[name] == null){
						if(locDir[lockMsg.textContent] != null && listArray.length == 1){
							name = lockMsg.textContent
						} else {
							mainMsg.textContent = "In Read-once mode, recipients' Locks must be stored";
							throw('name not on locDir')
						}
					}

				  if(name != 'myself'){								//can't do Read-once to myself
				  	var lastKeyCipher = locDir[name][1],
						lastLockCipher = locDir[name][2],				//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
						turnstring = locDir[name][3],
						secdum = nacl.randomBytes(32)							//different dummy key for each recipient
	
					if(turnstring == 'reset'){
						var typeByte = [172],								//becomes 'r' in base64
							resetMessage = true
					}else if(turnstring == 'unlock'){
						var typeByte = [164],								//becomes 'p' in base64
							pfsMessage = true
					}else{
						var typeByte = [160]								//becomes 'o' in base64
					}

					if(lastKeyCipher){
						var lastKey = keyDecrypt(lastKeyCipher,true)		//keep as a byte array
					}else{													//use new dummy Key if stored dummy doesn't exist
						var lastKey = secdum;
						if(!resetMessage){
							typeByte = [164];
							var pfsMessage = true
						}
					}

					if(!turnstring){									//so that an initial message is seen the same as a reset mesage
						typeByte = [172];
						var resetMessage = true
					}
					
					if(lastLockCipher){										//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher,true)
					}else{													//use permanent Lock if dummy doesn't exist
						if(Lock){
							var lastLock = convertPub(Lock)
						}else{
							var lastLock = makePub(wiseHash(LockStr,nonceStr))	//if actually a shared Key, make the Lock deriving from it
						}
					}

					if(lastLockCipher){
						if(Lock){
							var idKey = makeShared(lastLock,KeyDH);
						}else{
							var idKey = makeShared(lastLock,wiseHash(LockStr,nonceStr));
						}
					}else{
						var idKey = getDualKey(LockStr,nonceStr);
					}

					var sharedKey = makeShared(lastLock,lastKey);

					var cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey);

					if(Lock){
						var idTag = nacl.secretbox(Lock,nonce24,idKey).slice(0,8)
					}else{
						var idTag = PLencrypt(LockStr,nonce24,idKey).slice(0,8)
					}

					if(turnstring != 'lock'){															//if out of turn don't change the dummy Key, this includes reset
						var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,idKey)
					}else{
						var	newLockCipher = nacl.secretbox(makePub(secdum),nonce24,idKey)
					}
					
					if(turnstring == 'lock' || !lastKeyCipher){
						locDir[name][1] = keyEncrypt(secdum)										//new Key is stored in the permanent database, unless repeat or empty
					}
					if(turnstring != 'reset') locDir[name][3] = 'unlock';

					if(ChromeSyncOn && chromeSyncMode.checked){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(locDir[name]))
					}
				  }else{
					if(listArray.length < 2){
						mainMsg.textContent = 'In Read-once mode, you must select recipients other than yourself.';
						throw('only myself for Read-once')
					}
				  }
				}

			}else{
		//if it's not a Lock (and not PFS or Read-Once), do a symmetric encryption instead, with appropriate key stretching. ID tag based on the shared Key encrypted by itself (stretched)
				var sharedKey = wiseHash(LockStr,nonceStr),
					cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
					idTag = nacl.secretbox(nacl.util.decodeUTF8(LockStr),nonce24,sharedKey).slice(0,8)
			}

			//now add the idTag (first 8 bytes only) and encrypted arrays to the output array, and go to the next recipient
			if(onceMode.checked){				//these include encrypted ephemeral Locks, not the other types
				if(name != 'myself') outArray = concatUint8Arrays(outArray,concatUint8Arrays(idTag,concatUint8Arrays(cipher2,concatUint8Arrays(typeByte,newLockCipher))))
			}else{
				outArray = concatUint8Arrays(outArray,concatUint8Arrays(idTag,cipher2))
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags and encoding to base64
	var outString = nacl.util.encodeBase64(concatUint8Arrays(outArray,cipher)).replace(/=+$/,'');

	if(anonMode.checked){
		if(fileMode.checked){
			if(textMode.checked){
				mainBox.innerHTML = '<a download="PL24msa.txt" href="data:,' + outString + '"><b>PassLok 2.4 Anonymous message (text file)</b></a>'
			}else{
				mainBox.innerHTML = '<a download="PL24msa.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok 2.4 Anonymous message (binary file)</b></a>'
			}
		}else{
			mainBox.innerHTML = "<pre>" + ("PL24msa==" + outString + "==PL24msa").match(/.{1,80}/g).join("<br>") + "</pre>"
		}
	}else if(onceMode.checked){
		if(fileMode.checked){
			if(textMode.checked){
				mainBox.innerHTML = '<a download="PL24mso.txt" href="data:,' + outString + '"><b>PassLok 2.4 Read-once message (text file)</b></a>'
			}else{
				mainBox.innerHTML = '<a download="PL24mso.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok 2.4 Read-once message (binary file)</b></a>'
			}
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Read-once message encrypted with PassLok--------==<br><br>' + (myezLock + '//////' + outString).match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Read-once message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL24mso==" + outString + "==PL24mso").match(/.{1,80}/g).join("<br>") + "</pre>"
		}
	}else{
		if(fileMode.checked){
			if(textMode.checked){
				mainBox.innerHTML = '<a download="PL24mss.txt" href="data:,' + outString + '"><b>PassLok 2.4 Signed message (text file)</b></a>'
			}else{
				mainBox.innerHTML = '<a download="PL24mss.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok 2.4 Signed message (binary file)</b></a>'
			}
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Signed message encrypted with PassLok--------==<br><br>' + (myezLock + '//////' + outString).match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Signed message encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL24mss==" + outString + "==PL24mss").match(/.{1,80}/g).join("<br>") + "</pre>"
		}
	}
	if(isChatInvite){
		if(fileMode.checked){
			if(textMode.checked){
				mainBox.innerHTML = '<a download="PL24chat.txt" href="data:,' + outString + '"><b>PassLok 2.4 Chat invitation (text file)</b></a>'
			}else{
				mainBox.innerHTML = '<a download="PL24chat.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok 2.4 Chat Invitation (binary file)</b></a>'
			}
		}else if(emailMode.checked){
			mainBox.innerHTML = '<pre>----------begin Chat invitation encrypted with PassLok--------==<br><br>' + (myezLock + '//////' + outString).match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Chat invitation encrypted with PassLok-----------</pre>'
		}else{
			mainBox.innerHTML = "<pre>" + ("PL24chat==" + outString + "==PL24chat").match(/.{1,80}/g).join("<br>") + "</pre>"
		}
	}

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);
	mainMsg.textContent = 'Encryption successful. Select and copy.'
	if (pfsMessage) mainMsg.textContent = "Delayed forward secrecy for at least one recipient";
	if (resetMessage) mainMsg.textContent = "No forward secrecy for at least one recipient, who will be warned of the fact";
	callKey = '';
}

//just to shuffle the array containing the recipients' Locks so no one can tell the order
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

//encrypts a hidden message into the padding included with list encryption, or makes a random padding also encrypted so it's indistinguishable
function decoyEncrypt(length,secKey){
	if (decoyMode.checked){
		if(learnMode.checked){
			var reply = confirm("You are adding a hidden message. Cancel if this is not what you want, then uncheck Hidden msg. in Options.");
			if(!reply) throw("decoy encryption canceled")
		}
		if((decoyPwdIn.value.trim() == "")||(decoyText.value.trim() == "")){ 		//stop to display the decoy entry form if there is no hidden message or key
			decoyIn.style.display = "block";											//display decoy form, and back shadow
			shadow.style.display = "block";
			if(!isMobile) decoyText.focus();
			throw ("stopped for decoy input")
		}
		var keyStr = decoyPwdIn.value,
			text = encodeURI(decoyText.value.replace(/%20/g,' '));
			nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce);

		keyStr = replaceByItem(keyStr);													//if in database, get the real item
		var keyStripped = stripTags(keyStr);

		if(keyStripped.length == 43 || keyStripped.length == 50){							//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase().replace(/l/g,'L'), base36, base64, true) //ezLok replaced by regular Lock
			var sharedKey = makeShared(convertPub(nacl.util.decodeBase64(keyStripped)),secKey)
		}else{
			var sharedKey = wiseHash(keyStr,nacl.util.encodeBase64(nonce))					//symmetric encryption for true shared key
		}

		while(text.length < length) text = text + ' ';											//add spaces to make the number of characters required
		if(text.length > length) text = text.slice(0,length);									//truncate if needed
		var cipher = concatUint8Arrays(nonce,PLencrypt(text,nonce24,sharedKey))
	}else{
		var cipher = nacl.randomBytes(length + 25)												//no decoy mode so padding is random; add 25 to account for mac and nonce
	}
	decoyPwdIn.value = "";
	decoyText.value = "";
	return cipher;
};

//decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_Single as appropriate
function Decrypt_Single(type,cipherStr,lockBoxHTML){
	callKey = 'decrypt';
	keyMsg.textContent = "";
	mainMsg.textContent = "";

	if(cipherStr == ""){
			mainMsg.textContent = 'Nothing to encrypt or decrypt';
			throw("main box empty")
	}
	
	var isCompressed = false;
	if(cipherStr.slice(50,56).match('//////') && !cipherStr.slice(0,50).match(/[^0-9a-kLm-z]/)){	//if it comes from PassLok for Email or SeeOnce
		cipherStr = extractLock(cipherStr);																		//get or enter sender	
		lockBoxHTML = lockBox.innerHTML.trim();
		if(!cipherStr.charAt(0).match(/[gasoprASO]/)){														//check for allowed types after prepended Lock and separator
			mainMsg.textContent = 'Unrecognized message format';
			return
		}
		isCompressed = true													//will be used to get the right encoding
	}
	
	if(lockBoxHTML.slice(0,1) == 'k') decryptItem();			//if Lock or shared Key is encrypted, decrypt it
	var name = lockMsg.textContent,
		lockBoxLines = lockBoxHTML.replace(/<div>/g,"<br>").replace(/<\/div>/g,"").split('<br>'),
		lockBoxItem = lockBoxLines[0],
		strippedLockBox = stripTags(lockBoxItem);		//this holds a Lock or shared Key (or a name leading to it). if there is a video URL, it gets stripped, as well as any non-base64 chars

	if(type == 'd' && lockBoxHTML.length > 43){padDecrypt(cipherStr);openChat();return}		//special encrypting mode for long keys
	
	if(type == 'h')	{																		//special human encrypted mode
		lockBox.textContent = replaceByItem(lockBoxItem);
		if(lockBox.textContent.split('|').length != 3){
			mainMsg.textContent = 'Please supply a correct Key for human decryption: three strings separated by commas';
			return
		}
		humanEncrypt(cipherStr,false);													//when set to false the process decrypts
		return
	}

	//here detect if the message is for multiple recipients, and if so call the appropriate function
	if(type.match(/[ASO]/)){
		Decrypt_List(type,cipherStr);
		openChat();
		return
	}

	if(type.match(/[gsopr]/)){															//only one sender allowed in some modes
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.textContent = "Please select a single sender";
				throw("too many lines in Lock box");
			}
		}
	}

	if(cipherStr.length != 160 && isBase64) isCompressed = true;				//detect URSA and compatible mode messages, which are compressed

	if(type == "k"){																//secret Key-encrypted item, such as a complete locDir database
		if(learnMode.checked){
			var reply = confirm("The message in the main box was encrypted with your secret Key, and will now be decrypted if your secret Key has been entered. If it is a database it will be placed in the Locks screen so you can merge it into the stored database. If it contains settings, they will replace your current setings, including the email/token.  Cancel if this is not what you want.");
			if(!reply) throw("secret Key decryption canceled")
		}
		refreshKey();					
		lockBox.innerHTML = keyDecrypt(cipherStr);			//decryption step

		if(lockBox.textContent.slice(0,6) == 'myself'){		//string contains settings; add them after confirmation
			var reply = confirm("If you click OK, the settings from the backup will replace the current settings, possibly including a random token. This cannot be undone.");
			if(!reply) throw("settings restore canceled");

			mergeLockDB();
			mainMsg.textContent = 'The settings have been replaced with those in this backup';
			lockBox.textContent = ''
		}else{																		//stored local directory; display so it can be edited
			setTimeout(function(){lockMsg.textContent = 'Extracted items. Click Merge to add them to the local directory.'},10);
			if(!advancedMode.checked) mode2adv();
			main2lock()
		}

	}else if(type == "g"){							//symmetric decryption
		if(learnMode.checked){
			var reply2 = confirm("The message in the main box was encrypted with a shared Key, and will now be decrypted if the same Key is present in the Locks box. The result will replace the encrypted message. Cancel if this is not what you want.");
			if(!reply2) throw("sym decryption canceled")
		}
		var fullArray = nacl.util.decodeBase64(cipherStr),
			nonce = fullArray.slice(1,10),								//9 bytes
			nonce24 = makeNonce24(nonce),
			nonceStr = nacl.util.encodeBase64(nonce),
			cipher = fullArray.slice(10);		
		if(lockBoxItem == ''){
			mainMsg.textContent = 'Enter shared Key or select the sender';
			throw("symmetric key empty")
		}
		lockBoxItem = replaceByItem(lockBoxItem);						//if it's a name in the box, get the real item
		var	keyStr = lockBoxItem;
		if(keyStr.length == 43){
			var sharedKey = nacl.util.decodeBase64(keyStr)				//sender's Lock, likely from an invitation email
		}else if(keyStr.length == 50){
			var sharedKey = nacl.util.decodeBase64(changeBase(keyStr.toLowerCase().replace(/l/g,'L'),base36,base64))		//sender's ezLok, likely from an invitation email
		}else{
			var sharedKey = wiseHash(keyStr,nonceStr)					//real shared Key
		}

		var plain = PLdecrypt(cipher,nonce24,sharedKey,isCompressed,'symmetric');			//main decryption instruction	

		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())					//make sure non-allowed tags and attributes are disabled
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.textContent = 'Decryption successful';
																		//additional text to accompany an invitation
		if(keyStr.length == 43 || keyStr.length == 50){
			mainBox.innerHTML = "This is my message to you:<blockquote><em>" + mainBox.innerHTML + "</em></blockquote><br>PassLok is now ready to encrypt your reply so that only I can decrypt it.<br><br>To do this, click <strong>Clear</strong>, type your message, select my name in the directory, and then click <strong>Encrypt</strong>. Optionally, you can select a different encryption mode at the bottom of the screen before you click the button. Then you can copy and paste it into your favorite communications program or click <strong>Email</strong> to send it with your default email.<br><br>If this is a computer, you can use rich formatting if you click the <strong>Rich</strong> button."
		}

	}else if(type == "s"){							//signed decryption
		if(learnMode.checked){
			var reply = confirm("The message in the main box was encrypted with your Lock and the sender's Key, and will now be decrypted, replacing the encrypted message, if your secret Key has been entered. Cancel if this is not what you want.");
			if(!reply) throw("signed decryption canceled")
		}
		if(strippedLockBox == ''){
			mainMsg.textContent = "Identify the sender or enter his/her Lock";
			throw("Lock box empty")
		}
		refreshKey();
		if(locDir[name] == null){
			name = lockBoxItem							//try again using the string in the lockBox as name, not stripped
		}
		strippedLockBox = replaceByItem(lockBoxItem);
		if (strippedLockBox.length == 50) strippedLockBox = changeBase(strippedLockBox.toLowerCase().replace(/l/g,'L'), base36, base64, true); 	//replace ezLok with standard
		var sharedKey = makeShared(convertPub(nacl.util.decodeBase64(strippedLockBox)),KeyDH),
			fullArray = nacl.util.decodeBase64(cipherStr),
			nonce = fullArray.slice(1,10),
			nonce24 = makeNonce24(nonce),
			cipher = fullArray.slice(10);

		var plain = PLdecrypt(cipher,nonce24,sharedKey,isCompressed,'signed');			//decryption step

		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.textContent = 'Decryption successful'

	}else if(type == "a"){					//short anonymous decryption
		if(learnMode.checked){
			var reply = confirm("The short message in the main box was encrypted with your personal Lock, and will now be decrypted if your secret Key has been entered, replacing the encrypted message. Cancel if this is not what you want.");
			if(!reply) throw("public decryption canceled")
		}
		refreshKey();
		var fullArray = nacl.util.decodeBase64(cipherStr),
			nonce = fullArray.slice(1,10),
			pubdum = fullArray.slice(10,42),
			nonce24 = makeNonce24(nonce),
			sharedKey = makeShared(pubdum,KeyDH),
			cipher = fullArray.slice(42);

		var plain = PLdecrypt(cipher,nonce24,sharedKey,isCompressed,'anon');			//decryption step

		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}
		mainMsg.textContent = 'Decryption successful'

	}else if(type == "o" || type == "p" || type == "r"){			//Read-once and PFS decryption, may be SeeOnce
		if(learnMode.checked){
			var reply2 = confirm("The message in the main box was encrypted in Read-once mode, and will now be decrypted if the sender has been selected. The result will replace the encrypted message. Cancel if this is not what you want.");
			if(!reply2) throw("Read-once decryption canceled")
		}
		refreshKey();
		if(lockBoxItem == ''){
			mainMsg.textContent = 'Select the sender';
			throw("Read-once sender empty")
		}
		if(name == 'myself'){
			mainMsg.textContent = 'You cannot make a Read-once message to yourself. It must be from someone else';
			throw('Read-once message to myself')			
		}
		if(!locDir[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the Lock box
		if(!locDir[name]){											//if it still doesn't work, message and bail out
			mainMsg.textContent = 'The sender must be in the directory';
			throw('sender not in directory')
		}

		if(type == 'r'){											//if a reset message, delete ephemeral data first, after recipient agrees
			var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
			if(!agree) throw('reset decrypt canceled');
			locDir[name][1] = locDir[name][2] = null;
			var isReset = true
		}

		var LockStr = replaceByItem(lockBoxItem);					//if it's a name in the box, get the real item
		if(LockStr.length == 50) LockStr = changeBase(LockStr.toLowerCase().replace(/l/g,'L'), base36, base64, true); 		//replace ezLok with standard
		var	keyStr = lockBoxItem,
			fullArray = nacl.util.decodeBase64(cipherStr),
			nonce = fullArray.slice(1,10),
			nonce24 = makeNonce24(nonce),
			nonceStr = nacl.util.encodeBase64(nonce),
			newLockCipher = fullArray.slice(10,58),
			cipher = fullArray.slice(58);

		var lastKeyCipher = locDir[name][1],												//retrieve dummy Key from storage
			turnstring = locDir[name][3];													//this strings says whose turn it is to encrypt
		if(turnstring=='lock' && type=='o'){
			window.setTimeout(function(){mainMsg.textContent = 'Read-once messages can be decrypted only once'},2000)
		}

		if(lastKeyCipher) {
			var lastKey = keyDecrypt(lastKeyCipher,true)
		}else{																	//if a dummy Key doesn't exist, use permanent Key
			if(LockStr.length == 43){
				var lastKey = KeyDH
			}else{
				var lastKey = wiseHash(LockStr,nonceStr)							//shared Key: use directly
			}
		}

		if(type == 'p' || type == 'r'){												//retrieve ephemeral Lock in PFS and reset modes
			if(lastKeyCipher){
				if(LockStr.length == 43){
					var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPub(nacl.util.decodeBase64(LockStr)),lastKey));
					if(!newLock) failedDecrypt('read-once')
				}else{
					var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(makePub(wiseHash(LockStr,nacl.util.encodeBase64(nonce))),lastKey));
					if(!newLock) failedDecrypt('read-once')
				}
			}else{
				var dualKey = getDualKey(LockStr,nonceStr),
					newLock = nacl.secretbox.open(newLockCipher,nonce24,dualKey);
				if(!newLock) failedDecrypt('read-once')
			}
			var	sharedKey = makeShared(newLock,lastKey)

		}else{																			//retrieve ephemeral Lock in proper Read-once mode
			var lastLockCipher = locDir[name][2];										//read-once mode uses last Key and last Lock
			if(lastKeyCipher){
				if(lastLockCipher){
					var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(keyDecrypt(lastLockCipher,true),lastKey));
					if(!newLock) failedDecrypt('read-once')
				}else{
					if(LockStr.length == 43){
						var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(convertPub(nacl.util.decodeBase64(LockStr)),lastKey));
						if(!newLock) failedDecrypt('read-once')
					}else{
						var newLock = nacl.secretbox.open(newLockCipher,nonce24,makeShared(makePub(wiseHash(LockStr,nonceStr)),lastKey));
						if(!newLock) failedDecrypt('read-once')
					}
				}
			}else{
				var dualKey = getDualKey(LockStr,nonceStr),
					newLock = nacl.secretbox.open(newLockCipher,nonce24,dualKey);
					if(!newLock) failedDecrypt('read-once')
			}
			if(lastLockCipher) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockCipher,true)
			}else{																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey)
		}

		var plain = PLdecrypt(cipher,nonce24,sharedKey,isCompressed,'read-once');		//main decryption step

		if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
		}else{
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
		}

		locDir[name][2] = keyEncrypt(newLock);										//store the new ephemeral Lock
		locDir[name][3] = 'lock';
		if(fullAccess) localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){									//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
		setTimeout(function(){														//give it some time before displaying this
			if(isReset){
				mainMsg.textContent = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'			
			}else if(type == 'o'){
				mainMsg.textContent = 'Decryption successful. This message cannot be decrypted again'
			}else if(type == 'p'){
				mainMsg.textContent = 'Decryption successful. This message will become un-decryptable after you reply'
			}else{
				mainMsg.textContent = 'Decryption successful'
			}
		},10);
	}else{
		Encrypt_Single(lockBoxHTML,cipherStr)										//none of the known encrypted types, therefore encrypt rather than decrypt
	}
	openChat();
	callKey = ''
}

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Anonymous, or Read-once. For Signed and Anonymous modes, it is possible that a shared Key has been used rather than a Lock.
function Decrypt_List(type,cipherStr){
	keyMsg.textContent = "";
	var name = lockMsg.innerHTML,														//keep the formatting if there are several lines
		cipherInput = nacl.util.decodeBase64(cipherStr),
		recipients = cipherInput[1],										//number of recipients. '0' reserved for special cases
		nonce = cipherInput.slice(2,17),									//15 bytes
		nonce24 = makeNonce24(nonce),
		nonceStr = nacl.util.encodeBase64(nonce),
		padding = cipherInput.slice(17, 117);							//100 bytes

	if(type == 'A'){
		var pubdum = cipherInput.slice(117,149);							//retrieve ephemeral lock
		cipherInput = cipherInput.slice(149)
	}else{
		cipherInput = cipherInput.slice(117)
	}

	//now cut the rest of the input into pieces. First ID tags and their respective encrypted keys etc., then the ciphertext
	var cipherArray = new Array(recipients);
	if(type != 'O'){													//shorter pieces in Anonymous and Signed modes
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(56*i,56*(i+1))		//8 bytes for ID, 48 for encrypted key
		}
		var cipher = cipherInput.slice(56*recipients)
	}else{																//longer pieces in Read-once mode
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(105*i,105*(i+1))		//8 bytes for ID, 48 for encrypted ephemeral Lock, 48 for encrypted key, 1 for type
		}
		var cipher = cipherInput.slice(105*recipients)
	}

	var lockBoxItem = lockBox.innerHTML.replace(/<br>$/,"").trim().replace(/<div>/g,'<br>').replace(/<\/div>/g,'').split('<br>')[0],
		LockStr = replaceByItem(lockBoxItem);					//if it's a name, replace it with the decrypted item. Locks are stripped of their tags in any case.
	if(!locDir[name] && locDir[lockBoxItem]) name = lockBoxItem;	//name placed in the box

	if(LockStr.length == 50) LockStr = changeBase(LockStr.toLowerCase().replace(/l/g,'L'), base36, base64, true) 				//ezLok case
	if(LockStr.length == 43) var Lock = nacl.util.decodeBase64(LockStr);
	if(locDir['myself'] == null && fullAccess) key2any();									//make this entry if it has been deleted

	if(decoyMode.checked){																	//decoy decryption of the padding
		if(type == 'A'){
			decoyDecrypt(padding,pubdum)
		}else{
			if(Lock){
				decoyDecrypt(padding,convertPub(Lock))					//works since KeyDH was used for encryption
			}else{
				decoyDecrypt(padding)										//main shared Key case. Will trigger an error message if the decoy key was asymmetric
			}
		}
	}

	//now make the idTag to be searched for, depending on the type of encryption
	if(LockStr.length == 43 || (LockStr == '' && type == 'A')){
		var stuffForId = myLock
	}else{
		var stuffForId = nacl.util.decodeUTF8(LockStr)
	}
	if(type == 'O' && name == 'myself'){
		mainMsg.textContent = 'You cannot make a Read-once message to yourself. It must be from someone else';
		throw('Read-once message to myself')
	}
	if(type == 'S'){											//signed mode first
		if(learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key, provided the sender's Lock or shared Key are selected on the directory, or entered directly after pressing Edit. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if(LockStr == ''){
			mainMsg.textContent = "Enter the sender's Lock or shared Key";
			throw("Lock box empty");
		}
		var lockBoxLines = lockBox.innerHTML.trim().split('<br>').filter(Boolean);
		if(lockBoxLines.length > 1){
			if(lockBoxLines[1].slice(0,4) != 'http'){
				mainMsg.textContent = "Please select a single sender";
				throw("too many lines in Lock box");
			}
		}
		refreshKey();
		if(Lock){														//assuming this is a Lock, not a shared Key. See below for the other case
			if(!locDir[name] && locDir[lockBoxItem]) name = lockBoxItem;
			var sharedKey = makeShared(convertPub(Lock),KeyDH),
				idKey = sharedKey;
		}else{														//this when it's a regular shared Key in common with the sender
			var	sharedKey = wiseHash(LockStr,nonceStr),						//nonce is used as salt for regular shared Keys
				idKey = sharedKey;
		}

	}else if(type == 'A'){										//anonymous mode
		if(learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key. Cancel if this is not what you want.");
			if(!reply) throw("anonymous list decryption canceled");
		}
		var LockSplit = LockStr.split('\n');
		if(LockSplit.length > 1) var isVideo = (LockSplit[1].slice(0,4) == 'http');
		if(LockStr.length == 43 || LockStr == '' || isVideo){		//test for Lock, empty, video URL, in order to do anonymous Diffie-Hellman using the dummy Lock
			refreshKey();
			var	sharedKey = makeShared(pubdum,KeyDH),
				idKey = sharedKey;
		}else{																//looks like a shared Key in the Lock box: use it as is
			var	sharedKey = wiseHash(LockStr,nonceStr),
				idKey = sharedKey;
		}

	}else if(type == 'O'){														//Read-once mode
		if(learnMode.checked){
			var reply = confirm("The contents of the message in the main box will be decrypted with your secret Key, provided the sender's Lock or shared Key are selected on the directory, or entered directly after pressing Enter. Cancel if this is not what you want.");
			if(!reply) throw("signed list decryption canceled");
		}
		if(LockStr == ''){
			mainMsg.textContent = "Enter the sender's Lock or shared Key";
			throw("Lock box empty");
		}
		refreshKey();
		if(locDir[name]){
			var	lastKeyCipher = locDir[name][1],
				lastLockCipher = locDir[name][2],
				turnstring = locDir[name][3];										//this strings says whose turn it is to encrypt
			if(turnstring == 'lock'){											//set message in case decryption fails
				window.setTimeout(function(){mainMsg.textContent = 'Read-once messages can be decrypted only once'},2000)
			}
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = keyDecrypt(lastKeyCipher,true);
			if(Lock){
				var idKey = makeShared(convertPub(Lock),lastKey)
			}else{
				var idKey = makeShared(makePub(wiseHash(LockStr,nonceStr)),lastKey)
			}
		}else{														//if a dummy Key doesn't exist, use permanent Key
			if(Lock){
				var lastKey = KeyDH
			}else{
				var lastKey = wiseHash(LockStr,nonceStr)									//shared Key: use directly
			}
			var idKey = getDualKey(LockStr,nonceStr)
		}
	}else{															//no known type, so encrypt rather than decrypt
		Encrypt_List(lockBox.innerHTML.replace(/<br>$/,"").trim().replace(/<div>/g,'<br>').replace(/<\/div>/g,'').split('<br>'),cipherStr);
		return
	}

	if(Lock || (LockStr == '' && type == 'A')){
		var idTag = nacl.secretbox(stuffForId,nonce24,idKey).slice(0,8)
	}else{
		var idTag = PLencrypt(LockStr,nonce24,idKey).slice(0,8)
	}

	//look for the id tag and return the bytes that follows it
	for(i = 0; i < recipients; i++){
		var success = true;
		for(var j = 0; j < 8; j++){									//just the first 8 bytes
			success = success && (idTag[j] == cipherArray[i][j])		//find the idTag bytes at the start of cipherArray[i]
		}
		if(success){
			var msgKeycipher = cipherArray[i].slice(8)
		}
	}

	if(typeof msgKeycipher == 'undefined'){							//may have been reset, so try again
		if(LockStr){
			if(Lock){
				lastKey = KeyDH
			}else{
				lastKey = wiseHash(LockStr,nonceStr)
			}
			idKey = getDualKey(LockStr,nonceStr);
			idTag = nacl.secretbox(stuffForId,nonce24,idKey).slice(0,8);
			for(i = 0; i < recipients; i++){
				var success = true;
				for(var j = 0; j < 8; j++){
					success = success && (idTag[j] == cipherArray[i][j])	
				}
				if(success){
					var msgKeycipher = cipherArray[i].slice(8)
				}
			}
		}
		if(typeof msgKeycipher == 'undefined'){						//now really give up
			if(!decoyMode.checked) mainMsg.textContent = 'No message found for you';
			throw('idTag not found')
		}
	}

	//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
	if(type != 'O'){					//anonymous and signed modes
		var msgKey = nacl.secretbox.open(msgKeycipher,nonce24,sharedKey);
		if(!msgKey) failedDecrypt('signed');

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last byte
	}else{
		var	typeByte = msgKeycipher.slice(48,49),
			newLockCipher = msgKeycipher.slice(49),
			newLock = nacl.secretbox.open(newLockCipher,nonce24,idKey);
		msgKeycipher = msgKeycipher.slice(0,48);
		if(!newLock) failedDecrypt('read-once');

		if(typeByte[0] == 164){														//PFS mode: last Key and new Lock
			var	sharedKey = makeShared(newLock,lastKey);

		}else if(typeByte[0] == 172){													//reset. lastKey is the permanent, or symmetric key
			var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
			if(!agree) throw('reset decrypt canceled');
			var	sharedKey = makeShared(newLock,lastKey);
			locDir[name][1] = locDir[name][2] = null									//if reset type, delete ephemeral data first

		}else{																			//Read-once mode: last Key and last Lock
			var lastLockCipher = locDir[name][2];
			if(lastLockCipher != null){												//if stored dummy Lock exists, decrypt it
				var lastLock = keyDecrypt(lastLockCipher,true)
			}else{																	//use new dummy if no stored dummy
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey)
		}

		var msgKey = nacl.secretbox.open(msgKeycipher,nonce24,sharedKey);
		if(!msgKey) failedDecrypt('read-once');
		locDir[name][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
		locDir[name][3] = 'lock';

		if(ChromeSyncOn && chromeSyncMode.checked){									//change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}

	//final decryption for the main message, plus decompression
	var plainstr = PLdecrypt(cipher,nonce24,msgKey,true);
	mainBox.innerHTML = safeHTML(plainstr);											//non-whitelisted tags and attributes disabled

	if(fullAccess) localStorage[userName] = JSON.stringify(locDir);				//everything OK, so store
	if (!decoyMode.checked){
		if(typeByte){
			if(typeByte[0] == 172){
				mainMsg.textContent = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
			}else if(typeByte[0] == 160){
				mainMsg.textContent = 'Decryption successful. This message cannot be decrypted again'
			}else if(typeByte[0] == 164){
				mainMsg.textContent = 'Decryption successful. This message will become un-decryptable after you reply'
			}
		}else{
			mainMsg.textContent = 'Decryption successful'
		}
	}
	callKey = ''
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,dummyLock){
	if(learnMode.checked){
		var reply = confirm("Hidden message mode is selected. If you go ahead, a dialog will ask you for the special Key or Lock for this. Cancel if this is not what you want.");
		if(!reply) throw("decoy decrypt canceled")
	}
	if (decoyPwdOut.value.trim() == ""){					//stop to display the decoy key entry form if there is no key entered
		decoyOut.style.display = "block";
		shadow.style.display = "block";
		if(!isMobile) decoyPwdOut.focus();
		throw ("stopped for decoy input")
	}
	var keyStr = decoyPwdOut.value;
	keyStr = replaceByItem(keyStr);													//use stored item, if it exists
	decoyPwdOut.value = "";

	var nonce = cipher.slice(0,9),
		cipherMsg = cipher.slice(9),
		nonce24 = makeNonce24(nonce),
		sharedKey = wiseHash(keyStr,nacl.util.encodeBase64(nonce)),				//try symmetric first
		plain = nacl.secretbox.open(cipherMsg,nonce24,sharedKey);
	if(!plain){																			//try asymmetric
		var email = readEmail();
		if(dummyLock){
			sharedKey = makeShared(dummyLock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keyStr,email)).secretKey))
		}else{
			failedDecrypt('decoy')
		}
		plain = nacl.secretbox.open(cipherMsg,nonce24,sharedKey);
		if(!plain) failedDecrypt('decoy')											//now give up
	}
	mainMsg.innerHTML = 'Hidden message: <span style="color:blue">' + safeHTML(decodeURI(nacl.util.encodeUTF8(plain))) + '</span>'		//color the hidden message
}