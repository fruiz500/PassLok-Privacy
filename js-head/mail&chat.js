//formats results depending on tags present and sends to default email
function sendMail() {
    var type = getType(mainBox.innerHTML.trim())[0],
        words = mainBox.textContent;							//for word Locks
    if(words.match('==')) words = words.split('==')[1];
    words = words.trim().split(' ');
    if(learnMode.checked){
        if(type.match(/[lckgdasoprASO]/)){
            var reply = confirm("A new tab will open, including the contents of this box in your default email. You still need to supply the recipient's address and a subject line. Only Locks and encrypted or signed items are allowed. Cancel if this is not what you want.")
        }else{
            var reply = confirm("An invitation for others to join PassLok and containing your Lock will open in your default email. You still need to supply the recipient's address.  Cancel if this is not what you want.")
        }
        if(!reply) return
    }

  if(mainBox.textContent.match("The gibberish link below contains a message from me that has been encrypted with PassLok")){			//invitation message
    var link = "mailto:"+ "?subject=Invitation to PassLok" + "&body=" + encodeURIComponent(mainBox.textContent.trim()) + "%0D%0A%0D%0AYou can get PassLok from https://passlok.com/app and other sources, plus the Chrome, Firefox, and Android app stores."
  }else{
    var hashTag = encodeURIComponent(mainBox.textContent.trim().replace(/ /g,'_'));		//item ready for link
    var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab and ask you for your Key), or simply copy it and paste it into your favorite version of PassLok:%0D%0A%0D%0Ahttps://passlok.com/app#" + hashTag + "%0D%0A%0D%0AYou can get PassLok from https://passlok.com/app and other sources, plus the Chrome, Firefox, and Android app stores.";

    if(words.length == 20){												//20 words, so most likely a word Lock
        var link = "mailto:"+ "?subject= " + "&body=This email contains my PassLok v.2.4 Lock as a list of words. Use it to encrypt text or files for me to decrypt, or to verify my seal.%0D%0A%0D%0A" + linkText
    }else if(type=="a" || type=="A"){
        if(emailMode.checked){
            var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim())
        }else{
            var link = "mailto:"+ "?subject= " + "&body=Anonymous message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText
        }
    }else if (type=="g" || type=="d" || type=="h"){
        if(emailMode.checked){
            var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim())
        }else{
            var link = "mailto:"+ "?subject= " + "&body=Message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with shared Key.%0D%0A%0D%0A" + linkText
        }
    }else if (type=="s" || type=="S"){
        if(emailMode.checked){
            var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim())
        }else{
            var link = "mailto:"+ "?subject= " + "&body=Signed message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key and my Lock.%0D%0A%0D%0A" + linkText
        }
    }else if (type && type.match(/[oprO]/)){
        if(emailMode.checked){
            var link = "mailto:"+ "?subject= " + "&body=" + encodeURIComponent(mainBox.textContent.trim())
        }else{
            var link = "mailto:"+ "?subject= " + "&body=Read-once message encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with your secret Key.%0D%0A%0D%0A" + linkText
        }
    }else if (type=="k"){
        var link = "mailto:"+ "?subject=My PassLok database" + "&body=Database encrypted with PassLok v.2.4 %0D%0A%0D%0ADecrypt with my secret Key.%0D%0A%0D%0A" + linkText
    }else if (type=="l"){
        var link = "mailto:"+ "?subject= " + "&body=Text sealed with PassLok v.2.4. It is not encrypted. Extract it and verify my authorship using my Lock.%0D%0A%0D%0A" + linkText;
    }else if (type=='c'){
        var link = "mailto:"+ "?subject= " + "&body=This email contains my PassLok v.2.4 Lock. Use it to encrypt text or files for me to decrypt, or to verify my seal.%0D%0A%0D%0A" + linkText
    }
  }
    if(isMobile){ 	 											//new window for PC, same window for mobile
        if(isChrome && isAndroid){
            mainMsg.textContent = "Android Chrome does not allow communication with the email app"
        }else{
            window.open(link,"_parent")
        }
    }else{
        window.open(link,"_blank")
    }
}

//encrypt main box with myLock in order to make an invitation
function makeInvitation(){
    if(mainBox.textContent.trim() != ''){
        var reply = confirm('Do you want the contents of the main box to be encrypted and added to an invitation email? This will encourage the recipients to try PassLok, but be aware that the encrypted contents WILL NOT BE SECURE.');
        if (!reply) return;
        var text = mainBox.innerHTML.trim(),
            nonce = nacl.randomBytes(9),
            nonce24 = makeNonce24(nonce),
            cipherStr = myezLock + '//////' + nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,PLencrypt(text,nonce24,myLock,true)))).replace(/=+$/,'');			//this includes compression
        mainBox.textContent = '';

            var prefaceMsg = document.createElement('div');
            prefaceMsg.textContent = "The gibberish link below contains a message from me that has been encrypted with PassLok, a free app that you can get at the Chrome and Firefox web stores. There is also PassLok Privacy, PassLok for Email, and PassLok Universal at the same stores, plus the standalone PassLok web app at https://passlok.com/app.\r\n\r\nTo decrypt it, install PassLok, reload this page. You will be asked to supply a Master Key, which will not be stored or sent anywhere. You must remember your secret Key, but you can change it later if you want. When asked whether to accept my new Key (which you don't know), go ahead and click OK. You can also decrypt the invitation by pasting it into your favorite version of PassLok:";
        if(emailMode.checked){
            var initialTag = document.createElement('pre'),
                invBody = document.createElement('pre'),
                finalTag = document.createElement('pre');
            initialTag.textContent = "\r\n\r\n----------begin invitation message encrypted with PassLok--------==\r\n\r\n";
            invBody.textContent = cipherStr.match(/.{1,80}/g).join("\r\n");
            finalTag.textContent = "\r\n\r\n==---------end invitation message encrypted with PassLok-----------";
            mainBox.appendChild(prefaceMsg);
            mainBox.appendChild(initialTag);
            mainBox.appendChild(invBody);
            mainBox.appendChild(finalTag);
        }else{
            prefaceMsg.textContent = prefaceMsg.textContent + "\r\n\r\nhttps://passlok.com/app#PL24inv==" + cipherStr + "==PL24inv";
            mainBox.appendChild(prefaceMsg)
        }
        updateButtons();
        mainMsg.textContent = "Invitation created. Invitations are ";
        var blinker = document.createElement('span');
        blinker.className = "blink";
        blinker.textContent = "NOT SECURELY ENCRYPTED";
        mainMsg.appendChild(blinker);
        if(emailMode.checked) sendMail()
    }else{
        mainMsg.textContent = "Write something not confidential to add to the invitation, then click Invite again"
    }
}

//displays QR code with sender's Lock and main URL
function makeQRcode(){
    if(!refreshKey()) return;
    qrcode.makeCode('passlok.com/app#' + myLockStr);
    mainMsg.textContent = "This QR code contains your Lock. Tap it to hide";
    qrcodeImg.lastChild.style.margin = "auto";            //center QR code
    qrcodeImg.style.display = 'block'
}

//calls texting app
function sendSMS(){
    if(learnMode.checked){
        var reply = confirm("The default texting app will now open. You need to have copied your short encrypted message to the clipboard before doing this, if you want to send one. This only works on smartphones. Cancel if this is not what you want.");
        if(!reply) return
    }
    if(sendSMSBtn.textContent == 'Save'){
        saveFiles()
    }else{
        selectMain();
        window.open("SMS:","_parent")
    }
}

//decrypts a chat invite if found, then opens chat screen, otherwise makes one
function Chat(){
    var text = mainBox.innerHTML.trim();

    if(text.match('==') && text.split('==')[0].slice(-4) == 'chat'){		//there is already a chat invitation, so open it
        var msg = text.split('==')[1],
            type = msg.charAt(0);
        unlock(type,msg,lockBox.innerHTML.replace(/\n/g,'<br>').trim());
        return
    }

    var listArray = lockBox.innerHTML.replace(/\n/g,'<br>').trim().split('<br>').filter(Boolean);
    if(learnMode.checked){
        var reply = confirm("A special encrypted item will be made, inviting the selected recipients to a secure chat session. Cancel if this is not what you want.");
        if(!reply) return
    }

    if(listArray.length == 0 || (listArray.length == 1 && listArray[0] == 'myself')){
        mainMsg.textContent = 'Please select those invited to chat';
        return
    }
    if(longMode.checked) listArray = listArray.concat('myself');								//make sure 'myself' is on the list, unless it's not a multi-recipient message
    listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates and nulls
    listArray = listArray.filter(function(n){return n});
    lockBox.innerText = listArray.join('\n');
    openClose('shadow');
    openClose('chatDialog');												//stop to get chat type
    chatDate.value = mainBox.textContent.trim().slice(0,43);
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
    closeBox();
    if(dataChat.checked){					//A to C for Muaz Khan's WebRTC chat, D for Jitsi
        var type = 'A'
    }else if (audioChat.checked){
        var type = 'B'
    }else if (videoChat.checked){
        var type = 'C'
    }else{
        var type = 'D'
    }
    var date = chatDate.value.slice(0,43);						//can't do encodeURI here because this will be decrypted by decryptList, which doesn't expect it
    if(date.trim() == '') date = 'noDate';
    while(date.length < 43) date += ' ';
    var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),
        chatRoom = makeChatRoom();
    lock(lockBox.innerHTML.replace(/\n/g,'<br>').replace(/<br>$/,"").trim(),date + type + chatRoom + '?' + password);	//date msg + info to be sent to chat page
    setTimeout(function(){
            if(emailMode.checked) sendMail()
    },50)
}

//makes a mostly anonymous chatRoom name from four words in the wordlist
function makeChatRoom(){
    var wordlist = wordListExp.toString().slice(1,-2).split('|'),
        name = '';
    for(var i = 0; i < 4; i++){
        name += capitalizeFirstLetter(replaceVariants(wordlist[randomIndex()]))
    }
    return name
}

//capitalizes first letter, the better to blend into Jitsi
function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

//returns a random index for wordlist
function randomIndex(){
    return Math.floor(Math.random()*wordLength)
}

//detects if there is a chat link in the main box, and opens the Chat window
function openChat(){
    var typetoken = mainBox.textContent.trim();
    if (typetoken.slice(-44,-43) == '?' && !typetoken.slice(43).match(/[^A-Za-z0-9+\/?]/)){			//chat data detected, so open chat
        mainBox.textContent = '';
        var date = typetoken.slice(0,43).trim(),									//the first 43 characters are for the date and time etc.
            chatToken = decodeURI(typetoken.slice(43));
        if(date != 'noDate'){
            var msgStart = "This chat invitation says:\n\n " + date + " \n\n"
        }else{
            var msgStart = ""
        }
        var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location. If you cancel, a link for the chat will be made.");
        if(!reply){
            var chatLink = document.createElement('a');
            chatLink.href = 'https://passlok.com/chat/chat.html#' + chatToken;
            chatLink.textContent = 'Right-click to open the chat';
            mainBox.textContent = '';
            mainBox.appendChild(chatLink);
            return
        }
        if(isSafari || isIE || isiOS){
            mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
            return
        }
        main2chat(chatToken)
    }
}
