// initialize things
window.onload = function() {

	if(isMobile){
		niceEditBtn.style.display = 'none';		//no rich text editing on mobile
		fileBtns.style.display = 'none';
		selectMainBtn.style.display = 'none';
	} else {
		preview.style.width = "40%";					//smaller image on PCs
		sendSMSBtn.style.display = 'none';
	}
	if(!isMobile || isChrome){							//search box in Help tab. Works on Android Chrome, but won't detect right
		helpTopMobile.style.display = 'none';
		helpTop.style.display = 'block';
		helpSpace.style.display = 'block'
	}
	if(isAndroid){										//resize shift buttons on Android
		if(window.location.protocol == 'file:'){
			extra2mainBtn.style.padding = '8px';
			main2extraBtn.style.padding = '8px';
		}else{
			extra2mainBtn.style.padding = '9px';
			main2extraBtn.style.padding = '9px';
		}
	}
	if(isiOS) encodeJPGBtn.style.display = 'none';	//JPG hide does not work on iOS
  
	window.addEventListener("resize", function() { textheight();chatResize();}, false)	    	//resize if the window changes

	//this one for loading files into extra screen
    mainFile.addEventListener('change', loadFileAsURL, false);

    // add action to the file input
    imageFile.addEventListener('change', importImage);

    // add actions to the rest of the buttons
    encodePNGBtn.addEventListener('click', encodePNG);

	encodeJPGBtn.addEventListener('click', encodeJPG);

    decodeImgBtn.addEventListener('click', decodeImage);

   	showLockBtn.addEventListener('click', showLock);

	selectMainBtn.addEventListener('click', selectMain);

   	clearMainBtn.addEventListener('click', clearMain);

   	showLockBtnBasic.addEventListener('click', showLock);

   	decryptBtn.addEventListener('click', lockUnlock);

	verifyBtn.addEventListener('click', signVerify);

   	main2extraBtn.addEventListener('click', main2extra);

   	decryptBtnBasic.addEventListener('click', lockUnlock);

   	extra2mainBtn.addEventListener('click', main2extra);

   	niceEditBtn.addEventListener('click', toggleRichText);

   	sendMailBtn.addEventListener('click', sendMail);

   	chatBtn.addEventListener('click', Chat);

   	sendSMSBtn.addEventListener('click', sendSMS);

   	imageBtn.addEventListener('click', main2image);

   	secretShareBtn.addEventListener('click', splitJoin);

	stegoBtn.addEventListener('click', textStego);

   	saveFileBtn.addEventListener('click', saveURLAsFile);

   	image2mainBtn.addEventListener('click', image2main);

   	lock2dirBtn.addEventListener('click', lock2dir);

   	clearLocksBtn.addEventListener('click', clearLocks);

   	clearLocksBtnBasic.addEventListener('click', clearLocks);

   	addLockBtn.addEventListener('click', addLock);

   	removeLockBtn.addEventListener('click', removeLock);

   	resetPFSBtn.addEventListener('click', resetPFS);

   	addToListBtn.addEventListener('click', addToList);

   	addLockBtnBasic.addEventListener('click', addLock);

   	removeLockBtnBasic.addEventListener('click', removeLock);

   	showLockDBBtn.addEventListener('click', showLockDB);

   	mergeLockDBBtn.addEventListener('click', mergeLockDB);

   	resetLockDBBtn.addEventListener('click', resetLockDB);

   	moveLockDBBtn.addEventListener('click', moveLockDB);

   	acceptKeyBtn.addEventListener('click', acceptKey);

   	cancelKeyBtn.addEventListener('click', cancelKey);

   	skipIntroBtn.addEventListener('click', cancelKey);

   	changeNameBtn.addEventListener('click', showName);

   	changeKeyBtn.addEventListener('click', changeKey);

   	changeEmailBtn.addEventListener('click', showEmail);

   	backupSettingsBtn.addEventListener('click', moveMyself);

   	basicMode.addEventListener('click', adv2basic);

   	advancedMode.addEventListener('click', basic2adv);

	liteStyle.addEventListener('click', selectStyle);

	darkStyle.addEventListener('click', selectStyle);

	redStyle.addEventListener('click', selectStyle);

	greenStyle.addEventListener('click', selectStyle);

	blueStyle.addEventListener('click', selectStyle);
	
	customStyle.addEventListener('click', selectStyle);
	
	rndColors.addEventListener('click', randomColors);
	
	editTabColor.addEventListener('click', initPicker);
	
	editBgColor.addEventListener('click', initPicker);
	
	editBtnColor.addEventListener('click', initPicker);
	
	editBoxColor.addEventListener('click', initPicker);

	anonMode.addEventListener('click', checkboxStore);

	signedMode.addEventListener('click', checkboxStore);

	pfsMode.addEventListener('click', checkboxStore);

	onceMode.addEventListener('click', checkboxStore);

	learnMode.addEventListener('click', checkboxStore);

	shortMode.addEventListener('click', checkboxStore);

	decoyMode.addEventListener('click', checkboxStore);

   	ezLokMode.addEventListener('click', checkboxStore);

	noTagsMode.addEventListener('click', checkboxStore);

   	encryptLocksMode.addEventListener('click', checkboxStore);

	chromeSyncMode.addEventListener('click', checkboxStore);

	ReedSolMode.addEventListener('click', checkboxStore);

	tripleMode.addEventListener('click', checkboxStore);

	attachedMode.addEventListener('click', checkboxStore);

	sealMode.addEventListener('click', checkboxStore);

	sentenceMode.addEventListener('click', checkboxStore);

	letterMode.addEventListener('click', checkboxStore);

	wordMode.addEventListener('click', checkboxStore);

	spaceMode.addEventListener('click', checkboxStore);

   	showKey.addEventListener('click', showsec);

   	introRandomBtn.addEventListener('click', randomToken);

	clearIntroRandomBtn.addEventListener('click', clearIntroEmail);

   	randomEmailBtn.addEventListener('click', randomToken);

   	acceptEmailBtn.addEventListener('click', email2any);

   	cancelEmailBtn.addEventListener('click', cancelEmail);

   	acceptNameBtn.addEventListener('click', name2any);

   	cancelNameBtn.addEventListener('click', cancelName);

   	showIntroKey.addEventListener('click', showIntro);

   	clearIntroBtn.addEventListener('click', clearIntro);

   	suggestIntroBtn.addEventListener('click', suggestIntro);

   	showlockIntroBtn.addEventListener('click', initUser);

   	showDecoyInCheck.addEventListener('click', showDecoyIn);

   	submitDecoyBtn.addEventListener('click', submitDecoyIn);

   	cancelDecoyBtn.addEventListener('click', cancelDecoyIn);

   	showDecoyOutCheck.addEventListener('click', showDecoyOut);

   	submitDecoy2Btn.addEventListener('click', submitDecoyOut);

   	cancelDecoy2Btn.addEventListener('click', cancelDecoyOut);

   	submitPartsBtn.addEventListener('click', submitParts);

   	cancelPartsBtn.addEventListener('click', cancelPartsIn);

   	closeLockdirBtn.addEventListener('click', lock2dir);

   	closeChatBtn.addEventListener('click', chat2main);

   	resetChatBtn.addEventListener('click', resetChat);

   	cancelChatBtn.addEventListener('click', closeBox);

   	submitChatBtn.addEventListener('click', makeChat);

	lockList.addEventListener('change', fillBox);

   	resetListBtn.addEventListener('click', resetList);

	main2lockBtn.addEventListener('click', main2lock);

	lock2mainBtn.addEventListener('click', main2lock);

   	newUserBtn.addEventListener('click', newUser);

   	submitKeyChangeBtn.addEventListener('click', changeKey);

   	cancelKeyChangeBtn.addEventListener('click', cancelKeyChange);

   	showNewKeyCheck.addEventListener('click', showNewKey);

	gotointro2.addEventListener('click', go2intro2);

   	backtointro1.addEventListener('click', go2intro2);

   	gotointro3.addEventListener('click', go2intro3);

   	backtointro2.addEventListener('click', go2intro3);

   	gotointro4.addEventListener('click', go2intro4);

   	backtointro3.addEventListener('click', go2intro4);

   	gotointro5.addEventListener('click', go2intro5);

   	backtointro4.addEventListener('click', go2intro5);

   	mainBox.addEventListener('keyup', charsLeft);

   	decoyText.addEventListener('keyup', charsLeft);

   	chatDate.addEventListener('keyup', charsLeft);

//Firefox requires the keyup code to be inline if it refers to the event
//but this must be removed for the Chrome app and replaced with those commented below

//	pwd.addEventListener('keyup', function() {pwdKeyup(event)}, false);

 	pwdIntro.addEventListener('keyup', introKeyup);

//	decoyPwdIn.addEventListener('keyup', function() {decoyKeyup(event)}, false);

//	decoyPwdOut.addEventListener('keyup', function() {decoyKeyupOut(event)}, false);

//	partsIn.addEventListener('keyup', function() {partsKeyup(event)}, false);

	newKey.addEventListener('keyup', newKeyup);

//	newKey2.addEventListener('keyup', function() {newKey2up(event)}, false);

//	lockNameBox.addEventListener('keyup', function() {lockNameKeyup(event)}, false);
	
	lockBox.addEventListener('keyup', applyRStoLock);
	lockBox.addEventListener('paste', pasteLock);
	
	function pasteLock() {
    setTimeout(function(){
        applyRStoLock();
    }, 0); //or 4
	}

//	userNameBox.addEventListener('keyup', function() {nameKeyup(event)}, false);
		
//	emailBox.addEventListener('keyup', function() {emailKeyup(event)}, false);

	neverMode.addEventListener('click', hide5min);
	
//for the rich text editor boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

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
	document.images[12].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	document.images[13].addEventListener("click", function() {formatDoc('outdent')});
	document.images[14].addEventListener("click", function() {formatDoc('indent')});
	document.images[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	document.images[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	document.images[17].addEventListener("click", function() {formatDoc('unlink')});
	document.images[18].addEventListener("click", function() {formatDoc('removeFormat')});
	document.images[19].addEventListener("click", function() {formatDoc('undo')});
	document.images[20].addEventListener("click", function() {formatDoc('redo')});
	
//for the help screens
	aa1.addEventListener('click', function() {openClose('a1')});
	aa2.addEventListener('click', function() {openClose('a2')});
	aa3.addEventListener('click', function() {openClose('a3')});
	aa4.addEventListener('click', function() {openClose('a4')});
	aa5.addEventListener('click', function() {openClose('a5')});
	aa6.addEventListener('click', function() {openClose('a6')});
	aa7.addEventListener('click', function() {openClose('a7')});
	aa8.addEventListener('click', function() {openClose('a8')});
	aa9.addEventListener('click', function() {openClose('a9')});
	aa10.addEventListener('click', function() {openClose('a10')});
	aa11.addEventListener('click', function() {openClose('a11')});
	aa12.addEventListener('click', function() {openClose('a12')});
	aa13.addEventListener('click', function() {openClose('a13')});
	aa14.addEventListener('click', function() {openClose('a14')});
	aa15.addEventListener('click', function() {openClose('a15')});
	aa16.addEventListener('click', function() {openClose('a16')});
	aa17.addEventListener('click', function() {openClose('a17')});
	aa18.addEventListener('click', function() {openClose('a18')});
	aa19.addEventListener('click', function() {openClose('a19')});
	aa20.addEventListener('click', function() {openClose('a20')});
	aa21.addEventListener('click', function() {openClose('a21')});
	aa22.addEventListener('click', function() {openClose('a22')});
	aa23.addEventListener('click', function() {openClose('a23')});
	aa24.addEventListener('click', function() {openClose('a24')});
	aa25.addEventListener('click', function() {openClose('a25')});
	aa26.addEventListener('click', function() {openClose('a26')});
	aa27.addEventListener('click', function() {openClose('a27')});
	aa28.addEventListener('click', function() {openClose('a28')});
	aa29.addEventListener('click', function() {openClose('a29')});
	aa30.addEventListener('click', function() {openClose('a30')});
	aa31.addEventListener('click', function() {openClose('a31')});
	aa32.addEventListener('click', function() {openClose('a32')});
	aa33.addEventListener('click', function() {openClose('a33')});
	aa34.addEventListener('click', function() {openClose('a34')});
	aa35.addEventListener('click', function() {openClose('a35')});
	aa36.addEventListener('click', function() {openClose('a36')});
	aa37.addEventListener('click', function() {openClose('a37')});
	aa38.addEventListener('click', function() {openClose('a38')});
	aa39.addEventListener('click', function() {openClose('a39')});
	aa40.addEventListener('click', function() {openClose('a40')});
	aa41.addEventListener('click', function() {openClose('a41')});
	aa42.addEventListener('click', function() {openClose('a42')});
	aa43.addEventListener('click', function() {openClose('a43')});
	aa44.addEventListener('click', function() {openClose('a44')});
	aa45.addEventListener('click', function() {openClose('a45')});
	aa46.addEventListener('click', function() {openClose('a46')});
	aa47.addEventListener('click', function() {openClose('a47')});
	aa48.addEventListener('click', function() {openClose('a48')});
	aa49.addEventListener('click', function() {openClose('a49')});
	aa50.addEventListener('click', function() {openClose('a50')});
	aa51.addEventListener('click', function() {openClose('a51')});
	aa52.addEventListener('click', function() {openClose('a52')});
	aa53.addEventListener('click', function() {openClose('a53')});
	aa54.addEventListener('click', function() {openClose('a54')});
	aa55.addEventListener('click', function() {openClose('a55')});
	aa56.addEventListener('click', function() {openClose('a56')});
	aa57.addEventListener('click', function() {openClose('a57')});
	aa58.addEventListener('click', function() {openClose('a58')});
	aa59.addEventListener('click', function() {openClose('a59')});
	aa60.addEventListener('click', function() {openClose('a60')});
	aa61.addEventListener('click', function() {openClose('a61')});
	aa62.addEventListener('click', function() {openClose('a62')});

//a few help items don't have extra material, but are ready here just in case. Uncomment as needed

//	bb1.addEventListener('click', function() {openClose('b1')});
//	bb2.addEventListener('click', function() {openClose('b2')});
	bb3.addEventListener('click', function() {openClose('b3')});
//	bb4.addEventListener('click', function() {openClose('b4')});
	bb5.addEventListener('click', function() {openClose('b5')});
	bb6.addEventListener('click', function() {openClose('b6')});
	bb7.addEventListener('click', function() {openClose('b7')});
	bb8.addEventListener('click', function() {openClose('b8')});
	bb9.addEventListener('click', function() {openClose('b9')});
	bb10.addEventListener('click', function() {openClose('b10')});
	bb11.addEventListener('click', function() {openClose('b11')});
	bb12.addEventListener('click', function() {openClose('b12')});
	bb13.addEventListener('click', function() {openClose('b13')});
	bb14.addEventListener('click', function() {openClose('b14')});
	bb15.addEventListener('click', function() {openClose('b15')});
	bb16.addEventListener('click', function() {openClose('b16')});
	bb17.addEventListener('click', function() {openClose('b17')});
	bb18.addEventListener('click', function() {openClose('b18')});
	bb19.addEventListener('click', function() {openClose('b19')});
	bb20.addEventListener('click', function() {openClose('b20')});
	bb21.addEventListener('click', function() {openClose('b21')});
	bb22.addEventListener('click', function() {openClose('b22')});
	bb23.addEventListener('click', function() {openClose('b23')});
	bb24.addEventListener('click', function() {openClose('b24')});
	bb25.addEventListener('click', function() {openClose('b25')});
	bb26.addEventListener('click', function() {openClose('b26')});
//	bb27.addEventListener('click', function() {openClose('b27')});
	bb28.addEventListener('click', function() {openClose('b28')});
	bb29.addEventListener('click', function() {openClose('b29')});
	bb30.addEventListener('click', function() {openClose('b30')});
	bb31.addEventListener('click', function() {openClose('b31')});
	bb32.addEventListener('click', function() {openClose('b32')});
//	bb33.addEventListener('click', function() {openClose('b33')});
	bb34.addEventListener('click', function() {openClose('b34')});
	bb35.addEventListener('click', function() {openClose('b35')});
	bb36.addEventListener('click', function() {openClose('b36')});
	bb37.addEventListener('click', function() {openClose('b37')});
//	bb38.addEventListener('click', function() {openClose('b38')});
	bb39.addEventListener('click', function() {openClose('b39')});
	bb40.addEventListener('click', function() {openClose('b40')});
	bb41.addEventListener('click', function() {openClose('b41')});
	bb42.addEventListener('click', function() {openClose('b42')});
//	bb43.addEventListener('click', function() {openClose('b43')});
//	bb44.addEventListener('click', function() {openClose('b44')});
	bb45.addEventListener('click', function() {openClose('b45')});
	bb46.addEventListener('click', function() {openClose('b46')});
//	bb47.addEventListener('click', function() {openClose('b47')});
//	bb48.addEventListener('click', function() {openClose('b48')});
//	bb49.addEventListener('click', function() {openClose('b49')});
	bb50.addEventListener('click', function() {openClose('b50')});
//	bb51.addEventListener('click', function() {openClose('b51')});
	bb52.addEventListener('click', function() {openClose('b52')});
	bb53.addEventListener('click', function() {openClose('b53')});
	bb54.addEventListener('click', function() {openClose('b54')});
	bb55.addEventListener('click', function() {openClose('b55')});
	bb56.addEventListener('click', function() {openClose('b56')});
	bb57.addEventListener('click', function() {openClose('b57')});
	bb58.addEventListener('click', function() {openClose('b58')});
	bb59.addEventListener('click', function() {openClose('b59')});
	bb60.addEventListener('click', function() {openClose('b60')});
	bb61.addEventListener('click', function() {openClose('b61')});
//	bb62.addEventListener('click', function() {openClose('b62')});
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
    	lockBox.value = evt.data;
		suspendFindLock = true;
		lockMsg.innerHTML='Give a name to this Lock and save it. Otherwise Clear.'
  	}
}

if(!localStorage){newUser();}else if(localStorage.length==0){newUser();};

fillNameList();

initTabs();																	//initialize tabs

var time10 = hashTime10();													//get milliseconds for 10 wiseHash at iter = 10

//end of body script.