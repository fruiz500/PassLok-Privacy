// initialize things
window.onload = function() {

    if(isMobile){
        mainMsg.style.height = '20px';
        imgSpacer.style.display = 'none';
        partSpacer1.style.display = 'none';
        partSpacer2.style.display = 'none';
        decoyInSpacer1.style.display = 'none';
        decoyInSpacer2.style.display = 'none';
        decoyOutSpacer.style.display = 'none';
        qrcodeImg.style.width = '100%';
        qrcodeImg.style.left = '0';
        var bottomButtons = mainbuttonsbot.children;
        for(var i = 0; i < bottomButtons.length; i++) bottomButtons[i].classList.add("narrow")
    }else{
        previewImg.style.width = "80%"					//smaller image on PCs
    }
    if(isAndroid){										//resize shift buttons on Android
        extra2mainBtn.style.padding = '11px';
        main2extraBtn.style.padding = '11px'
    }
    if(isiOS) encodeJPGBtn.style.display = 'none';	//JPG hide does not work on iOS
    if(isiPhone || isAndroidPhone){					//to make things fit on narrow screens
        anonLabel.textContent = ' Anon.  ';
        modeLabel.style.display = 'none';
        otherLabel.style.display = 'none';
        greenLabel.textContent = 'Grn';
        customLabel.textContent = 'Cust';
        backgroundLabel.textContent = 'Bg.';
        sentencesLabel.textContent = 'Sentence';
        lockScr.style.top = "5%";
        lockScr.style.left = "5%";
        lockScr.style.width = "90%";
        lockScr.style.height = "90%"
    }

    //load field icons
    pwdIntroIcon.src = eyeImg;
    pwdIcon.src = eyeImg;
    newKeyIcon.src = eyeImg;
    decoyInIcon.src = eyeImg;
    decoyOutIcon.src = eyeImg;
    imageIcon.src = eyeImg;

  //event listeners for buttons etc.
    window.addEventListener('resize',textheight);

    mainFile.addEventListener('change', loadFileAsURL);
    mainFile.addEventListener('click', function(){this.value = '';});

    imgFile.addEventListener('change', loadImage);
    imgFile.addEventListener('click', function(){this.value = '';});

    imageFile.addEventListener('change', importImage);
    imageFile.addEventListener('click', function(){this.value = '';});

    imageFileEmail.addEventListener('change', importImage);
    imageFileEmail.addEventListener('click', function(){this.value = '';});

    lockFile.addEventListener('change', loadLockFile);
    lockFile.addEventListener('click', function(){this.value = '';});

    encodePNGBtn.addEventListener('click', encodePNG);

    encodeJPGBtn.addEventListener('click', encodeJPG);

    decodeImgBtn.addEventListener('click', decodeImage);

    imageIcon.addEventListener('click',function(){showPwd('image')});

    showLockBtn.addEventListener('click', showLock);

    selectMainBtn.addEventListener('click', selectMain);

       clearMainBtn.addEventListener('click', clearMain);

    showLockBtnBasic.addEventListener('click', showLock);

       decryptBtn.addEventListener('click', lockBtnAction);

    verifyBtn.addEventListener('click', signVerify);

       main2extraBtn.addEventListener('click', main2extra);

       decryptBtnBasic.addEventListener('click', lockBtnAction);

    decryptBtnEmail.addEventListener('click', lockBtnAction);

       extra2mainBtn.addEventListener('click', main2extra);

       niceEditBtn.addEventListener('click', toggleRichText);

       chatBtn.addEventListener('click', Chat);

       sendSMSBtn.addEventListener('click', sendSMS);

       secretShareBtn.addEventListener('click', splitJoin);

    stegoBtn.addEventListener('click', textStego);

    stegoBtnEmail.addEventListener('click', textStego);

       image2mainBtn.addEventListener('click', image2main);

       clearLocksBtn.addEventListener('click', clearLocks);

       addLockBtn.addEventListener('click', function(){addLock(false)});

       removeLockBtn.addEventListener('click', removeLock);

       resetPFSBtn.addEventListener('click', resetPFS);

       showLockDBBtn.addEventListener('click', showLockDB);

       mergeLockDBBtn.addEventListener('click', mergeLockDB);

       moveLockDBBtn.addEventListener('click', moveLockDB);

       acceptKeyBtn.addEventListener('click', acceptpwd);

       cancelKeyBtn.addEventListener('click', cancelKey);

       skipIntroBtn.addEventListener('click', cancelKey);

       changeNameBtn.addEventListener('click', showName);

       changeKeyBtn.addEventListener('click', acceptnewKey);

       changeEmailBtn.addEventListener('click', showEmail);

       backupSettingsBtn.addEventListener('click', moveMyself);

       basicMode.addEventListener('click', mode2basic);

       advancedMode.addEventListener('click', mode2adv);

    emailMode.addEventListener('click', mode2email);

    liteStyle.addEventListener('click', selectStyle);

    darkStyle.addEventListener('click', selectStyle);

    redStyle.addEventListener('click', selectStyle);

    greenStyle.addEventListener('click', selectStyle);

    blueStyle.addEventListener('click', selectStyle);

    customStyle.addEventListener('click', selectStyle);

    colorPicker.addEventListener('change',updateColor);

    rndColors.addEventListener('click', randomColors);

    editTabColor.addEventListener('click', initPicker);

    editBgColor.addEventListener('click', initPicker);

    editBtnColor.addEventListener('click', initPicker);

    editBoxColor.addEventListener('click', initPicker);

    anonMode.addEventListener('click', checkboxStore);

    signedMode.addEventListener('click', checkboxStore);

    onceMode.addEventListener('click', checkboxStore);

    learnMode.addEventListener('click', checkboxStore);

    longMode.addEventListener('click', checkboxStore);

    shortMode.addEventListener('click', checkboxStore);

    compatMode.addEventListener('click', checkboxStore);

    decoyMode.addEventListener('click', checkboxStore);

    wordLockMode.addEventListener('click', checkboxStore);

    ezLokMode.addEventListener('click', checkboxStore);

    normalLockMode.addEventListener('click', checkboxStore);

    fileMode.addEventListener('click', checkboxStore);

    binaryMode.addEventListener('click', checkboxStore);

    textMode.addEventListener('click', checkboxStore);

    qrMode.addEventListener('click', checkboxStore);

    includeMode.addEventListener('click', checkboxStore);

    chromeSyncMode.addEventListener('click', checkboxStore);

    sentenceMode.addEventListener('click', checkboxStore);

    letterMode.addEventListener('click', checkboxStore);

    invisibleMode.addEventListener('click', checkboxStore);

    wordMode.addEventListener('click', checkboxStore);

    spaceMode.addEventListener('click', checkboxStore);

    pwdIcon.addEventListener('click',function(){showPwd('pwd')});

       introRandomBtn.addEventListener('click', randomToken);

    clearIntroRandomBtn.addEventListener('click', clearIntroEmail);

       randomEmailBtn.addEventListener('click', randomToken);

       acceptEmailBtn.addEventListener('click', email2any);

       cancelEmailBtn.addEventListener('click', cancelEmail);

       acceptNameBtn.addEventListener('click', name2any);

       cancelNameBtn.addEventListener('click', cancelName);

       pwdIntroIcon.addEventListener('click', function(){showPwd('pwdIntro')});

       clearIntroBtn.addEventListener('click', clearIntro);

       suggestIntroBtn.addEventListener('click', suggestIntro);

       showlockIntroBtn.addEventListener('click', initUser);

       decoyInIcon.addEventListener('click', function(){showPwd('decoyIn')});

       submitDecoyBtn.addEventListener('click', acceptdecoyIn);

       cancelDecoyBtn.addEventListener('click', cancelDecoy);

       decoyOutIcon.addEventListener('click', function(){showPwd('decoyOut')});

       submitDecoy2Btn.addEventListener('click', acceptdecoyIn);

       cancelDecoy2Btn.addEventListener('click', cancelDecoy);

       submitPartsBtn.addEventListener('click', submitParts);

       cancelPartsBtn.addEventListener('click', cancelPartsIn);

       cancelChatBtn.addEventListener('click', closeBox);

       submitChatBtn.addEventListener('click', makeChat);

    lockList.addEventListener('change', fillBox);

    lockList.addEventListener('click', updateButtons);

       resetListBtn.addEventListener('click', resetList);

    main2lockBtn.addEventListener('click', main2lock);

    lock2mainBtn.addEventListener('click', main2lock);

       newUserBtn.addEventListener('click', newUser);

       submitKeyChangeBtn.addEventListener('click', acceptnewKey);

       cancelKeyChangeBtn.addEventListener('click', cancelKeyChange);

    newKeyIcon.addEventListener('click',function(){showPwd('newKey')});

    gotointro2.addEventListener('click', go2intro2);

       backtointro1.addEventListener('click', go2intro2);

       gotointro3.addEventListener('click', go2intro3);

       backtointro2.addEventListener('click', go2intro3);

       gotointro4.addEventListener('click', go2intro4);

       backtointro3.addEventListener('click', go2intro4);

       gotointro5.addEventListener('click', go2intro5);

       backtointro4.addEventListener('click', go2intro5);

       mainBox.addEventListener('keyup', charsLeft);

    mainBox.addEventListener('paste', pasteMain);

       decoyText.addEventListener('keyup', charsLeft);

       chatDate.addEventListener('keyup', charsLeft);

    pwdBox.addEventListener('keyup',function(event){boxKeyup('pwd',event)});

    pwdIntroBox.addEventListener('keyup',function(event){boxKeyup('pwdIntro',event)});

    decoyInBox.addEventListener('keyup', function(event){boxKeyup('decoyIn',event)});

    decoyOutBox.addEventListener('keyup', function(event){boxKeyup('decoyOut',event)});

    partsIn.addEventListener('keyup', function(event) {partsKeyup(event)}, false);

    newKeyBox.addEventListener('keyup', function(event){boxKeyup('newKey',event)});

    newKey2Box.addEventListener('keyup', function(event) {newKey2up(event)}, false);

    lockBox.addEventListener('keyup', function(event) {lockBoxKeyup(event)}, false);

    lockBox.addEventListener('paste', pasteLock);

    userNameBox.addEventListener('keyup', function(event) {nameKeyup(event)}, false);

    emailBox.addEventListener('keyup', function(event) {emailKeyup(event)}, false);

    imageBox.addEventListener('keyup', function(event){boxKeyup('image',event)});

    qrcodeImg.addEventListener('click', function(){qrcodeImg.style.display = 'none';mainMsg.textContent = 'QR code canceled'});

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
    document.images[8].addEventListener("click", function() {formatDoc('justifyright')});
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
    document.images[23].addEventListener("click", saveFiles);

//for the help screens
    var helpHeaders = document.getElementsByClassName("helpHeading");		//add listeners to all the help headers

    for (var i = 0; i < helpHeaders.length; i++) {
        helpHeaders[i].addEventListener('click', openHelp);
    }

    var helpHeaders2 = document.getElementsByClassName("helpHeading2");		//2nd level help

    for (var i = 0; i < helpHeaders2.length; i++) {
        helpHeaders2[i].addEventListener('click', openHelp2);
    }

//fixes after inline styles were moved to css file
    lockList.style.padding = '4px';
    lockList.style.width = '30%';
    basicBtnsTop.style.display = 'block';
    mainMsg.style.minHeight = '20px';
    extraButtonsTop.style.display = 'none'
};

//fix for iOS Safari upon startup
if(isMobile){
    if(window.location.hash.match('#a') && window.location.hash.length < 10) window.location.hash = ''
}

if(!localStorage){newUser();}else if(localStorage.length == 0){newUser();}else if(localStorage.length == 1 && localStorage['randid']){newUser();};

//initialize QRcode
var qrcode = new QRCode(document.getElementById("qrcodeImg"), {
    width : 290,
    height : 290
});

fillNameList();

initTabs();																	//initialize tabs

//var time10 = hashTime10();													//get milliseconds for 10 wiseHash at iter = 10
var time10 = 200									//valid for core2 duo. Should be smaller for more recent machines

//end of body script.
