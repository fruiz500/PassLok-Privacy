var detectLock = true;
//displays how many characters are left, in Short mode and Decoy In box
function charsLeft(){	
	if(decoyIn.style.display == 'block'){					//for decoy message box
		var chars = encodeURI(document.getElementById('decoyText').value).replace(/%20/g, ' ').length;
		var limit = 59																//locked message, 59 chars
		if (chars <= limit){
			decoyMsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			decoyMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}
	
	//this one is for the text in the chat making dialog
	if(chatDialog.style.display == 'block'){
		var chars = chatDate.value.length;
		var limit = 43;
		if (chars <= limit){
			chatmsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			chatmsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}
	
	//now for the main box
	var string = XSSfilter(mainBox.innerHTML.trim().replace(/\&nbsp;/g,' ')),
		strlength = string.trim().length;
	string = string.replace(/\s/g,'').replace(/[^a-zA-Z0-9+/=]+/g,'');			//remove spaces and non-Base64 chars
	var stringsplit = string.split("=").sort(function (a, b) { return b.length - a.length; });		//make array after splitting by '=' largest first
	
	var lockDetected = false;																	//now detect if this is a Lock
	if(stringsplit[1]){						//tags found
		if((stringsplit[0].length == 43 || stringsplit[0].length == 50) && (stringsplit[0] != myLock) && (stringsplit[0].toLowerCase() != myezLock) && (stringsplit[1].length == 10 || stringsplit[1].slice(0,2) == 'PL')){
			lockDetected = true;
		}
	}else{								//no tags found
		if((stringsplit[0].length == 43 || stringsplit[0].length == 50) && (stringsplit[0] != myLock) && (stringsplit[0].toLowerCase() != myezLock) && (strlength == 43 || strlength == 50)){
			lockDetected = true;
		}
	}
	//Now for main box. First Lock paste, then short mode character count
	if(lockDetected && detectLock){
		var name = prompt("Looks like you just pasted someone's Lock. If you give it a name in the box below, it will be saved to your local directory");
		if (!name) {detectLock = false; return};
		lockBox.value = string;
		lockNameBox.value = name;
		applyRStoLock();
		addLock();
	} else if(document.getElementById("shortMode").checked){
		var chars = encodeURI(mainBox.innerHTML).replace(/%20/g, ' ').length;
		var sharedKey = striptags(replaceByItem(lockBox.value,false));
		if(!sharedKey) return;
		if(sharedKey.length != 43 && sharedKey.length != 50 && !document.getElementById("pfsMode").checked && !document.getElementById("onceMode").checked){	//Key-locked mode, 94 chars
			var limit = 94
		} else if(anonMode.checked){						//anonymous mode, 62 chars
			var limit = 62
		} else if(signedMode.checked){						//signed mode, 94 chars
			var limit = 94
		} else if(pfsMode.checked || onceMode.checked){		//pfs mode, 35 chars
			var limit = 35
		}
		if (chars <= limit){
			mainMsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			mainMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
	} else {
		mainMsg.innerHTML = "";
	}
}

//formats results depending on tags present and sends to default email
function sendMail() {
	var cipherstr = mainBox.innerHTML;
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];
	var type = cipherstr.slice(0,1);
	if (learnMode.checked){
		if(type.match(/[~!@#$%*]/)){
			var reply = confirm("A new tab will open, including the contents of this box in your default email. You still need to supply the recipient's address and a title. Only locked or signed text are allowed. Cancel if this is not what you want.");
		}else{
			var reply = confirm("An invitation for others to join PassLok and containing your Lock will open in your default email. You still need to supply the recipient's address.  Cancel if this is not what you want.");
		}
		if(!reply) throw("email canceled");
	}	
	mainMsg.innerHTML = "";
	var hashTag = encodeURIComponent(userName.replace(/\s/g,'_') + '&' + myLock);
	var linkText = "%0D%0A%0D%0AClick the link below if you don't have PassLok already or wish to get my Lock automatically. The app will open in a new tab, and then you may be asked for some information in order to set you up. Nothing will be sent out of your device:%0D%0A%0D%0Ahttps://passlok.com#" + hashTag;
	var inviteLink = "mailto:"+ "?subject=Invitation to PassLok privacy" + "&body=I would like to communicate privately with you using PassLok, a free app that you can get at https://passlok.com and other sources, plus the Chrome, Android, and iOS app stores." + linkText;
	
if (!noTagsMode.checked){							//add tags if checked, add explanatory text
	if(type=="!"){
    	var link = "mailto:"+ "?subject=" + "&body=Anonymous message locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with your secret Key. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="@"){
		var link = "mailto:"+ "?subject=" + "&body=Message locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with shared Key. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="#"){
		var link = "mailto:"+ "?subject=" + "&body=Signed message locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with your secret Key and my Lock. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="$"){
		var link = "mailto:"+ "?subject=" + "&body=PFS message locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with your secret Key and my Lock. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="*"){
		var link = "mailto:"+ "?subject=" + "&body=Read-once message locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with your secret Key and my Lock. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="~"){
		var link = "mailto:"+ "?subject=My PassLok database" + "&body=Database locked with PassLok v.2.2 %0D%0A%0D%0AUnlock with my secret Key. %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML);
	} else if (cipherstr.length==43 || cipherstr.replace(/-/g,'').length==50){
		var link = "mailto:"+ "?subject=" + "&body=This is my PassLok v.2.2 Lock. Use it to lock text or files for me to unlock, or to verify my signature or seal:%0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else if (type=="%" && cipherstr.length==87){
		var link = "mailto:"+ "?subject=" + "&body=The following is a text signed with PassLok v.2.2. Verify it using my Lock." + linkText + "%0D%0A%0D%0AThe text, followed by the signature,  BEGINS BELOW THIS LINE:%0D%0A%0D%0A" + encodeURIComponent(mainBox.innerText);
	} else if (type=="%"){
		var link = "mailto:"+ "?subject=" + "&body=The item at the end of this email is a text sealed with PassLok v.2.2. It is not encrypted. Extract it and verify my authorship using my Lock %0D%0A%0D%0A" + encodeURIComponent(mainBox.innerHTML) + linkText;
	} else {																		//may be a longish signed text, so try a little harder
		var cipherstrArray = mainBox.innerHTML.split('\n'),
			length = cipherstrArray.length,
			cipherstr = cipherstrArray[length-1];
		cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];
		if (cipherstr.length==159){
			var link = "mailto:"+ "?subject=" + "&body=The following is a text signed with PassLok v.2.2. Verify it using my Lock:" + linkText + "%0D%0A%0D%0AThe text, followed by the signature,  BEGINS BELOW THIS LINE:%0D%0A%0D%0A" + encodeURIComponent(mainBox.innerText);
		} else {
			var link = inviteLink;
		}
	}
}else{																				//tags unchecked, no extra text
	if(type.match(/[~!@#$%*]/)||cipherstr.length==43||cipherstr.length==50||cipherstr.length==160){
		var link = "mailto:"+ "?subject=" + "&body=" + encodeURIComponent(mainBox.innerHTML);
	}else{
		var link = inviteLink;
	}
}
	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

//calls texting app (works on mobile only)
function sendSMS(){
	if(isMobile){
		if (learnMode.checked){
			var reply = confirm("The default texting app will now open. You need to have copied your short locked message to the clipboard before doing this, if you want to send one. This only works on smartphones. Cancel if this is not what you want.");
			if(!reply) throw("SMS canceled");
		};
		var text = "";
    	if (window.getSelection) {
        	text = window.getSelection().toString();
    	} else if (document.selection && document.selection.type != "Control") {
        	text = document.selection.createRange().text;
    	}
		if (text == ''){
			mainMsg.innerHTML = 'Please copy the item to be texted and tap SMS again';
			throw ('no selection')
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
	
	if(text.slice(4,8) == 'chat'){										//there is already a chat invitation, so open it
		lockUnlock();
		return
	}
	
	var listArray = lockBox.value.trim().split('\n');
	if (learnMode.checked){
		var reply = confirm("A special locked item will be made, inviting the selected recipients to a secure chat session. Cancel if this is not what you want.");
		if(!reply) throw("chat invite canceled");
	};
	
	if(listArray[0] == '' || (listArray[0] == 'myself' && listArray.length == 1)){
		mainMsg.innerHTML = 'Please select those invited to chat';
		throw("nobody invited to chat");
	}
	listArray = listArray.concat('myself');								//make sure 'myself' is on the list
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates and nulls
	listArray = listArray.filter(function(n){return n});
	lockBox.value = listArray.join('\n');
	openClose('shadow');
	openClose('chatDialog');												//stop to get chat type
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
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,'');
	var chatRoom = makeChatRoom();
	mainBox.innerHTML = date + type + chatRoom + password;
	var listArray = lockBox.value.trim().split('\n');
	Encrypt_List(listArray);
	mainBox.innerHTML = mainBox.innerHTML.replace(/PL22msa|PL22mss|PL22msp|PL22mso/g,'PL22chat');			//change the tags
	mainMsg.innerHTML = 'Invitation to chat in the box.<br>Send it to the recipients.'
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var name = chatRoom.value;
	if(name == ''){
		name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
		if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	}
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
		index = Math.floor(Math.random()*blacklist.length);
	}
	return index
}