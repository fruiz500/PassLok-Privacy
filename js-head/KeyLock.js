//detect mobile and store in global Boolean variable. Learn mode detected by setlearnmode() below. Detect Basic mode. Who calls Key.
var isMobile = (typeof window.orientation != 'undefined');
var learnOn = false;
var callKey = '';
var BasicButtons = true;
var fullAccess = true;
var allowCancelWfullAccess = false;

//global variables used for key box expiration
var keytimer = 0;
var keytime = new Date().getTime();

//Regex for searching
var searchExp = new RegExp(wordlist.join("|"),"g");
var searchBlackExp = new RegExp(blacklist.join("|"),"g");

//Alphabets for base conversion. Used in making and reading the ezLok format and some fixes to SJCL
var BASE38 = '0123456789abcdefghijklmnopqrstuvwxyz+/';
var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	var	keymsg = document.getElementById("keymsg"),
		decoymsg = document.getElementById("decoymsg"),
		intromsg = document.getElementById("intromsg"),
		keychangemsg = document.getElementById("keychangemsg");

	var entropy = entropycalc(pwd);

	if(entropy == 0){
		var msg = 'This is a known <span style="color:magenta">bad Key!</span>',
			iter = 4096
	}else if(entropy < 10){
		var msg = '<span style="color:magenta">Terrible!</span>',
			iter = 4096
	}else if(entropy < 20){
		var msg = '<span style="color:red">Weak!</span>',
			iter = 2048
	}else if(entropy < 40){
		var msg = '<span style="color:orange">Medium</span>',
			iter = 1024
	}else if(entropy < 60){
		var msg = '<span style="color:green">Good!</span>',
			iter = 512
	}else if(entropy < 80){
		var msg = '<span style="color:blue">Great!</span>',
			iter = 256
	}else{
		var msg = '<span style="color:cyan">Overkill  !!</span>',
			iter = 2
	}
	if(pwd.trim()==''){
		if(document.getElementById("decoyIn").style.display=="block"){
			msg = 'Enter the Decoy Password below'
		}else{
			msg = 'Enter your Key below'
		}
	}else{
		if (BasicButtons){
			msg = 'Key strength: ' + msg
		}else{
			msg = 'Key entropy: ' + Math.round(entropy*100)/100 + ' bits. ' + msg
		}
	}
if(display){																//these are to display the appropriate messages
	if(document.getElementById("keyscr").style.display=="block") keymsg.innerHTML = msg;
	if(document.getElementById("decoyIn").style.display=="block") decoymsg.innerHTML = msg;
	if(document.getElementById("introscr3").style.display=="block") intromsg.innerHTML = msg;
	if(document.getElementById("keyChange").style.display=="block") keychangemsg.innerHTML = msg;
}
	return iter
};

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
	var wordsFound = pwd.match(searchBlackExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(searchExp);									//array containing words found on the regular wordlist
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
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordlist.length + blacklist.length))/Math.LN2
	}else{
		return (foundLength*Math.log(wordlist.length + blacklist.length))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//add entropy as forms are manipulated, optionally reset key box after 5 minutes
function ce() {
	sjcl.random.addEntropy(Math.floor((((new Date).getMilliseconds()) * 255) / 999), 2, "loadtime");
	//code below is an additional method to delete the Key box after 5 minutes. Not used at the moment
//	if ((new Date().getTime()) - keytime > 300000 && !document.getElementById('never').checked) {
//		document.getElementById('pwd').value = '';
//	}
};

//reads Key box and stops if there's something wrong. If the timer has run out, the Key is deleted
function readKey(){
	clearTimeout(keytimer);
	var period = 300000;

//start timer to erase Key
	if(!document.getElementById('never').checked){
		keytimer = setTimeout(function() {document.getElementById('pwd').value = ''}, period);
	}
	
//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period) && !document.getElementById('never').checked) document.getElementById('pwd').value ='';
    keytime = new Date().getTime();

	var key = document.getElementById('pwd').value.trim();
	if (key == ""){
		any2key();
		if(callKey == 'initkey'){
			document.getElementById("keymsg").innerHTML = '<span style="color:green"><strong>Welcome to PassLok Privacy</strong></span><br />Please enter your secret Key';
		}else{
			document.getElementById("keymsg").innerHTML = 'Please enter your secret Key';
			document.getElementById('shadow').style.display = 'block'
		}
		throw ('secret Key needed')
	}	
	return key
}

//reads email from its box. This is appended to the Key for public-key functions
function readEmail(){
	var email = document.getElementById('email').value;
	if (email == ""){
		any2email();
		throw ('email needed')
	};
	return email.trim()
}

var userName = '';
//checks that the Key is the same as before, resumes operation
function acceptKey(){
	var key = document.getElementById('pwd').value.trim();
	var keymsg = document.getElementById('keymsg');
	if(key == ''){
		keymsg.innerHTML = 'Please enter your Key';
		throw("no Key")
	}
	if(key.length < 4){
		keymsg.innerHTML = '<span style="color:red">This Key is too short</span>';
		throw("short Key")
	}
	if(striptags(key).length == 87 || striptags(key).length == 100){
		keymsg.innerHTML = '<span style="color:red">This is a Lock. Enter your Key here</span>';
		throw("lock instead of Key")
	}
	
	var x = document.getElementById("namelist");
	if (x.options.length == 2){						//only one user, no need to select it
		userName = x.options[1].value
	}else{												//several users
		for (var i = 0; i < x.options.length; i++) {
    		if(x.options[i].selected == true){
				userName = x.options[i].value
    		}
  		}
	}
	if (userName == ''){
		keymsg.innerHTML = 'Please select a user name, or make a new one';
		throw("no userName")
	}
	if(Object.keys(lockDB).length == 0) lockDB = JSON.parse(localStorage[userName]);
	if(lockDB['myself']){
		if(fullAccess){
			checkKey(key)
		}else{
			lockDB['myself'][7] = 'limited access';
			localStorage[userName] = JSON.stringify(lockDB);
			document.getElementById('mainmsg').innerHTML = 'You have limited access to functions<br>For full access, reload and enter the Key'
		}
	}
	initUser();
	fillList();																	//put names in selection box
	key2any();
	if(Object.keys(lockDB).length == 1 || Object.keys(lockDB).length == 0){		//new user, so display a fuller message
		document.getElementById('mainmsg').innerHTML = 'To lock a message for someone, you must first enter the recipient’s Lock or shared Key by clicking the <strong>Edit</strong> button'
	}
}

var lockDB = {};
var lockNames = [];
var myLock = '';
var myezLock = '';
var firstInit = true;
//settings are stored in array 'myself' on directory; here is a breakdown of what each index contains:
//0: user's Lock, encrypted by Key; 1: shared Key resulting from combining the user's Key and Lock, encrypted by Key;
//2: email/token, encrypted by Key; 3: basic or advanced interface flag, plain; 4: ezLok on or off, plain;
//5: encrypted Locks on or off, plain; 6: small output on or off, plain; 7: full access on or off, plain

//function to initialize lockDB and interface for the user
function initUser(){
	if(userName in localStorage){
		if(Object.keys(lockDB).length == 0) lockDB = JSON.parse(localStorage[userName]);	//database in Object form. Global variable
		lockNames = Object.keys(lockDB);												//array for finding lock names. Global variable	
		if(lockDB['myself']){															//initialize permanent settings
			if(fullAccess){
			myLock = keyDecrypt(lockDB['myself'][0]);
			myezLock = changeBase(myLock, BASE64, BASE38, true);
			}
			if(!firstInit) return;														//skip the rest if it's not the first time
			BasicButtons = (lockDB['myself'][3] != 'advanced');
			if(!BasicButtons){															//retrieve last interface
				openClose("basicbuttonsbot");
				openClose("basicbuttonstop");
				openClose("mainbuttonsbot");
				openClose("mainbuttonstop");
				openClose("basiclockbuttonstop");
				openClose("advlockmodes");
				openClose("lockbuttonstop");
				openClose("lockbuttonsbot");
				openClose('advancedModes');
				openClose('advancedHelp');
				document.getElementById('basicmode').checked = false;
				document.getElementById('advancedmode').checked = true;
				lockDB['myself'][3] = 'advanced';
			} else {
				lockDB['myself'][3] = 'basic'
			}
			if(lockDB['myself'][4] == 'ezLok off'){
				document.getElementById('ezLok').checked = false
			} else {
				document.getElementById('ezLok').checked = true
			}
			if(lockDB['myself'][5] == 'encrypt Locks'){
				document.getElementById('encryptLocks').checked = true
			} else {
				document.getElementById('encryptLocks').checked = false
			}
			if(lockDB['myself'][6] == 'small Output'){
				document.getElementById('smallOut').checked = true
			} else {
				document.getElementById('smallOut').checked = false
			}
			if(lockDB['myself'][7] == 'limited access'){
				setTimeout(function(){document.getElementById("mainmsg").innerHTML = '<span style="color:red"><strong>Warning: last session was limited</strong></span>';}, 500);		//add delay so this is seen			
				lockDB['myself'][7] = 'full access';
				localStorage[userName] = JSON.stringify(lockDB);
			}
			if(ChromeSyncOn) retrieveAllSync();
						
//if not settings are found, attempt to retrieve them from Chrome sync
		}else{
			if(!firstInit) return;
			if(ChromeSyncOn){
				var syncName = userName+'.myself';
    			chrome.storage.sync.get(syncName.toLowerCase(), function (obj) {
					var lockdata = obj[syncName.toLowerCase()];
					if(lockdata){
						lockDB['myself'] = JSON.parse(lockdata);
						setTimeout(function(){document.getElementById("mainmsg").innerHTML = 'Settings retrieved from your Chrome sync area';}, 0);
						localStorage[userName] = JSON.stringify(lockDB);
						lockNames = Object.keys(lockDB);
						document.getElementById('email').value = keyDecrypt(lockDB['myself'][2]);
						retrieveAllSync();
					}
				});
			}
		}
	}
	firstInit = false
}

//try decrypting the email/token in 'myself' to see if the Key is the same as the last one used
var checkingKey = false;
function checkKey(key){
	checkingKey = true;
	var myEmailcrypt = lockDB['myself'][2];
	document.getElementById('email').value = keyDecrypt(myEmailcrypt);
	checkingKey = false;
	return
}

//display Lock in the lower box of the Main tab.
function showLock(){
	callKey = 'showlock';
	var mainmsg = document.getElementById("mainmsg");				//for displaying messages above key box
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("The Lock matching the Key in this box will be placed in the lower box, replacing its contents. Cancel if this is not what you want.");
		if(reply===false) return;
	};
	var mykey = readKey();
	var myemail = readEmail();
	if(lockDB['myself'] && fullAccess){
		var mylocktemp = keyDecrypt(replaceByItem(lockDB['myself'][0],false))
	}else{
		var mylocktemp = makepub(mykey,myemail);						//append email to make Lock, to combat rainbow table attack
		if(fullAccess) storemyself(mykey,mylocktemp);
	}
	myLock = mylocktemp;												//refresh global variables
	myezLock = changeBase(myLock, BASE64, BASE38, true);
	if(document.getElementById('ezLok').checked){
		mylocktemp = changeBase(mylocktemp, BASE64, BASE38, true).replace(/l/g,'L');		//change smallcase l into capital
		var checksum = calcRScode(mylocktemp);
		mylocktemp = mylocktemp.match(/.{1,5}/g).join("_");					//split into groups of five, for easy reading
		checksum = checksum.match(/.{1,5}/g).join("_");
		if (document.getElementById("notags").checked == false) mylocktemp = "PL21ezLok=" + mylocktemp + "=" + checksum + "=PL21ezLok";
	}else{
		if (document.getElementById("notags").checked == false) mylocktemp = "PL21lok=" + mylocktemp + "=" + calcRScode(mylocktemp) + "=PL21lok"
	}
	document.getElementById('mainBox').innerHTML = triple(mylocktemp);
	mainmsg.innerHTML = "The Lock matching your Key is in the box.";
	callKey = '';
};

//stores new Lock into local directory, also email as well
function storemyself(mykey,mylock){
	var mylockcrypt = keyEncrypt(mykey,mylock),
		newEntry = JSON.parse('{"myself":["' + mylockcrypt + '"]}');
	lockDB = sortObject(mergeObjects(lockDB,newEntry));
	localStorage[userName] = JSON.stringify(lockDB);
	if(fullAccess) storeEmail();
	lockNames = Object.keys(lockDB);
	fillList();
	if(document.getElementById('advancedmode').checked){				//reset to basic mode
		basic2main();
	}
}
	
//makes the public string of a private string
function makepub(secstr,salt){
	var curve = sjcl.ecc.curves["c521"],						//make curve object
		sec = toexponent(secstr,salt),							//retrieve Key, correctly formatted as an EC exponent
	    pub = curve.G.mult(sec),								//make public key or Lock
		pubstr = sjcl.codec.base64.fromBits(pub.toBits()),
		parity = pub.y.mod(2).limbs[0];							//if parity = 1, y is the odd root of the equation, not the even one
	pubstr =  pubstr.slice(1,88);									//strip initial "A", only x part
	if(parity == 1) pubstr = BASE64.charAt(BASE64.indexOf(pubstr.charAt(0)) + 32) + pubstr.slice(1);		//shift up the first character of the Lock if the y component is odd
	return pubstr
};

//global variables needed by SCRYPT functions
var B, X, SIZE_MAX = Math.pow(2, 32) - 1;

//key reformatting and stretching for secret Key (shared key is formatted automatically by sjcl) for 521 bit keys
function toexponent(string,salt){
	var iter = keyStrength(string,false);						//get number of iterations from Key strength meter, Key only
	return sjcl.bn.fromBits(sjcl.misc.scrypt(string,salt,iter,8,1,66))	//iteration number variable according to Key strength, 528 bits
};

//this one makes the shared secret, output as a 528-bit bitarray, which is the x coordinate of the product of sec and point, defined by its x coordinate
function makeshared(secstr,xstr,salt){
	var	sec = toexponent(secstr,salt),
		pub = pointFromX(xstr);
	try{									//in case the Lock is invalid
		return pub.mult(sec).x.toBits()
	}catch(err){document.getElementById("mainmsg").innerHTML = 'Invalid Lock'};
};

//the following to retrieve a point from x coordinate
function pointFromX(xstr){
	var curve = sjcl.ecc.curves["c521"],
		index = BASE64.indexOf(xstr[0]),
		oddRoot = false;
	if(index > 31){						//2nd root for y
		oddRoot = true;
		xstr = BASE64.charAt(index - 32) + xstr.slice(1)
	}
	var p = curve.field.modulus.copy(),
		x = sjcl.bn.fromBits(sjcl.codec.base64.toBits('A'+xstr)),
		y = curve.b.add(x.mul(curve.a.add(x.square())));		//this is actually y^2, square root by special case of Tonelli-Shanks follows
	for (var i=0; i<519; i++) {y = y.square()};	  			//performs y^((p+1)/4), since p = 2^521 - 1, (p+1)/4=2^519, all is mod p
	y = y.mod(p);
	var parity = y.mod(2).limbs[0];
	if(oddRoot && parity == 1 || !oddRoot && parity == 0){		//all's well, no change
		return new sjcl.ecc.point(curve,x,y);
	}else{														//get the other root
		var y2 = p.sub(y);
		return new sjcl.ecc.point(curve,x,y2);
	}
};

//this strips initial and final tags, plus spaces and non-base64 characters in the middle
function striptags(string){
	string = string.replace(/\s/g,'');															//remove spaces
	string = string.split("=").sort(function (a, b) { return b.length - a.length; })[0];		//remove tags
	string = string.replace(/[^a-zA-Z0-9+/ ]+/g, ''); 											//takes out anything that is not base64
	return string
}

nameBeingUnlocked = '';
//this function replaces an item with its value on the lockDB database, decrypted if necessary, if the name exists, otherwise if gives a warning that it isn't a Lock
function replaceByItem(name,warning){
	var warningList = "";
	if(lockDB[name] == null) {					//not on database; see if it's a Lock, and otherwise add to warning list
		var namestr = striptags(name);
		if(namestr.length != 87 && namestr.length != 100){
			warningList = name
		}
	} else if(name == 'myself'){
		if(myLock != ''){
			name = myLock
		}else{
			
		}
	} else {									//found name on DB, so get value from the database and decrypt if necessary
		var string = lockDB[name][0];
		nameBeingUnlocked = name;
		var whole = keyDecrypt(string);
		nameBeingUnlocked = '';
		var	stripped = striptags(whole);
		if(stripped.length == 87 || stripped.length == 100) {name = stripped} else {name = whole};	//if it's a Lock, strip the tags
	}

	if (warningList != '' && warning){
		var agree = confirm('The following name was not found in your local directory. If you click OK, this string will be used as a shared Key for locking and unlocking the message. This could be a serious security hazard:\n\n' + warningList);
		if (!agree) throw('list encryption terminated by user')
	}
	return name
}

//changes the base of a number. inAlpha and outAlpha are strings containing the base code for the original and target bases, as in '0123456789' for decimal
//adapted from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha, isLock) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }

	//add leading zeroes in Locks
	if(isLock){
		if(targetBase == 64){
			while(result.length < 87) result = 'A'+ result;
		} else if (targetBase == 38){
			while(result.length < 100) result = '0'+ result;
		}
	}
    return result;
}

//puts an 86-character randome string in the "email" boxes
function randomToken(){
	var token = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,86);
	document.getElementById('emailIntro').value = token;
	document.getElementById('email').value = token;
}

//takes appropriate UI action if decryption fails
function failedDecrypt(){
	if(document.getElementById("lockBox").value.slice(0,1) == '~' || isList || nameBeingUnlocked != ''){				
		any2key();					//this displays the Key entry dialog
		document.getElementById("keymsg").innerHTML = "<span style='color:red'>This Key won't unlock the item </span>" + nameBeingUnlocked;
		allowCancelWfullAccess = true;
	}else if(document.getElementById('keyChange').style.display == 'block'){
		document.getElementById('keyChange').style.display = 'none';
		document.getElementById("keymsg").innerHTML = "<span style='color:red'>The Old Key is wrong</span>"
	}else if (checkingKey){
		document.getElementById('shadow').style.display = 'block';
		document.getElementById('keyscr').style.display = 'block';
		document.getElementById('keymsg').innerHTML = "<span style='color:red'>Please write the last Key you used</span><br>You can change the Key in Options";
		checkingKey = false;
	}else{
		document.getElementById("mainmsg").innerHTML = '<span>Unlock has Failed</span>';
	}
	throw('AES decryption failed')
}