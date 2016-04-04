//detect if Lock pasted in Lock box
function pasteLock(){
	lockMsg.innerHTML = '';
	var text = lockBox.value;
	var	strings = text.split(/\r?\n/);
	var lastline = strings[strings.length-1];
	if (lastline.slice(0,4) != 'http'){
		var lock = lastline;
	}else{
		var lock = strings[strings.length-2]									//in case there is a video URL as last line
	}
	var lockstripped = lock.replace(/[\s-]/g,'').split("==").sort(function (a, b) { return b.length - a.length; })[0];

	suspendFindLock = true;															//allow writing a name without searching
	if (lockstripped.length == 43 || lockstripped.length == 50) lockMsg.innerHTML = 'Lock detected';
}

//get name and Lock from form and merge them with the locDir object, then store
function addLock(){
	if(!fullAccess){
		lockMsg.innerHTML = 'Save not available in Guest mode<br>Please restart PassLok';
		throw('Lock save canceled')
	}
	if (learnMode.checked){
		var reply = confirm("The item in the box will be added to the permanent directory. Cancel if this is not what you want.");
		if(!reply) throw("locDir add canceled");
	}
	callKey = 'addlock';
	var name = lockNameBox.value.trim(),
		lock = lockBox.value.trim();
	if (XSSfilter(name)!=name){
		lockMsg.innerHTML = 'This is not a valid name';
		throw('name contained XSS-illegal characters')
	}
	var lockarray = lock.split('\n');
	var isList = (lockarray.length > 1 && lockarray[1].slice(0,4) != 'http' && lock.length <= 500);			//identify List
	if (lock ==''){
		if(!locDir['myself'] || BasicButtons) return;									//don't do it in Basic mode
		var ran = true;
		lock = nacl.util.encodeBase64(nacl.randomBytes(31)).replace(/=+$/,'');			//a little shorter so it's distinct
		lockBox.value = lock;
	}
	if (name !=''){
		var locklength = striptags(lockarray[0]).length;
		if((locklength == 43 || locklength == 50) && lockarray.length == 1){
			if(locklength == 50) lock = lock.replace(/L/g,'l');					//de-capitalize L, if ezLock
			var lockcrypt = lock;													//store Locks unencrypted, everything else encrypted by the Key
		}else{
			if (lock.length > 500) lock = LZString.compressToBase64(lock).replace(/=/g,'');			//cover texts are compressed
//			var key = refreshKey(),
			var	lockcrypt = keyEncrypt(lock);
		}
		if(isList) name = '--' + name + '--';										//dashes bracket name for Lists
			var newEntry = JSON.parse('{"' + name + '":["' + lockcrypt + '"]}');
			locDir = sortObject(mergeObjects(locDir,newEntry));
			localStorage[userName] = JSON.stringify(locDir);
			lockNames = Object.keys(locDir);
			window.setTimeout(function(){											//this needs to be on a timer for iOS
				if (ran) {
					lockMsg.innerHTML = '<span style="color:cyan">Random Key stored to local directory with name </span>' + name
				} else if(striptags(lock).length == 43 || striptags(lock).length == 50){
					lockMsg.innerHTML = '<span style="color:cyan">Lock saved to local directory with name </span>' + name
				} else if(isList){
					lockMsg.innerHTML = '<span style="color:cyan">List saved to local directory with name </span>' + name
				} else {
					lockMsg.innerHTML = '<span style="color:cyan">Item saved to local directory with name </span>' + name
				};
			}, 100);
			fillList();

			if(ChromeSyncOn && chromeSyncMode.checked){													//if Chrome sync is available, add to sync storage
				syncChromeLock(name,JSON.stringify(locDir[name]))
			}

	} else {
		lockMsg.innerHTML = '<span style="color:orange">Cannot save without a name</span>'
	};
	suspendFindLock = false;
	callKey = ''
}

//delete a particular key in Object locDir, then store
function removeLock(){
	if(!fullAccess){
		lockMsg.innerHTML = 'Delete not available in Guest mode<br>Please restart PassLok';
		throw('Lock removal canceled')
	}
	var reply = confirm("The item displayed in the box will be removed from the permanent directory. This is irreversible. Cancel if this is not what you want.");
	if(!reply) throw("locDir remove canceled");
	var name = lockMsg.innerHTML;
	if (locDir[name] == null){
		lockMsg.innerHTML = 'To remove an item, its name must be displayed <strong>here</strong>';
		throw('bad name')
	}
	if (name == 'myself'){
		lockMsg.innerHTML = 'There is a button to reset your options in the Options tab';
		throw('no delete for myself')
	}
	delete locDir[name];
	localStorage[userName] = JSON.stringify(locDir);
	lockNames = Object.keys(locDir);
	window.setTimeout(function(){										//this needs to be on a timer for iOS
		lockMsg.innerHTML = XSSfilter(name) + ' deleted';
	}, 100);
	fillList();

		if(ChromeSyncOn && chromeSyncMode.checked){						//if Chrome sync is available, remove from sync storage
			if(confirm('Item removed from local storage. Do you want to remove it also from Chrome sync?')) remChromeLock(name)
		}

	suspendFindLock = false;
}

//this is to just delete the Read-once data for a particular key (or reset the current list)
function resetPFS(){
	if(!fullAccess){
		lockMsg.innerHTML = 'Reset not available in Guest mode<br>Please restart PassLok';
		throw('Lock reset canceled')
	}
	if (lockBox.value.trim().split('\n').length > 1){		//use button to reset current List if a List is displayed, nothing to do with normal use
		if (learnMode.checked){
			var reply = confirm("The list currently being formed will be reset. Cancel if this is not what you want.");
			if(!reply) throw("List reset canceled");
		}
		currentList = '';
		lockMsg.innerHTML = 'Current list reset';
		return
	}

//now the real stuff
	var reply = confirm("The data needed to maintain a Read-once conversation with this person will be deleted. This is irreversible. Cancel if this is not what you want.");
	if(!reply) throw("reset canceled");

	var name = lockMsg.innerHTML;
	if (locDir[name] == null){
		lockMsg.innerHTML = 'The item to be reset must be displayed first';
		throw('bad name')
	}
	if (name == 'myself'){
		lockMsg.innerHTML = 'There is a button to reset your options in the Options tab';
		throw('no reset for myself')
	}
	if ((locDir[name][1] == null) && (locDir[name][2] == null)){
		lockMsg.innerHTML = 'Nothing to reset';
		throw('no Read-once data')
	}
	locDir[name][1] = locDir[name][2] = null;
	locDir[name][3] = 'reset';
	localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){							//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

	lockMsg.innerHTML = 'Read-once data for ' + XSSfilter(name) + " deleted. The next message to this user won't have forward secrecy.";
	suspendFindLock = false
}

var suspendFindLock = false							//when true, user can input a name without deleting the Lock box

//searches for name in Locks database and returns the Lock, displays full name as well. Invoked as the user types
function findLock(){
	lockMsg.innerHTML = '';
	var string = lockNameBox.value;
	var stringstrip = striptags(string);
	if(stringstrip.length == 43 || stringstrip.length == 50){									//it's a Lock in the wrong box. Move it
		lockBox.value = string;
		lockNameBox.value = '';
		lockMsg.innerHTML = 'Locks and shared Keys go in the lower box<br>You can write a name on the top box in order to save it';
		suspendFindLock = true;
		return
	}
	var index = searchStringInArrayDB(string,lockNames);
	if (index >= 0){
		var name = lockNames[index];
		lockMsg.innerHTML = XSSfilter(name);
		lockBox.value = locDir[name][0]
	}else{
		lockMsg.innerHTML = '';
		lockBox.value = ''
	}
}

//decrypts the contents of the Locks Box
function decryptLock(){
	callKey = 'decryptlock';
	var firstchar = lockBox.value.slice(0,1);
	if(firstchar == '~') {
		nameBeingUnlocked = lockMsg.innerHTML;
		decryptItem();
		nameBeingUnlocked = '';
	}
	if(lockBox.value != ''){
		var listArray = lockBox.value.split('\n');
		if(lockBox.value.length > 500){
			lockBox.value = LZString.decompressFromBase64(lockBox.value);
			newcover(lockBox.value);							//this for loading cover text from Lock screen
			lockMsg.innerHTML = 'New Cover text extracted and ready to use'
		} else if(listArray.length > 1 && listArray[1].slice(0,4) != 'http'){
			lockMsg.innerHTML = 'List extracted'
		} else if(striptags(lockBox.value).length == 43 || striptags(lockBox.value).length == 50){
			lockMsg.innerHTML = 'Lock extracted'
		} else if(lockBox.value.length == 42){
			lockMsg.innerHTML = 'Random Key extracted'
		} else if(lockMsg.innerHTML == 'myself'){
			lockMsg.innerHTML = 'Email/token extracted'
		} else {
			lockMsg.innerHTML = 'Shared Key extracted'
		}
	}
	if(lockScr.style.display == 'none') main2lock();
	callKey = ''
}

//if a newline is entered, puts the expanded contents of the name box in the Lock box, and waits for another item
var currentList = '';

function addToList(){
	if (learnMode.checked){
		var reply = confirm("The item displayed will be added to the current list. Cancel if this is not what you want.");
		if(!reply) throw("add to list canceled");
	}
	var	currentItem = lockBox.value;
	if(lockMsg.innerHTML != ''){
		var namenumber = currentItem.split('\n').length;

//if the item is itself a list or there is no name, add the contents rather than the displayed name
		if (namenumber > 1 || lockNameBox.value==''){
			if(currentList == ''){
				currentList = currentItem
			}else{
				currentList = currentList + '\n' + currentItem
			}
			lockMsg.innerHTML = namenumber + ' items added to the current list'
		} else {
			if(currentList == ''){
				currentList = lockMsg.innerHTML
			}else{
				currentList = currentList + '\n' + lockMsg.innerHTML
			}
			lockMsg.innerHTML = XSSfilter(lockMsg.innerHTML) + ' added to the current list'
		}
	} else {
		if (currentList !=''){
			lockMsg.innerHTML = 'This is the (temporary) current list'
		} else {
			lockMsg.innerHTML = 'No items on the current list'
		}
	}
	var listArray = currentList.replace(/\n+/g,'\n').split('\n');
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates
	currentList = listArray.join('\n');
	lockBox.value = currentList.trim();
	currentList = lockBox.value;
	suspendFindLock = false
}

//automatically decrypts an item stored encrypted in the locDir database. It uses the permanent Key
function decryptItem(){
	if(callKey != 'decryptlock') callKey = 'decryptitem';
//	var	key = refreshKey(),
	refreshKey();
	var	string = lockBox.value.trim();
	if(string == "") throw('nothing to decrypt');
	lockBox.value = keyDecrypt(string);
	if(callKey != 'decryptlock') callKey = '';
}

//add a few spaces and newlines, then remove brackets, etc., extra spaces, put in alphabetical order
function showLockDB(){
	if (learnMode.checked){
		var reply = confirm("The complete directory of Locks, shared Keys, etc. stored under the current user name will be displayed. Cancel if this is not what you want.");
		if(!reply) throw("locDir show canceled");
	}
	if(localStorage[userName] != "{}"){
		lockBox.value = JSON.stringify(locDir,null,4).replace(/[{}"\[\]]/g,'').replace(/\n    /g,'\n').replace(/ \n/g,'\n').replace(/,\n/g,'\n').trim();
		lockMsg.innerHTML = 'These are the items stored under the current user name';
	}else{
		lockMsg.innerHTML = '<span style="color:orange">There are no stored items</span>';
	}
	suspendFindLock = false
}

//as above, but just the 'myself' entry
function showMyself(){
	if(locDir['myself']){
		var alphalocDir = locDir['myself'];
		mainBox.innerHTML = 'myself:\n' + JSON.stringify(alphalocDir,null,4).replace(/[{}"\[\]]/g,'').replace(/\n    /g,'\n').replace(/ \n/g,'\n').replace(/,\n/g,'\n').trim();
		mainMsg.innerHTML = 'These are your stored settings';
	}else{
		mainMsg.innerHTML = '<span style="color:orange">No settings to store</span>';
	}
	suspendFindLock = false
}

//reconstruct the original JSON string from the newlines and spaces as displayed by showLockDB
function mergeLockDB(){
	callKey = 'mergedb';
	var	lockstr = lockBox.value.trim(),		//see if these are Locks for a possible DH merge, which is not the main function of this button
		mainstr = XSSfilter(mainBox.innerHTML.trim().replace(/\&nbsp;/g,''));
	if (lockstr == ''){
		lockMsg.innerHTML = 'Nothing to merge';
		throw('invalid merge')
	}
	if (lockstr.slice(0,1) == '~') {
//		var key = refreshKey();
		lockstr = keyDecrypt(lockstr)
	}
	var lockstr2 = striptags(lockstr),
		mainstr2 = striptags(mainstr),
		locklen = lockstr2.length,
		mainlen = mainstr2.length;

	if(lockstr.split('\n').length > 1){			//the real database merge implies multiline

		if (learnMode.checked){
			var reply = confirm("The items in the box will be merged into the permanent directory, replacing existing items of the same name. This is irreversible. Cancel if this is not what you want.");
			if(!reply) throw("locDir merge canceled");
		}
		if(!fullAccess){
			if(lockScr.style.display == 'block'){
				lockMsg.innerHTML = 'Merge not available in Guest mode<br>Please restart PassLok';
			}else{
				mainMsg.innerHTML = 'Settings update not available in Guest mode<br>Please restart PassLok';
			}
			throw('DB merge canceled')
		}
		var newDB = JSON.parse('{"' + lockBox.value.trim().replace(/\n +/g,'\n').replace(/:\n/g,'":["').replace(/\n\n/g,'"],"').replace(/\n/g,'","') + '"]}');
		newDB = realNulls(newDB);
		locDir = sortObject(mergeObjects(locDir,newDB));
		localStorage[userName] = JSON.stringify(locDir);
		lockNames = Object.keys(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){
			for(var name in locDir){								//if Chrome sync is available, put all this in sync storage
				syncChromeLock(name,JSON.stringify(locDir[name]))
			}
		}

		var email = keyDecrypt(locDir['myself'][0]);				//populate email and recalculate Keys and Locks
		if(email) myEmail = email;
//		var key = refreshKey();
//		KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,email)).secretKey;
		refreshKey();
		KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(KeyStr,email)).secretKey;
		KeyDH = ed2curve.convertSecretKey(KeySgn);
		myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
		myezLock = changeBase(myLock, BASE64, BASE36, true);

		fillList();
		var reply = prompt("The items have been merged into the local directory. It might be a good idea to change the user name at this point. To do so, enter the new user name and click OK. Otherwise Cancel.");
		if(reply){
			userNameBox.value = reply;
			changeName()
		}

	} else if(locklen != 43 || (mainlen != 43 && mainlen != 50)){	//merging of a DH Key in the directory box and a DH Lock in main

		lockMsg.innerHTML = '<span style="color:orange">The items to be merged must be 256-bit and in base64 (or base36 for Locks)<span>';
		throw('invalid DH merge')
	}else{
		if (learnMode.checked){
			var reply = confirm("The Key in the directory box will be combined with the Lock in the main box, and the resulting Lock will replace both. Cancel if this is not what you want.");
			if(!reply) throw("merge canceled");
		};
		if (mainlen == 50) mainstr2 = changeBase(mainstr2.toLowerCase(), BASE36, BASE64, true);
		var merged = nacl.util.encodeBase64(makeShared(mainstr2,nacl.util.decodeBase64(lockstr2))).replace(/=+$/,'');
		mainBox.innerHTML = merged;
		lockBox.value = merged;
		lockMsg.innerHTML = 'Key merged with Lock in main box';
		return
	}
	suspendFindLock = false;
	callKey = ''
}

//convert literal "null" entries to real nulls
function realNulls(object){
	for(var name in object){
		for(var i = 0; i < object[name].length; i++){
			if(object[name][i] == "null") object[name][i] = null
		}
	}
	return object
}

//makes encrypted backup of the whole DB, then if allowed clears locDir object, then stores
function moveLockDB(){
	if(!fullAccess){
		optionMsg.innerHTML = 'Move not allowed in Guest mode<br>Please restart PassLok';
		throw('DB move canceled')
	}
	callKey = 'movedb';
//	var key = refreshKey();
	refreshKey();

	//first encrypt locDir, as displayed by showLockDB
	showLockDB();
	var datacrypt = keyEncrypt(lockBox.value.trim());
	mainBox.innerHTML = 'PL23dir==' + datacrypt + '==PL23dir';
	optionMsg.innerHTML = '<span style="color:cyan">Database in Main tab</span>';
	mainMsg.innerHTML = 'The item in the box contains your directory<br>To restore it, click Decrypt';

	//now check that the user really wants to delete the database
	var reply = confirm("Your local directory has been exported to the Main tab. If you click OK, it will now be erased from this device. This cannot be undone.");
	if (!reply) throw("locDir erase canceled");

	if(ChromeSyncOn && chromeSyncMode.checked){								//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to delete also from Chrome sync?')){
			for(var name in locDir) remChromeLock(name);
			chrome.storage.sync.remove(userName.toLowerCase() + '.ChromeSyncList')
		}
	}

	locDir = {};
	delete localStorage[userName];
	lockNames = [];
	optionMsg.innerHTML = '<span style="color:purple">Stored items erased</span>';
	fillList();
	suspendFindLock = false;
	callKey = '';
}

//makes encrypted backup of the 'myself' entry only, then if allowed clears it, then stores
function moveMyself(){
	callKey = 'movemyself';

	//first encrypt myself data, as displayed by showLockDB
	showMyself();
	if(fullAccess){
//		var key = refreshKey();
		var datacrypt = keyEncrypt(mainBox.innerHTML.trim());
		mainBox.innerHTML = 'PL23bak==' + datacrypt+ '==PL23bak';
		var msg = 'The item in the box contains your settings<br>To restore them, click Decrypt';
	}else{
		var msg = 'These are your settings, possibly including your encrypted random token<br>You may want to save them in a safe place.'
	}
	optionMsg.innerHTML = '<span style="color:cyan">Backed-up settings on Main tab</span>';
	mainMsg.innerHTML = msg;

	//now check that the user really wants to delete the database
	var reply = confirm("Your settings, including the email/token, have been backed up. If you click OK, they will now be erased from this device. This cannot be undone.");
	if (!reply) throw("myself erase canceled");
	delete locDir['myself'];
	localStorage[userName] = JSON.stringify(locDir);
	lockNames = Object.keys(locDir);
	fillList();
	mainMsg.innerHTML = 'Your settings, including the email/token, have been erased<br>' + msg;
	optionMsg.innerHTML = 'Settings erased';

	if(ChromeSyncOn && chromeSyncMode.checked){								//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to remove your settings also from Chrome sync?')) remChromeLock('myself')
	}

	suspendFindLock = false;
	callKey = '';
}

//merges two objects; doesn't sort the keys
function mergeObjects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

//sorts object keys alphabetically
function sortObject(o) {
    var sorted = {},
    	key, a = [];
    for (key in o) {
    	if (o.hasOwnProperty(key)) {
    		a.push(key);
    	}
    }
    a.sort(insensitive);							//this depends on next function
    for (key = 0; key < a.length; key++) {
    	sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

//to make sorting case-insensitive
function insensitive(s1, s2) {
  var s1lower = s1.toLowerCase();
  var s2lower = s2.toLowerCase();
  return s1lower > s2lower? 1 : (s1lower < s2lower? -1 : 0);
}

//finds first partial match of string str and returns index of array element
function searchStringInArrayDB (str, strArray) {
	if (str != ''){
		var reg = new RegExp(str, "i");					//make it case-insensitive
		for (var j=0; j<strArray.length; j++) {
			if (strArray[j] != null){
    			if (strArray[j].match(reg)) return j;
			}
		}
	}
    return -1;
}

//decrypts locDir items one by one and encrypts them with new Key
function recryptDB(newKey,newUserName){
	var oldKeyStretched = KeyDir,
		newKeyStretched = wiseHash(newKey,newUserName);

	for(var name in locDir){
		if(name != 'myself'){
			for(var index = 0; index < locDir[name].length; index++){
				var content = locDir[name][index];
				if(content){
					if(content.slice(0,1) == '~'){										//do only encrypted items
						KeyDir = oldKeyStretched;
						nameBeingUnlocked = name;
						content = keyDecrypt(content);
						KeyDir = newKeyStretched;
						content = keyEncrypt(content);
						locDir[name][index] = content;
					}
				}
				if(ChromeSyncOn && chromeSyncMode.checked && index == 0){		//if Chrome sync is available, add to sync storage
					syncChromeLock(name,JSON.stringify(locDir[name]))
				}
			}
		}
	}

//change Lock stored under name 'myself'
	KeyDir = newKeyStretched;
	var email = readEmail();
	KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(newKey,email)).secretKey;
	KeyDH = ed2curve.convertSecretKey(KeySgn);
	myLock = nacl.util.encodeBase64(nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey).replace(/=+$/,'');
	myezLock = changeBase(myLock, BASE64, BASE36, true);
	locDir['myself'][0] = keyEncrypt(email);
	localStorage[userName] = JSON.stringify(locDir);

	if(ChromeSyncOn && chromeSyncMode.checked && index == 0){
		syncChromeLock(name,JSON.stringify(locDir['myself']))
	}
}

//reads old and new Key from boxes and calls recryptDB so locDir is re-encrypted with the new Key
function changeKey(){
	if(!fullAccess){
		optionMsg.innerHTML = 'Key change not allowed in Guest mode<br>Please restart PassLok';
		throw('key change canceled')
	}
	callKey = 'changekey';
	if (learnMode.checked){
		var reply = confirm("The local directory will be re-encrypted with a new Key. Cancel if this is not what you want.");
		if(!reply) throw("locDir recrypt canceled");
	}
	var newkey = newKey.value.trim(),
		newkey2 = newKey2.value.trim();
	if (newkey.trim() == "" || newkey2.trim() == ""){								//stop to display the entry form if new Key is empty
		keyChange.style.display = "block";
		shadow.style.display = "block";
		keyChangeMsg.innerHTML = 'Enter the new Key in both boxes';
		if(!isMobile){
			if(newkey.trim() == ""){
				newKey.focus()
			}else{
				newKey2.focus()
			}
		}
		throw ("stopped for new Key input")
	}
	if(newkey.trim() != newkey2.trim()){											//check that the two copies match before going ahead
		keyChangeMsg.innerHTML = "<span style='color:purple'>The two Keys don't match</span>";
		throw ("Keys don't match")
	}

//everything OK, so do it!
	if(!fullAccess){
		keyChangeMsg.innerHTML = 'Key change not allowed in Guest mode';
		throw('Key change canceled')
	}
	recryptDB(newkey,userName);
	newKey.value = "";									//on re-execution, read the box and reset it
	newKey2.value = "";
	keyChange.style.display = 'none';
	shadow.style.display = 'none';
	KeyStr = newkey;									//refill Key box, too

	if(ChromeSyncOn && chromeSyncMode.checked){
		for(var name in locDir){
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}
	}

	if(keyScr.style.display == 'block') keyScr.style.display = 'none';
	mainMsg.innerHTML = '<span style="color:cyan">The Key has changed</span>';
	lockMsg.innerHTML = '<span style="color:cyan">The Key has changed</span>';
	optionMsg.innerHTML = '<span style="color:cyan">The Key has changed</span>';
	callKey = '';
}

//grab the names in locDir and put them on the Main tab selection box
function fillList(){
	if(bgColor[0]){
		if(bgColor[0] != 'FFFFFF') {var headingColor = milder(bgColor[0],'33')}else{var headingColor = '639789'};
	}else{var headingColor = '639789'};
	if(extraButtonsTop.style.display == 'block'){									//steganography buttons showing
		if(!isiPhone){
			lockList.innerHTML = '<option value="" disabled selected style="color:#' + headingColor + ';">Choose one stored Cover text:</option><option value="default">default</option>'
		}else{
			lockList.innerHTML = '<option value="default">default</option>'
		}
		for(var name in locDir){
			if(locDir[name][0].length > 500){										//only cover texts, which are long
				lockList.innerHTML += '<option value="' + name + '">' + name + '</option>'
			}
		}
	}else{																			//normal behavior
		if(isiPhone){
			lockList.innerHTML = ''
		}else if(isMobile){
			lockList.innerHTML = '<option value="" disabled selected style="color:#' + headingColor + ';">Select recipients:</option>'			
		}else{
			lockList.innerHTML = '<option value="" disabled selected style="color:#' + headingColor + ';">Select recipients (ctrl-click for several):</option>'
		}
		for(var name in locDir){
			if(locDir[name][0].length < 500){
				lockList.innerHTML += '<option value="' + name + '">' + name + '</option>'
			}
		}
	}
	if(callKey != 'decryptlock' && callKey != 'decrypt' && callKey != 'addlock') resetList();
}

//take the selected names and put them in the Locks lower box. If any is a List, extract and merge with the other names, removing duplicates
var isList = false;												//so a decryption failure knows how to end
function fillBox(){
	callKey = 'fillbox';
	lockBox.value = '';
	var list = '';
	for (var i = 0; i < lockList.options.length; i++) {
    	if(lockList.options[i].selected){
			if(lockList.options[i].value.slice(0,2) == '--'){					//it's a List, so decrypt it and add the contents to the box
				var itemcrypt = locDir[lockList.options[i].value][0];
//				if (!key) var key = refreshKey();
				isList = true;											//to return here if the Key is wrong
				list = list + '\n' + keyDecrypt(itemcrypt);
			}else if(lockList.options[i].value == 'default'){					//default cover selected
				var covername = 'default';
				newcover(defaultcovertext)
			}else if(locDir[lockList.options[i].value][0].length > 500){		//it's a Cover, so decrypt it and make it the new Cover
				var covername = lockList.options[i].value;
				var covercrypt = locDir[covername][0];
//				if (!key) var key = refreshKey();
				isList = true;
				newcover(LZString.decompressFromBase64(keyDecrypt(covercrypt)));
			}else{
         		list = list + '\n' + lockList.options[i].value;
			}
    	}
  	}
	var array = list.trim().split('\n');
	if (array[0] != ''){
		array = array.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates
		array = array.filter(function(n){return n});													//remove nulls
		array.sort();																					//alphabetical order
		list = '';
		var msg = 'Encrypting for: ';
		for(var index = 0; index < array.length; index++){
			list = list + '\n' + array[index];
			msg = msg + array[index] + ', '
		}
		lockBox.value = list.trim();
	} else if(covername){
		var msg = covername + ' Cover text loaded';
	} else {
		var msg = '';
	}
	mainMsg.innerHTML = XSSfilter(msg);
	lockMsg.innerHTML = '';
	lockNameBox.value = '';
	isList = false;
	callKey = '';
}

//empty the selection box on Main tab
function resetList(){
	for (var i = 0; i < lockList.options.length; i++) {
		if(lockList.options[i].selected) lockBox.value = '';
    	lockList.options[i].selected = false
  	}
	if(extraButtonsTop.style.display == 'block'){
		setTimeout(function(){mainMsg.innerHTML = 'Cover text not changed';},0);
	}else{
		setTimeout(function(){
			if(lockBox.value){
				mainMsg.innerHTML = 'Click <strong>Edit</strong> to see loaded Keys'
			}else{
				mainMsg.innerHTML = 'Nobody selected'
			};
		},0);
	}
}

//grab the names in localStorage and put them on the userName selection box. Buggy, so a lot of cleanup ifs
function fillNameList(){
	nameList.innerHTML = '<option value="" disabled style="color:#639789;">Select User Name:</option>';
	var list = [];
	for(var name in localStorage){
			//this if is because of a bug in Firefox
		if(name != 'clear' && name != 'getItem' && name != 'key' && name!= 'length' && name != 'removeItem' && name != 'setItem'){
			//and this, because of a bug in Safari
			if(!name.match('com.apple.WebInspector') && name != 'locDir'){
				list = list.concat(name)
			}
		}
	}
	list.sort(function (a, b) {											//case-insensitive sort
    	return a.toLowerCase().localeCompare(b.toLowerCase());
	});;
	for(var i = 0; i < list.length; i++){
		nameList.innerHTML = nameList.innerHTML + '<option value="' + list[i] + '">' + list[i] + '</option>'
	}
}