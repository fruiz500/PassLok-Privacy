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

//  Clear out "sorry, no JavaScript" warning and display the type of source
    showGreeting();

//set global variable indicating if there is a Chrome sync data area. Works for Chrome and Firefox apps and extension
var ChromeSyncOn = false;
if(chrome){
    if(chrome.storage){
        if(chrome.storage.sync){
            ChromeSyncOn = true
        }
    }
}

//clears the no JavaScript warning and displays an initial message depending on the type of source
function showGreeting(){
    var protocol = window.location.protocol;
    var msgStart = "Welcome to PassLok Privacy\r\n",
        msgEnd = "\r\nSelect your user name and enter your Key. Then click OK";
    if(protocol == 'file:'){
        pwdMsg.textContent = msgStart + 'running from a saved file' + msgEnd
    }else if(protocol == 'https:'){
        pwdMsg.textContent = msgStart + 'downloaded from a secure server' + msgEnd
    }else if(protocol == 'chrome-extension:' || protocol == 'moz-extension:'){
        pwdMsg.textContent = msgStart + 'running as a Chrome or Firefox addon' + msgEnd
    }else{
        mainTab.style.backgroundColor = '#ffd0ff';
        pwdMsg.textContent = msgStart + 'WARNING: running from an insecure source!' + msgEnd
    }
}

//resizes text boxes so they fit within the window
function textheight(){
    var	fullheight = document.documentElement.clientHeight,
        offsetheight = 392,
        toolbarheight = 50;
    if(isiPhone) offsetheight = offsetheight - 65;
    lockBox.style.height = (fullheight - 300) * (isMobile ? 1 : 0.8) + 'px';
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
            mainBox.style.height = fullheight - offsetheight - 10 + 'px';
        }
    }
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
                mainMsg.textContent = 'File load canceled';
                return
            }
        }
        if(fileToLoad.type.slice(0,4) == "text"){
            if(URLFromFileLoaded.slice(0,2) == '==' && URLFromFileLoaded.slice(-2) == '=='){
                var fileLink = document.createElement("a");
                fileLink.download = fileName;
                fileLink.href = "data:," + decryptSanitizer(URLFromFileLoaded);			//filter before adding to the DOM
                fileLink.textContent = fileName;
                mainBox.appendChild(fileLink)
            }else{
                var spacer = document.createElement("br"),
                    textDiv = document.createElement("div");
                textDiv.textContent = decryptSanitizer(URLFromFileLoaded).replace(/  /g,' &nbsp;');
                mainBox.appendChild(spacer);
                mainBox.appendChild(textDiv)
            }
        }else{
            var fileLink = document.createElement("a");
            fileLink.download = fileName;
            fileLink.href = decryptSanitizer(URLFromFileLoaded).replace(/=+$/,'');
            fileLink.textContent = fileName;
            mainBox.appendChild(fileLink)
        }
        mainFile.type = '';
        mainFile.type = 'file'            //reset file input
    }
    if(fileToLoad.type.slice(0,4) == "text"){
        fileReader.readAsText(fileToLoad, "UTF-8");
        mainMsg.textContent = 'This is the content of file: ' + fileToLoad.name;
    }else{
        fileReader.readAsDataURL(fileToLoad, "UTF-8");
        mainMsg.textContent = 'The file has been loaded in encoded form. It is NOT ENCRYPTED';
    }
    setTimeout(function(){
        updateButtons();
        if(decryptBtn.textContent == 'Decrypt') mainMsg.textContent = 'This file may contain an encrypted item';
        if(verifyBtn.textContent == 'Unseal') mainMsg.textContent = 'This file may contain a sealed item';
        if(secretShareBtn.textContent == 'Join') mainMsg.textContent = 'This file may contain a part. Add more parts if necessary';
    },300);
}

//to load a file into the directory dialog
function loadLockFile(){
    var fileToLoad = lockFile.files[0],
        fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent){
        var fileName = fileToLoad.name;
            URLFromFileLoaded = fileLoadedEvent.target.result,
            escapedName = escapeHTML(fileName);
        lockBox.textContent = '';
        var fileLink = document.createElement('a');
        fileLink.download = escapedName;
        fileLink.href = decryptSanitizer(URLFromFileLoaded).replace(/=+$/,'');
        fileLink.textContent = escapedName;
        lockBox.appendChild(fileLink);
        lockFile.type = '';
        lockFile.type = 'file'            //reset file input
    }

    fileReader.readAsDataURL(fileToLoad, "UTF-8");
    lockMsg.textContent = 'File ' + escapedName + ' has been loaded'
}

//to load an image into the main box
function loadImage(){
    var fileToLoad = imgFile.files[0],
        fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent){
        var URLFromFileLoaded = fileLoadedEvent.target.result;
        if(URLFromFileLoaded.slice(0,10) != 'data:image'){
            mainMsg.textContent = 'This file is not a recognized image type';
            return
        }
        var image = document.createElement("img");
        image.src = decryptSanitizer(URLFromFileLoaded).replace(/=+$/,'');
        mainBox.appendChild(image);
        imgFile.type = '';
        imgFile.type = 'file'            //reset file input
    }

    fileReader.readAsDataURL(fileToLoad, "UTF-8");
}

//operates when the Save button is clicked
function saveFiles(){
    mainBox.contentEditable = 'false';
    var files = mainBox.querySelectorAll('a'),
        length = files.length;				//since files will be loaded as links in the main box
    for(var i = 0; i < length; i++){		//download all files
        if(files[i].href.includes('data:')) files[i].click()
    }
    mainBox.contentEditable = 'true'
}
