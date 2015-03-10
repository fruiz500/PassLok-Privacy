var detectLock = true;
//displays how many characters are left, in Short mode and in Decoy In box
function charsLeft(){
	var mainmsg = document.getElementById("mainmsg");
	var chatmsg = document.getElementById("chatmsg");
	var decoymsg = document.getElementById("decoymsg");	
	if(document.getElementById('decoyIn').style.display == 'block'){					//for decoy message box
		var chars = encodeURI(document.getElementById('decoyText').value).replace(/%20/g, ' ').length;
		if(!encrypting){
			var limit = 36																//signature, 36 chars
		} else {
			if(document.getElementById("shortmode").checked){
				var limit = 37															//short, signed or key-locked, 37 chars
			} else {
				if(document.getElementById("anonmode").checked){						//anonymous mode, 87 chars
					var limit = 87
				} else if(document.getElementById("signedmode").checked){				//signed mode, 152 chars
					var limit = 152
				} else if(document.getElementById("pfsmode").checked){					//pfs mode, 87 chars
				var limit = 87
				}
			}
		}
		if (chars <= limit){
			decoymsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			decoymsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}
	
	//this one is for the text in the chat making dialog
	if(document.getElementById("chatDialog").style.display == 'block'){
		var chars = document.getElementById('chatdate').value.length;
		var limit = 43;
		if (chars <= limit){
			chatmsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			chatmsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
		return
	}
	
	//now for the main box
	var string = XSSfilter(document.getElementById('mainBox').innerHTML.trim().replace(/\&nbsp;/g,' ')),
		strlength = string.trim().length;
	string = string.replace(/\s/g,'').replace(/[^a-zA-Z0-9+/=]+/g,'');			//remove spaces and non-Base64 chars
	var stringsplit = string.split("=").sort(function (a, b) { return b.length - a.length; });		//make array after splitting by '=' largest first
	
	var lockDetected = false;																	//now detect if this is a Lock
	if(stringsplit[1]){						//tags found
		if((stringsplit[0].length == 87 || stringsplit[0].length == 100) && (stringsplit[0] != myLock) && (stringsplit[0].toLowerCase() != myezLock) && (stringsplit[1].length == 20 || stringsplit[1].slice(0,2) == 'PL')){
			lockDetected = true;
		}
	}else{								//no tags found
		if((stringsplit[0].length == 87 || stringsplit[0].length == 100) && (stringsplit[0] != myLock) && (stringsplit[0].toLowerCase() != myezLock) && (strlength == 87 || strlength == 100)){
			lockDetected = true;
		}
	}
	//Now for main box. First Lock paste, then short mode character count
	if(lockDetected && detectLock){
		var name = prompt("Looks like you just pasted someone's Lock. If you give it a name in the box below, it will be saved to your local directory");
		if (!name) {detectLock = false; return};
		document.getElementById('lockBox').value = string;
		document.getElementById('locknameBox').value = name;
		applyRStoLock();
		addLock();
	} else if(document.getElementById("shortmode").checked){
		var chars = encodeURI(document.getElementById('mainBox').innerHTML).replace(/%20/g, ' ').length;
		if(document.getElementById("anonmode").checked){								//anonymous mode, 38 chars
			var limit = 38
		} else if(document.getElementById("signedmode").checked){						//signed mode, 58 chars
			var limit = 58
		} else if(document.getElementById("pfsmode").checked){							//pfs mode, 37 chars
			var limit = 37
		}
		if (chars <= limit){
			mainmsg.innerHTML = chars + " characters out of " + limit + " used"
		} else {
			mainmsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
		}
	} else {
		mainmsg.innerHTML = "";
	}
}

//formats results depending on tags present and sends to default email
function sendMail() {
	if(document.getElementById('mainBox').innerHTML.trim() == ''){
		if (learnOn){
			var reply = confirm("An invitation for others to join PassLok and containing your Lock will open in your default email. You still need to supply the recipient's address.  Cancel if this is not what you want.");
			if(reply===false) throw("email canceled");
		};
		showLock();
	}	
	var	mainmsg = document.getElementById("mainmsg");
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("A new tab will open, including the contents of this box in your default email. You still need to supply the recipient's address and a title. Only Locks and locked or signed text are allowed. Cancel if this is not what you want.");
		if(reply===false) throw("email canceled");
	};
	if (lockDB['myself']){
		var key = document.getElementById("pwd").value;
		if (key.trim() == '') {any2key(); return}
		if(document.getElementById('ezLok').checked){
			var mylock2 = changeBase(myLock,BASE64,BASE38,true);
			mylock2 = triple('PL21ezLok=' + mylock2 + '=PL21ezLok')		//this contains my Lock
		}else{
			var mylock2 = myLock;
			mylock2 = triple('PL21lok=' + mylock2 + '=PL21lok')
		}
	} else {
		var mylock2 = 'Lock not attached'
	}
	var cipherstr = document.getElementById('mainBox').innerHTML;
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];
	var type = cipherstr.slice(0,1);
if (document.getElementById("notags").checked === false){							//add tags if checked, add explanatory text
	if(type==="!"){
    	var link = "mailto:"+ "?subject=" + "&body=Anonymous message locked with PassLok v.2.1 %0D%0A%0D%0AUnlock with your secret Key. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
	} else if (type==="@"){
		var link = "mailto:"+ "?subject=" + "&body=Message locked with PassLok v.2.1 %0D%0A%0D%0AUnlock with shared Key. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
	} else if (type==="#"){
		var link = "mailto:"+ "?subject=" + "&body=Signed message locked with PassLok v.2.1 %0D%0A%0D%0AUnlock with your secret Key and my Lock. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
	} else if (type==="$"){
		var link = "mailto:"+ "?subject=" + "&body=PFS message locked with PassLok v.2.1 %0D%0A%0D%0AUnlock with your secret Key and my Lock. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
	} else if (type==="~"){
		var link = "mailto:"+ "?subject=My PassLok database" + "&body=Database locked with PassLok v.2.1 %0D%0A%0D%0AUnlock with my secret Key. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML);
	} else if (cipherstr.length==87 || cipherstr.replace(/_/g,'').length==100){
		var link = "mailto:"+ "?subject=Invitation to PassLok privacy" + "&body=I would like to communicate privately with you using PassLok, a free app that you can get at https://passlok.com and other sources, plus the Chrome, Android, and iOS app stores.%0D%0A%0D%0AAs soon as you start PassLok, you will be asked to come up with a secret Key, from which a matching Lock is made, and then you can send me that Lock anyway you want because it is impossible to get your Key from the Lock. To send it by email, just click the Email button in PassLok. Your secret Key will not be sent or saved anywhere.%0D%0A%0D%0AOn the line below is my PassLok v.2.1 Lock. Use it to send me private messages and verify my signature, or invite me to a private real-time chat involving text, files, audio, and even video. %0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) +"%0D%0A%0D%0AOnce again, you can get PassLok for free at https://passlok.com, plus the Chrome, Android, and iOS app stores.";
	} else if (cipherstr.length===160){
		var link = "mailto:"+ "?subject=" + "&body=Short message locked with PassLok v.2.1 %0D%0A%0D%0AStrip everything but the locked message and unlock normally.%0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
	} else if (cipherstr.length===245){
		var link = "mailto:"+ "?subject=" + "&body=The following is a text signed with PassLok v.2.1. Verify using my Lock, which is this:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com%0D%0A%0D%0AThe text, followed by the signature,  BEGINS BELOW THIS LINE:%0D%0A%0D%0A" + encodeURIComponent(document.getElementById('mainBox').innerHTML);

	} else {																		//may be a longish signed text, so try a little harder
		var cipherstrArray = document.getElementById('mainBox').innerHTML.split('\n'),
			length = cipherstrArray.length,
			cipherstr = cipherstrArray[length-1];
		cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];
		if (cipherstr.length==245){
			var link = "mailto:"+ "?subject=" + "&body=The following is a text signed with PassLok v.2.1. Verify using my Lock, which is this:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AHere's my Lock if you want to reply to me:%0D%0A%0D%0A" + encodeURIComponent(mylock2) + "%0D%0A%0D%0AGet PassLok at https://passlok.com";
		} else {
			mainmsg.innerHTML = 'Only Locks, and locked or signed text are allowed for Email';
			throw("illegal text")
		}
	}
}else{																				//tags unchecked, no extra text
	if((type=="!")||(type=="@")||(type=="#")||(type=="$")||(cipherstr.length==87)||(cipherstr.length==100)||(cipherstr.length==245)||(cipherstr.length==160)){
		var link = "mailto:"+ "?subject=" + "&body=" + encodeURIComponent(document.getElementById('mainBox').innerHTML);
	}else{
		mainmsg.innerHTML = '<span style="color:red">Only Locks, and locked or signed text are allowed for Email</span>';
		throw("illegal text")
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
		if (learnOn){
			var reply = confirm("The default texting app will now open. You need to have copied your short locked message to the clipboard before doing this, if you want to send one. This only works in smartphones. Cancel if this is not what you want.");
			if(reply===false) throw("SMS canceled");
		};
		window.open("SMS:","_parent")							//open SMS on mobile
	} else {
		document.getElementById('mainmsg').innerHTML = 'SMS function is only available on mobile devices'
	}
};

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	if(document.getElementById('chatframe').src.match('#')){			//chat already open, so open that screen
		document.getElementById('chatscr').style.display = 'block';
		return
	}
	
	var mainmsg = document.getElementById('mainmsg');
	var text = document.getElementById('mainBox').innerHTML.trim();
	
	if(text.slice(4,8) == 'chat'){										//there is already a chat invitation, so open it
		Decrypt_single();
		return
	}
	
	var listArray = document.getElementById('lockBox').value.trim().split('\n');
	if (learnOn){
		var reply = confirm("A special locked item will be made, inviting the selected recipients to a secure chat session. Cancel if this is not what you want.");
		if(reply===false) throw("chat invite canceled");
	};
	
	if(listArray[0] == '' || (listArray[0] == 'myself' && listArray.length == 1)){
		mainmsg.innerHTML = 'Please select those invited to chat';
		throw("nobody invited to chat");
	}
	listArray = listArray.concat('myself');								//make sure 'myself' is on the list
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates and nulls
	listArray = listArray.filter(function(n){return n});
	document.getElementById('lockBox').value = listArray.join('\n');
	openClose('shadow');
	openClose('chatDialog');												//stop to get chat type
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	closebox();
	if(document.getElementById('datachat').checked){
		var type = 'A'
	}else if (document.getElementById('audiochat').checked){
		var type = 'B'
	}else{
		var type = 'C'
	}
	var date = (document.getElementById('chatdate').value + '                                           ').slice(0,43);
	var password = sjcl.codec.base64.fromBits(sjcl.random.randomWords('8','0')).replace(/=/g,'');
	var chatroom = makeChatRoom();
	document.getElementById('mainBox').innerHTML = date + type + chatroom + password;
	var listArray = document.getElementById('lockBox').value.trim().split('\n');
	Encrypt_List(listArray);
	document.getElementById('mainBox').innerHTML = document.getElementById('mainBox').innerHTML.replace(/PL21msa|PL21mss|PL21msp|PL21mso/g,'PL21chat');			//change the tags
	mainmsg.innerHTML = 'Invitation to chat in the box.<br>Send it to the recipients.';
	selectMain();
}

//makes a mostly anonymous chatroom name from words on the blacklist
function makeChatRoom(){
	var name = document.getElementById('chatroom').value;
	if(name == ''){
		name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
		if((sjcl.bn.random(4).limbs[0])) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	}
	return (name + '                   ').slice(0,20);
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = sjcl.bn.random(blacklist.length).limbs[0];
	}
	return index
}