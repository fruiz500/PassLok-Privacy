//detect if Lock pasted in Lock box, otherwise clean up
function pasteLock(){
	setTimeout(function(){
	lockMsg.textContent = '';
	var text = lockBox.innerHTML.replace(/<br>/gi,'\n').replace(/\<(?!\/?a).*?\>/gi,'').trim().replace(/\n/g,'<br>').replace(/&nbsp;/gi,' ').replace(/<br>$/i,''),	//clean preserving anchors
		strings = text.split('<br>');
	var lastline = strings[strings.length-1];
	if (lastline.slice(0,4) != 'http'){
		var lock = lastline
	}else{
		var lock = strings[strings.length-2]									//in case there is a video URL as last line
	}
	var lockstripped = lock.replace(/[\s-]/g,'').split("==").sort(function (a, b) { return b.length - a.length; })[0];

	suspendFindLock = true;															//allow writing a name without searching
	if (lockstripped.length == 43 || lockstripped.length == 50){
		lockMsg.textContent = 'Lock detected';
		lockBox.textContent = lockstripped
	}
	},0)
}

//get name and Lock from form and merge them with the locDir object, then store
function addLock(){
	if(!fullAccess){
		lockMsg.textContent = 'Save not available in Guest mode<br>Please restart PassLok';
		return
	}
	if(learnMode.checked){
		var reply = confirm("The item in the box will be added to the permanent directory. Cancel if this is not what you want.");
		if(!reply) return
	}
	callKey = 'addlock';
	var name = lockNameBox.value.trim(),
		lock = lockBox.innerHTML.replace(/<br>$/i,"").trim().replace(/<div>/gi,'<br>').replace(/<\/div>/gi,'');
	if(removeHTMLtags(name)!=name){
		lockMsg.textContent = 'This is not a valid name';
		return
	}
	var lockarray = lock.split('<br>');
	var isList = (lockarray.length > 1 && lockarray[1].slice(0,4) != 'http' && lock.length <= 500);			//identify List
	if (lock ==''){
		if(!locDir['myself'] || BasicButtons) return;									//don't do it in Basic mode
		var ran = true;
		lock = nacl.util.encodeBase64(nacl.randomBytes(31)).replace(/=+$/,'');			//a little shorter so it's distinct
		lockBox.textContent = lock
	}
	if(name !=''){
		var locklength = stripTags(lockarray[0]).length;
		if((locklength == 43 || locklength == 50) && lockarray.length == 1){
			var lockcrypt = lock;													//store Locks unencrypted, everything else encrypted by the Key
		}else{
			if (lock.length > 500) lock = LZString.compressToBase64(lock).replace(/=/g,'');			//cover texts are compressed
			var	lockcrypt = keyEncrypt(lock);
			if(!lockcrypt) return
		}
		if(isList) name = '--' + name + '--';										//dashes bracket name for Lists
			var newEntry = JSON.parse('{"' + name + '":["' + lockcrypt + '"]}');
			locDir = sortObject(mergeObjects(locDir,newEntry));
			localStorage[userName] = JSON.stringify(locDir);
			lockNames = Object.keys(locDir);
			window.setTimeout(function(){											//this needs to be on a timer for iOS
				if(ran) {
					lockMsg.textContent = 'Random Key stored to local directory with name: ' + name
				}else if(stripTags(lock).length == 43 || stripTags(lock).length == 50){
					lockMsg.textContent = 'Lock saved to local directory with name: ' + name
				}else if(isList){
					lockMsg.textContent = 'List saved to local directory with name: ' + name
				}else{
					lockMsg.textContent = 'Item saved to local directory with name: ' + name
				};
			}, 100)
			fillList();

			if(ChromeSyncOn && chromeSyncMode.checked){													//if Chrome sync is available, add to sync storage
				syncChromeLock(name,JSON.stringify(locDir[name]))
			}

	}else{
		lockMsg.textContent = 'Cannot save without a name'
	}
	suspendFindLock = false;
	callKey = ''
}

//delete a particular key in Object locDir, then store
function removeLock(){
	if(!fullAccess){
		lockMsg.textContent = 'Delete not available in Guest mode\nPlease restart PassLok';
		return
	}
	var reply = confirm("The item displayed in the box will be removed from the permanent directory. This is irreversible. Cancel if this is not what you want.");
	if(!reply) return;
	var name = lockMsg.textContent;
	if (locDir[name] == null){
		lockMsg.textContent = 'To remove an item, its name must be displayed HERE';
		return
	}
	if (name == 'myself'){
		lockMsg.textContent = 'There is a button to reset your options in the Options tab';
		return
	}
	delete locDir[name];
	localStorage[userName] = JSON.stringify(locDir);
	lockNames = Object.keys(locDir);
	window.setTimeout(function(){										//this needs to be on a timer for iOS
		lockMsg.textContent = name + ' deleted';
	}, 100);
	fillList();

		if(ChromeSyncOn && chromeSyncMode.checked){						//if Chrome sync is available, remove from sync storage
			if(confirm('Item removed from local storage. Do you want to remove it also from sync storage?')) remChromeLock(name)
		}

	suspendFindLock = false
}

//this is to just delete the Read-once data for a particular key (or reset the current list)
function resetPFS(){
	if(!fullAccess){
		lockMsg.textContent = 'Reset not available in Guest mode. Please restart PassLok';
		return
	}
	if (lockBox.innerHTML.trim().split('<br>').filter(Boolean).length > 1){ //use button to reset current List if a List is displayed, nothing to do with normal use
		if(learnMode.checked){
			var reply = confirm("The list currently being formed will be reset. Cancel if this is not what you want.");
			if(!reply) return
		}
		currentList = '';
		lockMsg.textContent = 'Current list reset';
		return
	}

//now the real stuff
	var reply = confirm("The data needed to maintain a Read-once conversation with this person will be deleted. This is irreversible. Cancel if this is not what you want.");
	if(!reply) return;

	var name = lockMsg.textContent;
	if (locDir[name] == null){
		lockMsg.textContent = 'The item to be reset must be displayed first';
		return
	}
	if (name == 'myself'){
		lockMsg.textContent = 'There is a button to reset your options in the Options tab';
		return
	}
	if ((locDir[name][1] == null) && (locDir[name][2] == null)){
		lockMsg.textContent = 'Nothing to reset';
		return
	}
	locDir[name][1] = locDir[name][2] = null;
	locDir[name][3] = 'reset';
	localStorage[userName] = JSON.stringify(locDir);

		if(ChromeSyncOn && chromeSyncMode.checked){							//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(locDir[name]))
		}

	lockMsg.textContent = 'Read-once data for ' + name + " deleted. The next message to this user won't have forward secrecy.";
	suspendFindLock = false
}

var suspendFindLock = false							//when true, user can input a name without deleting the Lock box

//searches for name in Locks database and returns the Lock, displays full name as well. Invoked as the user types
function findLock(){
	lockMsg.textContent = '';
	var string = removeHTMLtags(lockNameBox.value.trim());
	var stringstrip = stripTags(string);
	if(stringstrip.length == 43 || stringstrip.length == 50){									//it's a Lock in the wrong box. Move it
		lockBox.textContent = string;
		lockNameBox.value = '';
		lockMsg.textContent = 'Locks and shared Keys go in the lower box<br>You can write a name on the top box in order to save it';
		suspendFindLock = true;
		return
	}
	var index = searchStringInArrayDB(string,lockNames);
	if (index >= 0){
		var name = lockNames[index];
		lockMsg.textContent = name;
		lockBox.textContent = locDir[name][0]
	}else{
		lockMsg.textContent = '';
		lockBox.textContent = ''
	}
}

//decrypts the contents of the Locks Box
function decryptLock(){
	callKey = 'decryptlock';
	var lockStr = lockBox.textContent.trim(),
		firstchar = lockStr.slice(0,1);
	if(firstchar == 'k' && lockStr.length == 92) {
		nameBeingUnlocked = lockMsg.textContent;
		decryptItem();
		nameBeingUnlocked = ''
	}
	if(lockBox.textContent != ''){
		var listArray = lockBox.innerHTML.split('<br>').filter(Boolean);
		if(lockBox.textContent.length > 500){
			lockBox.innerHTML = decryptSanitizer(LZString.decompressFromBase64(lockBox.textContent).trim());
			newCover(lockBox.textContent.trim());							//this for loading cover text from Lock screen
			lockMsg.textContent = 'New Cover text extracted and ready to use'
		} else if(listArray.length > 1 && listArray[1].slice(0,4) != 'http'){
			lockMsg.textContent = 'List extracted'
		} else if(stripTags(lockBox.textContent).length == 43 || stripTags(lockBox.textContent).length == 50){
			lockMsg.textContent = 'Lock extracted'
		} else if(lockBox.textContent.length == 42){
			lockMsg.textContent = 'Random Key extracted'
		} else if(lockMsg.textContent == 'myself'){
			lockMsg.textContent = 'Email/token extracted'
		} else {
			lockMsg.textContent = 'Shared Key extracted'
		}
	}
	if(lockScr.style.display == 'none') main2lock();
	callKey = ''
}

//if a newline is entered, puts the expanded contents of the name box in the Lock box, and waits for another item
var currentList = '';
function addToList(){
	if(learnMode.checked){
		var reply = confirm("The item displayed will be added to the current list. Cancel if this is not what you want.");
		if(!reply) return
	}
	var	currentItem = lockBox.innerText.trim();
	if(lockMsg.textContent != ''){
		var namenumber = currentItem.split('\n').length;

//if the item is itself a list or there is no name, add the contents rather than the displayed name
		if(namenumber > 1 || lockNameBox.value==''){
			if(currentList == ''){
				currentList = currentItem
			}else{
				currentList += '\n' + currentItem
			}
			lockMsg.textContent = namenumber + ' items added to the current list'
		}else{
			if(currentList == ''){
				currentList = lockMsg.textContent
			}else{
				currentList += '\n' + lockMsg.textContent
			}
			lockMsg.textContent += ' added to the current list'
		}
	}else{
		if(currentList !=''){
			lockMsg.textContent = 'This is the (temporary) current list'
		}else{
			lockMsg.textContent = 'No items on the current list'
		}
	}
	var listArray = currentList.replace(/\n+/g,'\n').split('\n');
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates
	currentList = listArray.join('\n');
	lockBox.innerText = currentList.trim();
	currentList = lockBox.innerText;
	suspendFindLock = false
}

//automatically decrypts an item stored encrypted in the locDir database. It uses the permanent Key
function decryptItem(){
	if(callKey != 'decryptlock') callKey = 'decryptitem';
	if(!refreshKey()) return;
	var	string = lockBox.textContent.trim();
	if(string == "") return;
	lockBox.innerHTML = decryptSanitizer(keyDecrypt(string));
	if(!lockBox.innerHTML) return;
	if(callKey != 'decryptlock') callKey = ''
}

//add a few spaces and newlines, then remove brackets, etc., extra spaces, put in alphabetical order
function showLockDB(){
	if(learnMode.checked){
		var reply = confirm("The complete directory of Locks, shared Keys, etc. stored under the current user name will be displayed. Cancel if this is not what you want.");
		if(!reply) return
	}
	if(localStorage[userName] != "{}"){
		lockBox.innerHTML = JSON.stringify(locDir,null,4).replace(/\],/g,'<br><br>').replace(/[{}"\[\]]/g,'').replace(/,\n/g,'<br>').replace(/: /g,':<br>').replace(/<br> +/g,'<br>').replace(/\n/g,'').trim();
		lockMsg.textContent = 'These are the items stored under the current user name'
	}else{
		lockMsg.textContent = 'There are no stored items'
	}
	suspendFindLock = false
}

//as above, but just the 'myself' entry
function showMyself(){
	if(locDir['myself']){
		var alphalocDir = locDir['myself'];
		mainBox.innerHTML = 'myself:<br>' + JSON.stringify(alphalocDir,null,4).replace(/[{}"\[\]]/g,'').replace(/,\n/g,'<br>').replace(/<br> +/g,'<br>').replace(/\n/g,'').trim();
		mainMsg.textContent = 'These are your stored settings'
	}else{
		mainMsg.textContent = 'No settings to store'
	}
	suspendFindLock = false
}

//reconstruct the original JSON string from the newlines and spaces as displayed by showLockDB
function mergeLockDB(){
	callKey = 'mergedb';
	var	lockstr = lockBox.innerHTML.replace(/<br>$/,"").trim(),		//see if these are Locks for a possible DH merge, which is not the main function of this button
		mainstr = mainBox.textContent.trim();
	if (lockstr == ''){
		lockMsg.textContent = 'Nothing to merge';
		return
	}
	if (lockstr.slice(0,1) == 'k') {
		lockstr = keyDecrypt(lockstr);
		if(!lockstr) return
	}
	var lockstr2 = stripTags(lockstr),
		mainstr2 = stripTags(mainstr),
		locklen = lockstr2.length,
		mainlen = mainstr2.length;

	if(lockstr.split('<br>').length > 1){			//the real database merge implies multiline
		if(learnMode.checked){
			var reply = confirm("The items in the box will be merged into the permanent directory, replacing existing items of the same name. This is irreversible. Cancel if this is not what you want.");
			if(!reply) return
		}
		if(!fullAccess){
			if(lockScr.style.display == 'block'){
				lockMsg.textContent = 'Merge not available in Guest mode<br>Please restart PassLok'
			}else{
				mainMsg.textContent = 'Settings update not available in Guest mode\nPlease restart PassLok'
			}
			return
		}
		var newDB = JSON.parse('{"' + lockBox.innerHTML.replace(/<br>$/,"").trim().replace(/<br> +/g,'<br>').replace(/:<br>/g,'":["').replace(/<br><br>/g,'"],"').replace(/<br>/g,'","') + '"]}');
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
		if(email){myEmail = email}else{return}
		if(!refreshKey()) return;
		KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(KeyStr,email)).secretKey;
		KeyDH = ed2curve.convertSecretKey(KeySgn);
		myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
		myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');
		myezLock = changeBase(myLockStr, base64, base36, true);

		fillList();
		var reply = prompt("The items have been merged into the local directory. It might be a good idea to change the user name at this point. To do so, enter the new user name and click OK. Otherwise Cancel.");
		if(reply){
			userNameBox.value = reply;
			changeName()
		}
		lockMsg.textContent = 'Items merged into the local directory'

	}else if(locklen == 43 && (mainlen == 43 || mainlen == 50)){	 //merging of a DH Key in the directory box and a DH Lock in main
		if(learnMode.checked){
			var reply = confirm("The Key in the directory box will be combined with the Lock in the main box, and the resulting Lock will replace both. Cancel if this is not what you want.");
			if(!reply) return
		}
		if (mainlen == 50) mainstr2 = changeBase(mainstr2.toLowerCase().replace(/l/g,'L'), base36, base64, true);
		var merged = nacl.util.encodeBase64(makeShared(nacl.util.decodeBase64(mainstr2),nacl.util.decodeBase64(lockstr2))).replace(/=+$/,'');
		mainBox.textContent = merged;
		lockBox.textContent = merged;
		lockMsg.textContent = 'Key merged with Lock, in main box';
		return

	}else if(locklen == 43 || locklen == 50){	                    //merging of a Lock in the directory box the user Key in order to get their shared Key
		if(learnMode.checked){
			var reply = confirm("The Lock in the directory box will be combined with your Key, and the resulting shared Key will replace both. Cancel if this is not what you want.");
			if(!reply) return
		}
		if(!refreshKey()) return;
		if (locklen == 50) lockstr2 = changeBase(lockstr2.toLowerCase().replace(/l/g,'L'), base36, base64, true);
		var merged = nacl.util.encodeBase64(makeShared(convertPub(nacl.util.decodeBase64(lockstr2)),KeyDH)).replace(/=+$/,'');
		lockBox.textContent = merged;
		imagePwd.value = merged;										//for image hiding
		lockMsg.textContent = 'The Lock has been merged with your Key and turned into this shared Key. Also copied as image Password';
		return

	}else{
		lockMsg.textContent = 'The items to be merged must be 256-bit and in base64 (or base36 for Locks)';
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
		optionMsg.textContent = 'Move not allowed in Guest mode\nPlease restart PassLok';
		return
	}
	callKey = 'movedb';
	if(!refreshKey()) return;

	//first encrypt locDir, as displayed by showLockDB
	showLockDB();
	var datacrypt = keyEncrypt(lockBox.innerHTML.replace(/<br>$/,"").trim());
	if(!datacrypt) return;
	mainBox.textContent = 'PL24dir==' + datacrypt + '==PL24dir';
	optionMsg.textContent = 'Database in Main tab';
	mainMsg.textContent = 'The item in the box contains your directory. To restore it, click Decrypt';
	setTimeout(function(){updateButtons()},50);

	//now check that the user really wants to delete the database
	var reply = confirm("Your local directory has been exported to the Main tab. If you click OK, it will now be erased from this device. This cannot be undone.");
	if (!reply) return;

	if(ChromeSyncOn && chromeSyncMode.checked){								//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to delete also from Chrome sync?')){
			for(var name in locDir) remChromeLock(name);
			chrome.storage.sync.remove(userName.toLowerCase() + '.ChromeSyncList')
		}
	}

	locDir = {};
	delete localStorage[userName];
	lockNames = [];
	optionMsg.textContent = 'Stored items erased';
	fillList();
	suspendFindLock = false;
	callKey = ''
}

//makes encrypted backup of the 'myself' entry only, then if allowed clears it, then stores
function moveMyself(){
	callKey = 'movemyself';

	//first encrypt myself data, as displayed by showLockDB
	showMyself();
	if(fullAccess){
		var datacrypt = keyEncrypt(mainBox.innerHTML.trim());					//preserve formatting
		if(!datacrypt) return;
		mainBox.textContent = 'PL24bak==' + datacrypt+ '==PL24bak';
		var msg = 'The item in the box contains your settings\nTo restore them, click Decrypt'
	}else{
		var msg = 'These are your settings, possibly including your encrypted random token<br>You may want to save them in a safe place.'
	}
	optionMsg.textContent = 'Backed-up settings on Main tab';
	mainMsg.textContent = msg;
	setTimeout(function(){updateButtons()},50);

	//now check that the user really wants to delete the database
	var reply = confirm("Your settings, including the email/token, have been backed up. If you click OK, they will now be erased from this device. This cannot be undone.");
	if (!reply) return;
	delete locDir['myself'];
	localStorage[userName] = JSON.stringify(locDir);
	lockNames = Object.keys(locDir);
	fillList();
	mainMsg.textContent = 'Your settings, including the email/token, have been erased\n' + msg;
	optionMsg.textContent = 'Settings erased';

	if(ChromeSyncOn && chromeSyncMode.checked){								//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to remove your settings also from Chrome sync?')) remChromeLock('myself')
	}

	suspendFindLock = false;
	callKey = ''
}

//merges two objects; doesn't sort the keys
function mergeObjects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3
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
    return sorted
}

//to make sorting case-insensitive
function insensitive(s1, s2) {
  var s1lower = s1.toLowerCase();
  var s2lower = s2.toLowerCase();
  return s1lower > s2lower? 1 : (s1lower < s2lower? -1 : 0)
}

//finds first partial match of string str and returns index of array element
function searchStringInArrayDB (str, strArray) {
	if (str != ''){
		var reg = new RegExp(str, "i");					//make it case-insensitive
		for (var j=0; j<strArray.length; j++) {
			if (strArray[j] != null){
    			if (strArray[j].match(reg)) return j
			}
		}
	}
    return -1
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
					if(content.slice(0,1) == 'k'){										//do only encrypted items
						KeyDir = oldKeyStretched;
						nameBeingUnlocked = name;
						content = keyDecrypt(content);
						if(!content) return;
						KeyDir = newKeyStretched;
						content = keyEncrypt(content);
						if(!content) return;
						locDir[name][index] = content
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
	myLock = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
	myLockStr = nacl.util.encodeBase64(myLock).replace(/=+$/,'');
	myezLock = changeBase(myLockStr, base64, base36, true);
	locDir['myself'][0] = keyEncrypt(email);
	if(!locDir['myself'][0]) return;
	localStorage[userName] = JSON.stringify(locDir);

	if(ChromeSyncOn && chromeSyncMode.checked && index == 0){
		syncChromeLock(name,JSON.stringify(locDir['myself']))
	}
}

//reads old and new Key from boxes and calls recryptDB so locDir is re-encrypted with the new Key
function changeKey(){
	if(!fullAccess){
		optionMsg.textContent = 'Key change not allowed in Guest mode. Please restart PassLok';
		return
	}
	callKey = 'changekey';
	if(learnMode.checked){
		var reply = confirm("The local directory will be re-encrypted with a new Key. Cancel if this is not what you want.");
		if(!reply) return
	}
	var newkey = newKey.value.trim(),
		newkey2 = newKey2.value.trim();
	if (newkey.trim() == "" || newkey2.trim() == ""){								//stop to display the entry form if new Key is empty
		keyChange.style.display = "block";
		shadow.style.display = "block";
		keyChangeMsg.textContent = 'Enter the new Key in both boxes';
		if(!isMobile){
			if(newkey.trim() == ""){
				newKey.focus()
			}else{
				newKey2.focus()
			}
		}
		return
	}
	if(newkey.trim() != newkey2.trim()){											//check that the two copies match before going ahead
		keyChangeMsg.textContent = "The two Keys don't match";
		return
	}

//everything OK, so do it!
	if(!fullAccess){
		keyChangeMsg.textContent = 'Key change not allowed in Guest mode';
		return
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
	mainMsg.textContent = 'The Key has changed';
	lockMsg.textContent = 'The Key has changed';
	optionMsg.textContent = 'The Key has changed';
	callKey = ''
}

//grab the names in locDir and put them on the Main tab selection box
function fillList(){
	if(bgColor[0]){
		if(bgColor[0] != 'FFFFFF') {var headingColor = milder(bgColor[0],'33')}else{var headingColor = '639789'};
	}else{var headingColor = '639789'};
	if(extraButtonsTop.style.display == 'block'){									//steganography buttons showing
		if(!isiPhone){
			lockList.innerHTML = '<option value="" disabled selected>Choose one stored Cover text:</option><option value="default">default</option>'
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
			lockList.textContent = ''
		}else if(isMobile){
			lockList.innerHTML = '<option value="" disabled selected>Select recipients:</option>'			
		}else{
			lockList.innerHTML = '<option value="" disabled selected>Select recipients (ctrl-click for several):</option>'
		}
		for(var name in locDir){
			if(locDir[name][0].length < 500){
				lockList.innerHTML += '<option value="' + name + '">' + name + '</option>'
			}
		}
	}
	lockList.style.color = '#' + headingColor;
	lockList.options[0].selected = false
}

//take the selected names and put them in the Locks lower box. If any is a List, extract and merge with the other names, removing duplicates
var isList = false;												//so a decryption failure knows how to end
function fillBox(){
	callKey = 'fillbox';
	lockBox.textContent = '';
	lockMsg.textContent = '';
	var list = '';
	for(var i = 0; i < lockList.options.length; i++){
    	if(lockList.options[i].selected){
			if(lockList.options[i].value.slice(0,2) == '--'){					//it's a List, so decrypt it and add the contents to the box
				var itemcrypt = locDir[lockList.options[i].value][0];
				isList = true;											//to return here if the Key is wrong
				var nextItem = keyDecrypt(itemcrypt);
				if(!nextItem) return;
				list += '<br>' + nextItem
			}else if(lockList.options[i].value == 'default'){					//default cover selected
				var covername = 'default';
				newCover(defaultCoverText)
			}else if(locDir[lockList.options[i].value][0].length > 500){		//it's a Cover, so decrypt it and make it the new Cover
				var covername = lockList.options[i].value;
				var covercrypt = locDir[covername][0];
				isList = true;
				var cover2 = keyDecrypt(covercrypt);
				if(!cover2) return;
				newCover(LZString.decompressFromBase64(cover2))
			}else{
         		list += '<br>' + lockList.options[i].value
			}
    	}
  	}
	list = list.replace(/<br>/i,'');										//remove the first linefeed
	var array = list.split('<br>');
	if(array[0] != ''){
		array = array.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates
		array = array.filter(function(n){return n});													//remove nulls
		array.sort();																					//alphabetical order
		list = '';
		var msg = 'Encrypting for: ';
		for(var index = 0; index < array.length; index++){
			list += '<br>' + array[index];
			msg += array[index] + ', '
		}
		lockBox.innerHTML = list.replace(/<br>/i,'').trim();				//remove first linefeed
	}else if(covername){
		var msg = covername + ' Cover text loaded'
	}else{
		var msg = ''
	}
	mainMsg.textContent = msg.trim().replace(/,$/,'');
	lockMsg.textContent = '';
	lockNameBox.value = '';
	isList = false;
	updateButtons();
	callKey = ''
}

//empty the selection box on Main tab
function resetList(){
	for (var i = 0; i < lockList.options.length; i++) {
		if(lockList.options[i].selected) {lockBox.textContent = '';lockMsg.textContent = ''}
    	lockList.options[i].selected = false
  	}
	setTimeout(function(){
		var l = lockBox.textContent.length;
		if(l == 0){
			mainMsg.textContent = 'Nobody selected'
		}else if(l > 500){
			mainMsg.textContent = 'Click Edit to see the Cover text'
		}else{
			mainMsg.textContent = 'Click Edit to see loaded Keys'				
		}
		updateButtons()
	},0)
}

//grab the names in localStorage and put them on the userName selection box. Buggy, so a lot of cleanup ifs
function fillNameList(){
	nameList.innerHTML = '<option value="" disabled>Select User Name:</option>';
	nameList.style.color = '#639789';
	var list = [];
	for(var name in localStorage){
			//this if is because of a bug in Firefox
		if(name != 'clear' && name != 'getItem' && name != 'key' && name!= 'length' && name != 'removeItem' && name != 'setItem'){
			//and this, because of a bug in Safari
			if(!name.match('com.apple.WebInspector') && name != 'locDir'){
				list = list.concat(removeHTMLtags(name))
			}
		}
	}
	list.sort(function (a, b) {											//case-insensitive sort
    	return a.toLowerCase().localeCompare(b.toLowerCase())
	})
	for(var i = 0; i < list.length; i++){
		nameList.innerHTML += '<option value="' + list[i] + '">' + list[i] + '</option>'
	}
}