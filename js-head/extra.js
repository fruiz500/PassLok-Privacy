//displays how many characters are left, in Short mode and Decoy In box
function charsLeft(){
	if(decoyIn.style.display == 'block'){					//for decoy message box
		var chars = encodeURI(document.getElementById('decoyText').value).replace(/%20/g, ' ').length;
		var limit = 59																//encrypted message, 59 chars
		if (chars <= limit){
			decoyMsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			decoyMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}

	//this one is for the text in the chat making dialog
	else if(chatDialog.style.display == 'block'){
		var chars = chatDate.value.length;
		var limit = 43;
		if (chars <= limit){
			chatmsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			chatmsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}

	//Now for main box. Short mode character count
	else if(shortMode.checked && !mainBox.innerHTML.charAt(0).match(/[~!@#$*-]/)){
		updateButtons();
		var chars = encodeURI(mainBox.innerHTML).replace(/%20/g, ' ').length,
			sharedKey = stripTags(replaceByItem(lockBox.innerHTML.replace(/<br>$/,"").trim()));
		if(!sharedKey) return;
		if(sharedKey.length != 43 && sharedKey.length != 50 && !onceMode.checked){		//Key-encrypted mode, 94 chars
			var limit = 94
		} else if(anonMode.checked){						//anonymous mode, 62 chars
			var limit = 62
		} else if(signedMode.checked){						//signed mode, 94 chars
			var limit = 94
		} else if(onceMode.checked){					//Read-once mode, 35 chars
			var limit = 35
		}
		if (chars <= limit){
			mainMsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			mainMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		
	}else{updateButtons()}								//display button labels according to item nature
}

//changes button labels according to context
function updateButtons(){
	var string = mainBox.innerHTML.trim();
	if(string.match('==')) string = string.split('==')[1].replace(/<(.*?)>/gi,"");
	var	type = string.charAt(0),
		typeGC = string.charAt(50);													//PassLok for Email compatible
	if(type.match(/[~!@#$*]/) || typeGC.match(/[~!@#$*]/) || (string.length == 160 && !string.match(' '))){		//encrypted item
		decryptBtn.innerHTML = 'Decrypt';
		decryptBtnBasic.innerHTML = 'Decrypt';
	}else{
		decryptBtn.innerHTML = 'Encrypt';
		decryptBtnBasic.innerHTML = 'Encrypt';
	}
	if(type == '-'){										//sealed item
		verifyBtn.innerHTML = 'Unseal';
	}else{
		verifyBtn.innerHTML = '&nbsp;Seal&nbsp;';
	}
	if(type.match(/[~!@#$*-]/) || typeGC.match(/[~!@#$*]/) || ((string.length == 160 || string.length == 43 || string.length == 50) && !string.match(' '))){	//Lock
		showLockBtn.innerHTML = 'Email';
		showLockBtnBasic.innerHTML = 'Email';
	}else if(string == ''){
		showLockBtn.innerHTML = 'myLock';
		showLockBtnBasic.innerHTML = 'myLock';
	}else{
		showLockBtn.innerHTML = 'Invite';
		showLockBtnBasic.innerHTML = 'Invite';
	}
	var	main = mainBox.innerHTML.trim();
	if((main.slice(0,8).match(/p\d{3}/) && main.slice(0,2)=='PL') || (main.match(/PL\d{2}p\d{3}/) && main.match('.txt'))){			//box contains parts
		secretShareBtn.innerHTML = 'Join';
	}else{
		secretShareBtn.innerHTML = '&nbsp;Split&nbsp;';
	}
}

//detect if a Lock has been pasted and offer to add it to the directory. Other kinds of items are also routed accordingly.
function pasteMain() {
    setTimeout(function(){
		var	string = mainBox.innerHTML.trim();
		if(string.match('==')) string = string.split('==')[1];
		var stringText = string.replace(/<(.*?)>/gi,"");											//remove HTML tags
		string = stringText.replace(/\s/g,'').replace(/[^a-zA-Z0-9+\/=~!@#\$\*:-]+/g,'');			//remove spaces and non-legal chars
		
		string = extractLock(string);
		
		var type = string.charAt(0),
			type2 = string.charAt(50);													//for prepended Lock
		if(type.match(/[~!@#\$\*:]/) || type2.match(/[@#\$\*:]/)){
			lockUnlock();
			return
		}
		if(type == '-'){
			signVerify();
			return
		}
    }, 0); //or 4
}

//extracts Lock at the start of an item, from an invitation or PassLok for Email
function extractLock(string){
		var CGParts = string.split(/[@#$]/);											//if PassLok for Email item, extract ezLock
		if(CGParts[0].length == 50){
			var possibleLock = CGParts[0];
			string = string.slice(50);
		}else if(CGParts[0].length == 43){
			var possibleLock = CGParts[0];
			string = string.slice(43);
		}else{
			var possibleLock = string;
		}
		if(possibleLock.length == 43 || possibleLock.length == 50){
			var index = 0, foundIndex;
			for(var name in locDir){
				if(possibleLock.length == 50) possibleLock = possibleLock.replace(/L/g,'l');
				if(locDir[name][0] == possibleLock || possibleLock == myezLock){								//found it, so select this user
					foundIndex = index	
				}
				index++
			}
			if(foundIndex != null){
				lockList.options[foundIndex+1].selected = true;
				fillBox();
			}else{
				name = prompt("Looks like you just entered someone's new Lock. If you give it a name in the box below, it will be saved to your local directory. If you use a name that is already in the directory, the new Lock will replace the old one.");
				if (!name) return;
				lockBox.innerHTML = possibleLock;
				lockNameBox.value = name;
				addLock();
			}
		}
		return string
}

//formats results depending on tags present and sends to default email
function sendMail() {
	if(isiOS && isFile){
		mainMsg.innerHTML = 'Email function not available on iOS native app';
		return
	}
	var cipherstr = mainBox.innerHTML.trim();
	if(cipherstr.match('==')) cipherstr = cipherstr.split('==')[1].replace(/-/g,'');				//remove tags and dashes
	cipherstr = XSSfilter(cipherstr);																//remove formatting
	var type = cipherstr.charAt(0),
		type2 = cipherstr.charAt(50);																	//for email mode
	if (learnMode.checked){
		if(type.match(/[~!@#\$-*]/) || type2.match(/[@#\$]/)){
			var reply = confirm("A new tab will open, including the contents of this box in your default email. You still need to supply the recipient's address and a subject line. Only encrypted or signed text are allowed. Cancel if this is not what you want.");
		}else{
			var reply = confirm("An invitation for others to join PassLok and containing your Lock will open in your default email. You still need to supply the recipient's address.  Cancel if this is not what you want.");
		}
		if(!reply) throw("email canceled");		
	}
	if(!type.match(/[~!@#\$-*]/) && !type2.match(/[@#\$]/) && cipherstr.length != 43 && cipherstr.length != 50){
		if(emailMode.checked){
			var lockLinkText = "The gibberish below contains a message from me that has been encrypted with PassLok for Email. To decrypt it, do this:%0D%0A%0D%0A1. Install the PassLok for Email Chrome extension by following this link: %0D%0Ahttps://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh%0D%0A%0D%0A2. Reload your email and get back to this message.%0D%0A%0D%0A3. Click the PassLok logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.%0D%0A%0D%0A4. When asked whether to accept my new Password (which you don't know), go ahead and click OK.%0D%0A%0D%0A----------begin invitation message encrypted with PassLok--------==%0D%0A%0D%0A" + encodeURIComponent(makeInvitation().match(/.{1,80}/g).join("\n")).replace(/%0A/g,'%0D%0A') + "%0D%0A%0D%0A==---------end invitation message encrypted with PassLok-----------";
		}else{
			var lockLinkText = "To decrypt it, click the link. The app will open in a new tab, and then you may be asked for some information in order to set you up. Nothing will be sent out of your device. You can also copy it and paste it into your favorite version of PassLok:%0D%0A%0D%0Ahttps://passlok.com/app#PL23inv==" + encodeURIComponent(makeInvitation()) + '==PL32inv';
		}
	}

	var hashTag = encodeURIComponent(mainBox.innerText).replace(/%0A/g,'%0D%0A');		//item ready for link
	var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab and ask you for your Key), or simply copy it and paste it into your favorite version of PassLok:%0D%0A%0D%0Ahttps://passlok.com/app#" + hashTag + "%0D%0A%0D%0AYou can get PassLok from https://passlok.com/app and other sources, plus the Chrome and Android app stores.";

	if(type=="!"){
    	var link = "mailto:"+ "?subject= " + "&body=Anonymous message encrypted with PassLok v.2.3 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText;
	} else if (type=="@"){
		var link = "mailto:"+ "?subject= " + "&body=Message encrypted with PassLok v.2.3 %0D%0A%0D%0ADecrypt with shared Key.%0D%0A%0D%0A" + linkText;
	} else if (type=="#" || type2=="#"){
		if(emailMode.checked){
			var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(XSSfilter(mainBox.innerHTML.trim().replace(/<br>/g,'\n'))).replace(/%0A/g,'%0D%0A');
		}else{
			var link = "mailto:"+ "?subject= " + "&body=Signed message encrypted with PassLok v.2.3 %0D%0A%0D%0ADecrypt with your secret Key and my Lock.%0D%0A%0D%0A" + linkText;
		}
	} else if (type=="$" || type=="*" || type2=="$"){
		if(emailMode.checked){
			var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(XSSfilter(mainBox.innerHTML.trim().replace(/<br>/g,'\n'))).replace(/%0A/g,'%0D%0A');
		}else{
			var link = "mailto:"+ "?subject= " + "&body=Read-once message encrypted with PassLok v.2.3 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText;
		}
	} else if (type=="~"){
		var link = "mailto:"+ "?subject=My PassLok database" + "&body=Database encrypted with PassLok v.2.3 %0D%0A%0D%0ADecrypt with my secret Key.%0D%0A%0D%0A" + linkText;
	} else if (type=="%"){
		var link = "mailto:"+ "?subject= " + "&body=Text sealed with PassLok v.2.3. It is not encrypted. Extract it and verify my authorship using my Lock.%0D%0A%0D%0A" + linkText;
	} else if (cipherstr.length == 43 || cipherstr.length == 50){
		var link = "mailto:"+ "?subject= " + "&body=This email contains my PassLok v.2.3 Lock. Use it to encrypt text or files for me to decrypt, or to verify my seal.%0D%0A%0D%0A" + linkText;
	} else {
		var link = "mailto:"+ "?subject=Invitation to PassLok" + "&body=The gibberish link below contains a message from me that has been encrypted with PassLok, a free app that you can get at https://passlok.com/app and other sources, plus the Chrome and Android app stores. There is also PassLok for Email at the Chrome store.%0D%0A%0D%0A" + lockLinkText;
	}

	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

//encrypt main box with myLock in order to make an invitation
function makeInvitation(){
	if(mainBox.innerText.trim() != ''){
		var reply = confirm('Do you want the contents of the main box to be encrypted and added to an invitation email? This will encourage the recipients to try PassLok, but be aware that the encrypted contents WILL NOT BE SECURE.');
		if (!reply) throw('invitation canceled');	
		var text = mainBox.innerHTML.trim(),
			nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
			cipherstr = myezLock + '@' + noncestr + PLencrypt(text,nonce24,nacl.util.decodeBase64(myLock),true);			//this includes compression
		return cipherstr
	}else{
		return ''
	}
}

//calls texting app (works on mobile only)
function sendSMS(){
	if(isMobile){
		if (learnMode.checked){
			var reply = confirm("The default texting app will now open. You need to have copied your short encrypted message to the clipboard before doing this, if you want to send one. This only works on smartphones. Cancel if this is not what you want.");
			if(!reply) throw("SMS canceled");
		};
		var text = "";
    	if (window.getSelection) {
        	text = window.getSelection().toString();
    	} else if (document.selection && document.selection.type != "Control") {
        	text = document.selection.createRange().text;
    	}
		window.open("SMS:","_parent")							//open SMS on mobile
	} else {
		mainMsg.innerHTML = 'SMS function is only available on mobile devices'
	}
};

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	if(document.getElementById('chatFrame').src.match('#')){			//chat already open, so open that screen
		chatScr.style.display = 'block';
		return
	}

	var text = mainBox.innerHTML.trim();

	if(text.match('==') && text.split('==')[0].slice(-4) == 'chat'){		//there is already a chat invitation, so open it
		lockUnlock();
		return
	}

	var listArray = lockBox.innerHTML.trim().split('<br>').filter(Boolean);
	if (learnMode.checked){
		var reply = confirm("A special encrypted item will be made, inviting the selected recipients to a secure chat session. Cancel if this is not what you want.");
		if(!reply) throw("chat invite canceled");
	};

	if(listArray[0] == '' || (listArray[0] == 'myself' && listArray.length == 1)){
		mainMsg.innerHTML = 'Please select those invited to chat';
		throw("nobody invited to chat");
	}
	listArray = listArray.concat('myself');								//make sure 'myself' is on the list
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates and nulls
	listArray = listArray.filter(function(n){return n});
	lockBox.innrText = listArray.join('\n');
	openClose('shadow');
	openClose('chatDialog');												//stop to get chat type
	chatDate.value = mainBox.innerText.trim().slice(0,43);
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
	var date = chatDate.value;
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,'');
	var chatRoom = makeChatRoom();
	mainBox.innerHTML = date + type + chatRoom + password;
	lockUnlock();
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var blacklist = blackListExp.toString().slice(1,-2).split('|');
	var	name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
	if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	while(name.length < 20) name += ' ';
	return name
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = Math.floor(Math.random()*blackLength);
	}
	return index
}

//detects if there is a chat invitation in the main box, and opens the Chat window
function openChat(){
	var typetoken = mainBox.innerHTML.trim();
	if (typetoken.length == 107 && !typetoken.slice(-43).match(' ')){			//chat invite detected, so open chat
		mainBox.innerHTML = '';
		var date = typetoken.slice(0,43).trim();									//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
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
}