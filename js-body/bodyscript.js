//this is the part of the javascript code that must be within the body

	sjcl.random.startCollectors();										//start SJCL's built-in entropy collectors

//  Clear out "sorry, no JavaScript" warning and display the type of source
	showGreeting();
//detect browser and device
	var	isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
		isFirefox = typeof InstallTrigger !== 'undefined',   						// Firefox 1.0+
		isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,       // At least Safari 3+: "[object HTMLElementConstructor]"
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,								// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		isIE = /*@cc_on!@*/false || !!document.documentMode,						 // At least IE6
		isiPad = (navigator.userAgent.match(/iPad/i) != null),
		isiPhone = (navigator.userAgent.match(/iPhone|iPod/i) != null),
		isiOS = (isiPhone || isiPad),
		isAndroid = (isMobile && !isiOS),
		isAndroidTablet = (navigator.userAgent.match(/mobile/i) == null && isAndroid),
		isAndroidPhone= (navigator.userAgent.match(/mobile/i) != null && isAndroid);
	textheight();
	chatResize();

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
		document.getElementById('keymsg').innerHTML = msgStart + 'running from a saved file' + msgEnd
	}else if(protocol == 'https:'){
		document.getElementById('keymsg').innerHTML = msgStart + 'running from a secure server' + msgEnd
	}else if(protocol == 'chrome-extension:'){
		document.getElementById('keymsg').innerHTML = msgStart + 'running as a Chrome app' + msgEnd
	}else{
		document.getElementById('mainTab').style.backgroundColor = '#ffd0ff';
		document.getElementById('keymsg').innerHTML = msgStart + '<span style="color:orange">WARNING: running from an insecure source!</span>' + msgEnd
	}
}

//resizes text boxes so they fit within the window
function textheight(){
	var	fullheight = document.documentElement.clientHeight,
		offsetheight = 400,
		toolbarheight = 48;
	if(isMobile && !isAndroid) offsetheight = offsetheight - 30;
	document.getElementById('lockBox').style.height = fullheight - offsetheight + 'px';
	if(niceEditor){
		document.getElementById('mainBox').style.height = fullheight - offsetheight - toolbarheight + 'px'
	}else{
		if(isMobile){
			document.getElementById('mainBox').style.height = fullheight - offsetheight + 30 + 'px';
		}else{
			document.getElementById('mainBox').style.height = fullheight - offsetheight + 'px';
		}
	}
}

function chatResize(){
	document.getElementById('chatframe').height = document.documentElement.clientHeight - 60
}

//functions for reading a file into the box, and for saving it later
function saveURLAsFile(){
	var URLToWrite = document.getElementById('mainBox').innerHTML.trim().replace(/<br>/g,'\n'),
		URLToWriteSplit = URLToWrite.split('\n'),
		fileNameToSaveAs = URLToWriteSplit[0].split(':')[1];
	if(URLToWriteSplit.length > 1){
		var content = URLToWriteSplit[1].trim()
	} else {
		var content = URLToWriteSplit[0].trim()
	};
	var downloadLink = document.createElement("a");
	if(content.slice(0,4).toLowerCase()=='data'){							//regular save of encoded file

//first check if the file can lead to problems, and if so request user confirmation	
		var extension = fileNameToSaveAs.toLowerCase().match(/\.\w+$/);
		var suspicious =  ['.exe','.scr','.url','.com','.pif','.bat','.xht','.htm','.html','.xml','.xhtml','.js','.sh','.svg','.gadget','.msi','.msp','.hta','.cpl','.msc','.jar','.cmd','.vb','.vbs','.jse','.ws','.wsf','.wsc','.wsh','.ps1','.ps2','.ps1xml','.ps2xml','.psc1','.scf','.lnk','.inf','.reg','.doc','.xls','.ppt','.pdf','.swf','.fla','.docm','.dotm','.xlsm','.xltm','.xlam','.pptm','.potm','.ppam','.ppsm','.sldm','.dll','.dllx','.rar','.zip','.7z','.gzip','.gzip2','.tar','.fon','.svgz','.jnlp'];
		if(extension){
			var index = suspicious.indexOf(extension[0])
		} else {
			var index = -1
		}
		if(index >= 0){
			var reply = confirm('The file you want to save has the extension: ' + suspicious[index] + '  This file might execute code automatically, which may lead to a loss of security. Do you still want to save it?');
			if(!reply) throw('file save canceled by user')
		}
		
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
	} else {																//to save contents as text file
		var textFileAsBlob = new Blob([document.getElementById('mainBox').innerHTML.trim()], {type:'text/plain'});
		fileNameToSaveAs = prompt("The box contents will be saved as a text file. Please enter a name for it.");
		if(fileNameToSaveAs.indexOf('.') == -1){
			downloadLink.download = fileNameToSaveAs + '.txt';
		}else{
			downloadLink.download = fileNameToSaveAs;
		}
		downloadLink.innerHTML = "Download File";
		content = window.URL.createObjectURL(textFileAsBlob);
	}
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = content;
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = content;
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
	document.getElementById('mainmsg').innerHTML = 'File saved with filename ' + downloadLink.download
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}

//this one is called by window.onload below
function loadFileAsURL()
{
	var fileToLoad = document.getElementById("fileToLoad").files[0];

	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent)
	{
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(fileToLoad.type.slice(0,4) == "text"){
			document.getElementById('mainBox').innerHTML = URLFromFileLoaded.replace(/  /g,' &nbsp;');
		}else{
			document.getElementById('mainBox').innerHTML = "filename:" + fileName + "<br>" + URLFromFileLoaded;
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		document.getElementById('mainmsg').innerHTML = 'This is the content of file <strong>' + fileToLoad.name + '</strong>'
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		document.getElementById('mainmsg').innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted.</strong>'
	}
}

//for saving image on the Image screen
function saveImageAsFile(){
	var content = document.getElementById('preview').src,
		downloadLink = document.createElement("a"),
		fileNameToSaveAs = prompt("The image will be saved in PNG format. Please enter a name for it.");
	if(fileNameToSaveAs.indexOf('.') == -1){
		downloadLink.download = fileNameToSaveAs + '.png';
	}else{
		downloadLink.download = fileNameToSaveAs;
	}
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = content;
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = content;
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
	document.getElementById('imagemsg').innerHTML = 'Image saved with filename ' + downloadLink.download
}