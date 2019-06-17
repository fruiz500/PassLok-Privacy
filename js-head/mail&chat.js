//formats results depending on tags present and sends to default email
function sendMail() {
	if(isiOS && isFile){
		mainMsg.textContent = 'Email function not available on iOS native app';
		return
	}
		
	var type = getType(mainBox.innerHTML.trim())[0],
		words = mainBox.textContent;							//for word Locks
	if(words.match('==')) words = words.split('==')[1];
	words = words.trim().split(' ');
	if(learnMode.checked){
		if(type.match(/[lckgdasoprASO]/)){
			var reply = confirm("A new tab will open, including the contents of this box in your default email. You still need to supply the recipient's address and a subject line. Only Locks and encrypted or signed items are allowed. Cancel if this is not what you want.")
		}else{
			var reply = confirm("An invitation for others to join PassLok and containing your Lock will open in your default email. You still need to supply the recipient's address.  Cancel if this is not what you want.")
		}
		if(!reply) return
	}
	
	if(!type && words.length != 20){														//no recognized type, so make an invitation
		var inviteText = makeInvitation();
		if(emailMode.checked){
			var lockLinkText = "The gibberish below contains a message from me that has been encrypted with PassLok for Email. To decrypt it, do this:%0D%0A%0D%0A1. Install the PassLok for Email extension by following by following one of these links: %0D%0AChrome: https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh%0D%0AFirefox: https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email%0D%0A%0D%0A2. Reload your email and get back to this message.%0D%0A%0D%0A3. Click the PassLok logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.%0D%0A%0D%0A4. When asked whether to accept my new Password (which you don't know), go ahead and click OK.%0D%0A%0D%0AIf you don't use Chrome or Firefox, or don't want to install an extension, you can also open the message in PassLok Privacy, a standalone app available from https://passlok.com/app%0D%0A%0D%0A----------begin invitation message encrypted with PassLok--------==%0D%0A" + encodeURIComponent(inviteText.match(/.{1,80}/g).join("\n")).replace(/%0A/g,'%0D%0A') + "%0D%0A==---------end invitation message encrypted with PassLok-----------"
		}else{
			var lockLinkText = "To decrypt it, click the link. The app will open in a new tab, and then you may be asked for some information in order to set you up. Nothing will be sent out of your device. You can also copy it and paste it into your favorite version of PassLok:%0D%0A%0D%0Ahttps://passlok.com/app#PL24inv==" + encodeURIComponent(inviteText) + '==PL24inv'
		}
	}

	var hashTag = encodeURIComponent(mainBox.textContent.trim().replace(/ /g,'_')).replace(/%0A/g,'%0D%0A');		//item ready for link
	var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab and ask you for your Key), or simply copy it and paste it into your favorite version of PassLok:%0D%0A%0D%0Ahttps://passlok.com/app#" + hashTag + "%0D%0A%0D%0AYou can get PassLok from https://passlok.com/app and other sources, plus the Chrome, Firefox, and Android app stores.";

	if(words.length == 20){												//20 words, so most likely a word Lock
		var link = "mailto:"+ "?subject= " + "&body=This email contains my PassLok v.2.4 Lock as a list of words. Use it to encrypt text or files for me to decrypt, or to verify my seal.%0D%0A%0D%0A" + linkText
	}else if(type=="a" || type=="A"){
    	var link = "mailto:"+ "?subject= " + "&body=Anonymous message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText
	} else if (type=="g"){
		var link = "mailto:"+ "?subject= " + "&body=Message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with shared Key.%0D%0A%0D%0A" + linkText
	} else if (type=="s" || type=="S"){
		if(emailMode.checked){
			var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim()).replace(/%0A/g,'%0D%0A')
		}else{
			var link = "mailto:"+ "?subject= " + "&body=Signed message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key and my Lock.%0D%0A%0D%0A" + linkText
		}
	} else if (type && type.match(/[oprO]/)){
		if(emailMode.checked){
			var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim()).replace(/%0A/g,'%0D%0A')
		}else{
			var link = "mailto:"+ "?subject= " + "&body=Read-once message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText
		}
	} else if (type=="k"){
		var link = "mailto:"+ "?subject=My PassLok database" + "&body=Database encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with my secret Key.%0D%0A%0D%0A" + linkText
	} else if (type=="l"){
		var link = "mailto:"+ "?subject= " + "&body=Text sealed with PassLok v.2.4. It is not encrypted. Extract it and verify my authorship using my Lock.%0D%0A%0D%0A" + linkText;
	} else if (type=='c'){
		var link = "mailto:"+ "?subject= " + "&body=This email contains my PassLok v.2.4 Lock. Use it to encrypt text or files for me to decrypt, or to verify my seal.%0D%0A%0D%0A" + linkText
	} else {
		var link = "mailto:"+ "?subject=Invitation to PassLok" + "&body=The gibberish link below contains a message from me that has been encrypted with PassLok, a free app that you can get at https://passlok.com/app and other sources, plus the Chrome, Firefox, and Android app stores. There is also PassLok for Email at the Chrome and Firefox stores.%0D%0A%0D%0A" + lockLinkText
	}

	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

//encrypt main box with myLock in order to make an invitation
function makeInvitation(){
	if(mainBox.textContent.trim() != ''){
		var reply = confirm('Do you want the contents of the main box to be encrypted and added to an invitation email? This will encourage the recipients to try PassLok, but be aware that the encrypted contents WILL NOT BE SECURE.');
		if (!reply) return;	
		var text = mainBox.innerHTML.trim(),
			nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			cipherStr = myezLock + '//////' + nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,PLencrypt(text,nonce24,myLock,true)))).replace(/=+$/,'');			//this includes compression		
		mainBox.textContent = '';
		if(emailMode.checked){
			var prefaceMsg = document.createElement('div');
			prefaceMsg.textContent = "The gibberish link below contains a message from me that has been encrypted with PassLok, a free app that you can get at the Chrome and Firefox web stores. There is also PassLok Privacy and PassLok for Email at the same stores, plus the standalone PassLok web app at https://passlok.com/app.\r\n\r\nTo decrypt it, install PassLok, reload this page. You will be asked to supply a Master Key, which will not be stored or sent anywhere. You must remember your secret Key, but you can change it later if you want. When asked whether to accept my new Key (which you don't know), go ahead and click OK. You can also decrypt the invitation by pasting it into your favorite version of PassLok:";
			var initialTag = document.createElement('pre'),
				invBody = document.createElement('pre'),
				finalTag = document.createElement('pre');
			initialTag.textContent = "----------begin invitation message encrypted with PassLok--------==";
			invBody.textContent = cipherStr.match(/.{1,80}/g).join("\r\n");
			finalTag.textContent = "==---------end invitation message encrypted with PassLok-----------";
			mainBox.appendChild(prefaceMsg);
			mainBox.appendChild(initialTag);
			mainBox.appendChild(invBody);
			mainBox.appendChild(finalTag);
		}else{
			var invBody = document.createElement('div');
			invBody.textContent = "The gibberish link below contains a message from me that has been encrypted with PassLok, a free app that you can get at the Chrome and Firefox web stores. There is also PassLok Privacy and PassLok for Email at the same stores, plus the standalone PassLok web app at https://passlok.com/app.\r\n\r\nTo decrypt it, install PassLok, reload this page. You will be asked to supply a secret Key, which will not be stored or sent anywhere. You must remember your secret Key, but you can change it later if you want. When asked whether to accept my new Key (which you don't know), go ahead and click OK. You can also decrypt the invitation by pasting it into your favorite version of PassLok:\r\n\r\nhttps://passlok.com/app#PL24inv==" + cipherStr + "==PL24inv";
			mainBox.appendChild(invBody)
		}
		updateButtons();
		mainMsg.textContent = "Invitation created and ready to put in the page. Invitations are ";
		var blinker = document.createElement('span');
		blinker.className = "blink";
		blinker.textContent = "NOT SECURELY ENCRYPTED";
		mainMsg.appendChild(blinker);
		return cipherStr
	}else{
		return ''
	}
}

//calls texting app (works on mobile only)
function sendSMS(){
	if(isMobile){
		if(learnMode.checked){
			var reply = confirm("The default texting app will now open. You need to have copied your short encrypted message to the clipboard before doing this, if you want to send one. This only works on smartphones. Cancel if this is not what you want.");
			if(!reply) return
		}
		var text = "";
    	if (window.getSelection) {
        	text = window.getSelection().toString();
    	} else if (document.selection && document.selection.type != "Control") {
        	text = document.selection.createRange().text
    	}
		window.open("SMS:","_parent")							//open SMS on mobile
	} else {
		mainMsg.textContent = 'SMS function is only available on mobile devices'
	}
}

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	if(document.getElementById('chatFrame').src.match('#')){			//chat already open, so open that screen
		chatScr.style.display = 'block';
		return
	}

	var text = mainBox.innerHTML.trim();

	if(text.match('==') && text.split('==')[0].slice(-4) == 'chat'){		//there is already a chat invitation, so open it
		var msg = text.split('==')[1],
			type = msg.charAt(0);
		unlock(type,msg,lockBox.innerHTML.replace(/\n/g,'<br>').trim());
		return
	}

	var listArray = lockBox.innerHTML.replace(/\n/g,'<br>').trim().split('<br>').filter(Boolean);
	if(learnMode.checked){
		var reply = confirm("A special encrypted item will be made, inviting the selected recipients to a secure chat session. Cancel if this is not what you want.");
		if(!reply) return
	}

	if(listArray.length == 0 || (listArray.length == 1 && listArray[0] == 'myself')){
		mainMsg.textContent = 'Please select those invited to chat';
		return
	}
	if(longMode.checked) listArray = listArray.concat('myself');								//make sure 'myself' is on the list, unless it's not a multi-recipient message
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates and nulls
	listArray = listArray.filter(function(n){return n});
	lockBox.innerText = listArray.join('\n');
	openClose('shadow');
	openClose('chatDialog');												//stop to get chat type
	chatDate.value = mainBox.textContent.trim().slice(0,43);
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	closeBox();
	if(dataChat.checked){
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else{
		var type = 'C'
	}
	var date = chatDate.value.slice(0,43);						//can't do encodeURI here because this will be decrypted by decryptList, which doesn't expect it
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),
		chatRoom = makeChatRoom();
	lock(lockBox.innerHTML.replace(/\n/g,'<br>').replace(/<br>$/,"").trim(),date + type + chatRoom + password);
	if(!longMode.checked) main2chat(type + chatRoom + password);
	setTimeout(function(){
			if(emailMode.checked) sendMail()
	},50)
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var blacklist = blackListExp.toString().slice(1,-2).split('|'),
		name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
	if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	while(name.length < 20) name += ' ';
	return name
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = Math.floor(Math.random()*blackLength)
	}
	return index
}

//detects if there is a chat invitation in the main box, and opens the Chat window
function openChat(){
	var typetoken = mainBox.textContent.trim();
	if (typetoken.length == 107 && !typetoken.slice(-43).match(' ')){			//chat invite detected, so open chat
		mainBox.textContent = '';
		var date = typetoken.slice(0,43).trim();									//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n " + date + " \n\n"
		}else{
			var msgStart = ""
		}
		var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location.");
		if(!reply){
			mainBox.textContent = '';
			return
		}
		if(isSafari || isIE || isiOS){
			mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
			return
		}
		main2chat(typetoken.slice(43));
	}
}