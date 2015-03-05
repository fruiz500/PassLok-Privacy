//get name and Lock from form and merge them with the lockDB object, then store
function addLock(){
	var lockmsg = document.getElementById("lockmsg");
	if(!fullAccess){
		lockmsg.innerHTML = 'Save not available after Key cancel<br>Please restart PassLok';
		throw('lock save canceled')
	}
	if (learnOn){
		var reply = confirm("The item in the box will be added to the permanent directory. Cancel if this is not what you want.");
		if(reply==false) throw("lockDB add canceled");
	}
	callKey = 'addlock';
	if(lockDB['myself'] && document.getElementById('encryptLocks').checked){
		var encryptLocks = true
	}else{
		var encryptLocks = false
	}
	var name = document.getElementById('locknameBox').value.trim(),
		lock = document.getElementById('lockBox').value.trim();
	if (XSSfilter(name)!=name){
		lockmsg.innerHTML = 'This is not a valid name';
		throw('name contained XSS-illegal characters')
	}
	var lockarray = lock.split('\n');
	var isList = (lockarray.length > 1 && lockarray[1].slice(0,4) != 'http' && lock.length <= 500);			//identify List
	if (lock ==''){
		if(!lockDB['myself'] || BasicButtons) return;									//don't do it in Basic mode
		var ran = true;
		lock = sjcl.codec.base64.fromBits(sjcl.random.randomWords('17','0')).slice(0,86);   //make a random Key and store it below if a name is provided
		document.getElementById('lockBox').value = lock;
	}
	if (name !=''){
		var locklength = striptags(lockarray[0]).length;
		if((locklength == 87 || locklength == 100) && !encryptLocks && lockarray.length == 1){
			var lockcrypt = lock;													//store Locks unencrypted, everything else encrypted by the Key
		}else{
			if (lock.length > 500) lock = LZString.compressToBase64(lock);			//cover texts are compressed
			var key = readKey(),
				lockcrypt = keyEncrypt(key,lock);
		}
		if(isList) name = '--' + name + '--';										//dashes bracket name for Lists
			var newEntry = JSON.parse('{"' + name + '":["' + lockcrypt + '"]}');
			lockDB = sortObject(mergeObjects(lockDB,newEntry));
			localStorage[userName] = JSON.stringify(lockDB);
			lockNames = Object.keys(lockDB);
			window.setTimeout(function(){											//this needs to be on a timer for iOS
				if (ran) {
					lockmsg.innerHTML = '<span style="color:green">Random Key stored to local directory with name </span>' + name
				} else if(striptags(lock).length == 87 || striptags(lock).length == 100){
					lockmsg.innerHTML = '<span style="color:green">Lock saved to local directory with name </span>' + name
				} else if(isList){
					lockmsg.innerHTML = '<span style="color:green">List saved to local directory with name </span>' + name
				} else {
					lockmsg.innerHTML = '<span style="color:green">Item saved to local directory with name </span>' + name
				};
			}, 100);
			fillList();

			if(ChromeSyncOn){													//if Chrome sync is available, add to sync storage
				syncChromeLock(name,JSON.stringify(lockDB[name]))
			}

	} else {
		lockmsg.innerHTML = '<span style="color:red">Cannot save without a name</span>'
	};
	suspendFindLock = false;
	callKey = ''
}

//delete a particular key in Object lockDB, then store
function removeLock(){
	var lockmsg = document.getElementById("lockmsg");	
	if(!fullAccess){
		lockmsg.innerHTML = 'Delete not available after Key cancel<br>Please restart PassLok';
		throw('lock removal canceled')
	}
	if (learnOn){
		var reply = confirm("The item displayed in the box will be removed from the permanent directory. This is irreversible. Cancel if this is not what you want.");
		if(reply==false) throw("lockDB remove canceled");
	}
	var name = lockmsg.innerHTML;
	if (lockDB[name] == null){
		lockmsg.innerHTML = 'To remove an item, its name must be displayed <strong>here</strong>';
		throw('bad name')
	}
	if (name == 'myself'){
		lockmsg.innerHTML = 'There is a button to reset your options in the Options tab';
		throw('no delete for myself')
	}
	delete lockDB[name];
	localStorage[userName] = JSON.stringify(lockDB);
	lockNames = Object.keys(lockDB);
	window.setTimeout(function(){										//this needs to be on a timer for iOS
		lockmsg.innerHTML = XSSfilter(name) + ' deleted';
	}, 100);
	fillList();

		if(ChromeSyncOn){											//if Chrome sync is available, remove from sync storage
			if(confirm('Item removed from local storage. Do you want to remove it also from the Chrome sync area?')) remChromeLock(name)
		}

	suspendFindLock = false;
}

//this is to just delete the PFS data for a particular key (or reset the current list)
function resetPFS(){
	var lockmsg = document.getElementById("lockmsg");
	if(!fullAccess){
		lockmsg.innerHTML = 'Reset not available after Key cancel<br>Please restart PassLok';
		throw('lock reset canceled')
	}
	if (document.getElementById('lockBox').value.trim().split('\n').length > 1){		//use button to reset current List if a List is displayed, nothing to do with normal use
		if (learnOn){
			var reply = confirm("The list currently being formed will be reset. Cancel if this is not what you want.");
			if(reply==false) throw("List reset canceled");
		}
		currentList = '';
		lockmsg.innerHTML = 'Current list reset';
		return
	}
//now the real stuff
	if (learnOn){
		var reply = confirm("The data needed to maintain a PFS conversation with this sender/recipient will be deleted, so the ongoing conversation cannot be continued. This is irreversible. Cancel if this is not what you want.");
		if(reply==false) throw("myself reset canceled");
	}
	var name = lockmsg.innerHTML;
	if (lockDB[name] == null){
		lockmsg.innerHTML = 'The item to be reset must be displayed first';
		throw('bad name')
	}
	if (name == 'myself'){
		lockmsg.innerHTML = 'There is a button to reset your options in the Options tab';
		throw('no reset for myself')
	}	
	if ((lockDB[name][1] == null) && (lockDB[name][2] == null) && (lockDB[name][3] == null)){
		lockmsg.innerHTML = 'Nothing to reset';
		throw('no PFS data')
	}
	lockDB[name].splice(1);
	localStorage[userName] = JSON.stringify(lockDB);

		if(ChromeSyncOn){											//if Chrome sync is available, change in sync storage
			syncChromeLock(name,JSON.stringify(lockDB[name]))
		}

	lockmsg.innerHTML = 'PFS data for ' + XSSfilter(name) + ' deleted';
	suspendFindLock = false
}

var suspendFindLock = false							//when true, user can input a name without deleting the lock box

//searches for name in Locks database and returns the Lock, displays full name as well. Invoked as the user types
function findLock(){
	var lockmsg = document.getElementById("lockmsg");
	lockmsg.innerHTML = '';
	var string = document.getElementById('locknameBox').value;
	var stringstrip = striptags(string);
	if(stringstrip.length == 87 || stringstrip.length == 100){									//it's a Lock in the wrong box. Move it
		document.getElementById('lockBox').value = string;
		document.getElementById('locknameBox').value = '';
		lockmsg.innerHTML = 'Locks go in the lower box. You can give it a name and save it';
		suspendFindLock = true;
		return
	}
	var index = searchStringInArrayDB(string,lockNames);
	if (index >= 0){
		var name = lockNames[index];
		lockmsg.innerHTML = XSSfilter(name);
		document.getElementById('lockBox').value = lockDB[name][0]
	}else{
		lockmsg.innerHTML = '';
		document.getElementById('lockBox').value = ''
	}
}

//decrypts the contents of the Locks Box
function decryptLock(){
	callKey = 'decryptlock';
	var lockmsg = document.getElementById("lockmsg");
	var firstchar = document.getElementById('lockBox').value.slice(0,1);
	if(firstchar == '~') {
		nameBeingUnlocked = lockmsg.innerHTML;
		decryptItem();
		nameBeingUnlocked = '';
	}
	if(document.getElementById('lockBox').value != ''){
		var listArray = document.getElementById('lockBox').value.split('\n');
		if(document.getElementById('lockBox').value.length > 500){
			document.getElementById('lockBox').value = LZString.decompressFromBase64(document.getElementById('lockBox').value);
			newcover(document.getElementById('lockBox').value);							//this for loading cover text from lock screen
			lockmsg.innerHTML = 'New Cover text extracted and ready to use'
		} else if(listArray.length > 1 && listArray[1].slice(0,4) != 'http'){
			lockmsg.innerHTML = 'List extracted'
		} else if(striptags(document.getElementById('lockBox').value).length == 87 || striptags(document.getElementById('lockBox').value).length == 100){
			lockmsg.innerHTML = 'Lock extracted'
		} else if(document.getElementById('lockBox').value.length == 86){
			lockmsg.innerHTML = 'Random Key extracted'
		} else {
			lockmsg.innerHTML = 'Shared Key extracted'
		}
	}
	if(document.getElementById('lockscr').style.display == 'none') main2lock();
	callKey = ''
}

//if a newline is entered, puts the expanded contents of the name box in the lock box, and waits for another item
var currentList = '';

function addToList(){
	if (learnOn){
		var reply = confirm("The item displayed will be added to the current list. Cancel if this is not what you want.");
		if(reply==false) throw("add to list canceled");
	}
	var lockmsg = document.getElementById("lockmsg"),
		currentItem = document.getElementById('lockBox').value;
	if(lockmsg.innerHTML != ''){
		var namenumber = currentItem.split('\n').length;

//if the item is itself a list or there is no name, add the contents rather than the displayed name
		if (namenumber > 1 || document.getElementById('locknameBox').value==''){
			if(currentList == ''){
				currentList = currentItem
			}else{
				currentList = currentList + '\n' + currentItem
			}
			lockmsg.innerHTML = namenumber + ' items added to the current list'
		} else {
			if(currentList == ''){
				currentList = lockmsg.innerHTML
			}else{
				currentList = currentList + '\n' + lockmsg.innerHTML
			}
			lockmsg.innerHTML = XSSfilter(lockmsg.innerHTML) + ' added to the current list'
		}
	} else {
		if (currentList !=''){
			lockmsg.innerHTML = 'This is the (temporary) current list'
		} else {
			lockmsg.innerHTML = 'No items on the current list'
		}
	}
	var listArray = currentList.replace(/\n+/g,'\n').split('\n');
	listArray = listArray.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates
	currentList = listArray.join('\n');
	document.getElementById('lockBox').value = currentList.trim();
	currentList = document.getElementById('lockBox').value;
	suspendFindLock = false
}

//automatically decrypts an item stored encrypted in the lockDB database. It uses the permanent Key
function decryptItem(){
	if(callKey != 'decryptlock') callKey = 'decryptitem';
	var	key = readKey(),
		string = document.getElementById('lockBox').value.trim();
	if(string == "") throw('nothing to decrypt');
	document.getElementById('lockBox').value = keyDecrypt(string);
	if(callKey != 'decryptlock') callKey = ''
}

//add a few spaces and newlines, then remove brackets, etc., extra spaces, put in alphabetical order
function showLockDB(){
	if (learnOn){
		var reply = confirm("The complete directory of Locks, shared Keys, etc. stored under the current user name will be displayed. Cancel if this is not what you want.");
		if(reply==false) throw("lockDB show canceled");
	}
	var lockmsg = document.getElementById("lockmsg");
	if(localStorage[userName] != "{}"){
		var alphalockDB = lockDB;
		document.getElementById('lockBox').value = JSON.stringify(alphalockDB,null,4).replace(/[{}"\[\]]/g,'').replace(/\n    /g,'\n').replace(/ \n/g,'\n').replace(/,\n/g,'\n').trim();
		lockmsg.innerHTML = 'These are the items stored under the current user name';
	}else{
		lockmsg.innerHTML = '<span style="color:red">There are no stored items</span>';
	}
	suspendFindLock = false
}

//as above, but just the 'myself' entry
function showMyself(){
	var mainmsg = document.getElementById("mainmsg");
	if(lockDB['myself']){
		var alphalockDB = lockDB['myself'];
		document.getElementById('mainBox').innerHTML = 'myself:\n' + JSON.stringify(alphalockDB,null,4).replace(/[{}"\[\]]/g,'').replace(/\n    /g,'\n').replace(/ \n/g,'\n').replace(/,\n/g,'\n').trim();
		mainmsg.innerHTML = 'These are your stored settings';
	}else{
		mainmsg.innerHTML = '<span style="color:red">No settings to store</span>';
	}
	suspendFindLock = false
}

//reconstruct the original JSON string from the newlines and spaces as displayed by showLockDB
function mergeLockDB(){
	var lockmsg = document.getElementById("lockmsg"),
		mainmsg = document.getElementById("mainmsg");
	callKey = 'mergedb';
	var	lockstr = document.getElementById('lockBox').value.trim(),		//see if these are Locks for a possible DH merge, which is not the main function of this button
		mainstr = XSSfilter(document.getElementById('mainBox').innerHTML.trim().replace(/\&nbsp;/g,''));
	if (lockstr == ''){
		lockmsg.innerHTML = 'Nothing to merge';
		throw('invalid merge')
	}
	if (lockstr.slice(0,1) == '~') {
		var key = readKey();
		lockstr = keyDecrypt(lockstr)
	}
	var lockstr2 = striptags(lockstr),
		mainstr2 = striptags(mainstr),
		locklen = lockstr2.length,
		mainlen = mainstr2.length;
	if(((locklen==87 || locklen==100) && (mainlen==87 || mainlen==100)) || (!(locklen==87 || locklen==100) && !(mainlen==87 || mainlen==100) && lockstr.split('\n').length == 1)){
		lockmsg.innerHTML = '<span style="color:orange">One and only one of the items to be merged must be a Lock<span>';
		throw('invalid DH merge')
	}
	if (locklen == 87 || locklen == 100){					//if it's a Lock in the lock box, merge it with the Key, clear lock box so it doesn't get merged next time
		if (mainstr == ''){
			lockmsg.innerHTML = 'Nothing to merge this Lock with';
			throw('invalid merge')
		}
		if (learnOn){
			var reply = confirm("The Lock in the Locks box will be combined with the Key in the main box, and the resulting Key will replace both. Cancel if this is not what you want.");
			if(reply===false) throw("merge canceled");
		};
		if (lockstr2.length == 100) lockstr2 = changeBase(lockstr2.toLowerCase(), BASE38, BASE64, true); 		//ezLok replaced by regular Lock
		document.getElementById('mainBox').innerHTML = makeshared(mainstr,lockstr2,'');
		document.getElementById('lockBox').value = document.getElementById('mainBox').innerHTML;
		lockmsg.innerHTML = 'Lock merged with Key in main box';
		return
	} else if ((mainlen == 87 || mainlen == 100) && lockstr.split('\n').length == 1 && lockstr!=''){		//if it's a Lock in the main box and not multiline in the lock box
		if (learnOn){
			var reply = confirm("The Key in the Locks box will be combined with the Lock in the main box, and the resulting Key will replace both. Cancel if this is not what you want.");
			if(reply===false) throw("merge canceled");
		};
		if (mainstr2.length == 100) mainstr2 = changeBase(mainstr2.toLowerCase(), BASE38, BASE64, true)
		document.getElementById('mainBox').innerHTML = makeshared(lockstr,mainstr2,'');
		document.getElementById('lockBox').value = document.getElementById('mainBox').innerHTML;
		lockmsg.innerHTML = 'Key merged with Lock in main box';
		return

	} else if(lockstr.split('\n').length > 1){

	//now the real database merge, which implies multiline
		if (learnOn){
			var reply = confirm("The items in the box will be merged into the permanent directory, replacing existing items of the same name. This is irreversible. Cancel if this is not what you want.");
			if(reply==false) throw("lockDB merge canceled");
		}
		if(!fullAccess){
			if(document.getElementById('lockscr').style.display == 'block'){
				lockmsg.innerHTML = 'Merge not available after Key cancel<br>Please restart PassLok';
			}else{
				mainmsg.innerHTML = 'Settings update not available after Key cancel<br>Please restart PassLok';
			}
			throw('DB merge canceled')
		}
		var newDB = JSON.parse('{"' + document.getElementById('lockBox').value.trim().replace(/\n +/g,'\n').replace(/:\n/g,'":["').replace(/\n\n/g,'"],"').replace(/\n/g,'","') + '"]}');
		newDB = realNulls(newDB);
		lockDB = sortObject(mergeObjects(lockDB,newDB));
		localStorage[userName] = JSON.stringify(lockDB);
		lockNames = Object.keys(lockDB);
		window.setTimeout(function(){
			lockmsg.innerHTML = 'Items merged into database';
		}, 100);
		document.getElementById('email').value = keyDecrypt(lockDB['myself'][2]);
		fillList();

		if(ChromeSyncOn){
			for(var name in lockDB){										//if Chrome sync is available, change all this in sync storage
				syncChromeLock(name,JSON.stringify(lockDB[name]))
			}
		}
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

//makes encrypted backup of the whole DB, then if allowed clears lockDB object, then stores
function moveLockDB(){
	var optionmsg = document.getElementById("optionmsg");
	if(!fullAccess){
		optionmsg.innerHTML = 'Move not allowed after Key cancel<br>Please restart PassLok';
		throw('DB move canceled')
	}
	callKey = 'movedb';
	var key = readKey();

	//first encrypt lockDB, as displayed by showLockDB
	showLockDB();
	var datacrypt = keyEncrypt(key,document.getElementById('lockBox').value.trim());
	document.getElementById('mainBox').innerHTML = triple('PL21dir=' + datacrypt + '=' + calcRScode(datacrypt) + '=PL21dir');
	optionmsg.innerHTML = '<span>Database in Main tab</span>'

	//now check that the user really wants to delete the database
	var answer = confirm("Your local directory has been exported to the Main tab. If you click OK, it will now be erased from this device. This cannot be undone.");
	if (answer == false) throw("lockDB erase canceled");
	
	if(ChromeSyncOn){											//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to delete also from the Chrome sync area?')){
			for(var name in lockDB) remChromeLock(name)
		}
	}
		
	lockDB = {};
	delete localStorage[userName];
	lockNames = [];
	optionmsg.innerHTML = '<span style="color:purple">Stored items erased</span>';
	fillList();
	suspendFindLock = false;
	callKey = '';
}

//deletes extra data from all entries
function resetLockDB(){
	var lockmsg = document.getElementById("lockmsg");
	if(!fullAccess){
		lockmsg.innerHTML = 'Reset not allowed after Key cancel<br>Please restart PassLok';
		throw('DB reset canceled')
	}
	var answer = confirm("If you click OK, the extra data for every item will be erased. This cannot be undone.");
	if (answer == false) throw("lockDB reset canceled");	
	for(var name in lockDB){
		if(name !='myself') lockDB[name].splice(1);
		
		if(ChromeSyncOn){									//if Chrome sync is available, add to sync storage
			syncChromeLock(name,JSON.stringify(lockDB[name]))
		}
			
	}
	localStorage[userName] = JSON.stringify(lockDB);
	suspendFindLock = false;
}

//makes encrypted backup of the 'myself' entry only, then if allowed clears it, then stores
function moveMyself(){
	callKey = 'movemyself';
	var mainmsg = document.getElementById("mainmsg");
	var optionmsg = document.getElementById("optionmsg");

	//first encrypt myself data, as displayed by showLockDB
	showMyself();
	if(fullAccess){
		var key = readKey();
		var datacrypt = keyEncrypt(key,document.getElementById('mainBox').innerHTML.trim());
		document.getElementById('mainBox').innerHTML = triple('PL21bak=' + datacrypt + "=" + calcRScode(datacrypt) + '=PL21bak');
		var msg = 'The item in the box contains your backed-up settings<br>To restore them, click Lock/Unlock';
		mainmsg.innerHTML = msg;
	}else{
		var msg = 'These are your settings, possibly including your encrypted random token<br>You may want to save them in a safe place.'
	}
	optionmsg.innerHTML = 'Backed-up settings on Main tab';
	
	//now check that the user really wants to delete the database
	var answer = confirm("Your settings, including the email/token, have been backed up. If you click OK, they will now be erased from this device. This cannot be undone.");
	if (answer == false) throw("myself erase canceled");
	delete lockDB['myself'];
	localStorage[userName] = JSON.stringify(lockDB);
	lockNames = Object.keys(lockDB);
	fillList();
	mainmsg.innerHTML = 'Your settings, including the email/token, have been erased<br>' + msg;
	optionmsg.innerHTML = 'Settings erased';
	
	if(ChromeSyncOn){											//if Chrome sync is available, remove from sync storage
		if(confirm('Do you want to remove your settings also from the Chrome sync area?')) remChromeLock('myself')
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

//decrypts lockDB items one by one and encrypts them with new Key
function recryptDB(newkey){
	for(var name in lockDB){
		delete lockDB[name][1];										//this entry is useless after Key is changed. Will be remade later
		for(var index = 0; index < lockDB[name].length; index++){
			var content = lockDB[name][index];
			if(content){
				if(content.slice(0,1) == '~'){										//do only encrypted items
					content = keyDecrypt(content);
					content = keyEncrypt(newkey,content);
					lockDB[name][index] = content;
				}
			}
			if(ChromeSyncOn && index == 0){									//if Chrome sync is available, add to sync storage
				syncChromeLock(name,JSON.stringify(lockDB[name]))
			}
		}
	}
//change Lock stored under name 'myself'
	var email = readEmail();
	var newlock = makepub(newkey,email);
	myLock = newlock;
	myezLock = changeBase(myLock, BASE64, BASE38, true);
	newlock = keyEncrypt(newkey,newlock);
	lockDB['myself'][0] = newlock;
	localStorage[userName] = JSON.stringify(lockDB);
}

//reads old and new Key from boxes and calls recryptDB so lockDB is re-encrypted with the new Key
function changeKey(){
	var optionmsg = document.getElementById("optionmsg"),
		changemsg = document.getElementById("keychangemsg");
	if(!fullAccess){
		optionmsg.innerHTML = 'Key change not allowed after Key cancel';
		throw('Key change canceled')
	}	
	callKey = 'changekey';
	if (learnOn){
		var reply = confirm("The local directory will be re-encrypted with a new Key. Cancel if this is not what you want.");
		if(reply == false) throw("lockDB recrypt canceled");
	}	
	var newkey = document.getElementById('newKey').value.trim(),
		newkey2 = document.getElementById('newKey2').value.trim();
	if (newkey.trim() == "" || newkey2.trim() == ""){								//stop to display the entry form if new Key is empty
		document.getElementById("keyChange").style.display = "block";
		document.getElementById("shadow").style.display = "block";
		changemsg.innerHTML = 'Enter the new Key in both boxes';
		if(!isMobile){
			if(newkey.trim() == ""){
				document.getElementById("newKey").focus()
			}else{
				document.getElementById("newKey2").focus()
			}
		}
		throw ("stopped for new Key input")
	}
	if(newkey.trim() != newkey2.trim()){											//check that the two copies match before going ahead
		changemsg.innerHTML = "<span style='color:red'>The two Keys don't match</span>";
		throw ("Keys don't match")
	}

//everything OK, so do it!
	recryptDB(newkey);
	document.getElementById('newKey').value = "";									//on re-execution, read the box and reset it
	document.getElementById('newKey2').value = "";
	document.getElementById('keyChange').style.display = 'none';
	document.getElementById('shadow').style.display = 'none';
	document.getElementById('pwd').value = newkey;									//refill Key box, too
	
	if(ChromeSyncOn){
		for(var name in lockDB){
			syncChromeLock(name,JSON.stringify(lockDB[name]))
		}
	}
	
	if(document.getElementById('keyscr').style.display == 'block') document.getElementById('keyscr').style.display = 'none';
	document.getElementById('mainmsg').innerHTML = '<span style="color:green">The Key has changed</span>';
	document.getElementById('lockmsg').innerHTML = '<span style="color:green">The Key has changed</span>';
	document.getElementById('optionmsg').innerHTML = '<span style="color:green">The Key has changed</span>';
	callKey = '';
}

//grab the names in lockDB and put them on the Main tab selection box
function fillList(){
	var x = document.getElementById("locklist");
	if(document.getElementById('extrabuttonstop').style.display == 'block' && document.getElementById('basicbuttonsbot').style.display != 'block'){		//steganography buttons showing
		x.innerHTML = '<option value="" disabled selected style="color:#639789;">Choose one stored Cover text:</option><option value="default">default</option>';
		for(var name in lockDB){
			if(lockDB[name][0].length > 500){										//only cover texts, which are long
				x.innerHTML = x.innerHTML + '<option value="' + name + '">' + name + '</option>'
			}
		}
	}else{																			//normal behavior
		x.innerHTML = '<option value="" disabled selected style="color:#639789;">Select recipients:</option>';
		for(var name in lockDB){
			if(lockDB[name][0].length < 500){										//exclude cover texts, which are long
				x.innerHTML = x.innerHTML + '<option value="' + name + '">' + name + '</option>'
			}
		}
	}
	if(callKey != 'decryptlock' && callKey != 'decrypt' && callKey != 'addlock') resetList()
}

//take the selected names and put them in the Locks lower box. If any is a List, extract and merge with the other names, removing duplicates
var isList = false;												//so a decryption failure knows how to end
function fillBox(){
	callKey = 'fillbox';
	var x = document.getElementById("locklist");
	document.getElementById('lockBox').value = '';
	var list = '';
	for (var i = 0; i < x.options.length; i++) {
    	if(x.options[i].selected == true){
			if(x.options[i].value.slice(0,2) == '--'){					//it's a List, so decrypt it and add the contents to the box
				var itemcrypt = lockDB[x.options[i].value][0];
				if (!key) var key = readKey();
				isList = true;											//to return here if the Key is wrong
				list = list + '\n' + keyDecrypt(itemcrypt);
			}else if(x.options[i].value == 'default'){					//default cover selected
				var covername = 'default';
				newcover(defaultcovertext)
			}else if(lockDB[x.options[i].value][0].length > 500){		//it's a Cover, so decrypt it and make it the new Cover
				var covername = x.options[i].value;
				var covercrypt = lockDB[covername][0];
				if (!key) var key = readKey();
				isList = true;
				newcover(LZString.decompressFromBase64(keyDecrypt(covercrypt)));
			}else{
         		list = list + '\n' + x.options[i].value;
			}
    	}
  	}
	var array = list.trim().split('\n');
	if (array[0] != ''){
		array = array.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});  			//remove duplicates
		array = array.filter(function(n){return n});													//remove nulls
		array.sort();																					//alphabetical order
		list = '';
		var msg = 'Lock selected for: ';
		for(var index = 0; index < array.length; index++){
			list = list + '\n' + array[index];
			msg = msg + array[index] + ', '
		}
		document.getElementById('lockBox').value = list.trim();
	} else if(covername){
		var msg = covername + ' Cover text loaded';
	} else {
		var msg = '';
	}
	document.getElementById('mainmsg').innerHTML = XSSfilter(msg);
	document.getElementById('lockmsg').innerHTML = '';
	isList = false;
	callKey = '';
}

//empty the selection box on Main tab
function resetList(){
	var x = document.getElementById("locklist");
	for (var i = 0; i < x.options.length; i++) {
    	x.options[i].selected = false
  	}
	if(document.getElementById('extrabuttonstop').style.display == 'block' && document.getElementById('basicbuttonsbot').style.display != 'block'){
		document.getElementById('mainmsg').innerHTML = 'Cover text not changed'
	}else{
		document.getElementById('lockBox').value = '';
		document.getElementById('mainmsg').innerHTML = 'No Locks selected'
	}
}

//grab the names in localStorage and put them on the userName selection box
function fillNameList(){
	var x = document.getElementById("namelist");	
		x.innerHTML = '<option value="" disabled style="color:#639789;">Select User Name:</option>';
		var list = [];
		for(var name in localStorage){
			list = list.concat(name)
		}
		list.sort(function (a, b) {											//case-insensitive sort
    		return a.toLowerCase().localeCompare(b.toLowerCase());
		});;
		for(var i = 0; i < list.length; i++){
				x.innerHTML = x.innerHTML + '<option value="' + list[i] + '">' + list[i] + '</option>'
		}
}