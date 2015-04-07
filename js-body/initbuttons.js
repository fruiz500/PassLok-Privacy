// initialize things
window.onload = function() {

	if(isMobile){
		document.getElementById('niceEditButton').style.display = 'none';		//no rich text editing on mobile
		document.getElementById('filebuttons').style.display = 'none';
		document.getElementById('selectMainButton').style.display = 'none';
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
    document.getElementById('fileToLoad').addEventListener('change', loadFileAsURL, false);

    // add action to the file input
    document.getElementById('imagefile').addEventListener('change', importImage);

    // add action to the encode button
    document.getElementById('encode').addEventListener('click', encodeImage);

    // add action to the decode button
    document.getElementById('decode').addEventListener('click', decodeImage);

//button code moved from html page, used to be inline

   	document.getElementById('showlockButton').addEventListener('click', showLock);

   	document.getElementById('basicmode').addEventListener('click', adv2basic);

   	document.getElementById('advancedmode').addEventListener('click', basic2adv);
	
	document.getElementById('selectMainButton').addEventListener('click', selectMain);

   	document.getElementById('clearMainButton').addEventListener('click', clearMain);

   	document.getElementById('showlockButtonBasic').addEventListener('click', showLock);

   	document.getElementById('decryptButton').addEventListener('click', Decrypt_single);

	document.getElementById('verifyButton').addEventListener('click', verifySignature);

   	document.getElementById('main2extraButton').addEventListener('click', main2extra);

   	document.getElementById('decryptButtonBasic').addEventListener('click', Decrypt_single);

   	document.getElementById('extra2mainButton').addEventListener('click', main2extra);

   	document.getElementById('niceEditButton').addEventListener('click', toggleRichText);

   	document.getElementById('sendMailButton').addEventListener('click', sendMail);

   	document.getElementById('chatButton').addEventListener('click', Chat);

   	document.getElementById('sendSMSButton').addEventListener('click', sendSMS);

   	document.getElementById('imageButton').addEventListener('click', main2image);

   	document.getElementById('secretshareButton').addEventListener('click', secretshare);

	document.getElementById('stegoButton').addEventListener('click', textStego);

   	document.getElementById('savefileButton').addEventListener('click', saveURLAsFile);

   	document.getElementById('image2mainButton').addEventListener('click', image2main);

   	document.getElementById('lock2dirButton').addEventListener('click', lock2dir);

   	document.getElementById('clearLocksButton').addEventListener('click', clearLocks);

   	document.getElementById('clearLocksButtonBasic').addEventListener('click', clearLocks);

   	document.getElementById('addLockButton').addEventListener('click', addLock);

   	document.getElementById('removeLockButton').addEventListener('click', removeLock);

   	document.getElementById('resetPFSButton').addEventListener('click', resetPFS);

   	document.getElementById('addToListButton').addEventListener('click', addToList);

   	document.getElementById('addLockButtonBasic').addEventListener('click', addLock);

   	document.getElementById('removeLockButtonBasic').addEventListener('click', removeLock);

   	document.getElementById('showLockDBButton').addEventListener('click', showLockDB);

   	document.getElementById('mergeLockDBButton').addEventListener('click', mergeLockDB);

   	document.getElementById('resetLockDBButton').addEventListener('click', resetLockDB);

   	document.getElementById('moveLockDBButton').addEventListener('click', moveLockDB);

   	document.getElementById('acceptKeyButton').addEventListener('click', acceptKey);

   	document.getElementById('cancelKeyButton').addEventListener('click', cancelKey);

   	document.getElementById('skipintro').addEventListener('click', cancelKey);

   	document.getElementById('changeNameButton').addEventListener('click', showName);

   	document.getElementById('changeKeyButton').addEventListener('click', changeKey);

   	document.getElementById('changeEmailButton').addEventListener('click', showEmail);

   	document.getElementById('backupSettings').addEventListener('click', moveMyself);

   	document.getElementById('ezLok').addEventListener('click', ezLokStore);

   	document.getElementById('encryptLocks').addEventListener('click', encryptLocksStore);

   	document.getElementById('smallOut').addEventListener('click', smallOutStore);

	document.getElementById('ReedSol').addEventListener('click', RScodeStore);

   	document.getElementById('showKey').addEventListener('click', showsec);

   	document.getElementById('introRandomButton').addEventListener('click', randomToken);

	document.getElementById('clearIntroRandomButton').addEventListener('click', clearIntroEmail);

   	document.getElementById('randomEmailButton').addEventListener('click', randomToken);

   	document.getElementById('acceptEmailButton').addEventListener('click', email2any);

   	document.getElementById('cancelEmailButton').addEventListener('click', cancelEmail);

   	document.getElementById('acceptNameButton').addEventListener('click', name2any);

   	document.getElementById('cancelNameButton').addEventListener('click', cancelName);

   	document.getElementById('showIntroKey').addEventListener('click', showIntro);

   	document.getElementById('clearIntroButton').addEventListener('click', clearIntro);

   	document.getElementById('suggestIntroButton').addEventListener('click', suggestIntro);

   	document.getElementById('showlockIntroButton').addEventListener('click', initUser);

   	document.getElementById('showdecIn').addEventListener('click', showdecoyIn);

   	document.getElementById('submitDecoyButton').addEventListener('click', submitDecoyIn);

   	document.getElementById('cancelDecoyButton').addEventListener('click', cancelDecoyIn);

   	document.getElementById('showdecOut').addEventListener('click', showdecoyOut);

   	document.getElementById('submitDecoy2Button').addEventListener('click', submitDecoyOut);

   	document.getElementById('cancelDecoy2Button').addEventListener('click', cancelDecoyOut);

   	document.getElementById('submitPartsButton').addEventListener('click', submitParts);

   	document.getElementById('cancelPartsButton').addEventListener('click', cancelPartsIn);

   	document.getElementById('learnmode').addEventListener('click', setlearnmode);

   	document.getElementById('closelockdirButton').addEventListener('click', lock2dir);

   	document.getElementById('closechatButton').addEventListener('click', chat2main);

   	document.getElementById('resetchatButton').addEventListener('click', resetChat);

   	document.getElementById('cancelChatButton').addEventListener('click', closebox);

   	document.getElementById('submitChatButton').addEventListener('click', makeChat);

	document.getElementById('locklist').addEventListener('change', fillBox);

   	document.getElementById('resetListButton').addEventListener('click', resetList);

	document.getElementById('main2lockButton').addEventListener('click', main2lock);

	document.getElementById('lock2mainButton').addEventListener('click', main2lock);

   	document.getElementById('newUserButton').addEventListener('click', newUser);

   	document.getElementById('submitKeychange').addEventListener('click', changeKey);

   	document.getElementById('cancelKeychange').addEventListener('click', cancelKeyChange);

   	document.getElementById('showNewKey').addEventListener('click', showNewKey);

	document.getElementById('gotointro2').addEventListener('click', go2intro2);

   	document.getElementById('backtointro1').addEventListener('click', go2intro2);

   	document.getElementById('gotointro3').addEventListener('click', go2intro3);

   	document.getElementById('backtointro2').addEventListener('click', go2intro3);

   	document.getElementById('gotointro4').addEventListener('click', go2intro4);

   	document.getElementById('backtointro3').addEventListener('click', go2intro4);

   	document.getElementById('gotointro5').addEventListener('click', go2intro5);

   	document.getElementById('backtointro4').addEventListener('click', go2intro5);

   	document.getElementById('mainBox').addEventListener('keyup', charsLeft);

   	document.getElementById('decoyText').addEventListener('keyup', charsLeft);

   	document.getElementById('chatdate').addEventListener('keyup', charsLeft);

//Firefox requires the keyup code to be inline if it refers to the event
//but this must be removed for the Chrome app and replaced with those commented below

//	document.getElementById('pwd').addEventListener('keyup', function() {pwdKeyup(event)}, false);

   	document.getElementById('pwdIntro').addEventListener('keyup', introKeyup);

//	document.getElementById('decoyPwdIn').addEventListener('keyup', function() {decoyKeyup(event)}, false);

//	document.getElementById('decoyPwdOut').addEventListener('keyup', function() {decoyKeyupOut(event)}, false);

//	document.getElementById('partsIn').addEventListener('keyup', function() {partsKeyup(event)}, false);

	document.getElementById('newKey').addEventListener('keyup', newKeyup);

//	document.getElementById('newKey2').addEventListener('keyup', function() {newKey2up(event)}, false);

//	document.getElementById('locknameBox').addEventListener('keyup', function() {locknameKeyup(event)}, false);
	
	document.getElementById('lockBox').addEventListener('keyup', applyRStoLock);
	document.getElementById('lockBox').addEventListener('paste', pasteLock);
	
	function pasteLock() {
    setTimeout(function(){
        applyRStoLock();
    }, 0); //or 4
	}

//	document.getElementById('userName').addEventListener('keyup', function() {nameKeyup(event)}, false);
		
//	document.getElementById('email').addEventListener('keyup', function() {emailKeyup(event)}, false);

	document.getElementById('never').addEventListener('click', hide5min);
	
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
	document.getElementById('aa60').addEventListener('click', function() {openClose('a60')});
	document.getElementById('aa61').addEventListener('click', function() {openClose('a61')});
	document.getElementById('aa62').addEventListener('click', function() {openClose('a62')});

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
	document.getElementById('bb46').addEventListener('click', function() {openClose('b46')});
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
	document.getElementById('bb60').addEventListener('click', function() {openClose('b60')});
	document.getElementById('bb61').addEventListener('click', function() {openClose('b61')});
	document.getElementById('bb62').addEventListener('click', function() {openClose('b62')});
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

var time10 = hashTime10();													//get milliseconds for 10 wiseHash at iter = 10

//end of body script.