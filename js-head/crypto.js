var encrypting;		//global flag so decoy input doesn't get confused
	
//AES encryption process: determines the kind of encryption by looking at the radio buttons and check boxes under the main box and the length of the presumed Lock
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

	if(document.getElementById('mainBox').innerHTML.length == 130){		//same length as a chat invite. Give warning and stop
		mainmsg.innerHTML = 'This message can be mistaken for a chat invite<br>Make it shorter or longer';
		return
	}

	if(!shortOn){								//Encrypt_single() handles only short mode, otherwise Encrypt_List() is used instead
		Encrypt_List(listArray);
		return
	}
	if (listArray.length > 1 && listArray[1].slice(0,4) != 'http'){			//this is a List, which is not compatible with short mode, video URLs on 2nd line don't count
		mainmsg.innerHTML = '<span style="color:red">Short mode not available for multiple recipients</span>';
		throw('multiple Locks for short mode')
	}
	var lockBoxNoVideo = listArray[0].trim();						//strip video URL, if any
	var	lockBoxHold = lockBoxNoVideo;								//to hold it in case it is a name
	var Lock = replaceByItem(lockBoxNoVideo,true);			//if it's the name of a stored item, use the decrypted item instead, if not and it isn't a Lock, there will be a warning. This function removes tags and non-base64 chars from true Locks only
	if (Lock.length == 100) Lock = changeBase(Lock.toLowerCase(), BASE38, BASE64, true) 		//ezLok replaced by regular Lock

//now we do the different encryption modes

	if(Lock.length != 87 && !pfsOn && !onceOn){							//shared Key-locked mode, if no true Lock is entered
		var sharedKey = Lock;
		if (learnOn){
			var reply3 = confirm("The contents of the main box will be locked with the shared Key in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply3==false) throw("sym encryption canceled");
		};
		var iter = keyStrength(sharedKey,false);										//get number of iterations from Key strength meter
		var iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('2','0')),		//random initialization vector, 11 chars long
			salt = makesalt(iv,sharedKey,37,true),									//salt can hide 37 chars in short mode
			text = encodeURI(document.getElementById('mainBox').innerHTML).replace(/%20/g, ' ');
		if (text.length > 58) clipped = true;
			text = text + "                                                         ";  //clip or add spaces to make a 58 char message
			text = text.slice(0,58);
		var keystr = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(sharedKey,salt,iter,8,1,33));				//scrypt key-stretching is applied here
		var cipherj = JSON.parse(sjcl.encrypt(keystr,text,{"iv":iv,"salt":salt,"ks":256,"iter":101}).replace(/=/g,''));
		if (learnOn){
			alert(name + " will need to place the same Key in the Locks box to unlock the message in the main box.");
		};
		document.getElementById('mainBox').innerHTML = "@" + cipherj.iv + cipherj.salt + cipherj.ct;
		if(isMobile){																	//get ready to put into SMS
			mainmsg.innerHTML = 'Locking successful. Copy and click SMS';
			selectMain()
		}
	}

	else if (pfsOn || onceOn){									//PFS and read-once modes not available for short messages
		mainmsg.innerHTML = 'PFS and Read-once modes are not available for Short messages';
		return
	}

	else if (signedOn){								//signed mode, make encryption key from secret Key and recipient's Lock
		if (learnOn){
			var reply3 = confirm("The contents of the main box will be locked with your secret secret Key and the Lock in the Locks box, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply3 == false) throw("signed encryption canceled");
		};
		var key = readKey();
		var email = readEmail();
		if(!lockDB[name] && lockDB[lockBoxHold]) name = lockBoxHold;					//get name from Lock area
		if (lockDB[name] && fullAccess){
			var sharedKeycipher = lockDB[name][1];
		}
		if (sharedKeycipher != null && fullAccess){
			var sharedKey = keyDecrypt(sharedKeycipher)
		} else {
			var sharedKey = makeshared(key,Lock,email);								//add email to the key
			if (lockDB[name] && fullAccess){
				lockDB[name][1] = keyEncrypt(key,sharedKey);
				localStorage[userName] = JSON.stringify(lockDB)

				if(ChromeSyncOn){											//if Chrome sync is available, change in sync storage
					syncChromeLock(name,JSON.stringify(lockDB[name]))
				}
			}
		}
		var iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('2','0')),
			salt = makesalt(iv,key,37,false),														//salt can hide 37 chars in short mode
			text = encodeURI(document.getElementById('mainBox').innerHTML).replace(/%20/g, ' ');
		if (text.length > 58) clipped = true;
			text = text + "                                                         ";  //clip or add spaces to make a 58 char message
			text = text.slice(0,58);
		var cipherj = JSON.parse(sjcl.encrypt(sharedKey,text,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,''));
		if (learnOn){
			alert(lockmsg + " will need your Lock and his/her secret Key to unlock the message in the main box.");
		};
		document.getElementById('mainBox').innerHTML = "#" + cipherj.iv + cipherj.salt + cipherj.ct;
		if(isMobile){
			mainmsg.innerHTML = 'Locking successful. Copy and click SMS';
			selectMain()
		}
	}

	else if (anonOn){								//anonymous mode, using only the recipient's Lock
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked with the Lock in the Locks box and the result will be placed in the main box. This is irreversible. Cancel if this is not what you want.");
			if(reply == false) throw("public encryption canceled");
		};
		if(name == '') name = "the recipient";
		var secstrdum = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,86),	//make dummy Key
			pubstrdum = makepub(secstrdum,'');														//makes 87 char dummy public key, initial A stripped
		var keystr = makeshared(secstrdum,Lock,'');											//make AES key from dummy secret and recipient's Lock
		var iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('2','0')),						//11 char serial in short mode, no salt
			salt = "",
			text = encodeURI(document.getElementById('mainBox').innerHTML).replace(/%20/g, ' ');
		if (text.length > 38) clipped = true;
			text = text + "                                                         ";  			//clip or add spaces to make a 38 char message
			text = text.slice(0,38);
		var cipherj = JSON.parse(sjcl.encrypt(keystr,text,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,''));   //use 256 bit keys, min stretching for random key
		if (learnOn){
			alert(name + " will need to place his/her secret Key in the key box to unlock the message in the main box.");
		}
		document.getElementById('mainBox').innerHTML = cipherj.iv + cipherj.salt + pubstrdum + cipherj.ct;	//display adding dummy public key and anonymous tags, depending on mode
		if(isMobile){
			mainmsg.innerHTML = 'Locking successful. Copy and click SMS';
			selectMain()
		}
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
			if(lockDB[name] == null) {					//not on database; see if it's a Lock, and otherwise add to warning list
				var namestr = striptags(name);
				if(namestr.length != 87 && namestr.length != 100){
					if (warningList==""){warningList = name} else {warningList = warningList + '\n' + name}
				}
			}
		}
	}
	if ((warningList != '') && (listArray.length > 1)){
		var agree = confirm('The names on the list below were not found in your local directory. If you click OK, they will be used as shared Keys for locking and unlocking the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}

	var	msgkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords('8','0')).slice(0,43),		//message key a little over 256-bit
		iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('4','0')),
		text = document.getElementById('mainBox').innerHTML;
	if (anonOn) {
		if (learnOn){
			var reply = confirm("The contents of the main box will be anonymously locked with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("anonymous list encryption canceled");
		}

		if(tagsOff){														//initial tag
			var outString = "!"
		} else {
			var outString = "PL21msa=!"
		}
	} else if(pfsOn){
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked in PFS mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("PFS list encryption canceled");
		}
		if(tagsOff){
			var outString = "$"
		} else {
			var outString = "PL20msp=$"
		}
	} else if(onceOn){
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked in Read-once mode with the Locks of the recipients listed, so that all of them can read it with their respective Keys, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("Read-once list encryption canceled");
		}
		if(tagsOff){
			var outString = "*"
		} else {
			var outString = "PL20mso=*"
		}
	} else {
		if (learnOn){
			var reply = confirm("The contents of the main box will be locked with the Locks of the recipients listed and signed with your Key, so that all of them can read it by supplying your Lock, and the result will replace the main box. Cancel if this is not what you want.");
			if(reply == false) throw("signed list encryption canceled");
		}
		if(tagsOff){
			var outString = "#"
		} else {
			var outString = "PL21mss=#"
		}
	}
	
	if (anonOn) {											//for anonymous mode, make dummy Lock. Make salt in all modes
		var secstrdum = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,86),
			pubstrdum = makepub(secstrdum,'');
		var salt = makesalt(iv,secstrdum,87,false);
	} else if(signedOn){									//signed mode: no dummy, but Key is needed
		var key = readKey();
		var salt = makesalt(iv,key,152,false);
	} else {												//PFS and Read-once: Key is read, shorter salt
		var key = readKey();
		var salt = makesalt(iv,key,87,false);
	}
	
	if(XSSfilter(text).slice(0,9) != 'filename:') text = LZString.compressToBase64(text);									//compress unless it's a file, which would grow on compression
	var cipherj = JSON.parse(sjcl.encrypt(msgkey,text,{"iv":iv,"salt":salt,"ks":256,"iter":101}).replace(/=/g,''));		//main encryption event, but don't add it yet
	outString = outString + cipherj.iv + cipherj.salt;
	if (anonOn) outString = outString + pubstrdum;						//for anonymous mode, add the dummy lock to the output string

	//for each item on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message iv and salt, and the shared key
	for (var index = 0; index < listArray.length; index++){
		var name = listArray[index].trim();
		if (name != ''){
			var Lock = replaceByItem(name,false);				//returns item if the name is on directory. Locks are stripped
			if (Lock.length == 100) Lock = changeBase(Lock.toLowerCase(), BASE38, BASE64, true) 		//get Lock from ezLok
			if (Lock.length == 87  || pfsOn || onceOn){				//if it's a Lock, do anonymous, PFS or signed encryption, and add the result to the output. Same if, not being a Lock, PFS or Read-Once are selected. Shared Key case at the end of all this
			
				if (signedOn){
					if (key == null) var key = readKey();
					var email = readEmail();
					if(lockDB[name]!=null && fullAccess){
						var sharedKeycipher = lockDB[name][1];			//permanent key shared with recipient, for encrypting the new dummy Lock
						if (sharedKeycipher != null){
							var sharedKey = keyDecrypt(sharedKeycipher);
						} else {
							var sharedKey = makeshared(key,Lock,email);
							lockDB[name][1] = keyEncrypt(key,sharedKey);
							
							if(ChromeSyncOn){
								syncChromeLock(name,JSON.stringify(lockDB[name]))
							}
						}
					} else {											//if the name is not in the directory, make it fresh
						var sharedKey = makeshared(key,Lock,email)
					}
					var	cipherj2 = JSON.parse(sjcl.encrypt(sharedKey,msgkey,{"iv":iv,"salt":salt,"ks":256,"iter": 101})),
						idtag = JSON.parse(sjcl.encrypt(sharedKey,Lock,{"iv":iv,"salt":salt,"ks":256,"iter": 101}));

				} else if (anonOn){
					var sharedKey = makeshared(secstrdum,Lock,'');		//no asymmetric salt used with random keys
					var	cipherj2 = JSON.parse(sjcl.encrypt(sharedKey,msgkey,{"iv":iv,"salt":salt,"ks":256,"iter": 101})),
						idtag = JSON.parse(sjcl.encrypt(sharedKey,Lock,{"iv":iv,"salt":salt,"ks":256,"iter": 101}));

				} else if (pfsOn || onceOn){
					if(lockDB[name] == null){
						if(lockDB[lockmsg.innerHTML] != null && listArray.length == 1){
							name = lockmsg.innerHTML
						} else {
							mainmsg.innerHTML = 'In PFS and Read-once modes, recipient Locks must be stored';
							throw('name not on lockDB')
						}
					}
					if (key == null) var key = readKey();
					var email = readEmail();
					var dualKeycipher = lockDB[name][1],				//this is the permanent shared Key, we'll call it "dual" here
						turnstring = lockDB[name][4];
					if (turnstring=='next unlock'){
						if(onceOn){					//don't allow a switch in read-once mode, since it corrupts the exchange
							mainmsg.innerHTML = 'In Read-once mode, you cannot lock a new message before receiving a reply from all recipients. Use PFS mode instead.';
							throw('read-once locking aborted')						
						}
					}
					if (Lock.length == 87){
						if (dualKeycipher != null){
							var dualKey = keyDecrypt(dualKeycipher);
						} else {
							var dualKey = makeshared(key,Lock,email);
							lockDB[name][1] = keyEncrypt(key,dualKey);
							
							if(ChromeSyncOn){
								syncChromeLock(name,JSON.stringify(lockDB[name]))
							}
						}
						var pfsSalt = ''
					}else{
						var dualKey = Lock;							//actually, a permanent shared Key, unstripped
						var pfsSalt = '';
					}
				  if(name != 'myself'){								//can't do PFS or Read-once to myself, so do a signed one, below
					var lastLockcipher = lockDB[name][3];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
					if (lastLockcipher != null) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockcipher);
					} else {													//use permanent Lock if dummy doesn't exist
						if (Lock.length == 87){
							var lastLock = Lock
						}else{
							var lastLock = makepub(Lock,'');					//if not a proper Lock, make the Lock deriving from it
						}
					}
					var secstrdum = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,87),		//different dummy key for each recipient
						pubstrdum = makepub(secstrdum,'');
					if (pfsOn){
						var sharedKey = makeshared(secstrdum,lastLock,pfsSalt);		//in PFS, use new dummy Key and stored Lock
					}else{
						var lastKeycipher = lockDB[name][2];						//read-once mode uses previous Key and previous Lock
						if (lastKeycipher != null){
							var lastKey = keyDecrypt(lastKeycipher);
							var pfsSalt = ''
						} else {													//use new dummy Key if stored dummy doesn't exist
							var lastKey = secstrdum;
							var pfsSalt = ''
						}
						var sharedKey = makeshared(lastKey,lastLock,pfsSalt);
					}
					lockDB[name][2] = keyEncrypt(key,secstrdum);				//new Key is stored in the permanent database
					lockDB[name][4] = 'next unlock';

					if(ChromeSyncOn){										//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(lockDB[name]))
					}
				//sharedKey depends on the newLock, so use the permanent shared Key instead for making the idtag and encrypting the newLock
					var	cipherj2 = JSON.parse(sjcl.encrypt(sharedKey,msgkey,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,'')),
						idtag = JSON.parse(sjcl.encrypt(dualKey,Lock,{"iv":iv,"salt":salt,"ks":256,"iter": 101})),
						newLockcipher = JSON.parse(sjcl.encrypt(dualKey,pubstrdum,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,''));
						
				  }else{														//don't do PFS to 'myself'; use signed mode instead
					var	cipherj2 = JSON.parse(sjcl.encrypt(dualKey,msgkey,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,'')),
						idtag = JSON.parse(sjcl.encrypt(dualKey,Lock,{"iv":iv,"salt":salt,"ks":256,"iter": 101})),
						dummyLock = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,87),
						newLockcipher = JSON.parse(sjcl.encrypt(dualKey,dummyLock,{"iv":iv,"salt":salt,"ks":256,"iter": 101}).replace(/=/g,''));	//filler
				  }
				}
				
			} else {													//if it's not a Lock (and not PFS or Read-Once), do a symmetric encryption instead, with appropriate key stretching. ID tag based on the shared Key encrypted by itself
				var sharedKey = Lock;
				var iter = keyStrength(sharedKey,false),
					keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(sharedKey,salt,iter,8,1,33)),
					cipherj2 = JSON.parse(sjcl.encrypt(keyStretched,msgkey,{"iv":iv,"salt":salt,"ks":256,"iter":101}).replace(/=/g,'')),
					idtag = JSON.parse(sjcl.encrypt(sharedKey,sharedKey,{"iv":iv,"salt":salt,"ks":256,"iter":101}));
			}
			
			//now add the id and encrypted strings to the output string, and go to the next recipient
			if (pfsOn || onceOn){
				outString = outString + '%' + idtag.ct.slice(0,11) + '%' + newLockcipher.ct + cipherj2.ct;
			} else {
				outString = outString + '%' + idtag.ct.slice(0,11) + '%' + cipherj2.ct;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString = outString + '%' + cipherj.ct
	if (tagsOff) {
			document.getElementById('mainBox').innerHTML = outString
	} else {
		if(anonOn){
			document.getElementById('mainBox').innerHTML = triple(outString + "=" + calcRScode(outString) + "=PL21msa")
		} else if (pfsOn){
			document.getElementById('mainBox').innerHTML = triple(outString + "=" + calcRScode(outString) + "=PL21msp")
		} else if(onceOn){
			document.getElementById('mainBox').innerHTML = triple(outString + "=" + calcRScode(outString) + "=PL20mso")
		} else {
			document.getElementById('mainBox').innerHTML = triple(outString + "=" + calcRScode(outString) + "=PL21mss")
		}
	}
	if(fullAccess) localStorage[userName] = JSON.stringify(lockDB);
	smallOutput();
	mainmsg.innerHTML = 'Locking successful. Select and copy.'
	callKey = '';
}

//decrypts a string encrypted with the secret Key, 11 char serial, no salt, variable key stretching. Returns original if not encrypted
function keyDecrypt(cipherstring){
	if (cipherstring.charAt(0) == '~'){
		var	key = readKey();
		cipherstring = cipherstring.slice(1);							//take out the initial '~'
		var	iv = cipherstring.slice(0,11),
			ct = cipherstring.slice(11,cipherstring.length),
			iter = keyStrength(key,false);
		var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(key,'',iter,8,1,33));
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + '' + '","ct":"' + ct + '","ks":256,"iter":101}';
		try{
			return sjcl.decrypt(keyStretched,cipherstr2)
		}catch(err){failedDecrypt()}
	}else{
		return cipherstring
	}
}

//encrypts a string with the secret Key, 11 char serial, no salt, variable key stretching
function keyEncrypt(key,plainstring){
	var	iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('2','0')),				//minimum iterations = 101
		iter = keyStrength(key,false);
	var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(key,'',iter,8,1,33));
	var cipherj2 = JSON.parse(sjcl.encrypt(keyStretched,plainstring,{"iv":iv,"salt":"","ks":256,"iter":101}).replace(/=/g,''));
	return '~' + cipherj2.iv + cipherj2.ct
}

//encrypts a hidden message into the salt value used by regular encryption, or makes a random salt also encoded by AES so it's indistinguishable
function makesalt(iv,dummykey,leng,keyLocked){
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
		var key = document.getElementById('decoyPwdIn').value,
			text = encodeURI(document.getElementById('decoyText').value.replace(/%20/g, ' '));
			key = replaceByItem(key,false);													//if in database, get the real item
		var keyStripped = striptags(key);
		
		if (keyStripped.length == 87 || keyStripped.length == 100){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 100) keyStripped = changeBase(keyStripped.toLowerCase(), BASE38, BASE64, true) //ezLok replaced by regular Lock			
			if (keyLocked || document.getElementById('anonmode').checked){		//anonymous or Key-locked mode, make shared key from given Lock and dummy key
				key = makeshared(dummykey,keyStripped,'');
			}else{															//signed/PFS mode, make shared key from given Lock and regular Key
				var mykey = readKey();
				var email = readEmail();
				key = makeshared(mykey,keyStripped,email);
			}			
			var iter = 2;
		}else{																		//symmetric encryption
			var iter = keyStrength(key,false);										//key may be weak, so stretch it
		}
		
	} else {																		//no decoy mode, so salt comes from random text and key, no extra stretching
		var key = sjcl.codec.base64.fromBits(sjcl.random.randomWords('8','0')),
			text = sjcl.codec.base64.fromBits(sjcl.random.randomWords('57','0')).slice(0,214),
			iter = 2;
	};
	while (text.length < leng) {															//clip or add spaces to make the number of characters required
			text = text + "          ";
	};
	text = text.slice(0,leng);		
	var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(key,'',iter,8,1,33));
	var cipherj = JSON.parse(sjcl.encrypt(keyStretched,text,{"iv":iv,"salt":"","ks":256,"iter":101}).replace(/=/g,''));
	document.getElementById('decoyPwdIn').value = "";
	document.getElementById('decoyText').value = "";
	return cipherj.ct;
};

//AES decryption process: determines which kind of encryption by looking at first character after the initial tag. Calls Encrypt_single as appropriate
function Decrypt_single(){
	callKey = 'decrypt';
	encrypting = true;
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
		if (cipherArray[1].length == 11){
			Decrypt_List(cipherArray);
			
			var typetoken = document.getElementById('mainBox').innerHTML;
			if (typetoken.length == 130){											//chat invite detected, so open chat
				document.getElementById('mainBox').innerHTML = '';
				var date = typetoken.slice(0,43).trim();				//the first 43 characters are for the date and time etc.
				if(date != ''){
					var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
				}else{
					var msgStart = ""
				}
				var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might leak metadata.");
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
	var type = cipherstr.slice(0,1);											//get encryption type. !=anonymous, @=symmetric, #=signed, $=PFS, ~=Key-encrypted
		cipherstr = cipherstr.replace(/[^a-zA-Z0-9+/ ]+/g, '');					//remove anything that is not base64

	if (cipherstr.length == 160){					//short anonymous decryption
		if (learnOn){
			var reply = confirm("The short message in the main box was locked with your personal Lock, and will now be unlocked if your secret Key has been entered, replacing the locked message. Cancel if this is not what you want.");
			if(reply == false) throw("public decryption canceled");
		};																		//make sure there is no List in Lock box
		var key = readKey();
		var email = readEmail();
		var	iv = cipherstr.slice(0,11),												//get iv, salt, and later ct data and dummy Lock
			salt = "";
		var pubstrdum = cipherstr.slice(11,98);
		var keystr = makeshared(key,pubstrdum,email);
		var	ct = cipherstr.slice(98,cipherstr.length);
		cipherstr = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + ct + '","ks":256,"iter":101}';	//add labels and keylength to data, minimum keystretching
		try{
			document.getElementById('mainBox').innerHTML = decodeURI(sjcl.decrypt(keystr,cipherstr)).trim();
		}catch(err){failedDecrypt()};
		if(!decoyOn) mainmsg.innerHTML = 'Unlock successful'
	}

	else if (type == "~"){																//secret Key encrypted item, such as a complete lockDB database
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
			if(document.getElementById('basicmode').checked) basic2main();
			document.getElementById("lockmsg").innerHTML = 'Extracted items. Click <strong>Merge</strong> to add them to the local directory.';
			main2lock();
		}
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
		var key = readKey();
		var email = readEmail();
		if (lockDB[name] == null){
			name = lockBoxItem;							//try again using the string in the lockBox as name, not stripped
		}
		if (lockDB[name] && fullAccess) var sharedKeycipher = lockDB[name][1];
		if (sharedKeycipher != null){
			var sharedKey = keyDecrypt(sharedKeycipher)
		} else {
			strippedLockBox = replaceByItem(lockBoxItem,false);
			if (strippedLockBox.length == 100) strippedLockBox = changeBase(strippedLockBox.toLowerCase(), BASE38, BASE64, true) 		//replace ezLok with standard
			var sharedKey = makeshared(key,strippedLockBox,email)
			if (lockDB[name] && fullAccess) {
				lockDB[name][1] = keyEncrypt(key,sharedKey);
				localStorage[userName] = JSON.stringify(lockDB);

				if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
					syncChromeLock(name,JSON.stringify(lockDB[name]))
				}
			}
		}
		var	iv = cipherstr.slice(0,11),
			salt = cipherstr.slice(11,71),
			ct = cipherstr.slice(71,cipherstr.length);
		if (decoyOn) decoydecrypt(iv,strippedLockBox,salt);
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + ct + '","ks":256,"iter":101}';
		try{
		if (cipherstr.length == 159){
			document.getElementById('mainBox').innerHTML = decodeURI(sjcl.decrypt(sharedKey,cipherstr2)).trim();
			if (!decoyOn) mainmsg.innerHTML = 'Unlock successful'
		}else{
			document.getElementById('mainBox').innerHTML = decodeURI(sjcl.decrypt(sharedKey,cipherstr2));
			if (!decoyOn) mainmsg.innerHTML = 'Unlock successful'
		}
		}catch(err){failedDecrypt()}
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
		var	iv = cipherstr.slice(0,11),
			salt = cipherstr.slice(11,71),
			ct = cipherstr.slice(71,cipherstr.length);
		var keystr = lockBoxItem;
		if (decoyOn) {
			var decoylock = makepub(keystr,'');
			decoydecrypt(iv,decoylock,salt);
		}
		var iter = keyStrength(keystr,false);										//get number of iterations from Key strength meter
		var keystr=sjcl.codec.base64.fromBits(sjcl.misc.scrypt(keystr,salt,iter,8,1,33));
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + ct + '","ks":256,"iter":101}';
		try{
			document.getElementById('mainBox').innerHTML = decodeURI(sjcl.decrypt(keystr,cipherstr2)).trim();
		}catch(err){failedDecrypt()}
		if (!decoyOn) mainmsg.innerHTML = 'Unlock successful'
	}else{
		Encrypt_single()																//none of the known encrypted types, therefore encrypt rather than decrypt
	};
	callKey = '';
};

//decrypts a message encrypted for multiple recipients. Encryption can be signed, anonymous, or symmetric
function Decrypt_List(cipherArray){
	encrypting = true;
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
	var iv = cipherArray[0].slice(0,22);
	if (type == '!' || type == '$' || type == '*') {			//anonymous, PFS 0r Read-once, shorter salt because of the dummy Locks
		var salt = cipherArray[0].slice(22,149),
			pubstrdum = cipherArray[0].slice(149,236);									//dummy Lock
	} else {
		var salt = cipherArray[0].slice(22,236)
	}
	var ct = cipherArray[cipherArray.length - 1],										//exclude the type flag
		lockBoxItem = document.getElementById('lockBox').value.trim().split('\n')[0].trim();	//should be single Lock or shared Key, maybe a name
	var Lock = replaceByItem(lockBoxItem,false);			//if it's a name, replace it with the decrypted item, no warning. Locks are stripped of their tags in any case.

	if (Lock.length == 100) Lock = changeBase(Lock.toLowerCase(), BASE38, BASE64, true) 				//ezLok case
	if(lockDB['myself'] == null && fullAccess) key2any();									//make this entry if it has been deleted
	
	if (decoyOn){																			//decoy decryption
		if (type == '!'){
			decoydecrypt(iv,pubstrdum,salt);
		}else{
			if (Lock.length == 87){
				var decoylock = Lock
			}else{
				var decoylock = makepub(Lock,'')
			}
			decoydecrypt(iv,decoylock,salt);
		}
	}
	
	//now make the idtag to be searched for, depending on the type of encryption. First the shared Key that encrypts the idtag

	if (type == '#' || type == '$' || type == '*'){				//signed mode first, PFS and Read-once the same at this point
		if (learnOn){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key, provided the sender's Lock or shared Key are in the in the Locks box. Cancel if this is not what you want.");
			if(reply == false) throw("signed list decryption canceled");
		}
		if (Lock == ''){
			mainmsg.innerHTML = "<span style='color:red'>Enter the sender's Lock or shared Key</span>";
			throw("lock box empty");
		}
		if (key == null) var key = readKey();
		var email = readEmail();
		if (Lock.length == 87){									//assuming this is a Lock, not a shared Key. See below for the other case
			if (lockDB[name] && fullAccess){										//get permanent shared Key from storage, or make it if not stored
				var sharedKeycipher = lockDB[name][1];
			}else if(lockDB[lockBoxItem] && fullAccess){							//get name from Lock box instead of message
				name = lockBoxItem;
				var sharedKeycipher = lockDB[name][1];
			}
			if (sharedKeycipher != null){
				var sharedKey = keyDecrypt(sharedKeycipher)
			} else {																//no shared key found, so making a new one
				var sharedKey = makeshared(key,Lock,email);
				if (lockDB[name] && fullAccess) {
					lockDB[name][1] = keyEncrypt(key,sharedKey);

					if(ChromeSyncOn){												//if Chrome sync is available, change in sync storage
						syncChromeLock(name,JSON.stringify(lockDB[name]))
					}
				}
			}
			var stuffForId = myLock;
		} else {														//this when it's a regular shared Key in common with the sender
			var sharedKey = Lock,
				stuffForId = sharedKey;
		}

	} else {										//anonymous mode
		if (learnOn){
			var reply = confirm("The contents of the message in the main box will be unlocked with your secret Key. Cancel if this is not what you want.");
			if(reply===false) throw("anonymous list decryption canceled");
		}
		if (Lock.length == 87 || Lock == '' || Lock.split('\n').length > 1){		//test for Lock, empty, multiline(video URL, since Lists have been filtered by now) in Lock box, in order to do anonymous Diffie-Hellman using the dummy Lock
			if (key == null) var key = readKey();
			var email = readEmail(),
				sharedKey = makeshared(key,pubstrdum,email),
				stuffForId = myLock;
		} else {																//looks like a shared Key in the Lock box: use it as is
			var sharedKey = Lock,
				stuffForId = sharedKey;
		}
	}
	var iter = keyStrength(sharedKey,false);										//should be 2 for everything except bad shared Keys
	var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(sharedKey,salt,iter,8,1,33));
	var	idtag = JSON.parse(sjcl.encrypt(sharedKey,stuffForId,{"iv":iv,"salt":salt,"ks":256,"iter":101})).ct.slice(0,11);
	
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
	//got the encrypted message key, now decrypt it, and finally the main message. The process for PFS and read-once modes is more involved. There is an overall try object in order to collect errors caused by sjcl.decrypt
try{
	if (Lock.length != 87 && Lock.length != 0 && type != '$' && type != '*'){
		var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(sharedKey,salt,iter,8,1,33)),
			cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + msgkeycipher + '","ks":256,"iter":101}',
			msgkey = sjcl.decrypt(keyStretched,cipherstr2).trim();
	} else if (type != '$' && type != '*'){
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + msgkeycipher + '","ks":256,"iter":101}',
			msgkey = sjcl.decrypt(sharedKey,cipherstr2).trim();

	} else if(name == 'myself'){		//encrypted to 'myself' in PFS or Read-once mode is actually in signed mode, but there is a dummy Lock to get rid of first
		msgkeycipher = msgkeycipher.slice(127,msgkeycipher.length);
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + msgkeycipher + '","ks":256,"iter":101}',
			msgkey = sjcl.decrypt(sharedKey,cipherstr2).trim();		
		
//for PFS mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key
	} else {
		var newLockcipher = msgkeycipher.slice(0,127);
		msgkeycipher = msgkeycipher.slice(127,msgkeycipher.length);
		var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + newLockcipher + '","ks":256,"iter":101}',
			newLock = sjcl.decrypt(sharedKey,cipherstr2).trim();
		if(!lockDB[name]) name = lockBoxItem;						//if the name is not displayed, try with the content of the lock box
		if(!lockDB[name]){											//if it still doesn't work, message and bail out
			mainmsg.innerHTML = 'The sender must be in the directory';
			throw('sender not in directory')
		}
		var lastKeycipher = lockDB[name][2],												//retrieve dummy Key from storage
			turnstring = lockDB[name][4];													//this strings says whose turn it is to encrypt
		if (turnstring=='next lock'){
			if(type == '*'){
				window.setTimeout(function(){mainmsg.innerHTML = 'Read-once messages can be unlocked only once'},3000)				
			}
		}
		if (lastKeycipher != null) {
			var lastKey = keyDecrypt(lastKeycipher);
			var pfsSalt = ''
		} else {																		//if a dummy Key doesn't exist, use permanent Key
			if (Lock.length == 87){
				var lastKey = key;
				var pfsSalt = email
			}else{
				var lastKey = Lock;												//shared Key: use directly
				var pfsSalt = ''
			}
		}
		if(type == '$'){																//PFS mode
			var	keystr = makeshared(lastKey,newLock,pfsSalt);
		}else{																			//Read-once mode
																
			var lastLockcipher = lockDB[name][3];										//read-once mode uses last Key and last Lock
			if (lastLockcipher != null) {												//if stored dummy Lock exists, decrypt it first
				var lastLock = keyDecrypt(lastLockcipher)
			} else {																	//use new dummy if stored dummy doesn't exist
				var lastLock = newLock
			}
			var	keystr = makeshared(lastKey,lastLock,pfsSalt);
		}
			var cipherstr2 = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + msgkeycipher + '","ks":256,"iter":101}';
		var	msgkey = sjcl.decrypt(keystr,cipherstr2).trim();
		lockDB[name][3] = keyEncrypt(key,newLock);										//store the new dummy Lock
		lockDB[name][4] = 'next lock';

		if(ChromeSyncOn){																//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(lockDB[name]))
		}
	}
	var cipherstr = '{"iv":"' + iv + '","salt":"' + salt + '","ct":"' + ct + '","ks":256,"iter":101}';
	var plainstr = sjcl.decrypt(msgkey,cipherstr);
	
}catch(err){failedDecrypt()}			//no more AES decryptions 

	if(XSSfilter(plainstr).slice(0,9) != 'filename:') plainstr = LZString.decompressFromBase64(plainstr);		//encoded files are not compressed
	document.getElementById('mainBox').innerHTML = plainstr;
	
	if(fullAccess) localStorage[userName] = JSON.stringify(lockDB);
	if (!decoyOn) mainmsg.innerHTML = 'Unlock successful';
	callKey = '';
}

//decrypt the message hidden in the salt, for decoy mode
function decoydecrypt(iv,dummylock,ct){
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
	var key2 = document.getElementById('decoyPwdOut').value;
		key2 = replaceByItem(key2,false);											//use stored item, if it exists
	dummylock = replaceByItem(dummylock,false);
	var lockstripped = striptags(dummylock);
	if (lockstripped.length == 100) lockstripped = changeBase(lockstripped.toLowerCase(), BASE38, BASE64, true);
	var keyold = key2;
	var	iter = keyStrength(key2,false);
	document.getElementById('decoyPwdOut').value = ""
	if(!document.getElementById('shareddecOut').checked){							//asymmetric mode, so now make the real encryption key
		var email = readEmail();
		key2 = makeshared(key2,lockstripped,email);
		iter = 2;
	}
	var keyStretched = sjcl.codec.base64.fromBits(sjcl.misc.scrypt(key2,'',iter,8,1,33))
	var	cipherstr2 = '{"iv":"' + iv + '","salt":"' + "" + '","ct":"' + ct + '","ks":256,"iter":101}';
	try{
		mainmsg.innerHTML = 'Hidden message: <span style="color:blue">' + decodeURI(sjcl.decrypt(keyStretched,cipherstr2)) + '</span>'
	}catch(err){failedDecrypt()}
};

//takes a SHA512 hash of the plaintext and generates an ECDSA signature
function applySignature(){
	callKey = 'sign';
	var keymsg = document.getElementById("keymsg"),
		mainmsg = document.getElementById("mainmsg");
		keymsg.innerHTML = "";
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("A signature matching the contents of the main box will be made using your secret Key, and the resulting signature will be added to the end of the main box. Cancel if this is not what you want.");
		if(reply == false) throw("signature canceled");
	};
	var secstr = readKey();
	var email = readEmail();
	var pubstr = striptags(secstr),
		hash = sjcl.hash.sha512.hash(document.getElementById('mainBox').innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,'').trim()),				//take SHA512 hash of trimmed text, with some things replaced by newlines
		sec = toexponent(secstr,email),
		curve = sjcl.ecc.curves["c521"],
		R = curve.r,
		l = R.bitLength(),
    	k = sjcl.bn.random(R.sub(1), 0).add(1),
    	r = curve.G.mult(k).x.mod(R),
		s = sjcl.bn.fromBits(hash).add(r.mul(sec)).mul(k.inverseMod(R)).mod(R),
		sigstr = sjcl.codec.base64.fromBits(sjcl.bitArray.concat(r.toBits(l), s.toBits(l))),	//make it base64
		iv = sjcl.codec.base64.fromBits(sjcl.random.randomWords('2','0')),						//for hidden message, if activated
		padding = makesalt(iv,secstr,36,false);
	var outString = sigstr.slice(1,sigstr.length) + iv.slice(0,11) + padding;
	if (document.getElementById("notags").checked === false){
			//strip initial "A" and add decoy iv & padding and tags
		document.getElementById('mainBox').innerHTML = document.getElementById('mainBox').innerHTML + "<br><br>" + triple("PL21sig=" + outString + "=" + calcRScode(outString) + "=PL21sig");
	}else{
		document.getElementById('mainBox').innerHTML = document.getElementById('mainBox').innerHTML + "<br><br>" + triple(outString)
	}
	callKey = '';
};

//verifies the ECDSA signature of a hash of the plaintext, calls applySignature as appropriate. Algorithm from SJCL ecc.js, but not the latest version
function verifySignature(){
	encrypting = false;
	var keymsg = document.getElementById("keymsg"),
		lockmsg = document.getElementById("lockmsg"),
		mainmsg = document.getElementById("mainmsg");
		keymsg.innerHTML = "";
		mainmsg.innerHTML = "";
	var text = document.getElementById('mainBox').innerHTML.replace(/<br>/g,'\n').replace(/<div>/g,'\n').replace(/<\/div>/g,'').trim();					//newline-related formatting is ignored
	if (text == ""){																				//nothing in text box
		mainmsg.innerHTML = '<span style="color:red">Nothing to sign or verify</span>';
		throw("no text")
	};
	if(document.getElementById('lockBox').value.slice(0,1)=='~') decryptItem();
	var	sign = text.split(/\r?\n/);
		sign = sign[sign.length-1];														//this is a signature if added as last line of text
		sign = XSSfilter(sign).replace(/&[^;]+;/g,'').replace(/\s/g,'');				//remove HTML tags and special characters, spaces that might have been added
		sign = bestOfThree(sign);
	var sigstr = applyRScode(sign,false);
	if (!(sigstr.length == 245)){															//no signature tag, therefore making sign
		applySignature();
		mainmsg.innerHTML = 'Signature attached to text.';
		return
	};
	var	pubstr = document.getElementById('lockBox').value.trim();
	if (pubstr == ""){
		mainmsg.innerHTML = 'Select a Lock to verify the signature.';
		throw("no lock present")
	};
	if (learnOn){
		var reply = confirm("The text in the main box has been signed with somebody's secret Key. I will now verify if the sign is correct for this text and the matching Lock, which should be present in the Locks box, and will display the result in a popup. Cancel if this is not what you want.");
		if(reply == false) throw("sign verification canceled");
	};
		pubstr = striptags(pubstr);
	if (pubstr.length != 87 && pubstr.length != 100){											//not a Lock, but maybe it's a name
		if (lockDB[pubstr]) pubstr = replaceByItem(pubstr,false);
	}
	if (pubstr.length == 100) pubstr = changeBase(pubstr.toLowerCase(), BASE38, BASE64, true) 		//ezLok replaced by regular Lock
	if (pubstr.length != 87){
		mainmsg.innerHTML = '<span style="color:red">Enter a valid Lock</span>';
		throw("invalid public key")
	};
		text = text.replace(/\r?\n?[^\r\n]*$/, "");												//remove last line
	var hash = sjcl.hash.sha512.hash(text.trim().replace(/[\s\&nbsp;]+$/,'')),					//take SHA512 hash of plaintext, ignoring initial and end spaces
		curve = sjcl.ecc.curves["c521"],
		xstr = pubstr.slice(0,pubstr.length);
	var	pub = pointFromX(xstr),
		rs = sjcl.codec.base64.toBits("A" + sigstr.slice(0,175)),								//recover signature part
		w = sjcl.bitArray,
		R = curve.r,
		l = R.bitLength(),
		r = sjcl.bn.fromBits(w.bitSlice(rs,0,l)),
		s = sjcl.bn.fromBits(w.bitSlice(rs,l,2*l)),
		u = s.inverseMod(R),
		hG = sjcl.bn.fromBits(hash).mul(u).mod(R),
		hA = r.mul(u).mod(R),
		check = true,
		r2 = curve.G.mult2(hG, hA, pub).x.mod(R);
	if (r.equals(0) || s.equals(0) || r.greaterEquals(R) || s.greaterEquals(R) || !r2.equals(r)) check = false;
	if (check) {
		mainmsg.innerHTML = '<span style="color:green"><strong>The signature is VERIFIED</strong></span>'
		}
	else {
		mainmsg.innerHTML = '<span style="color:magenta"><strong>The signature has FAILED verification</strong></span>'
		};
	if (document.getElementById("decoymode").checked){								//this part to extract the hidden message, if it exists
		var iv = sigstr.slice(175,186),
			padding = sigstr.slice(186,245);
		decoydecrypt(iv, pubstr, padding);
	};
};