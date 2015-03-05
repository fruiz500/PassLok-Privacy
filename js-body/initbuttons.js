// initialize things
window.onload = function() {

	if(isMobile){
		document.getElementById('niceEditBasic').style.display = 'none';		//no rich text editing on mobile
		document.getElementById('niceEditButton').style.display = 'none';
		document.getElementById('filebuttons').style.display = 'none';
	} else {
		document.getElementById('preview').style.width = "40%";					//smaller image on PCs
		document.getElementById('sendSMSButton').style.display = 'none';
	}
	if(!isMobile || isChrome){							//search box in Help tab. Works on Android Chrome, but won't detect right
		document.getElementById('helptopmobile').style.display = 'none';
		document.getElementById('helptop').style.display = 'block';
		document.getElementById('helpspace').style.display = 'block'
	}

	window.addEventListener("resize", function() { textheight();chatResize();}, false)	    	//resize if the window changes

	//this one for loading files into extra screen
	var fileinput = document.getElementById('fileToLoad');
    fileinput.addEventListener('change', loadFileAsURL, false);
	fileinput.addEventListener('blur', ce);
	fileinput.addEventListener('focus', ce);

    // add action to the file input
    var input = document.getElementById('imagefile');
    input.addEventListener('change', importImage);
	input.addEventListener('blur', ce);
	input.addEventListener('focus', ce);

    // add action to the encode button
    var encodeButton = document.getElementById('encode');
    encodeButton.addEventListener('click', encodeImage);
	encodeButton.addEventListener('blur', ce);
	encodeButton.addEventListener('focus', ce);

    // add action to the decode button
    var decodeButton = document.getElementById('decode');
    decodeButton.addEventListener('click', decodeImage);
	decodeButton.addEventListener('blur', ce);
	decodeButton.addEventListener('focus', ce);

//button code moved from html page, used to be inline

	var showlockButton = document.getElementById('showlockButton');
   	showlockButton.addEventListener('click', showLock);
	showlockButton.addEventListener('blur', ce);
	showlockButton.addEventListener('focus', ce);

	var basicmodeBox = document.getElementById('basicmode');
   	basicmodeBox.addEventListener('click', modeClick);
	basicmodeBox.addEventListener('blur', ce);
	basicmodeBox.addEventListener('focus', ce);

	var advancedmodeBox = document.getElementById('advancedmode');
   	advancedmodeBox.addEventListener('click', modeClick);
	advancedmodeBox.addEventListener('blur', ce);
	advancedmodeBox.addEventListener('focus', ce);

	var clearMainButton = document.getElementById('clearMainButton');
   	clearMainButton.addEventListener('click', clearMain);
	clearMainButton.addEventListener('blur', ce);
	clearMainButton.addEventListener('focus', ce);

	var showlockButtonBasic = document.getElementById('showlockButtonBasic');
   	showlockButtonBasic.addEventListener('click', showLock);
	showlockButtonBasic.addEventListener('blur', ce);
	showlockButtonBasic.addEventListener('focus', ce);

	var clearMainButtonBasic = document.getElementById('clearMainButtonBasic');
   	clearMainButtonBasic.addEventListener('click', clearMain);
	clearMainButtonBasic.addEventListener('blur', ce);
	clearMainButtonBasic.addEventListener('focus', ce);

	var decryptButton = document.getElementById('decryptButton');
   	decryptButton.addEventListener('click', Decrypt_single);
	decryptButton.addEventListener('blur', ce);
	decryptButton.addEventListener('focus', ce);

	var verifyButton = document.getElementById('verifyButton');
   	verifyButton.addEventListener('click', verifySignature);
	verifyButton.addEventListener('blur', ce);
	verifyButton.addEventListener('focus', ce);

	var main2extraButton = document.getElementById('main2extraButton');
   	main2extraButton.addEventListener('click', main2extra);
	main2extraButton.addEventListener('blur', ce);
	main2extraButton.addEventListener('focus', ce);

	var decryptButtonBasic = document.getElementById('decryptButtonBasic');
   	decryptButtonBasic.addEventListener('click', Decrypt_single);
	decryptButtonBasic.addEventListener('blur', ce);
	decryptButtonBasic.addEventListener('focus', ce);

	var extra2mainButton = document.getElementById('extra2mainButton');
   	extra2mainButton.addEventListener('click', main2extra);
	extra2mainButton.addEventListener('blur', ce);
	extra2mainButton.addEventListener('focus', ce);
	
	var niceEditButton = document.getElementById('niceEditButton');
   	niceEditButton.addEventListener('click', toggleRichText);
	niceEditButton.addEventListener('blur', ce);
	niceEditButton.addEventListener('focus', ce);
	
	var niceEditBasic = document.getElementById('niceEditBasic');
   	niceEditBasic.addEventListener('click', toggleRichText);
	niceEditBasic.addEventListener('blur', ce);
	niceEditBasic.addEventListener('focus', ce);

	var sendMailButton = document.getElementById('sendMailButton');
   	sendMailButton.addEventListener('click', sendMail);
	sendMailButton.addEventListener('blur', ce);
	sendMailButton.addEventListener('focus', ce);
	
	var chatButton = document.getElementById('chatButton');
   	chatButton.addEventListener('click', Chat);
	chatButton.addEventListener('blur', ce);
	chatButton.addEventListener('focus', ce);
	
	var chatButtonBasic = document.getElementById('chatButtonBasic');
   	chatButtonBasic.addEventListener('click', Chat);
	chatButtonBasic.addEventListener('blur', ce);
	chatButtonBasic.addEventListener('focus', ce)

	var sendMailButtonBasic = document.getElementById('sendMailButtonBasic');
   	sendMailButtonBasic.addEventListener('click', sendMail);
	sendMailButtonBasic.addEventListener('blur', ce);
	sendMailButtonBasic.addEventListener('focus', ce);

	var sendSMSButton = document.getElementById('sendSMSButton');
   	sendSMSButton.addEventListener('click', sendSMS);
	sendSMSButton.addEventListener('blur', ce);
	sendSMSButton.addEventListener('focus', ce);

	var imageButton = document.getElementById('imageButton');
   	imageButton.addEventListener('click', main2image);
	imageButton.addEventListener('blur', ce);
	imageButton.addEventListener('focus', ce);

	var secretshareButton = document.getElementById('secretshareButton');
   	secretshareButton.addEventListener('click', secretshare);
	secretshareButton.addEventListener('blur', ce);
	secretshareButton.addEventListener('focus', ce);

	var stegoButton = document.getElementById('stegoButton');
   	stegoButton.addEventListener('click', textStego);
	stegoButton.addEventListener('blur', ce);
	stegoButton.addEventListener('focus', ce);

	var savefileButton = document.getElementById('savefileButton');
   	savefileButton.addEventListener('click', saveURLAsFile);
	savefileButton.addEventListener('blur', ce);
	savefileButton.addEventListener('focus', ce);

	var image2mainButton = document.getElementById('image2mainButton');
   	image2mainButton.addEventListener('click', image2main);
	image2mainButton.addEventListener('blur', ce);
	image2mainButton.addEventListener('focus', ce);

	var lock2dirButton = document.getElementById('lock2dirButton');
   	lock2dirButton.addEventListener('click', lock2dir);
	lock2dirButton.addEventListener('blur', ce);
	lock2dirButton.addEventListener('focus', ce);

	var clearLocksButton = document.getElementById('clearLocksButton');
   	clearLocksButton.addEventListener('click', clearLocks);
	clearLocksButton.addEventListener('blur', ce);
	clearLocksButton.addEventListener('focus', ce);

	var clearLocksButtonBasic = document.getElementById('clearLocksButtonBasic');
   	clearLocksButtonBasic.addEventListener('click', clearLocks);
	clearLocksButtonBasic.addEventListener('blur', ce);
	clearLocksButtonBasic.addEventListener('focus', ce);

	var addLockButton = document.getElementById('addLockButton');
   	addLockButton.addEventListener('click', addLock);
	addLockButton.addEventListener('blur', ce);
	addLockButton.addEventListener('focus', ce);

	var removeLockButton = document.getElementById('removeLockButton');
   	removeLockButton.addEventListener('click', removeLock);
	removeLockButton.addEventListener('blur', ce);
	removeLockButton.addEventListener('focus', ce);

	var resetPFSButton = document.getElementById('resetPFSButton');
   	resetPFSButton.addEventListener('click', resetPFS);
	resetPFSButton.addEventListener('blur', ce);
	resetPFSButton.addEventListener('focus', ce);

	var addToListButton = document.getElementById('addToListButton');
   	addToListButton.addEventListener('click', addToList);
	addToListButton.addEventListener('blur', ce);
	addToListButton.addEventListener('focus', ce);

	var addLockButtonBasic = document.getElementById('addLockButtonBasic');
   	addLockButtonBasic.addEventListener('click', addLock);
	addLockButtonBasic.addEventListener('blur', ce);
	addLockButtonBasic.addEventListener('focus', ce);

	var removeLockButtonBasic = document.getElementById('removeLockButtonBasic');
   	removeLockButtonBasic.addEventListener('click', removeLock);
	removeLockButtonBasic.addEventListener('blur', ce);
	removeLockButtonBasic.addEventListener('focus', ce);

	var showLockDBButton = document.getElementById('showLockDBButton');
   	showLockDBButton.addEventListener('click', showLockDB);
	showLockDBButton.addEventListener('blur', ce);
	showLockDBButton.addEventListener('focus', ce);

	var mergeLockDBButton = document.getElementById('mergeLockDBButton');
   	mergeLockDBButton.addEventListener('click', mergeLockDB);
	mergeLockDBButton.addEventListener('blur', ce);
	mergeLockDBButton.addEventListener('focus', ce);
	
	var resetLockDBButton = document.getElementById('resetLockDBButton');
   	resetLockDBButton.addEventListener('click', resetLockDB);
	resetLockDBButton.addEventListener('blur', ce);
	resetLockDBButton.addEventListener('focus', ce);
	
	var moveLockDBButton = document.getElementById('moveLockDBButton');
   	moveLockDBButton.addEventListener('click', moveLockDB);
	moveLockDBButton.addEventListener('blur', ce);
	moveLockDBButton.addEventListener('focus', ce);

	var acceptKeyButton = document.getElementById('acceptKeyButton');
   	acceptKeyButton.addEventListener('click', acceptKey);

	var cancelKeyButton = document.getElementById('cancelKeyButton');
   	cancelKeyButton.addEventListener('click', cancelKey);
	
	var skipintro = document.getElementById('skipintro');
   	skipintro.addEventListener('click', cancelKey);
	
	var changeNameButton = document.getElementById('changeNameButton');
   	changeNameButton.addEventListener('click', showName);
	changeNameButton.addEventListener('blur', ce);
	changeNameButton.addEventListener('focus', ce);

	var changeKeyButton = document.getElementById('changeKeyButton');
   	changeKeyButton.addEventListener('click', changeKey);
	changeKeyButton.addEventListener('blur', ce);
	changeKeyButton.addEventListener('focus', ce);
	
	var changeEmailButton = document.getElementById('changeEmailButton');
   	changeEmailButton.addEventListener('click', showEmail);
	changeEmailButton.addEventListener('blur', ce);
	changeEmailButton.addEventListener('focus', ce);

	var backupSettings = document.getElementById('backupSettings');
   	backupSettings.addEventListener('click', moveMyself);
	backupSettings.addEventListener('blur', ce);
	backupSettings.addEventListener('focus', ce);

	var ezLok = document.getElementById('ezLok');
   	ezLok.addEventListener('click', ezLokStore);
	ezLok.addEventListener('blur', ce);
	ezLok.addEventListener('focus', ce);
	
	var encryptLocks = document.getElementById('encryptLocks');
   	encryptLocks.addEventListener('click', encryptLocksStore);
	encryptLocks.addEventListener('blur', ce);
	encryptLocks.addEventListener('focus', ce);
	
	var smallOut = document.getElementById('smallOut');
   	smallOut.addEventListener('click', smallOutStore);
	smallOut.addEventListener('blur', ce);
	smallOut.addEventListener('focus', ce);

	var showKey = document.getElementById('showKey');
   	showKey.addEventListener('click', showsec);
	showKey.addEventListener('blur', ce);
	showKey.addEventListener('focus', ce);

	var introRandomButton = document.getElementById('introRandomButton');
   	introRandomButton.addEventListener('click', randomToken);
	introRandomButton.addEventListener('blur', ce);
	introRandomButton.addEventListener('focus', ce);

	var randomEmailButton = document.getElementById('randomEmailButton');
   	randomEmailButton.addEventListener('click', randomToken);
	randomEmailButton.addEventListener('blur', ce);
	randomEmailButton.addEventListener('focus', ce);

	var acceptEmailButton = document.getElementById('acceptEmailButton');
   	acceptEmailButton.addEventListener('click', email2any);
	acceptEmailButton.addEventListener('blur', ce);
	acceptEmailButton.addEventListener('focus', ce);

	var cancelEmailButton = document.getElementById('cancelEmailButton');
   	cancelEmailButton.addEventListener('click', cancelEmail);
	cancelEmailButton.addEventListener('blur', ce);
	cancelEmailButton.addEventListener('focus', ce);
	
	var acceptNameButton = document.getElementById('acceptNameButton');
   	acceptNameButton.addEventListener('click', name2any);
	acceptNameButton.addEventListener('blur', ce);
	acceptNameButton.addEventListener('focus', ce);

	var cancelNameButton = document.getElementById('cancelNameButton');
   	cancelNameButton.addEventListener('click', cancelName);
	cancelNameButton.addEventListener('blur', ce);
	cancelNameButton.addEventListener('focus', ce);
	
	var showIntroKey = document.getElementById('showIntroKey');
   	showIntroKey.addEventListener('click', showIntro);
	showIntroKey.addEventListener('blur', ce);
	showIntroKey.addEventListener('focus', ce);

	var clearIntroButton = document.getElementById('clearIntroButton');
   	clearIntroButton.addEventListener('click', clearIntro);
	clearIntroButton.addEventListener('blur', ce);
	clearIntroButton.addEventListener('focus', ce);

	var suggestIntroButton = document.getElementById('suggestIntroButton');
   	suggestIntroButton.addEventListener('click', suggestIntro);
	suggestIntroButton.addEventListener('blur', ce);
	suggestIntroButton.addEventListener('focus', ce);

	var showlockIntroButton = document.getElementById('showlockIntroButton');
   	showlockIntroButton.addEventListener('click', showlockIntro);
	showlockIntroButton.addEventListener('blur', ce);
	showlockIntroButton.addEventListener('focus', ce);

	var showdecIn = document.getElementById('showdecIn');
   	showdecIn.addEventListener('click', showdecoyIn);
	showdecIn.addEventListener('blur', ce);
	showdecIn.addEventListener('focus', ce);

	var submitDecoyButton = document.getElementById('submitDecoyButton');
   	submitDecoyButton.addEventListener('click', submitDecoyIn);
	submitDecoyButton.addEventListener('blur', ce);
	submitDecoyButton.addEventListener('focus', ce);

	var cancelDecoyButton = document.getElementById('cancelDecoyButton');
   	cancelDecoyButton.addEventListener('click', cancelDecoyIn);
	cancelDecoyButton.addEventListener('blur', ce);
	cancelDecoyButton.addEventListener('focus', ce);

	var showdecOut = document.getElementById('showdecOut');
   	showdecOut.addEventListener('click', showdecoyOut);
	showdecOut.addEventListener('blur', ce);
	showdecOut.addEventListener('focus', ce);

	var submitDecoy2Button = document.getElementById('submitDecoy2Button');
   	submitDecoy2Button.addEventListener('click', submitDecoyOut);
	submitDecoy2Button.addEventListener('blur', ce);
	submitDecoy2Button.addEventListener('focus', ce);

	var cancelDecoy2Button = document.getElementById('cancelDecoy2Button');
   	cancelDecoy2Button.addEventListener('click', cancelDecoyOut);
	cancelDecoy2Button.addEventListener('blur', ce);
	cancelDecoy2Button.addEventListener('focus', ce);

	var submitPartsButton = document.getElementById('submitPartsButton');
   	submitPartsButton.addEventListener('click', submitParts);
	submitPartsButton.addEventListener('blur', ce);
	submitPartsButton.addEventListener('focus', ce);

	var cancelPartsButton = document.getElementById('cancelPartsButton');
   	cancelPartsButton.addEventListener('click', cancelPartsIn);
	cancelPartsButton.addEventListener('blur', ce);
	cancelPartsButton.addEventListener('focus', ce);

	var learnmodeCheck = document.getElementById('learnmode');
   	learnmodeCheck.addEventListener('click', setlearnmode);
	learnmodeCheck.addEventListener('blur', ce);
	learnmodeCheck.addEventListener('focus', ce);

	var closelockdirButton = document.getElementById('closelockdirButton');
   	closelockdirButton.addEventListener('click', lock2dir);
	closelockdirButton.addEventListener('blur', ce);
	closelockdirButton.addEventListener('focus', ce);

	var closechatButton = document.getElementById('closechatButton');
   	closechatButton.addEventListener('click', chat2main);
	closechatButton.addEventListener('blur', ce);
	closechatButton.addEventListener('focus', ce);
	
	var resetchatButton = document.getElementById('resetchatButton');
   	resetchatButton.addEventListener('click', resetChat);
	resetchatButton.addEventListener('blur', ce);
	resetchatButton.addEventListener('focus', ce);
	
	var cancelChatButton = document.getElementById('cancelChatButton');
   	cancelChatButton.addEventListener('click', closebox);
	cancelChatButton.addEventListener('blur', ce);
	cancelChatButton.addEventListener('focus', ce);
	
	var submitChatButton = document.getElementById('submitChatButton');
   	submitChatButton.addEventListener('click', makeChat);
	submitChatButton.addEventListener('blur', ce);
	submitChatButton.addEventListener('focus', ce);

	var lockListBox = document.getElementById('locklist');
   	lockListBox.addEventListener('click', ce);
	lockListBox.addEventListener('change', fillBox);
	lockListBox.addEventListener('blur', ce);
	lockListBox.addEventListener('focus', ce);

	var resetListButton = document.getElementById('resetListButton');
   	resetListButton.addEventListener('click', resetList);
	resetListButton.addEventListener('blur', ce);
	resetListButton.addEventListener('focus', ce);

	var main2lockButton = document.getElementById('main2lockButton');
    main2lockButton.addEventListener('click', main2lock);
	main2lockButton.addEventListener('blur', ce);
	main2lockButton.addEventListener('focus', ce);
	
	var lock2mainButton = document.getElementById('lock2mainButton');
    lock2mainButton.addEventListener('click', main2lock);
	lock2mainButton.addEventListener('blur', ce);
	lock2mainButton.addEventListener('focus', ce);
	
	var newUserButton = document.getElementById('newUserButton');
   	newUserButton.addEventListener('click', newUser);
	newUserButton.addEventListener('blur', ce);
	newUserButton.addEventListener('focus', ce);

	var submitKeychange = document.getElementById('submitKeychange');
   	submitKeychange.addEventListener('click', changeKey);
	submitKeychange.addEventListener('blur', ce);
	submitKeychange.addEventListener('focus', ce);

	var cancelKeychange = document.getElementById('cancelKeychange');
   	cancelKeychange.addEventListener('click', cancelKeyChange);
	cancelKeychange.addEventListener('blur', ce);
	cancelKeychange.addEventListener('focus', ce);

	var showNewKeyCheckbox = document.getElementById('showNewKey');
   	showNewKeyCheckbox.addEventListener('click', showNewKey);
	showNewKeyCheckbox.addEventListener('blur', ce);
	showNewKeyCheckbox.addEventListener('focus', ce);

	var gotointro2 = document.getElementById('gotointro2');
   	gotointro2.addEventListener('click', go2intro2);
	gotointro2.addEventListener('blur', ce);
	gotointro2.addEventListener('focus', ce);

	var backtointro1 = document.getElementById('backtointro1');
   	backtointro1.addEventListener('click', go2intro2);
	backtointro1.addEventListener('blur', ce);
	backtointro1.addEventListener('focus', ce);
	
	var gotointro3 = document.getElementById('gotointro3');
   	gotointro3.addEventListener('click', go2intro3);
	gotointro3.addEventListener('blur', ce);
	gotointro3.addEventListener('focus', ce);

	var backtointro2 = document.getElementById('backtointro2');
   	backtointro2.addEventListener('click', go2intro3);
	backtointro2.addEventListener('blur', ce);
	backtointro2.addEventListener('focus', ce);
	
	var gotointro4 = document.getElementById('gotointro4');
   	gotointro4.addEventListener('click', go2intro4);
	gotointro4.addEventListener('blur', ce);
	gotointro4.addEventListener('focus', ce);

	var backtointro3 = document.getElementById('backtointro3');
   	backtointro3.addEventListener('click', go2intro4);
	backtointro3.addEventListener('blur', ce);
	backtointro3.addEventListener('focus', ce);
	
	var gotointro5 = document.getElementById('gotointro5');
   	gotointro5.addEventListener('click', go2intro5);
	gotointro5.addEventListener('blur', ce);
	gotointro5.addEventListener('focus', ce);

	var backtointro4 = document.getElementById('backtointro4');
   	backtointro4.addEventListener('click', go2intro5);
	backtointro4.addEventListener('blur', ce);
	backtointro4.addEventListener('focus', ce);

	var mainBox = document.getElementById('mainBox');
   	mainBox.addEventListener('keyup', charsLeft);
	mainBox.addEventListener('keydown', ce);
	mainBox.addEventListener('blur', ce);
	mainBox.addEventListener('focus', ce);
	
	var decoyText = document.getElementById('decoyText');
   	decoyText.addEventListener('keyup', charsLeft);
	decoyText.addEventListener('keydown', ce);
	decoyText.addEventListener('blur', ce);
	decoyText.addEventListener('focus', ce);
	
	var chatdate = document.getElementById('chatdate');
   	chatdate.addEventListener('keyup', charsLeft);
	chatdate.addEventListener('keydown', ce);
	chatdate.addEventListener('blur', ce);
	chatdate.addEventListener('focus', ce)

//Firefox requires the keyup code to be inline if it refers to the event
//but this must be removed for the Chrome app and replaced with those commented below
	var pwdBox = document.getElementById('pwd');
//	pwdBox.addEventListener('keyup', function() {pwdKeyup(event)}, false);

	var pwdIntroBox = document.getElementById('pwdIntro');
   	pwdIntroBox.addEventListener('keyup', introKeyup);
	pwdIntroBox.addEventListener('blur', ce);
	pwdIntroBox.addEventListener('focus', ce);

	var decoyPwdIn = document.getElementById('decoyPwdIn');
//	decoyPwdIn.addEventListener('keyup', function() {decoyKeyup(event)}, false);
	decoyPwdIn.addEventListener('keydown', ce);
	decoyPwdIn.addEventListener('blur', ce);
	decoyPwdIn.addEventListener('focus', ce);

	var decoyPwdOut = document.getElementById('decoyPwdOut');
//	decoyPwdOut.addEventListener('keyup', function() {decoyKeyupOut(event)}, false);
	decoyPwdOut.addEventListener('keydown', ce);
	decoyPwdOut.addEventListener('blur', ce);
	decoyPwdOut.addEventListener('focus', ce);

	var partsIn = document.getElementById('partsIn');
//	partsIn.addEventListener('keyup', function() {partsKeyup(event)}, false);
	partsIn.addEventListener('keydown', ce);
	partsIn.addEventListener('blur', ce);
	partsIn.addEventListener('focus', ce);

	var newKeyBox = document.getElementById('newKey');
	newKeyBox.addEventListener('keyup', newKeyup);
	newKeyBox.addEventListener('keydown', ce);
	newKeyBox.addEventListener('blur', ce);
	newKeyBox.addEventListener('focus', ce);

	var newKey2Box = document.getElementById('newKey2');
//	newKey2Box.addEventListener('keyup', function() {newKey2up(event)}, false);
	newKey2Box.addEventListener('keydown', ce);
	newKey2Box.addEventListener('blur', ce);
	newKey2Box.addEventListener('focus', ce);

	var locknameBox = document.getElementById('locknameBox');
//	locknameBox.addEventListener('keyup', function() {locknameKeyup(event)}, false);
	locknameBox.addEventListener('keydown', ce);
	locknameBox.addEventListener('blur', ce);
	locknameBox.addEventListener('focus', ce);
	
	var lockBox = document.getElementById('lockBox');
	lockBox.addEventListener('keyup', applyRStoLock);
	lockBox.addEventListener('keydown', ce);
	lockBox.addEventListener('blur', ce);
	lockBox.addEventListener('focus', ce);
	lockBox.addEventListener('paste', pasteLock);
	
	function pasteLock() {
    setTimeout(function(){
        applyRStoLock();
    }, 0); //or 4
	}

	var nameBox = document.getElementById('userName');
//	nameBox.addEventListener('keyup', function() {nameKeyup(event)}, false);
	nameBox.addEventListener('keydown', ce);
	nameBox.addEventListener('blur', ce);
	nameBox.addEventListener('focus', ce);
		
	var emailBox = document.getElementById('email');
//	emailBox.addEventListener('keyup', function() {emailKeyup(event)}, false);
	emailBox.addEventListener('keydown', ce);
	emailBox.addEventListener('blur', ce);
	emailBox.addEventListener('focus', ce);

	var neverbox = document.getElementById('never');
	neverbox.addEventListener('click', hide5min);
	neverbox.addEventListener('blur', ce);
	neverbox.addEventListener('focus', ce);
	
//for the rich text editor boxes and buttons
	document.getElementById('formatblock').addEventListener("change", function() {formatDoc('formatblock',this[this.selectedIndex].value);this.selectedIndex=0;});
	document.getElementById('fontname').addEventListener("change", function() {formatDoc('fontname',this[this.selectedIndex].value);this.selectedIndex=0;});
	document.getElementById('fontsize').addEventListener("change", function() {formatDoc('fontsize',this[this.selectedIndex].value);this.selectedIndex=0;});
	document.getElementById('forecolor').addEventListener("change", function() {formatDoc('forecolor',this[this.selectedIndex].value);this.selectedIndex=0;});
	document.getElementById('backcolor').addEventListener("change", function() {formatDoc('backcolor',this[this.selectedIndex].value);this.selectedIndex=0;});

	document.images[0].addEventListener("click", function() {formatDoc('bold')});
	document.images[1].addEventListener("click", function() {formatDoc('italic')});
	document.images[2].addEventListener("click", function() {formatDoc('underline')});
	document.images[3].addEventListener("click", function() {formatDoc('strikethrough')});
	document.images[4].addEventListener("click", function() {formatDoc('subscript')});
	document.images[5].addEventListener("click", function() {formatDoc('superscript')});
	document.images[6].addEventListener("click", function() {formatDoc('justifyleft')});
	document.images[7].addEventListener("click", function() {formatDoc('justifycenter')});
	document.images[8].addEventListener("click", function() {ormatDoc('justifyright')});
	document.images[9].addEventListener("click", function() {formatDoc('justifyfull')});
	document.images[10].addEventListener("click", function() {formatDoc('insertorderedlist')});
	document.images[11].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	document.images[12].addEventListener("click", function() {formatDoc('formatblock','blockquote')});
	document.images[13].addEventListener("click", function() {formatDoc('outdent')});
	document.images[14].addEventListener("click", function() {formatDoc('indent')});
	document.images[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	document.images[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	document.images[17].addEventListener("click", function() {formatDoc('unlink')});
	document.images[18].addEventListener("click", function() {formatDoc('removeFormat')});
	document.images[19].addEventListener("click", function() {formatDoc('undo')});
	document.images[20].addEventListener("click", function() {formatDoc('redo')});
	
//for the help screens
	document.getElementById('aa1').addEventListener('click', function() {openClose('a1')});
	document.getElementById('aa2').addEventListener('click', function() {openClose('a2')});
	document.getElementById('aa3').addEventListener('click', function() {openClose('a3')});
	document.getElementById('aa4').addEventListener('click', function() {openClose('a4')});
	document.getElementById('aa5').addEventListener('click', function() {openClose('a5')});
	document.getElementById('aa6').addEventListener('click', function() {openClose('a6')});
	document.getElementById('aa7').addEventListener('click', function() {openClose('a7')});
	document.getElementById('aa8').addEventListener('click', function() {openClose('a8')});
	document.getElementById('aa9').addEventListener('click', function() {openClose('a9')});
	document.getElementById('aa10').addEventListener('click', function() {openClose('a10')});
	document.getElementById('aa11').addEventListener('click', function() {openClose('a11')});
	document.getElementById('aa12').addEventListener('click', function() {openClose('a12')});
	document.getElementById('aa13').addEventListener('click', function() {openClose('a13')});
	document.getElementById('aa14').addEventListener('click', function() {openClose('a14')});
	document.getElementById('aa15').addEventListener('click', function() {openClose('a15')});
	document.getElementById('aa16').addEventListener('click', function() {openClose('a16')});
	document.getElementById('aa17').addEventListener('click', function() {openClose('a17')});
	document.getElementById('aa18').addEventListener('click', function() {openClose('a18')});
	document.getElementById('aa19').addEventListener('click', function() {openClose('a19')});
	document.getElementById('aa20').addEventListener('click', function() {openClose('a20')});
	document.getElementById('aa21').addEventListener('click', function() {openClose('a21')});
	document.getElementById('aa22').addEventListener('click', function() {openClose('a22')});
	document.getElementById('aa23').addEventListener('click', function() {openClose('a23')});
	document.getElementById('aa24').addEventListener('click', function() {openClose('a24')});
	document.getElementById('aa25').addEventListener('click', function() {openClose('a25')});
	document.getElementById('aa26').addEventListener('click', function() {openClose('a26')});
	document.getElementById('aa27').addEventListener('click', function() {openClose('a27')});
	document.getElementById('aa28').addEventListener('click', function() {openClose('a28')});
	document.getElementById('aa29').addEventListener('click', function() {openClose('a29')});
	document.getElementById('aa30').addEventListener('click', function() {openClose('a30')});
	document.getElementById('aa31').addEventListener('click', function() {openClose('a31')});
	document.getElementById('aa32').addEventListener('click', function() {openClose('a32')});
	document.getElementById('aa33').addEventListener('click', function() {openClose('a33')});
	document.getElementById('aa34').addEventListener('click', function() {openClose('a34')});
	document.getElementById('aa35').addEventListener('click', function() {openClose('a35')});
	document.getElementById('aa36').addEventListener('click', function() {openClose('a36')});
	document.getElementById('aa37').addEventListener('click', function() {openClose('a37')});
	document.getElementById('aa38').addEventListener('click', function() {openClose('a38')});
	document.getElementById('aa39').addEventListener('click', function() {openClose('a39')});
	document.getElementById('aa40').addEventListener('click', function() {openClose('a40')});
	document.getElementById('aa41').addEventListener('click', function() {openClose('a41')});
	document.getElementById('aa42').addEventListener('click', function() {openClose('a42')});
	document.getElementById('aa43').addEventListener('click', function() {openClose('a43')});
	document.getElementById('aa44').addEventListener('click', function() {openClose('a44')});
	document.getElementById('aa45').addEventListener('click', function() {openClose('a45')});
	document.getElementById('aa46').addEventListener('click', function() {openClose('a46')});
	document.getElementById('aa47').addEventListener('click', function() {openClose('a47')});
	document.getElementById('aa48').addEventListener('click', function() {openClose('a48')});
	document.getElementById('aa49').addEventListener('click', function() {openClose('a49')});
	document.getElementById('aa50').addEventListener('click', function() {openClose('a50')});
	document.getElementById('aa51').addEventListener('click', function() {openClose('a51')});
	document.getElementById('aa52').addEventListener('click', function() {openClose('a52')});
	document.getElementById('aa53').addEventListener('click', function() {openClose('a53')});
	document.getElementById('aa54').addEventListener('click', function() {openClose('a54')});
	document.getElementById('aa55').addEventListener('click', function() {openClose('a55')});
	document.getElementById('aa56').addEventListener('click', function() {openClose('a56')});
	document.getElementById('aa57').addEventListener('click', function() {openClose('a57')});
	document.getElementById('aa58').addEventListener('click', function() {openClose('a58')});
	document.getElementById('aa59').addEventListener('click', function() {openClose('a59')});

//a few help items don't have extra material, but are ready here just in case. Uncomment as needed

//	document.getElementById('bb1').addEventListener('click', function() {openClose('b1')});
//	document.getElementById('bb2').addEventListener('click', function() {openClose('b2')});
	document.getElementById('bb3').addEventListener('click', function() {openClose('b3')});
//	document.getElementById('bb4').addEventListener('click', function() {openClose('b4')});
	document.getElementById('bb5').addEventListener('click', function() {openClose('b5')});
	document.getElementById('bb6').addEventListener('click', function() {openClose('b6')});
	document.getElementById('bb7').addEventListener('click', function() {openClose('b7')});
	document.getElementById('bb8').addEventListener('click', function() {openClose('b8')});
	document.getElementById('bb9').addEventListener('click', function() {openClose('b9')});
	document.getElementById('bb10').addEventListener('click', function() {openClose('b10')});
	document.getElementById('bb11').addEventListener('click', function() {openClose('b11')});
	document.getElementById('bb12').addEventListener('click', function() {openClose('b12')});
	document.getElementById('bb13').addEventListener('click', function() {openClose('b13')});
	document.getElementById('bb14').addEventListener('click', function() {openClose('b14')});
	document.getElementById('bb15').addEventListener('click', function() {openClose('b15')});
	document.getElementById('bb16').addEventListener('click', function() {openClose('b16')});
	document.getElementById('bb17').addEventListener('click', function() {openClose('b17')});
	document.getElementById('bb18').addEventListener('click', function() {openClose('b18')});
	document.getElementById('bb19').addEventListener('click', function() {openClose('b19')});
	document.getElementById('bb20').addEventListener('click', function() {openClose('b20')});
	document.getElementById('bb21').addEventListener('click', function() {openClose('b21')});
	document.getElementById('bb22').addEventListener('click', function() {openClose('b22')});
	document.getElementById('bb23').addEventListener('click', function() {openClose('b23')});
	document.getElementById('bb24').addEventListener('click', function() {openClose('b24')});
	document.getElementById('bb25').addEventListener('click', function() {openClose('b25')});
	document.getElementById('bb26').addEventListener('click', function() {openClose('b26')});
//	document.getElementById('bb27').addEventListener('click', function() {openClose('b27')});
	document.getElementById('bb28').addEventListener('click', function() {openClose('b28')});
	document.getElementById('bb29').addEventListener('click', function() {openClose('b29')});
	document.getElementById('bb30').addEventListener('click', function() {openClose('b30')});
	document.getElementById('bb31').addEventListener('click', function() {openClose('b31')});
	document.getElementById('bb32').addEventListener('click', function() {openClose('b32')});
//	document.getElementById('bb33').addEventListener('click', function() {openClose('b33')});
	document.getElementById('bb34').addEventListener('click', function() {openClose('b34')});
	document.getElementById('bb35').addEventListener('click', function() {openClose('b35')});
	document.getElementById('bb36').addEventListener('click', function() {openClose('b36')});
	document.getElementById('bb37').addEventListener('click', function() {openClose('b37')});
//	document.getElementById('bb38').addEventListener('click', function() {openClose('b38')});
	document.getElementById('bb39').addEventListener('click', function() {openClose('b39')});
	document.getElementById('bb40').addEventListener('click', function() {openClose('b40')});
	document.getElementById('bb41').addEventListener('click', function() {openClose('b41')});
	document.getElementById('bb42').addEventListener('click', function() {openClose('b42')});
	document.getElementById('bb43').addEventListener('click', function() {openClose('b43')});
//	document.getElementById('bb44').addEventListener('click', function() {openClose('b44')});
	document.getElementById('bb45').addEventListener('click', function() {openClose('b45')});
//	document.getElementById('bb46').addEventListener('click', function() {openClose('b46')});
//	document.getElementById('bb47').addEventListener('click', function() {openClose('b47')});
//	document.getElementById('bb48').addEventListener('click', function() {openClose('b48')});
//	document.getElementById('bb49').addEventListener('click', function() {openClose('b49')});
	document.getElementById('bb50').addEventListener('click', function() {openClose('b50')});
//	document.getElementById('bb51').addEventListener('click', function() {openClose('b51')});
	document.getElementById('bb52').addEventListener('click', function() {openClose('b52')});
	document.getElementById('bb53').addEventListener('click', function() {openClose('b53')});
	document.getElementById('bb54').addEventListener('click', function() {openClose('b54')});
	document.getElementById('bb55').addEventListener('click', function() {openClose('b55')});
	document.getElementById('bb56').addEventListener('click', function() {openClose('b56')});
	document.getElementById('bb57').addEventListener('click', function() {openClose('b57')});
	document.getElementById('bb58').addEventListener('click', function() {openClose('b58')});
	document.getElementById('bb59').addEventListener('click', function() {openClose('b59')});

};

//this one is for mobile only. Remove for the Chrome app
window.addEventListener('load', function() {
    FastClick.attach(document.body);
}, false);

//for general directory
window.addEventListener('message', receiveMessage, false);

//gets Lock from the general directory iframe and puts it in Lock screen
function receiveMessage(evt){
  	if (evt.origin === 'https://www.passlok.com'){
    	document.getElementById('lockBox').value = evt.data;
		suspendFindLock = true;
		document.getElementById('lockmsg').innerHTML='Give a name to this Lock and save it. Otherwise Clear.'
  	}
}

if(localStorage.length == 0) newUser();

fillNameList();

initTabs();																	//initialize tabs

//end of body script.