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
	document.getElementById('intromsg').innerHTML = '';
	document.getElementById('pwd').value = '';
	document.getElementById('keymsg').innerHTML = '';
}
function clearIntroEmail(){
	document.getElementById('emailIntro').value = '';
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

//writes five random dictionary words in the intro Key box
function suggestIntro(){
	var output = '';
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	document.getElementById('pwdIntro').type="TEXT";
	document.getElementById('pwdIntro').value = output.trim();
	document.getElementById('showIntroKey').checked = true
}

//makes a new user account
function newUser(){
	document.getElementById('introscr').style.display = "block";
	BasicButtons = true;
}

//store email entered on email screen
function storeEmail(){
	var email = document.getElementById('email').value;		//if initiated, this box will contain at least a space, and the program won't stop to have it filled
	if (email == ''){
		any2email();
		throw('no email');
	}
	if(locDir['myself'] && fullAccess){
		var emailcrypt = keyEncrypt(email.trim());
		locDir['myself'][2] = emailcrypt;
		for(var name in locDir){					//this has likely changed for each entry, so delete it. It will be remade later
			delete locDir[name][1]
		}
	}
	localStorage[userName] = JSON.stringify(locDir);
	
	if(ChromeSyncOn){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}
}

//shows email screen so email/token can be changed
function showEmail(){
	if(!fullAccess){
		document.getElementById("optionmsg").innerHTML = 'Email change not allowed after Key cancel';
		throw('Email change canceled')
	}
	document.getElementById('shadow').style.display = 'block';
	document.getElementById('emailscr').style.display = 'block';
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
		userNameTemp = document.getElementById('userName').value,
		key = readKey();
	if (userNameTemp.trim() == ''){
		throw('no name');
	}
	recryptDB(key,userNameTemp);
	localStorage[userNameTemp] = localStorage[userName];
	delete localStorage[userName];
	userName = userNameTemp;
	
	if(ChromeSyncOn){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]));
			chrome.storage.sync.remove((oldUserName+'.'+name).toLowerCase());
		}
		updateChromeSyncList();
		chrome.storage.sync.remove(oldUserName.toLowerCase()+'.ChromeSyncList');
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
		getSettings();
		fillList();																	//put names in selection box
		if(locDir['myself']){
			locDir['myself'][8] = 'limited access';
			localStorage[userName] = JSON.stringify(locDir);
		
			if(ChromeSyncOn){
				syncChromeLock('myself',JSON.stringify(locDir['myself']));
			}			
		}
		if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
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
	document.getElementById('email').value = '';
	closebox();
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
	Decrypt_single()
}

//Enter has the same effect as clicking OK in decoy and parts box
function decoyKeyupOut(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){submitDecoyOut()};
}
function submitDecoyOut(){
	closebox();
	Decrypt_single()
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

//switch to Advanced mode
function basic2adv(){
	document.getElementById('mainbuttonstop').style.display = 'block';
	document.getElementById('basicbuttonstop').style.display = 'none'
	document.getElementById('lockbuttonstop').style.display = 'block';
	document.getElementById('basiclockbuttonstop').style.display = 'none';
	document.getElementById('lockbuttonsbot').style.display = 'block';
	document.getElementById('advlockmodes').style.display = 'block';
	document.getElementById('advancedModes').style.display = 'block';
	document.getElementById('advancedHelp').style.display = 'block';
	document.getElementById('basicmode').checked = false;
	document.getElementById('advancedmode').checked = true;

	BasicButtons = false
	
	if(locDir['myself'] && fullAccess){		
		locDir['myself'][3] = 'advanced';
		localStorage[userName] = JSON.stringify(locDir);
		if(ChromeSyncOn){
			syncChromeLock('myself',JSON.stringify(locDir['myself']));
		}
	};
}

//switch to Basic mode
function adv2basic(){
	document.getElementById('mainbuttonstop').style.display = 'none';
	document.getElementById('extrabuttonstop').style.display = 'none';
	document.getElementById('basicbuttonstop').style.display = 'block'
	document.getElementById('lockbuttonstop').style.display = 'none';
	document.getElementById('basiclockbuttonstop').style.display = 'block';
	document.getElementById('lockbuttonsbot').style.display = 'none';
	document.getElementById('advlockmodes').style.display = 'none';
	document.getElementById('advancedModes').style.display = 'none';
	document.getElementById('advancedHelp').style.display = 'none';
	document.getElementById('basicmode').checked = true;
	document.getElementById('advancedmode').checked = false;

	BasicButtons = true
	
	if(locDir['myself'] && fullAccess){		
		locDir['myself'][3] = 'basic';
		localStorage[userName] = JSON.stringify(locDir);
		if(ChromeSyncOn){
			syncChromeLock('myself',JSON.stringify(locDir['myself']));
		}
	};
	fillList()
}

//makes the ezLok choice permanent
function ezLokStore(){
	if(locDir['myself']){
		if (document.getElementById('ezLok').checked){
			locDir['myself'][4] = 'ezLok on'
		} else {
			locDir['myself'][4] = 'ezLok off'
		}
	}
	localStorage[userName] = JSON.stringify(locDir);
		
	if(ChromeSyncOn){
		syncChromeLock('myself',JSON.stringify(locDir['myself']));
	}
}

//makes the encrypt Locks choice permanent
function encryptLocksStore(){
	if(locDir['myself']){
		if (document.getElementById('encryptLocks').checked){
			locDir['myself'][5] = 'encrypt Locks'
		} else {
			locDir['myself'][5] = 'do not encrypt Locks'
		}
	}
	localStorage[userName] = JSON.stringify(locDir);
		
	if(ChromeSyncOn){
		syncChromeLock('myself',JSON.stringify(locDir['myself']));
	}
}

//makes the small Output choice permanent
function smallOutStore(){
	if(locDir['myself']){
		if (document.getElementById('smallOut').checked){
			locDir['myself'][6] = 'small Output'
		} else {
			locDir['myself'][6] = 'normal Output'
		}
	}
	localStorage[userName] = JSON.stringify(locDir);
		
	if(ChromeSyncOn){
		syncChromeLock('myself',JSON.stringify(locDir['myself']));
	}
}

//makes the RS code choice permanent
function RScodeStore(){
	if(locDir['myself']){
		if (document.getElementById('ReedSol').checked){
			locDir['myself'][7] = 'RS code on'
		} else {
			locDir['myself'][7] = 'RS code off'
		}
	}
	localStorage[userName] = JSON.stringify(locDir);
		
	if(ChromeSyncOn){
		syncChromeLock('myself',JSON.stringify(locDir['myself']));
	}
}

//opens local directory for input if something seems to be missing
function main2lock(){
	if(tabLinks['mainTab'].className == '') return;
	openClose("lockscr");
	openClose('shadow');
	if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){				//new user, so display a fuller message
		document.getElementById('lockmsg').innerHTML = 'Please enter a Lock or shared Key in the lower box. To store it, write a name in the top box and click <strong>Save</strong>.'
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
	if ((locklength == 43 || locklength == 50) && document.getElementById('lockdir').style.display != "block"){

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
	document.getElementById('emailmsg').innerHTML = 'Please enter your new email or similar item, or a new random token';
	if(!isMobile) document.getElementById("email").focus()
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	clearTimeout(keytimer);
	keytimer = setTimeout(function() {document.getElementById('pwd').value = ''}, 300000)	//reset timer for 5 minutes, then delete Key
	keytime = new Date().getTime();
	var key = document.getElementById('pwd').value.trim();
	document.getElementById('keyscr').style.display = 'none';
	document.getElementById('shadow').style.display = 'none';
}

//leave email screen
function email2any(){
	var email = document.getElementById('email').value.trim();
	if(myEmail.length == 43 && fullAccess){
		var result = confirm('If you go ahead, the random token associated with your user name will be overwritten, which will change your Lock. This is irreversible.');
		if(!result){
			document.getElementById('emailmsg').innerHTML = 'Random token overwrite canceled';
			throw ('random token overwrite canceled')
		}
	}
	myEmail = email;
	document.getElementById('email').value = '';
	var	key = readKey();
	if(!KeyDir) KeyDir = wiseHash(key,userName);
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,myEmail)).secretKey;			//do this regardless in case email has changed
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
	myezLock = changeBase(myLock, BASE64, BASE36, true);

	if(fullAccess) storemyLock();										//this also stores the email
	document.getElementById('emailscr').style.display = 'none';
	key2any();															//close key dialog too, if it was open
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
		document.getElementById('niceEditButton').innerHTML = 'Rich';
		niceEditor = false
	} else {
		document.getElementById('toolBar1').style.display = 'block';
		document.getElementById('niceEditButton').innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}
//The main script in the head ends here.