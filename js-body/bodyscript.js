//this is the part of the javascript code that must be within the body

//detect browser and device
	var isMobile = (typeof window.orientation != 'undefined'),
		isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
		isFirefox = typeof InstallTrigger !== 'undefined',   						// Firefox 1.0+
		isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,       // At least Safari 3+: "[object HTMLElementConstructor]"
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,								// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		isIE = /*@cc_on!@*/false || !!document.documentMode,						 // At least IE6
		isiPad = (navigator.userAgent.match(/iPad/i) != null),
		isiPhone = (navigator.userAgent.match(/iPhone|iPod/i) != null),
		isiOS = (isiPhone || isiPad),
		isAndroid = (isMobile && !isiOS),
		isAndroidTablet = (navigator.userAgent.match(/mobile/i) == null && isAndroid),
		isAndroidPhone = (navigator.userAgent.match(/mobile/i) != null && isAndroid),
		isFile = (window.location.protocol == 'file:');
	textheight();
	chatResize();

//  Clear out "sorry, no JavaScript" warning and display the type of source
	showGreeting();

//set global variable indicating if there is a Chrome sync data area. Works for Chrome apps and extension
var ChromeSyncOn = false;
if(isChrome){
	if(chrome.storage){
		if(chrome.storage.sync){
			ChromeSyncOn = true
		}
	}
}

//clears the no JavaScript warning and displays an initial message depending on the type of source
function showGreeting(){
	var protocol = window.location.protocol;
	var msgStart = "<span style='color:green'><strong>Welcome to PassLok Privacy</strong></span><br />",
		msgEnd = "<br />Select your user name and enter your Key. Then click OK";
	if(protocol == 'file:'){
		keyMsg.innerHTML = msgStart + 'running from a saved file' + msgEnd
	}else if(protocol == 'https:'){
		keyMsg.innerHTML = msgStart + 'downloaded from a secure server' + msgEnd
	}else if(protocol == 'chrome-extension:'){
		keyMsg.innerHTML = msgStart + 'running as a Chrome app' + msgEnd
	}else{
		mainTab.style.backgroundColor = '#ffd0ff';
		keyMsg.innerHTML = msgStart + '<span style="color:orange">WARNING: running from an insecure source!</span>' + msgEnd
	}
}

//resizes text boxes so they fit within the window
function textheight(){
	var	fullheight = document.documentElement.clientHeight,
		offsetheight = 392,
		toolbarheight = 50;
	if(isiPhone) offsetheight = offsetheight - 65;
	lockBox.style.height = (fullheight - offsetheight)*0.8 + 'px';
	if(niceEditor){
		mainBox.style.height = fullheight - offsetheight - toolbarheight + 'px'
	}else{
		if(isMobile){
			if(isAndroid && !isFile){
				mainBox.style.height = fullheight - offsetheight + 40 + 'px';
			}else if(isiPhone){
				mainBox.style.height = fullheight - offsetheight - 10 + 'px';
			}else{
				mainBox.style.height = fullheight - offsetheight + 'px';
			}
		}else{
			mainBox.style.height = fullheight - offsetheight + 'px';
		}
	}
}

function chatResize(){
	chatFrame.height = document.documentElement.clientHeight - 60
}

//this one is called by window.onload below
function loadFileAsURL(){
	var fileToLoad = mainFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.length > 2000000){
			var reply = confirm("This file is larger than 1.5MB and Chrome won't save it. Do you want to continue loading it?");
			if(!reply){
				mainMsg.innerHTML = 'File load canceled';
				throw('file load canceled')
			}
		}
		if(fileToLoad.type.slice(0,4) == "text"){
			if(URLFromFileLoaded.slice(0,2) == '==' && URLFromFileLoaded.slice(-2) == '=='){
				mainBox.innerHTML += safeHTML('<a download="' + fileName + '" href="data:,' + URLFromFileLoaded + '">' + fileName + '</a>')						//filter before adding to the DOM
			}else{
				mainBox.innerHTML += safeHTML('<br>' + URLFromFileLoaded.replace(/  /g,' &nbsp;'))
			}
		}else{
			mainBox.innerHTML += safeHTML('<a download="' + fileName + '" href="' + URLFromFileLoaded.replace(/=+$/,'') + '">' + fileName + '</a>')
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'This is the content of file <strong>' + fileToLoad.name + '</strong>';
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		mainMsg.innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted.</strong>';
	}
	setTimeout(function(){
		updateButtons();
		if(decryptBtn.innerText == 'Decrypt') mainMsg.innerText = 'This file contains an encrypted item';
		if(verifyBtn.innerText == 'Unseal') mainMsg.innerText = 'This file contains a sealed item';
		if(secretShareBtn.innerText == 'Join') mainMsg.innerHTML = 'This file contains a part. Add more parts if necessary';
	},300);
}

//to load a file into the directory dialog
function loadLockFile(){
	var fileToLoad = lockFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		lockBox.innerHTML = safeHTML('<a download="' + fileName + '" href="' + URLFromFileLoaded.replace(/=+$/,'') + '">' + fileName + '</a>')
	};

	fileReader.readAsDataURL(fileToLoad, "UTF-8");
	lockMsg.innerHTML = 'File <strong>' + fileToLoad.name + '</strong> has been loaded'
}

//to load an image into the main box
function loadImage(){
	var fileToLoad = imgFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) != 'data:image'){
			mainMsg.innerText = 'This file is not a recognized image type';
			return
		}
		mainBox.innerHTML += safeHTML('<img style="width:50%;" src="' + URLFromFileLoaded.replace(/=+$/,'') + '">')
	};

	fileReader.readAsDataURL(fileToLoad, "UTF-8");
}