//this is for showing and hiding text in key box and other password input boxes
function showsec(){
  var showPasswordCheckBox = document.getElementById("showKey");
  if(showPasswordCheckBox.checked){
        document.getElementById('pwd').type="TEXT";
  }else{
      document.getElementById('pwd').type="PASSWORD";
  }
};

function showdecoyIn(){
  var showPasswordCheckBox = document.getElementById("showdecIn");
  if(showPasswordCheckBox.checked){
        document.getElementById('decoyPwdIn').type="TEXT";
  }else{
      document.getElementById('decoyPwdIn').type="PASSWORD";
  }
};

function showdecoyOut(){
  var showPasswordCheckBox = document.getElementById("showdecOut");
  if(showPasswordCheckBox.checked){
        document.getElementById('decoyPwdOut').type="TEXT";
  }else{
      document.getElementById('decoyPwdOut').type="PASSWORD";
  }
};

function showIntro(){
  var showPasswordCheckBox = document.getElementById("showIntroKey");
  if(showPasswordCheckBox.checked){
        document.getElementById('pwdIntro').type="TEXT";
  }else{
      document.getElementById('pwdIntro').type="PASSWORD";
  }
};

function showNewKey(){
  var showNewKeyCheckBox = document.getElementById("showNewKey");
  if(showNewKeyCheckBox.checked){
		document.getElementById('newKey').type="TEXT";
		document.getElementById('newKey2').type="TEXT";
  }else{
		document.getElementById('newKey').type="PASSWORD";
		document.getElementById('newKey2').type="PASSWORD";
  }
};

//to display output in a small font
function smallOutput(){
	if (document.getElementById('smallOut').checked) document.getElementById('mainBox').innerHTML = "<span style='color:black;background-color:white;font-size:xx-small'>" + XSSfilter(document.getElementById('mainBox').innerHTML) + "</span>";
}

function box2cover(){
	newcover(XSSfilter(document.getElementById('mainBox').innerHTML.replace(/\&nbsp;/g,' ').trim()))
}

function chat2main(){
	document.getElementById('chatscr').style.display = 'none'
}

function resetChat(){
	var src = document.getElementById('chatframe').src;
	document.getElementById('chatframe').src = '';
	setTimeout(function(){document.getElementById('chatframe').src = src;}, 0);
}

//for clearing different boxes
function clearMain(){
	document.getElementById('mainBox').innerHTML = '';
	document.getElementById('mainmsg').innerHTML = '';
	detectLock = true;
}
function clearLocks(){
	document.getElementById('lockBox').value='';
	document.getElementById('locknameBox').value='';
	document.getElementById('lockmsg').innerHTML='';
	suspendFindLock = false;
}
function clearIntro(){
	document.getElementById('pwdIntro').value = '';
	document.getElementById('keyIntromsg').innerHTML = '';
	document.getElementById('pwd').value = '';
	document.getElementById('keymsg').innerHTML = '';
}

//for selecting the Main box contents
function selectMain(){
    var doc = document
        , text = doc.getElementById('mainBox')
        , range, selection
    ;    
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

//to exit the special intro screen
function showlockIntro(){
	var key = document.getElementById('pwdIntro').value,
		email = document.getElementById('emailIntro').value;
	userName = document.getElementById('nameIntro').value;
	if (key.trim() == '' || userName.trim() == ''){
		document.getElementById('intromsg2').innerHTML = 'The User Name or the Key box is empty<br />Please go back and ensure both are filled.';
		return
	}
	document.getElementById('pwd').value = key;
	if (email == '') email = ' ';
	document.getElementById('email').value = email;
	
	if(ChromeSyncOn){
		var syncName = userName+'.myself';
		var mySettings = [];
		chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
			var lockdata = obj[syncName.toLowerCase()];
			if(lockdata){
				mySettings = JSON.parse(lockdata);
				lockDB['myself'] = mySettings;
				localStorage[userName] = JSON.stringify(lockDB);
				lockNames = Object.keys(lockDB);
				document.getElementById('email').value = keyDecrypt(lockDB['myself'][2]);
				setTimeout(function(){
					retrieveAllSync();
				}, 0);
			}
		});				
	}	
	
	initUser();
	openClose('introscr5');
	if(!ChromeSyncOn) showLock();
	key2any();
	if(!ChromeSyncOn && fullAccess) storeEmail();
	if(document.getElementById('inviteBox').checked) sendMail();
}

//writes five random dictionary words in the intro Key box
function suggestIntro(){
	var output = '';
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[sjcl.bn.random(wordlist.length).limbs[0]];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	document.getElementById('pwdIntro').type="TEXT";
	document.getElementById('pwdIntro').value = output.trim();
	document.getElementById('showIntroKey').checked = true
}

//makes a new user account
function newUser(){
//	document.getElementById('videotutorial').src = "https://www.youtube.com/embed/UxgrES_CGcg";
	document.getElementById('introscr').style.display = "block";
	BasicButtons = true;
}

//store email entered on email screen
function storeEmail(){
	var email = document.getElementById('email').value;
	if (email == ''){
		any2email();
		throw('no email');
	}
	if(lockDB['myself'] && fullAccess){
		var key = readKey(),
			emailcrypt = keyEncrypt(key,email);
		lockDB['myself'][2] = emailcrypt;
		for(var name in lockDB){					//this has likely changed for each entry, so delete it. It will be remade later
			delete lockDB[name][1]
		}
	}
	localStorage[userName] = JSON.stringify(lockDB);
	
	if(ChromeSyncOn){
		for(var name in lockDB){
			syncChromeLock(name,JSON.stringify(lockDB[name]))
		}
	}
}

//shows email screen so it can be changed
function showEmail(){
	var optionmsg = document.getElementById("optionmsg"),
		email = document.getElementById('email').value;
	if(!fullAccess){
		optionmsg.innerHTML = 'Email change not allowed after Key cancel';
		throw('Email change canceled')
	};
	if(email.length == 86) document.getElementById('email').value = '';
	document.getElementById('shadow').style.display = 'block';
	document.getElementById('emailscr').style.display = 'block'
}

//shows user name so it can be changed
function showName(){
	if(!fullAccess){
		optionmsg.innerHTML = 'Name change not allowed after Key cancel';
		throw('Name change canceled')
	}
	if (learnOn){
		var reply = confirm("The current User Name will be changed. Cancel if this is not what you want.");
		if(reply == false) throw("Name change canceled");
	}
	document.getElementById('userName').value = userName;
	document.getElementById('shadow').style.display = 'block';
	document.getElementById('namescr').style.display = 'block'	
}

//changes the name of the complete database, syncs if possible
function changeName(){
	var oldUserName = userName,
		userNameTemp = document.getElementById('userName').value;
	if (userNameTemp.trim() == ''){
		throw('no name');
	}
	localStorage[userNameTemp] = localStorage[userName];
	delete localStorage[userName];
	userName = userNameTemp;
	
	if(ChromeSyncOn){
		for(var name in lockDB){
			syncChromeLock(name,JSON.stringify(lockDB[name]));
			chrome.storage.sync.remove((oldUserName+'.'+name).toLowerCase());
		}
	}
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
	document.getElementById('intromsg2').innerHTML = '';
	openClose('introscr4');
	openClose('introscr5');
}

//these close input dialogs
function closebox() {
	document.getElementById("shadow").style.display = "none";
	document.getElementById("keyscr").style.display = "none";
	document.getElementById("lockscr").style.display = "none";
	document.getElementById("decoyIn").style.display = "none";
	document.getElementById("decoyOut").style.display = "none";
	document.getElementById("partsIn").style.display = "none";
	document.getElementById("keyChange").style.display = "none";
	document.getElementById("emailscr").style.display = "none";
	document.getElementById("chatDialog").style.display = "none";
	document.getElementById("namescr").style.display = "none";
	document.getElementById("introscr").style.display = "none";
}
function cancelKey(){
	if(allowCancelWfullAccess == false){
		fullAccess = false;
		
		var x = document.getElementById("namelist");
		for (var i = 0; i < x.options.length; i++) {
    		if(x.options[i].selected == true){
				userName = x.options[i].value
    		}
  		}
		initUser();
		fillList();																	//put names in selection box
		if(lockDB['myself']){
			lockDB['myself'][7] = 'limited access';
			localStorage[userName] = JSON.stringify(lockDB);
		
			if(ChromeSyncOn){
				syncChromeLock(userName+'.myself',JSON.stringify(lockDB['myself']));
			}			
		}
		if(Object.keys(lockDB).length == 1 || Object.keys(lockDB).length == 0){		//new user, so display a fuller message
			document.getElementById('mainmsg').innerHTML = 'To lock a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button'
		}else{
			document.getElementById('mainmsg').innerHTML = 'You have limited access to functions<br>For full access, reload and enter the Key'
		}
	}
	allowCancelWfullAccess = false;
	closebox()
}
function cancelName(){
	closebox()
}
function cancelEmail(){
	closebox();
	if(lockDB['myself']) document.getElementById('email').value = keyDecrypt(lockDB['myself'][2]);
}
function cancelDecoyIn(){
	document.getElementById('decoyPwdIn').value = '';
	closebox()
}
function cancelDecoyOut(){
	document.getElementById('decoyPwdOut').value = '';
	closebox()
}
function cancelPartsIn(){
	document.getElementById('partsNumber').value = '';
	closebox()
}
function cancelChat(){
	closebox()
}
function cancelKeyChange(){
	document.getElementById('newKey').value = '';
	closebox();
	if(document.getElementById('keyscr').style.display == 'block') document.getElementById('keyscr').style.display = 'none'
}
function hide5min(){
	if(document.getElementById('never').checked){
		document.getElementById('5min').style.display = "none"
	}else{
		document.getElementById('5min').style.display = "block"
	}
}

//triggered if the user types Enter in the name box of the locks screen
function locknameKeyup(evt){
	evt = evt || window.event												//IE6 compliance
	if (evt.keyCode == 13) {												//sync from Chrome or decrypt if hit Return
		if(document.getElementById("lockmsg").innerHTML == ''){				//found nothing, so try to get it from Chrome sync
			if(ChromeSyncOn){
				var name = document.getElementById("locknameBox").value;
				getChromeLock(name);
			}
		} else {												//decrypt 1st time if found locally, 2nd time if synced from Chrome
			if(!document.getElementById("lockmsg").innerHTML.match('not found in your Chrome')){
				var firstchar = document.getElementById('lockBox').value.slice(0,1);
				if(firstchar == '~'){
					decryptLock()
				}
			}
		}
	} else if (!suspendFindLock){											//otherwise search database
			return findLock()
	} else {
		if(document.getElementById('lockBox').value.trim() == ''){
			suspendFindLock = false;
			return findLock()
		}
	}
}

//displays Keys strength and resets Key timer
function pwdKeyup(evt){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {document.getElementById('pwd').value = ''}, 300000);
	keytime = new Date().getTime();
	evt = evt || window.event
	if (evt.keyCode == 13){acceptKey()} else{
		 return keyStrength(document.getElementById('pwd').value,true);
	}
}

//Key strength display on intro screen
function introKeyup(){
	return keyStrength(document.getElementById('pwdIntro').value,true);
}

//same but for decoy In screen
function decoyKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitDecoyIn()} else{
		 return keyStrength(document.getElementById('decoyPwdIn').value,true);
	}
}

//same for key Change screen
function newKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){changeKey()} else{
		 return keyStrength(document.getElementById('newKey').value,true);
	}
}

//this one looks at the second box and announces a match
function newKey2up(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){changeKey()} else {
		var msg = document.getElementById('keychangemsg'),
			newkey = document.getElementById('newKey').value,
			newkey2 = document.getElementById('newKey2').value,
			length = newkey.length,
			length2 = newkey2.length;
		if(length != length2){
			if(newkey2 == newkey.slice(0,length2)){
				msg.innerHTML = 'Keys match so far. ' + (length-length2) + ' characters to go'
			} else {
				msg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}else{
			if(newkey2 == newkey){
				msg.innerHTML = "<span style='color:green'>Keys match!</span>"
			} else {
				msg.innerHTML = "<span style='color:magenta'>Keys don't match</span>"
			}
		}
	}
}

//activated when the user clicks OK on a decoy screen
function submitDecoyIn(){
	closebox();
	if(encrypting){Decrypt_single()}else{verifySignature()};
}

//Enter has the same effect as clicking OK in decoy and parts box
function decoyKeyupOut(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitDecoyOut()};
}
function submitDecoyOut(){
	closebox();
	if(encrypting){Decrypt_single()}else{verifySignature()};
}
function partsKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitParts()};
}
function submitParts(){
	if(!isNaN(document.getElementById('partsNumber').value)){
	closebox();
	secretshare();
	}
}
function emailKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){email2any()};
}
function nameKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){name2any()};
}

//for switching between sets of buttons
function main2extra(){
	if(document.getElementById('basicmode').checked) return;
	openClose("mainbuttonstop");
	openClose("extrabuttonstop");
	fillList();
}

var fromRadioSel = false
//switch to Advanced mode, and back
function basic2main(){
	if(document.getElementById('mainbuttonstop').style.display == 'block' || document.getElementById('basicbuttonstop').style.display == 'block'){
		openClose("mainbuttonstop");
	}else{
		openClose("extrabuttonstop");
	}
	openClose("mainbuttonsbot");
	openClose("basicbuttonstop");
	openClose("basicbuttonsbot");
	openClose("basiclockbuttonstop");
	openClose("advlockmodes");
	openClose("lockbuttonstop");
	openClose("lockbuttonsbot");
	openClose('advancedModes');
	openClose('advancedHelp');
	if(document.getElementById('basicmode').checked){
		if(!fromRadioSel){
			document.getElementById('basicmode').checked = false;
			document.getElementById('advancedmode').checked = true;
		}
		BasicButtons = false
	}else{
		if(!fromRadioSel){
			document.getElementById('basicmode').checked = true;
			document.getElementById('advancedmode').checked = false;
		}
		BasicButtons = true
	}	
	if(lockDB['myself']){		
		if (lockDB['myself'][3] == 'advanced' || lockDB['myself'][3] == null){
			lockDB['myself'][3] = 'basic';
		}else{
			lockDB['myself'][3] = 'advanced';
		}
		localStorage[userName] = JSON.stringify(lockDB);
		
		if(ChromeSyncOn){
			syncChromeLock('myself',JSON.stringify(lockDB['myself']));
		}
	};
	fillList();
}

function modeClick(){
	fromRadioSel = true;
	basic2main();
	fromRadioSel = false;
}

//makes the ezLok choice permanent
function ezLokStore(){
	if(lockDB['myself']){
		if (document.getElementById('ezLok').checked){
			lockDB['myself'][4] = 'ezLok on'
		} else {
			lockDB['myself'][4] = 'ezLok off'
		}
	}
	localStorage[userName] = JSON.stringify(lockDB);
		
	if(ChromeSyncOn){
		syncChromeLock(userName+'.myself',JSON.stringify(lockDB['myself']));
	}
}

//makes the encrypt Locks choice permanent
function encryptLocksStore(){
	if(lockDB['myself']){
		if (document.getElementById('encryptLocks').checked){
			lockDB['myself'][5] = 'encrypt Locks'
		} else {
			lockDB['myself'][5] = 'do not encrypt Locks'
		}
	}
	localStorage[userName] = JSON.stringify(lockDB);
		
	if(ChromeSyncOn){
		syncChromeLock(userName+'.myself',JSON.stringify(lockDB['myself']));
	}
}

//makes the small Output choice permanent
function smallOutStore(){
	if(lockDB['myself']){
		if (document.getElementById('smallOut').checked){
			lockDB['myself'][6] = 'small Output'
		} else {
			lockDB['myself'][6] = 'normal Output'
		}
	}
	localStorage[userName] = JSON.stringify(lockDB);
		
	if(ChromeSyncOn){
		syncChromeLock(userName+'.myself',JSON.stringify(lockDB['myself']));
	}
}

//opens local directory for input if something seems to be missing
function main2lock(){
	if(tabLinks['mainTab'].className == '') return;
	openClose("lockscr");
	openClose('shadow');
	if(Object.keys(lockDB).length == 1 || Object.keys(lockDB).length == 0){				//new user, so display a fuller message
		document.getElementById('lockmsg').innerHTML = 'Please enter a Lock or shared Key in the lower box. If you wish to store it, write a name in the top box and click <strong>Save</strong>.'
	}
	var string = document.getElementById('lockBox').value;
	if(string.length > 500){							//cover text detected, so replace the currently selected one
		newcover(string);
	}
}

//open image screen
function main2image(){
	if (learnOn){
		var reply = confirm("A new screen will open so you can load an image and hide the contents of the box in it. This only works for valid PassLok output. Cancel if this is not what you want.");
		if(reply == false) throw("Image canceled");
	};
	openClose('imagescr');
	if(document.getElementById('preview').src.slice(0,4)!='data'){
		document.getElementById('imagemsg').innerHTML='Click the button above to load an image'
	}else{
		updateCapacity()
	}
};

//return from image screen
function image2main(){
	if(document.getElementById('imagescr').style.display=='block'){
		openClose('imagescr');
	}
}

//go to general directory frame
function lock2dir(){
	if (learnOn){
		var reply = confirm("The General Directory will open so you can find or post a Lock.\nWARNING: this involves going online, which might leak metadata. Cancel if this is not what you want.");
		if(reply == false) throw("General Directory canceled");
	};
	if(document.getElementById('keyscr').style.display=='block') return;
	if(document.getElementById('lockdir').style.display=='none') loadLockDir();
	var locklength = striptags(XSSfilter(document.getElementById('mainBox').innerHTML.replace(/\&nbsp;/g,''))).length;
	if ((locklength == 87 || locklength == 100) && document.getElementById('lockdir').style.display != "block"){

//if populated, send Lock to directory
		var lockdirframe = document.getElementById('lockdirframe');
		lockdirframe.contentWindow.postMessage(XSSfilter(document.getElementById('mainBox').innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');
		lockdirframe.onload = function() {
	    	lockdirframe.contentWindow.postMessage(XSSfilter(document.getElementById('mainBox').innerHTML.replace(/\&nbsp;/g,'')), 'https://www.passlok.com');		//so that the Lock directory gets the Lock, too
		};
		document.getElementById('lockdir').style.display = "block";
		return
	}
	openClose('lockdir');
	focusBox()
}

//return from general directory frame
function dir2any(){
	openClose('lockdir');
	focusBox()
}

//to load general Lock directory only once
function loadLockDir(){
	if(document.getElementById('lockdirframe').src != 'https://www.passlok.com/lockdir') document.getElementById('lockdirframe').src = 'https://www.passlok.com/lockdir';
}

//loads the chat frame
function main2chat(token){
	var chatframe = document.getElementById('chatframe');
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running PassLok as a native app.');
		if(!reply) throw('chat canceled by user');
	}
	chatframe.src = 'https://www.passlok.com/chat/index.html#' + token;
	document.getElementById('chatscr').style.display = 'block';
}

//called when the Key box is empty
function any2key(){
	closebox();
	document.getElementById('shadow').style.display = 'block';
	document.getElementById('keyscr').style.display = 'block';
	if(!isMobile) document.getElementById("pwd").focus();
	allowCancelWfullAccess = false
}

//called when the email box is empty
function any2email(){
	document.getElementById('shadow').style.display = 'block';
	document.getElementById('emailscr').style.display = 'block';
	if(!isMobile) document.getElementById("email").focus()
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {document.getElementById('pwd').value = ''}, 300000)	//reset timer for 5 minutes, then delete Key
	keytime = new Date().getTime();
	var myKey = document.getElementById('pwd').value.trim();
	document.getElementById('keyscr').style.display = 'none';
	document.getElementById('shadow').style.display = 'none';
	if(lockDB['myself'] == null && myKey != ''){		//if "myself" lockDB entry containing the Key's matching Lock is not present, add it
		if(myLock != ''){
			var mylocktemp = myLock
		}else{
			var email = readEmail(),
				mylocktemp = makepub(myKey,email);
		}
		if(fullAccess) storemyself(myKey,mylocktemp);
		myLock = mylocktemp;
		myezLock = changeBase(myLock, BASE64, BASE38, true);
	};
	if (callKey == 'encrypt'){						//now complete whatever was being done when the Key was found missing
		Encrypt_single()
	}else if(callKey == 'decrypt'){
		Decrypt_single()
	}else if(callKey == 'sign'){
		applySignature()
	}else if(callKey == 'addlock'){
		openClose('lockscr');
		openClose('shadow');
		addLock()
	}else if(callKey == 'decryptitem'){
		decryptItem()
	}else if(callKey == 'decryptlock'){
		decryptLock()
	}else if(callKey == 'mergedb'){
		mergeLockDB()
	}else if(callKey == 'movedb'){
		moveLockDB()
	} else if(callKey == 'showlock'){
		showLock()
	} else if(callKey == 'fillbox'){
		fillBox()
	} else if(callKey == 'changekey'){
		changeKey()
	} else if(callKey == 'movemyself'){
		moveMyself()
	}
	focusBox()
}

//leave email screen
function email2any(){
	if(document.getElementById('email').value == '') document.getElementById('email').value = ' ';		//use a space so it's OK to use an empty email
	var email = document.getElementById('email').value,
		myKey = document.getElementById('pwd').value.trim();
	myLock = makepub(myKey,email);
	myezLock = changeBase(myLock, BASE64, BASE38, true);
	if(fullAccess) storemyself(myKey,myLock);
	document.getElementById('emailscr').style.display = 'none';
	if(fullAccess && lockDB['myself']) checkKey(document.getElementById('pwd').value);
	key2any();
	if(tabLinks['optionsTab'].className == 'selected') document.getElementById('optionmsg').innerHTML = '<span style="color:green">Email/token changed</span>';
}

//leave name change screen
function name2any(){
	if(document.getElementById('userName').value == '') {}
	if(fullAccess) changeName();
	closebox();
	document.getElementById('optionmsg').innerHTML = '<span style="color:green">The User Name has changed to: '+ userName +'</span>'
}

//put cursor in the box. Handy when using keyboard shortcuts
function focusBox(){
	if (!isMobile){															//on mobile, don't focus
		if(document.getElementById('keyscr').style.display == 'block'){
			document.getElementById("pwd").focus()
		} else if(document.getElementById('lockscr').style.display == 'block'){
			document.getElementById("locknameBox").focus()
		} else {
			document.getElementById("mainBox").focus()
		}
	}
}

//sets Learn mode when the appropriate box is checked
function setlearnmode(){
	if (document.getElementById("learnmode").checked) {learnOn = true} else {learnOn = false}
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
          contentDivs[id] = document.getElementById( id );
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
	 document.getElementById('helpmsg').innerHTML = 'Text not found in the titles'
 }else{
	 document.getElementById('helpmsg').innerHTML = 'Text highlighted below. Click again to see more results'
 }
 return;
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); document.getElementById("mainBox").focus(); 
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		document.getElementById('toolBar1').style.display = 'none';
		document.getElementById('niceEditBasic').innerHTML = 'Rich';
		document.getElementById('niceEditButton').innerHTML = 'Rich';
		niceEditor = false
	} else {
		document.getElementById('toolBar1').style.display = 'block';
		document.getElementById('niceEditBasic').innerHTML = 'Plain';
		document.getElementById('niceEditButton').innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}
//The main script in the head ends here.