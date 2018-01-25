//displays how many characters are left, in Short mode and Decoy In box
function charsLeft(){
	//for decoy message box
	if(decoyIn.style.display == 'block'){
		var chars = encodeURI(decoyText.value).replace(/%20/g,' ').length,
			limit = 75;	
		if(chars <= limit){
			decoyMsg.textContent = chars + " characters out of " + limit + " used"
		}else{
			decoyMsg.textContent = 'Maximum length exceeded. The message will be truncated'
		}
		return
	}

	//this one is for the text in the chat making dialog
	else if(chatDialog.style.display == 'block'){
		var chars = chatDate.value.length;
		var limit = 43;
		if(chars <= limit){
			chatmsg.textContent = chars + " characters out of " + limit + " used"
		}else{
			chatmsg.textContent = 'Maximum length exceeded. The message will be truncated'
		}
		return
	}

	//Now for main box. Short mode character count
	else if(shortMode.checked && mainBox.textContent.match(/[^a-zA-Z0-9+\/=-]/)){		//don't display character count if this is output
		updateButtons();
		var chars = encodeURI(mainBox.textContent).replace(/%20/g,' ').length,
			sharedKey = stripTags(replaceByItem(lockBox.textContent.trim()));
		if(!sharedKey) return;
		if(sharedKey.length != 43 && sharedKey.length != 50 && !onceMode.checked){	
			var limit = 94									//Key-encrypted mode, 94 chars
		}else if(anonMode.checked){
			var limit = 62									//anonymous mode, 62 chars
		}else if(signedMode.checked){
			var limit = 94									//signed mode, 94 chars
		}else if(onceMode.checked){
			var limit = 46									//Read-once mode, 46 chars
		}
		if(extra2mainBtn.style.display != ''){		//don't show this if hiding or splitting
			if(chars <= limit){
				mainMsg.textContent = chars + " characters out of " + limit + " used"
			}else{
				mainMsg.textContent = 'Maximum length exceeded. The message will be truncated'
			}
		}
	}else{updateButtons()}								//display button labels according to item nature
}

//changes button labels according to context
function updateButtons(){
	var string = mainBox.innerHTML.trim(),
		type = getType(string)[0],
		isRecipient = !!lockBox.textContent.trim();

	if(type && type.match(/[hkdsgasoprASO]/)){
		decryptBtn.textContent = 'Decrypt';
		decryptBtnBasic.textContent = 'Decrypt';
		decryptBtnEmail.textContent = 'Decrypt';
		showLockBtn.textContent = 'Email';
		showLockBtnBasic.textContent = 'Email'	
	}else if(type && type.match(/[lc]/) && isRecipient){
		decryptBtn.textContent = 'Encrypt';
		decryptBtnBasic.textContent = 'Encrypt';
		decryptBtnEmail.textContent = 'Encrypt';
		showLockBtn.textContent = 'Email';
		showLockBtnBasic.textContent = 'Email';
	}else if(isRecipient){
		decryptBtn.textContent = 'Encrypt';
		decryptBtnBasic.textContent = 'Encrypt';
		decryptBtnEmail.textContent = 'Encrypt';
		showLockBtn.textContent = 'myLock';
		showLockBtnBasic.textContent = 'myLock'	
	}else{
		decryptBtn.textContent = 'Invite';
		decryptBtnBasic.textContent = 'Invite';
		decryptBtnEmail.textContent = 'Invite';
		showLockBtn.textContent = 'myLock';
		showLockBtnBasic.textContent = 'myLock'	
	}
	if(type && type == 'l'){verifyBtn.textContent = 'Unseal'}else{verifyBtn.textContent = 'Seal'};

	if((string.slice(0,13).match(/p\d{3}/) && string.slice(0,7).match('PL')) || (string.match(/PL\d{2}p\d{3}/) && string.match('.txt'))){			//box contains parts
		secretShareBtn.textContent = 'Join'
	}else{
		secretShareBtn.textContent = 'Split'
	}
	
	if(string){ selectMainBtn.textContent = 'Copy' }else{ selectMainBtn.textContent = 'Paste' }
}

//gets recognized type of string, if any, otherwise returns false. Also returns cleaned-up string
function getType(stringIn){
	var string = stringIn.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/"(.*?)\/a>/,'');
	if(string.match('==')) string = string.split('==')[1].replace(/-/g,'');		//remove tags and dashes from Locks
	string = string.replace(/<(.*?)>/g,'');

	var	type = string.charAt(0),
		typeGC = string.charAt(56),												//PassLok for Email compatible
		isBase64 = !string.match(/[^a-zA-Z0-9+\/]/),
		isBase26 = !string.match(/[^A-Z]/),
		isNoLock = string.length != 43 && string.length != 50;

	if(type.match(/[lkgdasoprASO]/) && isBase64 && !isBase26 && isNoLock && string.length > 40){
		return [type, string]
	}else if(typeGC.match(/[gasoprSO]/) && isBase64 && !isBase26 && isNoLock && string.length > 40){
		return [typeGC, string]
	}else if(!isNoLock && isBase64 && !isBase26 && string.length > 40){
		return ['c'	, string]																//special type for a Lock
	}else if(string && isBase26){
		return ['h', string]																//human-computable encrypted
	}else{
		return [false, stringIn]
	}
}

//start decrypt or verify if the item pasted in is recognized
function pasteMain() {
    setTimeout(function(){
		var array = getType(mainBox.innerHTML.trim()),
			type = array[0],
			lockBoxHTML = lockBox.innerHTML.replace(/<br>$/,"").trim();
		if(type && type.match(/[hkdsgasoprASO]/)){							//known encrypted type: decrypt
			unlock(type,array[1],lockBoxHTML);
			return
		}else if(type && type == 'l'){										//unseal
			verifySignature(array[1],lockBoxHTML);
			return
		}else if(type && type == 'c'){										//store new Lock
			extractLock(mainBox.innerHTML.trim())
		}
    }, 0)
}

//this is for showing and hiding text in key box and other password input boxes
function showsec(){
	if(showKey.checked){
		pwd.type="TEXT"
	}else{
		pwd.type="PASSWORD"
	}
}

function showDecoyIn(){
	if(showDecoyInCheck.checked){
		decoyPwdIn.type="TEXT"
	}else{
		decoyPwdIn.type="PASSWORD"
	}
}

function showDecoyOut(){
	if(showDecoyOutCheck.checked){
		decoyPwdOut.type="TEXT"
	}else{
		decoyPwdOut.type="PASSWORD"
	}
}

function showIntro(){
	if(showIntroKey.checked){
		pwdIntro.type="TEXT"
	}else{
		pwdIntro.type="PASSWORD"
	}
}

function showNewKey(){
	if(showNewKeyCheck.checked){
		newKey.type="TEXT"
		newKey2.type="TEXT"
	}else{
		newKey.type="PASSWORD"
		newKey2.type="PASSWORD"
	}
}

function chat2main(){
	chatScr.style.display = 'none'
}

function resetChat(){
	var frame = document.getElementById('chatFrame'),
		src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 10)
}

//for clearing different boxes
function clearMain(){
	mainBox.textContent = '';
	mainMsg.textContent = '';
	selectMainBtn.textContent = 'Paste'
	charsLeft()
}
function clearLocks(){
	lockBox.textContent='';
	lockNameBox.value='';
	lockMsg.textContent='';
	suspendFindLock = false
}
function clearIntro(){
	pwdIntro.value = '';
	introMsg.textContent = '';
	KeyStr = '';
	keyMsg.textContent = ''
}
function clearIntroEmail(){
	emailIntro.value = ''
}

//encrypts, decrypts, or sends invite depending on main box content
function lockBtnAction(){
	var array = getType(mainBox.innerHTML.trim()),
		type = array[0],
		lockBoxHTML = lockBox.innerHTML.replace(/<br>$/,"").trim();
	if(type && type.match(/[hkdgasoprASO]/)){								//known encrypted type: decrypt
		unlock(type,array[1],lockBoxHTML)
	}else if(!!lockBoxHTML){												//recipients selected: encrypt and send if Email mode
		lock(lockBoxHTML,array[1]);
		setTimeout(function(){
			if(emailMode.checked) sendMail()
		},50)
	}else{
		sendMail()															//no recipients: invite
	}
}

//for selecting the Main box contents and copying them to clipboard, or pasting the clipboard if there is nothing
function selectMain(){
  if(mainBox.textContent.trim() != ''){
    var range, selection;
    if(document.body.createTextRange){
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select()
    }else if (window.getSelection){
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy')
  }else{
	document.execCommand("paste")	;
	selectMainBtn.textContent = 'Copy'
  }
}

//writes five random dictionary words in the intro Key box
function suggestIntro(){
	var output = '',
		wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <= 5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand
	}
	pwdIntro.type="TEXT";
	pwdIntro.value = output.trim();
	showIntroKey.checked = true
}

var friendsLock = '';
//makes a new user account
function newUser(){
	var referrer = decodeURI(window.location.hash).slice(1).split('&');
	if(referrer.length > 1){
		friendsName.value = referrer[0].replace(/_/g,' ');
		friendsLock = referrer[1];
		referrerMsg.style.display = "block"
	}
	introscr.style.display = "block";
	BasicButtons = true
}

//shows email screen so email/token can be changed
function showEmail(){
	if(!fullAccess){
		optionMsg.textContent = 'Email change not allowed in Guest mode. Please restart PassLok';
		throw('email change canceled')
	}
	if(myEmail) emailBox.value = myEmail;
	shadow.style.display = 'block';
	emailScr.style.display = 'block'
}

//shows user name so it can be changed
function showName(){
	if(!fullAccess){
		optionMsg.textContent = 'Name change not allowed in Guest mode. Please restart PassLok';
		throw('name change canceled')
	}
	userNameBox.value = userName;
	shadow.style.display = 'block';
	nameScr.style.display = 'block'
}

//changes the name of the complete database, syncs if possible
function changeName(){
	if(!fullAccess){
		namechangemsg.textContent = 'Name change not allowed in Guest mode';
		throw('Name change canceled')
	}
	if(learnMode.checked){
		var reply = confirm("The current User Name will be changed. Cancel if this is not what you want.");
		if(!reply) throw("Name change canceled")
	}
	var oldUserName = userName,
		userNameTemp = document.getElementById('userNameBox').value;
	if (userNameTemp.trim() == ''){
		throw('no name')
	}
	recryptDB(KeyStr,userNameTemp);
	localStorage[userNameTemp] = localStorage[userName];
	delete localStorage[userName];
	userName = userNameTemp;

	if(ChromeSyncOn && chromeSyncMode.checked){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]));
			chrome.storage.sync.remove((oldUserName+'.'+name).toLowerCase())
		}
		updateChromeSyncList();
		chrome.storage.sync.remove(oldUserName.toLowerCase()+'.ChromeSyncList')
	}
}

//makes base64 code for checkboxes in Options and stores it
function checkboxStore(){
	if(fullAccess){
		var checks = document.optionchecks;
		var binCode = '', i;
		for(i = 0; i < checks.length; i++){
			binCode += checks[i].checked ? 1 : 0
		}
		if(locDir['myself']){
			locDir['myself'][1] = changeBase(binCode,'01',base64);
			localStorage[userName] = JSON.stringify(locDir);

			if(ChromeSyncOn && chromeSyncMode.checked){
				syncChromeLock('myself',JSON.stringify(locDir['myself']))
			}
		}
	}
}

//resets checkboxes in Options according to the stored code
function code2checkbox(){
	var checks = document.optionchecks;
	if(locDir['myself'][1]){
		var binCode = changeBase(locDir['myself'][1],base64,'01'), i;
		while(binCode.length < checks.length) binCode = '0' + binCode;
		for(i = 0; i < checks.length; i++){
			checks[i].checked = (binCode[i] == '1')
		}
		var isEmailMode = checks[2].checked;
		BasicButtons = checks[0].checked || isEmailMode
	}
	if(!BasicButtons){									//retrieve Advanced interface
		openClose("basicBtnsTop");
		openClose("mainBtnsTop");
		openClose("lockBtnsBottom");
		openClose("basicHideModes");
		openClose('advancedModes');
		openClose('specialEncryptModes');
		openClose('advancedBtns');
		openClose('advancedHelp');
		basicMode.checked = false;
		advancedMode.checked = true
	}
	if(isEmailMode){									//Email compatible interface
		mode2email();
		updateButtons()
	}
	getCustomColors();
	selectStyle();

	if(ChromeSyncOn) syncCheck.style.display = 'block'
}

//go to 2nd intro screen, and back. The others are similar
function go2intro2(){
	openClose('introscr');
	openClose('introscr2')
}
function go2intro3(){
	openClose('introscr2');
	openClose('introscr3')
}
function go2intro4(){
	openClose('introscr3');
	openClose('introscr4')
}
function go2intro5(){
	intromsg2.textContent = '';
	openClose('introscr4');
	openClose('introscr5')
}

//these close input dialogs
function closeBox(){
	shadow.style.display = "none";
	keyScr.style.display = "none";
	lockScr.style.display = "none";
	decoyIn.style.display = "none";
	decoyOut.style.display = "none";
	partsIn.style.display = "none";
	keyChange.style.display = "none";
	emailScr.style.display = "none";
	chatDialog.style.display = "none";
	nameScr.style.display = "none";
	introscr.style.display = "none"
}

//Key entry is canceled, so record the limited access mode and otherwise start normally
function cancelKey(){
	if(firstInit) {pwd.value = ''; KeyStr = '';}
	if(!allowCancelWfullAccess){
		fullAccess = false;

		if(nameList.options.length == 2){						//only one user, no need to select it
			userName = nameList.options[1].value
		}else{												//several users
			for(var i = 0; i < nameList.options.length; i++){
    			if(nameList.options[i].selected){
					userName = nameList.options[i].value
    			}
  			}
		}

		getSettings();
		fillList();										//put names in selection box
		if(locDir['myself']){
			locDir['myself'][3] = 'guest mode';
			localStorage[userName] = JSON.stringify(locDir);

			if(ChromeSyncOn && chromeSyncMode.checked){
				syncChromeLock('myself',JSON.stringify(locDir['myself']))
			}
		}
		if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
			mainMsg.textContent = 'To encrypt a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the Edit button'
		}else{
			setTimeout(function(){mainMsg.textContent = 'You are in Guest mode. For full access, reload and enter your Key'},30)
		}
	}
	allowCancelWfullAccess = false;
	closeBox()
}
function cancelName(){
	closeBox();
	mainMsg.textContent = 'User name change canceled';
	callKey = ''
}
function cancelEmail(){
	emailBox.value = '';
	closeBox();
	mainMsg.textContent = 'Email/token change canceled';
	callKey = ''
}
function cancelDecoy(){
	decoyPwdIn.value = '';
	decoyPwdOut.value = '';
	closeBox();
	mainMsg.textContent = 'Hidden message canceled'
}
function cancelPartsIn(){
	partsNumber.value = '';
	closeBox();
	mainMsg.textContent = 'Split canceled'
}
function cancelChat(){
	closeBox();
	mainMsg.textContent = 'Chat canceled'
}
function cancelKeyChange(){
	newKey.value = '';
	closeBox();
	mainMsg.textContent = 'Key change canceled';
	if(keyScr.style.display == 'block') keyScr.style.display = 'none';
	callKey = ''
}

//triggered if the user types Enter in the name box of the locks screen
function lockNameKeyup(evt){
	evt = evt || window.event;												//IE6 compliance
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13) {												//sync from Chrome or decrypt if hit Return
		if(lockMsg.textContent == ''){				//found nothing, so try to get it from Chrome sync
			if(ChromeSyncOn && chromeSyncMode.checked){
				getChromeLock(lockNameBox.value);
			}
		}else{												//decrypt 1st time if found locally, 2nd time if synced from Chrome
			if(!lockMsg.textContent.match('not found in Chrome sync')){
				var firstchar = lockBox.textContent.slice(0,1);
				if(firstchar == 'k'){
					decryptLock()
				}
			}
		}
	}else if(!suspendFindLock){											//otherwise search database
			return findLock()
	}else{
		if(lockBox.textContent.trim() == ''){
			suspendFindLock = false;
			return findLock()
		}
	}
}

//displays Keys strength and resets Key timer
function pwdKeyup(evt){
	clearTimeout(keytimer);
	keytimer = setTimeout(resetKeys, 300000);
	keytime = new Date().getTime();
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){acceptKey()} else{
		 return keyStrength(pwd.value,true)
	}
}

//Key strength display on intro screen
function introKeyup(){
	return keyStrength(pwdIntro.value,true)
}

//Key strength display on image hide screen
function imageKeyup(){
	return keyStrength(imagePwd.value,true)
}

//same but for decoy In screen
function decoyKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){submitDecoyIn()} else{
		 return keyStrength(decoyPwdIn.value,true)
	}
}

//same for key Change screen
function newKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){changeKey()} else{
		 return keyStrength(newKey.value,true)
	}
}

//this one looks at the second box and announces a match
function newKey2up(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){changeKey()}else{
		var	newkey = newKey.value,
			newkey2 = newKey2.value,
			length = newkey.length,
			length2 = newkey2.length;
		if(length != length2){
			if(newkey2 == newkey.slice(0,length2)){
				keyChangeMsg.textContent = 'Keys match so far. ' + (length - length2) + ' characters to go'
			}else{
				keyChangeMsg.textContent = "Keys don't match"
			}
		}else{
			if(newkey2 == newkey){
				keyChangeMsg.textContent = "Keys match!>"
			}else{
				keyChangeMsg.textContent = "Keys don't match"
			}
		}
	}
}

//activated when the user clicks OK on a decoy screen
function submitDecoy(){
	closeBox();
	if(callKey == 'sign'){
		signVerify()
	}else{
		lockBtnAction()
	}
}

//Enter has the same effect as clicking OK in decoy and parts box
function decoyKeyupOut(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){submitDecoy()}
}
function partsKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){submitParts()}
}
function submitParts(){
	if(!isNaN(partsNumber.value)){
	closeBox();
	secretshare()
	}
}
function emailKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){email2any()}
}
function nameKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){name2any()}
}

//for switching between sets of buttons
function main2extra(){
	if(basicMode.checked) return;
	openClose("mainBtnsTop");
	openClose("extraButtonsTop");
	fillList()
}

//switch to Advanced mode
function mode2adv(){
	mainBtnsTop.style.display = 'block';
	basicBtnsTop.style.display = 'none';
	emailBtnsTop.style.display = 'none';
	lockBtnsBottom.style.display = 'block';
	advancedModes.style.display = 'block';
	basicHideModes.style.display = 'block';
	specialEncryptModes.style.display = 'block';
	advancedBtns.style.display = 'block';
	advancedHelp.style.display = 'block';
	basicMode.checked = false;
	advancedMode.checked = true;
	emailMode.checked = false;	
	anonMode.style.display = '';
	anonLabel.style.display = '';
	anonMode.checked = true;
	signedMode.checked = false;
	onceMode.checked = false;
	BasicButtons = false;
	checkboxStore()
}

//switch to Basic mode
function mode2basic(){
	mainBtnsTop.style.display = 'none';
	extraButtonsTop.style.display = 'none';
	basicBtnsTop.style.display = 'block';
	emailBtnsTop.style.display = 'none';	
	lockBtnsBottom.style.display = 'none';
	basicHideModes.style.display = 'none';
	advancedModes.style.display = 'none';
	specialEncryptModes.style.display = 'none';
	advancedBtns.style.display = 'none';
	advancedHelp.style.display = 'none';
	basicMode.checked = true;
	advancedMode.checked = false;
	emailMode.checked = false;
	resetAdvModes();
	decoyMode.checked = false;	
	anonMode.style.display = '';
	anonLabel.style.display = '';
	anonMode.checked = true;
	signedMode.checked = false;
	onceMode.checked = false;
	BasicButtons = true;
	checkboxStore();
	fillList()
}

//switch to PassLok for Email compatible mode
function mode2email(){
	mainBtnsTop.style.display = 'none';
	extraButtonsTop.style.display = 'none';
	basicBtnsTop.style.display = 'none';
	emailBtnsTop.style.display = 'block';
	lockBtnsBottom.style.display = 'none';
	basicHideModes.style.display = 'block';
	advancedModes.style.display = 'none';
	specialEncryptModes.style.display = 'none';
	advancedBtns.style.display = 'none';
	advancedHelp.style.display = 'none';
	basicMode.checked = false;
	advancedMode.checked = false;
	emailMode.checked = true;
	ezLokMode.checked = true;
	resetAdvModes();
	letterMode.checked = true;
	anonMode.style.display = 'none';
	anonLabel.style.display = 'none';
	anonMode.checked = false;
	signedMode.checked = true;
	onceMode.checked = false;
	BasicButtons = true;
	checkboxStore();
	fillList()
}

//sets modes selectable in Advanced mode to default values
function resetAdvModes(){
	longMode.checked = true;
	shortMode.checked = false;
	compatMode.checked = false;
	letterMode.checked = true;
	wordMode.checkec = false;
	spaceMode.checked = false;
	sentenceMode.checked = false
}

//opens local directory for input if something seems to be missing
function main2lock(){
	if(tabLinks['mainTab'].className == '') return;
	if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){				//new user, so display a fuller message
		lockMsg.textContent = 'Please enter a Lock or shared Key in the lower box. To store it, write a name in the top box and click Save'
	}
	var string = lockBox.textContent.trim();
	if(string.length > 500){							//cover text detected, so replace the currently selected one
		newCover(string)
	}
	resetList();
	openClose('lockScr');
	openClose('shadow')
}

//close image screen
function image2main(){
	if(imageScr.style.display=='block'){
		openClose('imageScr');
		openClose('shadow')
	}
}

//go to general directory frame
function lock2dir(){
	if(learnMode.checked){
		var reply = confirm("The General Directory will open so you can find or post a Lock.\nWARNING: this involves going online, which might leak metadata. Cancel if this is not what you want.");
		if(!reply) throw("General Directory canceled")
	}
	if(keyScr.style.display=='block') return;

	if(lockdirScr.style.display=='none') loadLockDir();	
	var locklength = stripTags(removeHTMLtags(mainBox.textContent)).length;
	if ((locklength == 43 || locklength == 50) && lockdirScr.style.display != "block"){

//if populated, send Lock to General Directory
		var frame = document.getElementById('lockdirFrame');
		frame.contentWindow.postMessage(removeHTMLtags(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');			//no formatting
		frame.onload = function() {
	    	frame.contentWindow.postMessage(removeHTMLtags(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');		//so that the Lock directory gets the Lock, too
		}
		lockdirScr.style.display = "block";
		return
	}
	openClose('lockdirScr');
	focusBox()
}

//return from general directory frame
function dir2any(){
	openClose('lockdirScr');
	focusBox()
}

//to load general Lock directory only once
function loadLockDir(){
	if(document.getElementById('lockdirFrame').src != 'https://www.passlok.com/lockdir') document.getElementById('lockdirFrame').src = 'https://www.passlok.com/lockdir'
}

//loads the chat frame
function main2chat(token){
	if(isAndroid && isChrome){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running PassLok as a native app.');
		if(!reply) throw('chat canceled by user')
	}
	document.getElementById('chatFrame').src = 'https://www.passlok.com/chat/index.html#' + token;				//open chat iframe; remote because of the CSP
	chatBtn.textContent = 'Back to Chat';
	chatBtn.style.color = 'orange';
	chatScr.style.display = 'block'
}

//called when the Key box is empty
function any2key(){
	closeBox();
	shadow.style.display = 'block';
	keyScr.style.display = 'block';
	if(!isMobile) pwd.focus();
	allowCancelWfullAccess = false
}

//called when the email box is empty
function any2email(){
	shadow.style.display = 'block';
	emailScr.style.display = 'block';
	emailMsg.textContent = 'Please enter your new email or similar item, or a new random token';
	if(!isMobile) emailBox.focus()
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(resetKeys, 300000);	//reset timer for 5 minutes, then delete Key
	keytime = new Date().getTime();
	keyScr.style.display = 'none';
	shadow.style.display = 'none'
}

//leave email screen
function email2any(){
	if(callKey = 'showlock') var dispLock = true;				//in case we were in the middle of displaying the Lock
	callKey = 'changeemail';
	var email = emailBox.value.trim();
	if(myEmail.length == 43 && fullAccess){
		var result = confirm('If you go ahead, the random token associated with your user name will be overwritten, which will change your Lock. This is irreversible.');
		if(!result){
			emailMsg.textContent = 'Random token overwrite canceled';
			throw ('random token overwrite canceled')
		}
	}
	myEmail = email;
	emailBox.value = '';
	refreshKey();
	if(!KeyDir) KeyDir = wiseHash(KeyStr,userName);
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(KeyStr,myEmail)).secretKey;			//do this regardless in case email has changed
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
	myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');
	myezLock = changeBase(myLockStr, base64, base36, true);
	if(dispLock) lockDisplay();

	if(fullAccess) storemyEmail();
	emailScr.style.display = 'none';
	key2any();															//close key dialog too, if it was open
	if(tabLinks['optionsTab'].className == 'selected'){
		optionMsg.textContent = 'Email/token changed';
	}
	fillList();
	callKey = ''
}

//leave name change screen
function name2any(){
	callKey = 'changename';
	if(fullAccess){
		changeName()
	}else{
		namechangemsg.textContent = 'Name change not allowed in Guest mode';
		throw('Name change canceled')
	}
	closeBox();
	optionMsg.textContent = 'The User Name has changed to: '+ userName;
	callKey = ''
}

//put cursor in the box. Handy when using keyboard shortcuts
function focusBox(){
	if (!isMobile){															//on mobile, don't focus
		if(keyScr.style.display == 'block'){
			pwd.focus()
		} else if(lockScr.style.display == 'block'){
			lockNameBox.focus()
		} else {
			mainBox.focus()
		}
	}
}

//to hide and unhide stuff
function openClose(theID) {
	if(document.getElementById(theID).style.display === "block"){
		document.getElementById(theID).style.display = "none"
	}else{
		document.getElementById(theID).style.display = "block"
	}
}

//as above, but closes everything else in help
function openHelp(theID){
	var helpItems = document.getElementsByClassName('helpItem');
	for(var i=0; i < helpItems.length; i++){
		helpItems[i].style.display = 'none'
	}
	document.getElementById(theID).style.display = "block";
	if(isMobile){									//scroll to the item
		location.href = '#';
		location.href = '#a' + theID;
		if(!isiOS){
			if(helpTop.style.display == 'block') helpTop.style.display = 'none'
		}
	}
}

<!--variables and functions for making tabs, by Matt Doyle 2009-->
var tabLinks = new Array(),
	contentDivs = new Array();

function initTabs(){

      // Grab the tab links and content divs from the page
      var tabListItems = document.getElementById('tabs').childNodes;
      for( var i = 0; i < tabListItems.length; i++){
        if(tabListItems[i].nodeName == "LI"){
          var tabLink = getFirstChildWithTagName( tabListItems[i], 'A' );
          var id = getHash( tabLink.getAttribute('href'));
          tabLinks[id] = tabLink;
          contentDivs[id] = document.getElementById(id)
        }
      }

      // Assign onclick events to the tab links, and
      // highlight the first tab
      var i = 0;

      for(var id in tabLinks){
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function(){ this.blur()};
        if (i == 0) tabLinks[id].className = 'selected';
        i++
      }

      // Hide all content divs except the first
      var i = 0;

      for(var id in contentDivs){
        if( i != 0 ) contentDivs[id].className = 'tabContent hide';
        i++
      }
}

function showTab(){
      var selectedId = getHash( this.getAttribute('href'));

      // Highlight the selected tab, and dim all others.
      // Also show the selected content div, and hide all others.
      for(var id in contentDivs){
        if(id == selectedId){
          tabLinks[id].className = 'selected';
          contentDivs[id].className = 'tabContent'
        }else{
          tabLinks[id].className = '';
          contentDivs[id].className = 'tabContent hide'
        }
      }
	  if(this.hash == '#mainTab') fillList();
	  if(this.hash != '#optionsTab'){
		  customColors.style.display = 'none';
		  optionMsg.textContent = 'Change Name, Key, etc.'
	  }
	  if(this.hash != '#helpTab' && !isiOS){
			if(helpTop.style.display == 'none') helpTop.style.display = 'block'
	  }
	  storeColors();

      // Stop the browser following the link
      return false
}

function getFirstChildWithTagName(element, tagName){
      for(var i = 0; i < element.childNodes.length; i++){
        if(element.childNodes[i].nodeName == tagName) return element.childNodes[i]
      }
}

function getHash(url){
      var hashPos = url.lastIndexOf('#');
      return url.substring(hashPos + 1)
}
//end of tab functions

//function to search in Help tab, from JAVASCRIPTER.NET 2011
var TRange=null;

function findString (str){
 if (parseInt(navigator.appVersion) < 4) return;
 var strFound;
 if (window.find){

  // CODE FOR BROWSERS THAT SUPPORT window.find

  strFound = self.find(str);
  if (!strFound){
   strFound = self.find(str,0,1);
   while(self.find(str,0,1)) continue
  }
 }
 else if(navigator.appName.indexOf("Microsoft") != -1){

  // EXPLORER-SPECIFIC CODE

  if(TRange != null){
   TRange.collapse(false);
   strFound = TRange.findText(str);
   if(strFound) TRange.select();
  }
  if(TRange == null || strFound == 0){
   TRange = self.document.body.createTextRange();
   strFound = TRange.findText(str);
   if(strFound) TRange.select()
  }
 }
 else if(navigator.appName == "Opera"){
  alert ("Opera browsers not supported, sorry...")
  return
 }
 if(!strFound){
	 helpmsg.textContent = 'Text not found in the titles'
 }else{
	 helpmsg.textContent = 'Text highlighted below. Click again to see more results'
 }
 return
}

//for rich text editing
function formatDoc(sCmd, sValue){
	  document.execCommand(sCmd, false, sValue); mainBox.focus()
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText(){
	if(niceEditor){
		toolBar1.style.display = 'none';
		mainBox.style.borderTopLeftRadius = '15px';
		mainBox.style.borderTopRightRadius = '15px';
		niceEditBtn.innerText = 'Rich';
		niceEditor = false
	}else{
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.innerText = 'Plain';
		niceEditor = true
	}
	textheight()
}