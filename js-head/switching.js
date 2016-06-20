//this is for showing and hiding text in key box and other password input boxes
function showsec(){
	if(showKey.checked){
		pwd.type="TEXT";
	}else{
		pwd.type="PASSWORD";
	}
}

function showDecoyIn(){
	if(showDecoyInCheck.checked){
		decoyPwdIn.type="TEXT";
	}else{
		decoyPwdIn.type="PASSWORD";
	}
}

function showDecoyOut(){
	if(showDecoyOutCheck.checked){
		decoyPwdOut.type="TEXT";
	}else{
		decoyPwdOut.type="PASSWORD";
	}
}

function showIntro(){
	if(showIntroKey.checked){
		pwdIntro.type="TEXT";
	}else{
		pwdIntro.type="PASSWORD";
	}
}

function showNewKey(){
	if(showNewKeyCheck.checked){
		newKey.type="TEXT";
		newKey2.type="TEXT";
	}else{
		newKey.type="PASSWORD";
		newKey2.type="PASSWORD";
	}
}

function chat2main(){
	chatScr.style.display = 'none'
}

function resetChat(){
	var frame = document.getElementById('chatFrame');
	var src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 0);
}

//for clearing different boxes
function clearMain(){
	mainBox.innerHTML = '';
	mainMsg.innerHTML = '';
	charsLeft();
}
function clearLocks(){
	lockBox.innerHTML='';
	lockNameBox.value='';
	lockMsg.innerHTML='';
	suspendFindLock = false;
}
function clearIntro(){
	pwdIntro.value = '';
	introMsg.innerHTML = '';
	KeyStr = '';
	keyMsg.innerHTML = '';
}
function clearIntroEmail(){
	emailIntro.value = '';
}

//for selecting the Main box contents and copying them to clipboard
function selectMain(){
    var range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range);
    }
	document.execCommand('copy')
}

//writes five random dictionary words in the intro Key box
function suggestIntro(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwdIntro.type="TEXT";
	pwdIntro.value = output.trim();
	showIntroKey.checked = true
}

var friendsLock = '';
//makes a new user account
function newUser(){
	var referrer = decodeURI(window.location.hash).slice(1).split('&');
	if (referrer.length > 1){
		friendsName.value = referrer[0].replace(/_/g,' ');
		friendsLock = referrer[1];
		referrerMsg.style.display = "block";
	}
	introscr.style.display = "block";
	BasicButtons = true;
}

//shows email screen so email/token can be changed
function showEmail(){
	if(!fullAccess){
		optionMsg.innerHTML = 'Email change not allowed in Guest mode<br>Please restart PassLok';
		throw('email change canceled')
	}
	if(myEmail) emailBox.value = myEmail;
	shadow.style.display = 'block';
	emailScr.style.display = 'block';
}

//shows user name so it can be changed
function showName(){
	if(!fullAccess){
		optionMsg.innerHTML = 'Name change not allowed in Guest mode<br>Please restart PassLok';
		throw('name change canceled')
	}
	userNameBox.value = userName;
	shadow.style.display = 'block';
	nameScr.style.display = 'block'
}

//changes the name of the complete database, syncs if possible
function changeName(){
	if(!fullAccess){
		namechangemsg.innerHTML = 'Name change not allowed in Guest mode';
		throw('Name change canceled')
	}
	if (learnMode.checked){
		var reply = confirm("The current User Name will be changed. Cancel if this is not what you want.");
		if(!reply) throw("Name change canceled");
	}
	var oldUserName = userName,
		userNameTemp = document.getElementById('userNameBox').value;
	if (userNameTemp.trim() == ''){
		throw('no name');
	}
	recryptDB(KeyStr,userNameTemp);
	localStorage[userNameTemp] = localStorage[userName];
	delete localStorage[userName];
	userName = userNameTemp;

	if(ChromeSyncOn && chromeSyncMode.checked){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]));
			chrome.storage.sync.remove((oldUserName+'.'+name).toLowerCase());
		}
		updateChromeSyncList();
		chrome.storage.sync.remove(oldUserName.toLowerCase()+'.ChromeSyncList');
	}
}

//makes base64 code for checkboxes in Options and stores it
function checkboxStore(){
	if(fullAccess){
		var checks = document.optionchecks;
		var binCode = '', i;
		for(i = 0; i < checks.length; i++){
			binCode += checks[i].checked ? 1 : 0;
		}
		if(locDir['myself']){
			locDir['myself'][1] = changeBase(binCode,'01',base64);
			localStorage[userName] = JSON.stringify(locDir);

			if(ChromeSyncOn && chromeSyncMode.checked){
				syncChromeLock('myself',JSON.stringify(locDir['myself']));
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
		BasicButtons = checks[0].checked || isEmailMode;
	}
	if(!BasicButtons){												//retrieve Advanced interface
		openClose("basicBtnsTop");
		openClose("mainBtnsTop");
		openClose("lockBtnsBottom");
		openClose('advancedModes');
		decoyEmail.style.display = '';
		openClose('advancedBtns');
		openClose('advancedHelp');
		basicMode.checked = false;
		advancedMode.checked = true;
	}
	if(isEmailMode) mode2email();						//Email compatible interface
	getCustomColors();
	selectStyle();

	if(ChromeSyncOn) syncCheck.style.display = 'block'
}

//go to 2nd intro screen, and back. The others are similar
function go2intro2(){
	openClose('introscr');
	openClose('introscr2');
}
function go2intro3(){
	openClose('introscr2');
	openClose('introscr3');
}
function go2intro4(){
	openClose('introscr3');
	openClose('introscr4');
}
function go2intro5(){
	intromsg2.innerHTML = '';
	openClose('introscr4');
	openClose('introscr5');
}

//these close input dialogs
function closeBox() {
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
	introscr.style.display = "none";
}

//Key entry is canceled, so record the limited access mode and otherwise start normally
function cancelKey(){
	if(firstInit) {pwd.value = ''; KeyStr = '';}
	if(!allowCancelWfullAccess){
		fullAccess = false;

		if (nameList.options.length == 2){						//only one user, no need to select it
			userName = nameList.options[1].value
		}else{												//several users
			for (var i = 0; i < nameList.options.length; i++) {
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
				syncChromeLock('myself',JSON.stringify(locDir['myself']));
			}
		}
		if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
			mainMsg.innerHTML = 'To encrypt a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button'
		}else{
			setTimeout(function(){mainMsg.innerHTML = '<span style="color:orange">You are in Guest mode<br>For full access, reload and enter the Key</span>'},30);
		}
	}
	allowCancelWfullAccess = false;
	closeBox()
}
function cancelName(){
	closeBox();
	optionsMsg.innerHTML = 'User name change canceled';
	callKey = ''
}
function cancelEmail(){
	emailBox.value = '';
	closeBox();
	optionsMsg.innerHTML = 'Email/token change canceled';
	callKey = ''
}
function cancelDecoyIn(){
	decoyPwdIn.value = '';
	closeBox();
	mainMsg.innerHTML = 'Hidden message canceled';
}
function cancelDecoyOut(){
	decoyPwdOut.value = '';
	closeBox();
	mainMsg.innerHTML = 'Hidden message canceled';
}
function cancelPartsIn(){
	partsNumber.value = '';
	closeBox();
	mainMsg.innerHTML = 'Split canceled';
}
function cancelChat(){
	closeBox();
	mainMsg.innerHTML = 'Chat canceled';
}
function cancelKeyChange(){
	newKey.value = '';
	closeBox();
	optionsMsg.innerHTML = 'Key change canceled';
	if(keyScr.style.display == 'block') keyScr.style.display = 'none';
	callKey = ''
}

//triggered if the user types Enter in the name box of the locks screen
function lockNameKeyup(evt){
	evt = evt || window.event;												//IE6 compliance
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13) {												//sync from Chrome or decrypt if hit Return
		if(lockMsg.innerHTML == ''){				//found nothing, so try to get it from Chrome sync
			if(ChromeSyncOn && chromeSyncMode.checked){
				getChromeLock(lockNameBox.value);
			}
		} else {												//decrypt 1st time if found locally, 2nd time if synced from Chrome
			if(!lockMsg.innerHTML.match('not found in Chrome sync')){
				var firstchar = lockBox.innerHTML.slice(0,1);
				if(firstchar == '~'){
					decryptLock()
				}
			}
		}
	} else if (!suspendFindLock){											//otherwise search database
			return findLock()
	} else {
		if(lockBox.innerHTML.trim() == ''){
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
	if (key == 13){acceptKey()} else{
		 return keyStrength(pwd.value,true);
	}
}

//Key strength display on intro screen
function introKeyup(){
	return keyStrength(pwdIntro.value,true);
}

//same but for decoy In screen
function decoyKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){submitDecoyIn()} else{
		 return keyStrength(decoyPwdIn.value,true);
	}
}

//same for key Change screen
function newKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){changeKey()} else{
		 return keyStrength(newKey.value,true);
	}
}

//this one looks at the second box and announces a match
function newKey2up(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){changeKey()} else {
		var	newkey = newKey.value,
			newkey2 = newKey2.value,
			length = newkey.length,
			length2 = newkey2.length;
		if(length != length2){
			if(newkey2 == newkey.slice(0,length2)){
				keyChangeMsg.innerHTML = 'Keys match so far. ' + (length - length2) + ' characters to go'
			} else {
				keyChangeMsg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}else{
			if(newkey2 == newkey){
				keyChangeMsg.innerHTML = "<span style='color:cyan'>Keys match!</span>"
			} else {
				keyChangeMsg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}
	}
}

//activated when the user clicks OK on a decoy screen
function submitDecoyIn(){
	closeBox();
	lockUnlock()
}

//Enter has the same effect as clicking OK in decoy and parts box
function decoyKeyupOut(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){submitDecoyOut()};
}
function submitDecoyOut(){
	closeBox();
	lockUnlock()
}
function partsKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){submitParts()};
}
function submitParts(){
	if(!isNaN(partsNumber.value)){
	closeBox();
	secretshare();
	}
}
function emailKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){email2any()};
}
function nameKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){name2any()};
}

//for switching between sets of buttons
function main2extra(){
	if(basicMode.checked) return;
	openClose("mainBtnsTop");
	openClose("extraButtonsTop");
	fillList();
}

//switch to Advanced mode
function mode2adv(){
	mainBtnsTop.style.display = 'block';
	basicBtnsTop.style.display = 'none';
	lockBtnsBottom.style.display = 'block';
	advancedModes.style.display = 'block';
	advancedBtns.style.display = 'block';
	advancedHelp.style.display = 'block';
	basicMode.checked = false;
	advancedMode.checked = true;
	emailMode.checked = false;
	hideBtnBasic.style.display = 'none';
	decoyEmail.style.display = '';		
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
	lockBtnsBottom.style.display = 'none';
	advancedModes.style.display = 'none';
	advancedBtns.style.display = 'none';
	advancedHelp.style.display = 'none';
	basicMode.checked = true;
	advancedMode.checked = false;
	emailMode.checked = false;
	resetAdvModes();
	hideBtnBasic.style.display = 'none';
	decoyEmail.style.display = 'none';
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
	basicBtnsTop.style.display = 'block';
	lockBtnsBottom.style.display = 'none';
	advancedModes.style.display = 'none';
	advancedBtns.style.display = 'none';
	advancedHelp.style.display = 'none';
	basicMode.checked = false;
	advancedMode.checked = false;
	emailMode.checked = true;
	ezLokMode.checked = true;
	resetAdvModes();
	hideBtnBasic.style.display = '';
	decoyEmail.style.display = '';
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
		lockMsg.innerHTML = 'Please enter a Lock or shared Key in the lower box. To store it, write a name in the top box and click <strong>Save</strong>.'
	}
	var string = lockBox.innerHTML.replace(/<br>$/,"").trim();
	if(string.length > 500){							//cover text detected, so replace the currently selected one
		newcover(string);
	}
	resetList();
	openClose('lockScr');
	openClose('shadow');
}

//open image screen
function main2image(){
	if (learnMode.checked){
		var reply = confirm("A new screen will open so you can load an image and hide the contents of the box in it. This only works for valid PassLok output. Cancel if this is not what you want.");
		if(!reply) throw("Image canceled");
	};
	openClose('imageScr');
	if(document.getElementById('preview').src.slice(0,4)!='data'){
		imagemsg.innerHTML='Click the button above to load an image'
	}else{
		updateCapacity()
	}
};

//return from image screen
function image2main(){
	if(imageScr.style.display=='block'){
		openClose('imageScr');
	}
}

//go to general directory frame
function lock2dir(){
	if (learnMode.checked){
		var reply = confirm("The General Directory will open so you can find or post a Lock.\nWARNING: this involves going online, which might leak metadata. Cancel if this is not what you want.");
		if(!reply) throw("General Directory canceled");
	};
	if(keyScr.style.display=='block') return;
	if(lockdirScr.style.display=='none') loadLockDir();
	var locklength = stripTags(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,''))).length;
	if ((locklength == 43 || locklength == 50) && lockdirScr.style.display != "block"){

//if populated, send Lock to directory
		var frame = document.getElementById('lockdirFrame');
		frame.contentWindow.postMessage(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');
		frame.onload = function() {
	    	frame.contentWindow.postMessage(XSSfilter(mainBox.innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');		//so that the Lock directory gets the Lock, too
		};
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
	if(document.getElementById('lockdirFrame').src != 'https://www.passlok.com/lockdir') document.getElementById('lockdirFrame').src = 'https://www.passlok.com/lockdir';
}

//loads the chat frame
function main2chat(token){
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running PassLok as a native app.');
		if(!reply) throw('chat canceled by user');
	}
	document.getElementById('chatFrame').src = 'https://www.passlok.com/chat/index.html#' + token;
	chatBtn.innerHTML = 'Back to Chat';
	chatBtn.style.color = 'orange';
	chatScr.style.display = 'block';
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
	emailMsg.innerHTML = 'Please enter your new email or similar item, or a new random token';
	if(!isMobile) emailBox.focus()
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(resetKeys, 300000);	//reset timer for 5 minutes, then delete Key
	keytime = new Date().getTime();
	keyScr.style.display = 'none';
	shadow.style.display = 'none';
}

//leave email screen
function email2any(){
	if(callKey = 'showlock') var dispLock = true;				//in case we were in the middle of displaying the Lock
	callKey = 'changeemail';
	var email = emailBox.value.trim();
	if(myEmail.length == 43 && fullAccess){
		var result = confirm('If you go ahead, the random token associated with your user name will be overwritten, which will change your Lock. This is irreversible.');
		if(!result){
			emailMsg.innerHTML = 'Random token overwrite canceled';
			throw ('random token overwrite canceled')
		}
	}
	myEmail = email;
	emailBox.value = '';
	refreshKey();
	if(!KeyDir) KeyDir = wiseHash(KeyStr,userName);
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(KeyStr,myEmail)).secretKey;			//do this regardless in case email has changed
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
	myezLock = changeBase(myLock, base64, base36, true);
	if(dispLock) lockDisplay();

	if(fullAccess) storemyEmail();
	emailScr.style.display = 'none';
	key2any();															//close key dialog too, if it was open
	if(tabLinks['optionsTab'].className == 'selected'){
		optionMsg.innerHTML = '<span style="color:cyan">Email/token changed</span>';
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
		namechangemsg.innerHTML = 'Name change not allowed in Guest mode';
		throw('Name change canceled')
	}
	closeBox();
	optionMsg.innerHTML = '<span style="color:cyan">The User Name has changed to: </span>'+ userName;
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

//simple XSS filter for use in innerHTML-editing statements. Removes stuff between angle brackets
function XSSfilter(string){
	return string.replace(/<(.*?)>/gi, "")
}

<!-- Text hide trick, by Sandeep Gangadharan 2005-->
if (document.getElementById) {
 document.writeln('<style type="text/css"><!--')
 document.writeln('.texter {display:none} @media print {.texter {display:block;}}')
 document.writeln('//--></style>') }

function openClose(theID) {
 if (document.getElementById(theID).style.display === "block") { document.getElementById(theID).style.display = "none" }
 else { document.getElementById(theID).style.display = "block" } };
// end of hide trick

//as above, but closes everything else in help
function openHelp(theID){
	var helpItems = document.getElementsByClassName('texter');
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
    var tabLinks = new Array();
    var contentDivs = new Array();

    function initTabs() {

      // Grab the tab links and content divs from the page
      var tabListItems = document.getElementById('tabs').childNodes;
      for ( var i = 0; i < tabListItems.length; i++ ) {
        if ( tabListItems[i].nodeName == "LI" ) {
          var tabLink = getFirstChildWithTagName( tabListItems[i], 'A' );
          var id = getHash( tabLink.getAttribute('href') );
          tabLinks[id] = tabLink;
          contentDivs[id] = document.getElementById(id);
        }
      }

      // Assign onclick events to the tab links, and
      // highlight the first tab
      var i = 0;

      for ( var id in tabLinks ) {
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function() { this.blur() };
        if ( i == 0 ) tabLinks[id].className = 'selected';
        i++;
      }

      // Hide all content divs except the first
      var i = 0;

      for ( var id in contentDivs ) {
        if ( i != 0 ) contentDivs[id].className = 'tabContent hide';
        i++;
      }
    }

    function showTab() {
      var selectedId = getHash( this.getAttribute('href') );

      // Highlight the selected tab, and dim all others.
      // Also show the selected content div, and hide all others.
      for ( var id in contentDivs ) {
        if ( id == selectedId ) {
          tabLinks[id].className = 'selected';
          contentDivs[id].className = 'tabContent';
        } else {
          tabLinks[id].className = '';
          contentDivs[id].className = 'tabContent hide';
        }
      }
	  if(this.hash == '#mainTab') fillList();
	  if(this.hash != '#optionsTab'){
		  customColors.style.display = 'none';
		  optionMsg.innerHTML = 'Change Name, Key, etc.'
	  }
	  if(this.hash != '#helpTab' && !isiOS){
			if(helpTop.style.display == 'none') helpTop.style.display = 'block'
	  }
	  storeColors();

      // Stop the browser following the link
      return false;
    }

    function getFirstChildWithTagName( element, tagName ) {
      for ( var i = 0; i < element.childNodes.length; i++ ) {
        if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
      }
    }

    function getHash( url ) {
      var hashPos = url.lastIndexOf ( '#' );
      return url.substring( hashPos + 1 );
    }
//end of tab functions

//function to search in Help tab, from JAVASCRIPTER.NET 2011
var TRange=null;

function findString (str) {
 if (parseInt(navigator.appVersion)<4) return;
 var strFound;
 if (window.find) {

  // CODE FOR BROWSERS THAT SUPPORT window.find

  strFound=self.find(str);
  if (!strFound) {
   strFound=self.find(str,0,1);
   while (self.find(str,0,1)) continue;
  }
 }
 else if (navigator.appName.indexOf("Microsoft")!=-1) {

  // EXPLORER-SPECIFIC CODE

  if (TRange!=null) {
   TRange.collapse(false);
   strFound=TRange.findText(str);
   if (strFound) TRange.select();
  }
  if (TRange==null || strFound==0) {
   TRange=self.document.body.createTextRange();
   strFound=TRange.findText(str);
   if (strFound) TRange.select();
  }
 }
 else if (navigator.appName=="Opera") {
  alert ("Opera browsers not supported, sorry...")
  return;
 }
 if (!strFound){
	 helpmsg.innerHTML = 'Text not found in the titles'
 }else{
	 helpmsg.innerHTML = 'Text highlighted below. Click again to see more results'
 }
 return;
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); mainBox.focus();
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		mainBox.style.borderTopLeftRadius = '15px';
		mainBox.style.borderTopRightRadius = '15px';
		niceEditBtn.innerHTML = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}