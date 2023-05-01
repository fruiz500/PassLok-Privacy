//initialize a few global variables used for GUI interaction
var callKey = '',
    BasicButtons = true,
    fullAccess = true,
    allowCancelWfullAccess = false;

//global variables used for key box expiration
var keytimer = 0,
    keytime = new Date().getTime();

//Alphabets for base conversion. Used in making and reading the ezLok format
var base36 = '0123456789abcdefghijkLmnopqrstuvwxyz',									//L is capital for readability
    base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(string,location) {
    var entropy = entropycalc(string),
        msg,colorName;

    if(entropy == 0){
        msg = 'This is a known bad Password!';
        colorName = 'magenta'
    }else if(entropy < 20){
        msg = 'Terrible!';
        colorName = 'magenta'
    }else if(entropy < 40){
        msg = 'Weak!';
        colorName = 'red'
    }else if(entropy < 60){
        msg = 'Medium';
        colorName = 'darkorange'
    }else if(entropy < 90){
        msg = 'Good!';
        colorName = 'green'
    }else if(entropy < 120){
        msg = 'Great!';
        colorName = 'blue'
    }else{
        msg = 'Overkill  !!';
        colorName = 'cyan'
    }

    var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

    var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds
    if(BasicButtons){
        var msg = 'Key strength: ' + msg + '\r\nUp to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
    }else{
        var msg = 'Key entropy: ' + Math.round(entropy*100)/100 + ' bits. ' + msg + '\r\nUp to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
    }
    if(location){
        var msgName = location + 'Msg';
        document.getElementById(msgName).textContent = msg;
        hashili(msgName,string);
        document.getElementById(msgName).style.color = colorName
    }
    return iter
}

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
    var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
    var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
    var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
    var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
    var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

    pwd = pwd.replace(/\s/g,'');										//no credit for spaces

    var Ncount = 0;
    if(numberRegex.test(pwd)){
        Ncount = Ncount + 10;
    }
    if(smallRegex.test(pwd)){
        Ncount = Ncount + 26;
    }
    if(capRegex.test(pwd)){
        Ncount = Ncount + 26;
    }
    if(base64Regex.test(pwd)){
        Ncount = Ncount + 2;
    }
    if(otherRegex.test(pwd)){
        Ncount = Ncount + 31;											//assume only printable characters
    }

//start by finding words that might be on the blacklist (no credit)
    var pwd = reduceVariants(pwd);
    var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
    if(wordsFound){
        for(var i = 0; i < wordsFound.length;i++){
            pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
        }
    }

//now look for regular words on the wordlist
    wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
    if(wordsFound){
        wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
        var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
        for(var i = 0; i < wordsFound.length;i++){
            pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
        }
    }else{
        var foundLength = 0;
    }

    pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

    if(pwd != ''){
        return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
    }else{
        return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
    }
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
    return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u')
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
    return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
var vowel = 'aeiou',
    consonant = 'bcdfghjklmnprstvwxyz',
    hashiliTimer;

function hashili(msgID,string){
    var element = document.getElementById(msgID);
    clearTimeout(hashiliTimer);
    hashiliTimer = setTimeout(function(){
        if(!string.trim()){
            element.innerText += ''
        }else{
            var code = nacl.hash(nacl.util.decodeUTF8(string.trim())).slice(-2),			//take last 4 bytes of the SHA512
                code10 = ((code[0]*256)+code[1]) % 10000,		//convert to decimal
                output = '';

            for(var i = 0; i < 2; i++){
                var remainder = code10 % 100;								//there are 5 vowels and 20 consonants; encode every 2 digits into a pair
                output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
                code10 = (code10 - remainder) / 100
            }
            element.innerText += '\n' + output
        }
    }, 1000);						//one second delay to display hashili
}

//these derive from the Key after running through scrypt stretching. BitArray format. Dir (salt=userName) is 32-byte, Sgn (salt=email, Edwards curve) is 64-byte; DH (Motgomery curve, deriving from Sgn) is 32-byte, myEmail is a string.
var KeyStr,
    KeyDir,
    KeySgn,
    KeyDH,
    myEmail = '';

//reads Key box and stops if there's something wrong. If the timer has run out, the Key is deleted from box, and stretched keys are deleted from memory
function refreshKey(){
    clearTimeout(keytimer);
    var period = 300000;

//start timer to erase Key
    keytimer = setTimeout(function() {
        resetKeys();
    }, period);

//erase key at end of period, by a different way
    if ((new Date().getTime() - keytime > period)) {
        resetKeys();
    }
    keytime = new Date().getTime();

    if (!KeyStr){
        any2key();
        if(callKey == 'initkey'){
            pwdMsg.textContent = 'Welcome to PassLok Privacy\r\nPlease enter your secret Key'
        }else{
            pwdMsg.textContent = 'Please enter your secret Key';
            shadow.style.display = 'block'
        }
        return false
    }
    return true
}

//resets the Keys in memory when the timer ticks off
function resetKeys(){
    KeyStr = '';
    KeyDir = '';
    KeySgn = '';
    KeyDH = '';
    myEmail = '';
    pwdBox.value = '';
    imageBox.value = ''
}

//reads email from the box. This is used as a salt to make the Lock
function readEmail(){
    if(myEmail) return myEmail;
    if(locDir['myself'] && fullAccess){
        if(locDir['myself'][0]){
            var decrypted = keyDecrypt(locDir['myself'][0]);
            if(decrypted == undefined) return undefined;
            return decrypted
        }
    }
    var email = emailBox.value;
    if (email == "" && emailScr.style.display != 'block'){
        any2email();
        return false
    };
    return email.trim()
}

var userName = '';

//to initialize a new user. Executed by final button in new user wizard
function initUser(){
    var key = pwdIntroBox.value,
        email = emailIntro.value,
        isNewUser = true;
    userName = nameIntro.value;
    myEmail = email.trim();

    if (key.trim() == '' || userName.trim() == ''){
        intromsg2.textContent = 'The User Name or the Key box is empty. Please go back and ensure both are filled.';
        return
    }
    pwdIntroBox.value = '';
    emailIntro.value = '';
    openClose('introscr5');

    if(!localStorage[userName]){
        locDir = {};
        localStorage[userName] = JSON.stringify(locDir)
    }
    locDir = JSON.parse(localStorage[userName]);
    mainMsg.textContent = '';
    var blinker = document.createElement('span'),
        msgText = document.createElement('span');
    blinker.className = "blink";
    blinker.textContent = "LOADING...";
    msgText.textContent = " for best speed, use at least a Medium Key";
    mainMsg.appendChild(blinker);
    mainMsg.appendChild(msgText);
    key2any();

setTimeout(function(){									//do the rest after a short while to give time for the key screen to show
    KeyStr = key;
    KeyDir = wiseHash(key,userName);							//storage stretched key loaded into memory, will be used right away

    if(ChromeSyncOn){											//if sync is available, get settings only from sync, then the rest
        var syncName = userName+'.myself';
        chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
            var lockdata = obj[syncName.toLowerCase()];
            if(lockdata){											//the user isn't totally new: retrieve settings
                locDir['myself'] = JSON.parse(lockdata);
                email = keyDecrypt(locDir['myself'][0]);
                if(!email) return;
                retrieveAllSync();
                isNewUser = false;
                setTimeout(function(){fillList();mainMsg.textContent = 'Settings synced from Chrome';}, 500);
            }else{													//user never seen before: store settings
                locDir['myself'] = [];
                locDir['myself'][0] = keyEncrypt(email);			//email/token is stored, encrypted by Key+userName
                if(!locDir['myself'][0]) return;
                syncChromeLock('myself',locDir['myself'][0]);
                setTimeout(function(){fillList();}, 500);
            }
            if(email) myEmail = email;
            localStorage[userName] = JSON.stringify(locDir);
            lockNames = Object.keys(locDir);
            KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;		//make the Edwards curve secret key first
            KeyDH = ed2curve.convertSecretKey(KeySgn);								//and then the Montgomery curve key
            showLock();
        });
    }else{															//if not, store the email
        if(!locDir['myself']) locDir['myself'] = [];
        locDir['myself'][0] = keyEncrypt(email);
        if(!locDir['myself'][0]) return;
        localStorage[userName] = JSON.stringify(locDir);
        lockNames = Object.keys(locDir);
        KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;
        KeyDH = ed2curve.convertSecretKey(KeySgn);
        showLock();
        setTimeout(function(){fillList();}, 500);
    }
    if(ChromeSyncOn) syncCheck.style.display = 'block';
    getSettings();
    if(inviteBox.checked) sendMail();

    //if from a QR code or invitation, get the Lock from the URL and add it to the directory
    var hash = decodeURI(window.location.hash).slice(1);								//check for data in the URL
    if(hash.length == 43){										//as from a QR code
        var hashStripped = hash
    }else{														//as from an invitation, etc.
        var hashStripped = hash.match('==(.*)==') || [' ',' '];
        hashStripped = hashStripped[1];
        hashStripped = extractLock(hashStripped)
    }
    if (hashStripped.length == 43 || hashStripped.length == 50){			//sender's Lock
        lockBox.textContent = hashStripped;
        addLock(true)
    }

    setTimeout(function(){ makeGreeting(isNewUser)}, 30);									//fill Main box with a special greeting
},30);
}

//makes a special encrypted greeting for a new user
function makeGreeting(isNewUser){
    var Lock = lockDisplay();
    if(!Lock) return;
    Lock = Lock.split('==')[1];
    if(isNewUser){
        var greeting = "<div>Congratulations! You have decrypted your first message.</div><div><br></div><div>Remember, this is your Lock, which you should give to other people so they can encrypt messages and files that only you can decrypt:</div><div><br></div>" + Lock + "<div><div><br></div><div>You can display it at any time by clicking <b>myLock</b> with the main box empty.</div><div><br></div><div>It is already entered into the local directory (top box), under name 'myself'. When you add your friends' Locks or shared Keys by pasting them into the main box or clicking the <b>Edit</b> button, they will appear in the directory so you can encrypt items that they will be able to decrypt. If someone invited you, that person should be there already.</div><div><br></div><div>Try encrypting this back: click on <b>myself</b> in the directory in order to select your Lock, and then click <b>Encrypt</b></div></div><div><br></div><div>You won't be able to decrypt this back if you select someone else's name before you click <b>Encrypt</b>, but that person will.</div><div><br></div><div><a href='https://passlok.com/learn'>Right-click and open this link</a> to reload PassLok along with a series of tutorials.</div>";
        Encrypt_List(['myself'],greeting);
        var welcomeMsg = document.createElement('div');
        welcomeMsg.textContent = "Welcome to PassLok!\r\n\r\nYour Lock is:\r\n\r\n" + Lock + "\r\n\r\nYou want to give this Lock to your friends so they can encrypt messages that only you can decrypt. You will need *their* Locks in order to encrypt messages for them. You can display it any time by clicking myLock with the main box empty.\r\n\r\nEncrypted messages look like the gibberish below this line. Go ahead and decrypt it by clicking the Decrypt button.\r\n\r\n";
        mainBox.insertBefore(welcomeMsg,mainBox.firstChild);
        mainMsg.textContent = "PassLok Privacy";
        updateButtons();
    }
}

//checks that the Key is the same as before, resumes operation. Executed by OK button in key entry dialog
function acceptpwd(){
    var key = pwdBox.value.trim();
    if(key == ''){
        pwdMsg.textContent = 'Please enter your Key';
        return
    }
    if(key.length < 4){
        pwdMsg.textContent = 'This Key is too short!';
        return
    }

    var x = document.getElementById('nameList');
    if (x.options.length == 2){						//only one user, no need to select it
        userName = x.options[1].value
    }else{												//several users
        for (var i = 0; i < x.options.length; i++) {
            if(x.options[i].selected){
                userName = x.options[i].value
            }
          }
    }
    if (userName == '' && fullAccess){
        pwdMsg.textContent = 'Please select a user name, or make a new one';
        return
    }
    if(Object.keys(locDir).length == 0 && localStorage[userName]) locDir = JSON.parse(localStorage[userName]);
    if(firstInit){
        mainMsg.textContent = '';
        var blinker = document.createElement('span'),
            msgText = document.createElement('span');
        blinker.className = "blink";
        blinker.textContent = "LOADING...";
        msgText.textContent = " for best speed, use at least a Medium Key";
        mainMsg.appendChild(blinker);
        mainMsg.appendChild(msgText);
    }
    KeyStr = key;
    key2any();

setTimeout(function(){									//execute after a 30 ms delay so the key entry dialog can go away
    if(locDir['myself']){
        if(!fullAccess){									//OK so far, now check that the Key is good; at the same time populate email and generate stretched Keys
            locDir['myself'][3] = 'guest mode';
            localStorage[userName] = JSON.stringify(locDir);
            mainMsg.textContent = 'You have limited access to functions. For full access, reload and enter the Key'
        }
        if(!checkKey(key)) return;							//check the key and bail out if fail
        getSettings();

        var hash = decodeURI(window.location.hash).slice(1);								//check for data in the URL
        if(hash.length == 43 || hash.length == 50){										//as from a QR code
            var hashStripped = hash
        }else{														//as from an invitation, etc.
            var hashStripped = hash.match('==(.*)==') || [' ',' '];
            hashStripped = hashStripped[1];
            hashStripped = extractLock(hashStripped)
        }

        if (hashStripped.length == 43 || hashStripped.length == 50){			//sender's Lock
            lockBox.textContent = hashStripped;
            addLock(true);

        }else{								//process automatically the other kinds; most will need a Lock to be selected first.
            if(hash) mainBox.textContent = hash;
            var type = hashStripped.charAt(0);
            if(type == 'A' || type == 'k'){						//anonymous or key-encrypted
                unlock(type,hashStripped,'')
            }else if(type == 'l'){
                setTimeout(function(){mainMsg.textContent= "Please select the sender and click Unseal"; updateButtons();},300)
            }else if(hash){
                setTimeout(function(){mainMsg.textContent= "Please select the sender and click Decrypt"; updateButtons();},300)
            }
        }

        if(ChromeSyncOn && chromeSyncMode.checked){
            syncChromeLock('myself',JSON.stringify(locDir['myself']))
        }
    }else{													//if stored settings are not present: ask for email, compute stretched Keys. Store stuff if full access
        if(firstInit) KeyDir = wiseHash(key,userName);

        if(ChromeSyncOn && chromeSyncMode.checked && firstInit){	//the Chrome app gets the settings from sync, asynchronously
            var syncName = userName+'.myself';
            chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
                var lockdata = obj[syncName.toLowerCase()];
                if(lockdata){											//the user isn't totally new: retrieve settings
                    locDir['myself'] = JSON.parse(lockdata);
                    email = keyDecrypt(locDir['myself'][0]);
                    if(email){myEmail = email}else{return}
                    localStorage[userName] = JSON.stringify(locDir);
                    retrieveAllSync();
                    setTimeout(function(){mainMsg.textContent = 'Settings retrieved Chrome sync';}, 500);
                }else{													//user missing in sync: store settings
                    var email = readEmail();
                    locDir['myself'] = [];
                    locDir['myself'][0] = keyEncrypt(email);
                    if(!locDir['myself'][0]) return;
                    localStorage[userName] = JSON.stringify(locDir);
                    syncChromeLock('myself',JSON.stringify(locDir['myself']));
                }
                lockNames = Object.keys(locDir);
                KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;		//make the Edwards curve secret key first
                KeyDH = ed2curve.convertSecretKey(KeySgn);								//and then the Montgomery curve key
            });
        } else {											//no sync, so ask user for email and go on making Keys
            firstInit = false;
            var email = readEmail();
            KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;
            KeyDH = ed2curve.convertSecretKey(KeySgn);
            locDir['myself'] = [];
            locDir['myself'][0] = keyEncrypt(email);
            if(!locDir['myself'][0]) return;
            localStorage[userName] = JSON.stringify(locDir);
        }
        checkboxStore();
    }
    pwdBox.value = '';																		//all done, so empty the box

    if(Object.keys(locDir).length == 1 || Object.keys(locDir).length == 0){		//new user, so display a fuller message
        mainMsg.textContent = 'To encrypt a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the Edit button'
    }
    if (callKey == 'encrypt'){						//now complete whatever was being done when the Key was found missing
        lockBtnAction()
    }else if(callKey == 'decrypt'){
        lockBtnAction()
    }else if(callKey == 'sign'){
        signVerify()
    }else if(callKey == 'addlock'){
        openClose('lockScr');
        openClose('shadow');
        addLock(false)
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
        acceptnewKey()
    } else if(callKey == 'changename'){
        name2any()
    } else if(callKey == 'changeemail'){
        email2any()
    } else if(callKey == 'movemyself'){
        moveMyself()
    }
    focusBox()
},30);
}

var locDir = {},
    lockNames = [],
    myLock,
    myLockStr,
    myezLock,
    firstInit = true;

//sticky settings are stored in array 'myself' on directory; here is a breakdown of what each index contains:
//0: email/token, encrypted by Key; 1: checkbox code, plain; 2: color scheme; 3: full access on or off, plain

//function to initialize locDir and interface for the user
function getSettings(){
    if(userName in localStorage){
        if(Object.keys(locDir).length == 0) locDir = JSON.parse(localStorage[userName]);	//database in Object form. Global variable
        lockNames = Object.keys(locDir);												//array for finding Lock names. Global variable
        if(locDir['myself']){															//initialize permanent settings
            if(!firstInit) return;														//skip the rest if it's not the first time
            if(locDir['myself'][3] == 'guest mode'){
                setTimeout(function(){				//add delay so messages are seen and recrypt doesn't get in the way
                    if(fullAccess){
                        var reply = confirm("Last user did not enter the right Key. Would you like to re-encrypt the local directory?");
                        if(reply){
                            recryptDB(KeyStr,userName);
                            mainMsg.textContent = 'The local directory has been re-encrypted'
                        }else{
                            mainMsg.textContent = 'WARNING: last session was in Guest mode'
                        }
                    }else{
                        mainMsg.textContent = 'Last session was also in Guest mode'
                    }
                }, 500);
                locDir['myself'][3] = 'full access';
                localStorage[userName] = JSON.stringify(locDir);
            }
            code2checkbox();										//set checkboxes

            if(ChromeSyncOn && chromeSyncMode.checked) retrieveAllSync();
        }
    }
    fillList();
    resetList();
    firstInit = false;
    setTimeout(function(){
        mainMsg.textContent = 'PassLok is ready'
    },100)
}

//try decrypting the email/token in 'myself' to see if the Key is the same as the last one used. Then populate email box and generate stretched keys and Lock
var checkingKey = false;

function checkKey(key){
    checkingKey = true;
    KeyDir = wiseHash(key,userName);
    if(fullAccess){
        var myEmailcrypt = locDir['myself'][0];
        var email = keyDecrypt(myEmailcrypt);				//this will fail if the Key is not the last one used, displaying a message
        if(!checkingKey) return false;
        if(email){
            myEmail = email
        }else{
            myEmail = readEmail()
        }
    }else{
        myEmail = readEmail();
    }
    KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,myEmail)).secretKey;
    KeyDH = ed2curve.convertSecretKey(KeySgn);
    if(!myLock){
        myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
        myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');
        myezLock = changeBase(myLockStr, base64, base36, true);
    }
    checkingKey = false;
    return true
}

//display Lock in the lower box of the Main tab.
function showLock(){
    if(showLockBtn.textContent == 'Email'){		//redirect to email if not ready to show Lock
        sendMail();
        return
    }
    callKey = 'showlock';
    if(learnMode.checked){
        var reply = confirm("The Lock matching the Key in this box will be placed in the lower box, replacing its contents. Cancel if this is not what you want.");
        if(!reply) return;
    };

    if(!refreshKey()) return;
    if(!locDir['myself']) locDir['myself'] = [];
    if(!myLock){
        myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
        myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');	//the Lock derives from the signing Key
        myezLock = changeBase(myLockStr, base64, base36, true);
    }

    //done calculating, now display it
    mainBox.textContent = lockDisplay();
    mainMsg.textContent = "The Lock matching your Key is in the box. Send it to people to communicate";
    updateButtons();
    showLockBtn.textContent = 'Email';
    showLockBtnBasic.textContent = 'Email';
    callKey = '';
}

//extracts Lock at the start of an item, from an invitation or PassLok for Email, or data in the URL
function extractLock(string){
    var CGParts = stripTags(removeHTMLtags(string)).replace(/-/g,'').split('//////');				//if PassLok for Email or SeeOnce item, extract ezLock, filter anyway
    if(CGParts[0].length == 50){
        var possibleLock = CGParts[0],
            possibleLock64 = changeBase(possibleLock, base36, base64, true);
        string = string.slice(56)
    }else if(CGParts[0].length == 43){
        var possibleLock = CGParts[0],
            possibleLock64 = possibleLock;
        string = string.slice(49)
    }else{
        var possibleLock = removeHTMLtags(string)
    }

    var wordsStr = possibleLock.match('==') ? possibleLock.split('==')[1].replace(/_/g,' ').trim() : possibleLock.replace(/_/g,' ').trim(),
        words = wordsStr.split(' ');					//for word Locks in URL
    if(words.length == 20){
        possibleLock = changeBase(wordsStr,wordListExp,base64,true);			//convert to base64
        if(!possibleLock) return false
    }

    if(possibleLock.length == 43 || possibleLock.length == 50){
        var index = 0, foundIndex;
        for(var name in locDir){
            if(locDir[name][0] == possibleLock || locDir[name][0] == possibleLock64){
                foundIndex = index
            }
            index++
        }
        if(foundIndex != null){															//found it, so select this user
            lockList.options[foundIndex+1].selected = true;
            fillBox()
        }else{																				//not found, so store after asking for a name
            lockBox.textContent = possibleLock;
            addLock(true)
        }
    }
    return string
}

//just to display the Lock. Gets called above and in one more place
function lockDisplay(){
    if(!myezLock) return;
    if(ezLokMode.checked){
        var mylocktemp = myezLock;
        mylocktemp = mylocktemp.match(/.{1,5}/g).join("-");					//split into groups of five, for easy reading
        mylocktemp = "PL25ezLok==" + mylocktemp + "==PL25ezLok"
    }else if(normalLockMode.checked){
        var mylocktemp = myLockStr;
        mylocktemp = "PL25lok==" + mylocktemp + "==PL25lok"
    }else{
        mylocktemp = "PL25wordLok==" + changeBase(myLockStr,base64,wordListExp,true) + "==PL25wordLok"
    }
    return mylocktemp
}

//stores email if missing
function storemyEmail(){
    if(!locDir['myself']) locDir['myself'] = [];
    locDir['myself'][0] = keyEncrypt(readEmail());
    if(!locDir['myself'][0]) return;
    localStorage[userName] = JSON.stringify(locDir);

    if(ChromeSyncOn && chromeSyncMode.checked){
        syncChromeLock('myself',JSON.stringify(locDir['myself']))
    }
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Key
function wiseHash(pwd,salt){
    var iter = keyStrength(pwd,false),
        secArray = new Uint8Array(32),
        keyBytes;
    if(salt.length == 43) iter = 1;								//random salt: no extra stretching needed
    scrypt(pwd,salt,iter,8,32,0,function(x){keyBytes=x;});
    for(var i=0;i<32;i++){
            secArray[i] = keyBytes[i]
    }
    return secArray
}

//returns milliseconds for 10 scrypt runs at iter=10 so the user can know how long wiseHash will take; called at the end of body script
function hashTime10(){
    var before = Date.now();
    for (var i=0; i<10; i++){
        scrypt('hello','world',10,8,32,0,function(){});
    }
    return Date.now() - before
}

//makes the DH public array and a DH secret key array. Returns a uint8 array
function makePub(sec){
    return nacl.box.keyPair.fromSecretKey(sec).publicKey
}

//Diffie-Hellman combination of a DH public key and a DH secret key array. Returns Uint8Array
function makeShared(pub,sec){
    return nacl.box.before(pub,sec)
}

//makes the DH public key (Montgomery) from a published Lock, which is a Signing public key (Edwards)
function convertPub(Lock){
    return ed2curve.convertPublicKey(Lock)
}

//stretches nonce to 24 bytes. The rest is left undefined
function makeNonce24(nonce){
    var	result = new Uint8Array(24);
    for(i = 0; i < nonce.length; i++){result[i] = nonce[i]}
    return result
}

//encrypt string with a shared Key, returns a uint8 array
function PLencrypt(plainstr,nonce24,sharedKey,isCompressed){
    if(!isCompressed || plainstr.match('="data:')){						//no compression if it includes a file
        var plain = nacl.util.decodeUTF8(plainstr)
    }else{
        var plain = LZString.compressToUint8Array(plainstr)
    }
    return nacl.secretbox(plain,nonce24,sharedKey)
}

//decrypt string (or uint8 array) with a shared Key. Var 'label' is to display messages
function PLdecrypt(cipherStr,nonce24,sharedKey,isCompressed,label){
    if(typeof cipherStr == 'string'){
        var cipher = nacl.util.decodeBase64(cipherStr);
        if(!cipher) return false
    }else{
        var cipher = cipherStr
    }
    var	plain = nacl.secretbox.open(cipher,nonce24,sharedKey);					//decryption instruction
    if(!plain){failedDecrypt(label);return false};

    if(!isCompressed || plain.join().match(",61,34,100,97,116,97,58,")){		//this is '="data:' after encoding
        return nacl.util.encodeUTF8(plain)
    }else{
        return LZString.decompressFromUint8Array(plain)
    }
}

//encrypts a string or uint8 array with the secret Key, 9 byte nonce, padding so length for ASCII input is the same no matter what. The input can also be binary, and then it won't be padded
function keyEncrypt(plainstr){
    if(!refreshKey()) return undefined;																		//make sure the Key is still alive
    var	nonce = nacl.randomBytes(9),
        nonce24 = makeNonce24(nonce);
    if(typeof plainstr == 'string'){
        plainstr = encodeURI(plainstr).replace(/%20/g,' ');
        while (plainstr.length < 43) plainstr = plainstr + ' ';
        var cipher = PLencrypt(plainstr,nonce24,KeyDir,false)
    }else{
        var cipher = nacl.secretbox(plainstr,nonce24,KeyDir)
    }
    return nacl.util.encodeBase64(concatUint8Arrays([144],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'')		//1st character should be k
}

//decrypts a string encrypted with the secret Key, 9 byte nonce. Returns original if not encrypted. If isArray set, return uint8 array
function keyDecrypt(cipherStr,isArray){
    var cipher = nacl.util.decodeBase64(cipherStr.replace(/[^a-zA-Z0-9+\/]+/g,''));
    if(!cipher) return false;
    if (cipher[0] == 144){
        if(!refreshKey()) return undefined;											//make sure the Key is still alive
        var	nonce = cipher.slice(1,10),												//ignore the marker byte
            nonce24 = makeNonce24(nonce),
            cipher2 = cipher.slice(10);
        if(isArray){
            var plain = nacl.secretbox.open(cipher2,nonce24,KeyDir);
            if(!plain) return;
            return plain
        }else{
            var plain = PLdecrypt(cipher2,nonce24,KeyDir,false,'key');
            if(!plain) return;
            return decodeURI(plain.trim())
        }
    }else{
        return cipherStr
    }
}

//this strips initial and final tags, plus spaces and non-base64 characters in the middle
function stripTags(string){
    string = string.replace(/\s/g,'').replace(/==+/,'==');										//remove spaces, reduce multiple = to double
    if(string.match('==')) string = string.split('==')[1].replace(/<(.*?)>/gi,"");
    string = string.replace(/[^a-zA-Z0-9+\/]+/g,''); 											//takes out anything that is not base64
    return string
}

//removes stuff between angle brackets
function removeHTMLtags(string){
    return string.replace(/<(.*?)>/gi, "")
}

//this one escapes dangerous characters, preserving non-breaking spaces
function escapeHTML(str){
    escapeHTML.replacements = { "&": "&amp;", '"': "&quot;", "'": "&#039;", "<": "&lt;", ">": "&gt;" };
    str = str.replace(/&nbsp;/gi,'non-breaking-space')
    str = str.replace(/[&"'<>]/g, function (m){
        return escapeHTML.replacements[m];
    });
    return str.replace(/non-breaking-space/g,'&nbsp;')
}

//remove XSS vectors using DOMPurify
function decryptSanitizer(string){
    return DOMPurify.sanitize(string, {ADD_DATA_URI_TAGS: ['a']})
}

var nameBeingUnlocked = '';

//this function replaces an item with its value on the locDir database, decrypted if necessary, if the name exists
function replaceByItem(name){
    var fullName = '',
        index = searchStringInArrayDB(name,lockNames);
    if (index < 0){									//not on database; strip it if it's a Lock
        var stripped = stripTags(name);
        if(stripped.length == 43 || stripped.length == 50){fullName = stripped}else{fullName = name}
    } else if(name == 'myself'){
        if(myLock) fullName = myLockStr
    } else {									//found name on DB, so get value from the database and decrypt if necessary
        fullName = lockNames[index];
        var string = locDir[fullName][0];
        nameBeingUnlocked = fullName;
        var whole = keyDecrypt(string);
        if(!whole) return undefined;
        nameBeingUnlocked = '';
        var	stripped = stripTags(whole);
        if(stripped.length == 43 || stripped.length == 50) {fullName = stripped} else {fullName = whole}		//if it's a Lock, strip tags
    }
    return fullName
}

//changes the base of a number. inAlpha and outAlpha are strings containing the base code for the original and target bases, as in '0123456789' for decimal. Bases can be string, words separated by spaces, or RegExp
//adapted from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(numberIn, inAlpha, outAlpha, isLock) {
    var isWordsIn = inAlpha instanceof RegExp || inAlpha.match(' '),				//detect whether it's words into string, or the opposite
        isWordsOut = outAlpha instanceof RegExp || outAlpha.match(' ');			//could be RegExp or space-delimited

    //split alphabets into array
    var alphaIn = isWordsIn ? (inAlpha instanceof RegExp ? inAlpha.toString().slice(1,-2).split('|') : inAlpha.trim().split(' ')) : inAlpha.split(''),
        alphaOut = isWordsOut ? (outAlpha instanceof RegExp ? outAlpha.toString().slice(1,-2).split('|') : outAlpha.trim().split(' ')) : outAlpha.split('');

    var targetBase = alphaOut.length,
        originalBase = alphaIn.length;
    var result = [],
        number = isWordsIn ? numberIn.trim().replace(/ +/g,' ').split(' ') : numberIn.split('');

    if(isWordsIn){										//convert words into dictionary variants
        for(var i = 0; i < number.length; i++){
            number[i] = reduceVariants(number[i])
        }
    }

    while (number.length > 0) {
        var remainingToConvert = [], resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = alphaIn.indexOf(number[position]);
            if (idx < 0) {
                if(lockScr.style.display == 'block'){
                    lockMsg.textContent = "Word '" + replaceVariants(number[position]) + "' in word Lock not found in dictionary. Please check"
                }else{
                    mainMsg.textContent = "Word '" + replaceVariants(number[position]) + "' in pasted word Lock not found in dictionary. Please check"
                }
                    return false
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert.push(alphaIn[remainDigit])
            }
        }
        number = remainingToConvert;
        result.push(alphaOut[resultDigit])
    }

    if(isLock){													//add leading zeroes in Locks
        var lockLength = isWordsOut ? 20 : ((targetBase == 36) ? 50 : 43);
        while(result.length < lockLength) result.push(alphaOut[0])
    }
    result.reverse();

    if(isWordsOut){											//convert to regular words
        for(var i = 0; i < result.length; i++){
            result[i] = replaceVariants(result[i])
        }
    }

    return isWordsOut ? result.join(' ') : result.join('')
}

//puts an 43-character random string in the 'emailBox' boxes
function randomToken(){
    var token = nacl.util.encodeBase64(nacl.randomBytes(32)).slice(0,43);
    emailIntro.value = token;
    emailBox.value = token;
}

//takes appropriate UI action if decryption fails
function failedDecrypt(label){
    pwdMsg.style.color = '';
    mainMsg.style.color = '';
    if(checkingKey){
        shadow.style.display = 'block';
        keyScr.style.display = 'block';
        pwdMsg.textContent = "Please write the last Key you used. You can change the Key in Options";
        checkingKey = false
    }else if(lockBox.textContent.trim().slice(0,1) == 'k' || isList || nameBeingUnlocked != '' || label == 'key'){
        any2key();					//this displays the Key entry dialog
        pwdMsg.textContent = "This Key won't decrypt the item " + nameBeingUnlocked;
        allowCancelWfullAccess = true
    }else if(keyChange.style.display == 'block'){
        keyChange.style.display = 'none';
        pwdMsg.textContent = "The Old Key is wrong"
    }else if(label == 'decoy'){
        mainMsg.textContent = 'No hidden message was found'
    }else if(label == 'read-once' && !decoyMode.checked){
        mainMsg.textContent = 'Read-once decrypt has Failed. You may have to reset the exchange with this sender';
    }else if(!decoyMode.checked){
        mainMsg.textContent = 'Decryption has failed'
    }
    return
}
