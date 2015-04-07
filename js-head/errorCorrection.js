//optionally call RS code regenerator. If too long, ask the user first
function calcRStag(string){
	var RStag = '';
	if(document.getElementById('ReedSol').checked){
		if(string.length < 100000){
			RStag = '=' + calcRScode(string)
		}else{
			var reply = confirm("Adding error correction code for output this long will take a long time. Cancel if you'd rather not wait.");
			if(reply == true) {
				RStag = '=' + calcRScode(string) 
			}
		}
	}
	return RStag
}

//calculate the RS checksum for the item
function calcRScode(string){
	string = string.replace(/\s/g,'').replace(/[^a-zA-Z0-9+/~!@#$*%=]+/g,'');				//remove tags, spaces, etc.
	string = string.split("=");
	string = string.sort(function (a, b) { return b.length - a.length; })[0];
	if (string.length == 50) string = string.toLowerCase();								//ezLoks are case-insensitive
	if (string != '') {
		return extractRScode(string);
	}
}

//extract the second largest segment of a '=' separated string, which should be the RS checksum
function getRScode(string){
	string = string.replace(/[\s-]/g,'');														//remove spaces and line feeds
	string = string.split("=")																	//split into segments
	string = string.sort(function (a, b) { return b.length - a.length; })[1];				//get the second largest piece
	if (string == null) return '';
	string = string.toLowerCase();
	if (string.match('pl2') != null){
		string = ''																			//return nothing if it's an end tag
	}
	return string	
}

//verifies the RS checksum, if it exists, of the string and replaces the string with the stripped and corrected item
function applyRScode(string,isMsg){									//string also contains the checksum and possibly tags
	var n = 5;
	string = string.replace(/[\s-]/g,'');													//cleanup spaces etc
	var hexRS = getRScode(string);
	string = string.split("=");																//split into segments
	string = string.sort(function (a, b) { return b.length - a.length; })[0];				//get largest
	if(string.length > 100000 && hexRS.length > 100){
			var reply = confirm("Checking error correction code for an item this long will take a long time. Cancel if you'd rather not wait.");
			if(reply == false) return string;
	}
	var groups = Math.ceil(string.length / (255 - n));
	if (hexRS.length == groups * (2 * n) && string.length != 43 && string.length != 50){		//found a complete checksum, so now use it, but not for a Lock
		if(isMsg){																			//flag invalid characters
			string = string.charAt(0).replace(/[^~!@#$*%]/g,'ã') + string.slice(1).replace(/[^a-zA-Z0-9+/%]/g,'ã')	//locked msg or sig
		}else{
			string = string.replace(/[^a-zA-Z0-9+/]/g,'ã')									//not a locked msg
		}
		return useHexRScode(string,hexRS)
	} else{
		return string
	}
}

//replaces Lock in the local directory with its corrected version
function applyRStoLock(){
	var lockmsg = document.getElementById('lockmsg');
		lockmsg.innerHTML = '';
	var text = document.getElementById('lockBox').value;
	var	strings = text.split(/\r?\n/);
	var lastline = strings[strings.length-1];
	if (lastline.slice(0,4) != 'http'){
		var lock = lastline;
		var restOfLocks = strings.slice(0,strings.length-1)
	}else{
		var lock = strings[strings.length-2]									//in case there is a video URL as last line
		var restOfLocks = strings.slice(0,strings.length-2)
	}
	lock = bestOfThree(lock);
	var hexRS = getRScode(lock);
	var lockstripped = lock.replace(/[\s-]/g,'').split("=").sort(function (a, b) { return b.length - a.length; })[0];
	
	if (lockstripped.length == 60){											//correct checksum, if written as part of ezLok
		hexRS = lockstripped.slice(50,60);
		lockstripped = lockstripped.slice(0,50);
		if(document.getElementById('notags').checked){
			document.getElementById('lockBox').value = lockstripped.match(/.{1,5}/g).join('-') + '=' + hexRS
		}else{
			document.getElementById('lockBox').value = 'PL22ezLok=' + lockstripped.match(/.{1,5}/g).join('-') + '=' + hexRS +'=PL22ezLok'
		}
	}
	if (lockstripped.length == 53){											//correct checksum, if written as part of regular lock
		hexRS = lockstripped.slice(43,53);
		lockstripped = lockstripped.slice(0,43);
		if(document.getElementById('notags').checked){
			document.getElementById('lockBox').value = lockstripped + '=' + hexRS
		}else{
			document.getElementById('lockBox').value = 'PL22lok=' + lockstripped + '=' + hexRS + '=PL22lok'
		}
	}
	suspendFindLock = true;															//allow writing a name without searching
	if (lockstripped.length != 43 && lockstripped.length != 50) return				//do nothing if it's not a Lock	
	if (hexRS.length == 10){														//found a complete code, so now check it
		lockstripped = lockstripped.replace(/[^a-zA-Z0-9+/]/g,'ã');					//flag invalid characters																
		document.getElementById('lockBox').value = (restOfLocks.join('\n') + '\n' + useHexRScode(lockstripped,hexRS)).trim();
		setTimeout(function(){lockmsg.innerHTML = "Lock detected and corrected per the tags";}, 500);		//add delay so this is seen
	}else{
		lockmsg.innerHTML = 'Lock detected';
	}
}

//convert a string into an array of decimal character codes
function string2charArray(string){
	var output = [];
	for(var i = 0;i < string.length; i++){
		output[i] = string.charCodeAt(i)
	};
	return output
}

//convert an array of 8-bit decimal codes into a hexadecimal string
function charArray2hex(charArray){
	var output = '';
	for(var i = 0;i < charArray.length; i++){
		var newstring = charArray[i].toString(16);
		if (newstring.length < 2) newstring = '0' + newstring;
		output = output + newstring
	};
	return output
}

//convert a hexadecimal string (two characters per byte) into an array of decimal codes. Wrong codes marked as -1
function hex2charArray(string){
	var output = [];
	for(var i = 0;i < string.length; i=i+2){
		var a = parseInt(string.slice(i,i+2),16);
		if(isNaN(a)){
			output[i/2] = -1
		}else{
			output[i/2] = a
		}
	};
	return output
}

//extract the RS code appended to each 255-character piece of a string
function extractRScode(string){
	var n = 5;
	var rs = new ReedSolomon(n);
	var enc = rs.encode(string);
	if (string.length <= 255 - n){
		var hexRS = charArray2hex(enc.slice(string.length))
	}else{
		var groups = Math.floor(string.length / (255 - n)) + 1;
		var hexRS = '';
		for (var i = 1; i <= groups; i++){
			if (i != groups){
				hexRS = hexRS + charArray2hex(enc.slice(255*i - n, 255*i))
			}else{
				hexRS = hexRS + charArray2hex(enc.slice(enc.length - n))
			}
		}
	};
	return hexRS
}

//use a hexadecimal RS code to correct its matching string
function useHexRScode(string,hexRS){
	var n = 5;
	var rs = new ReedSolomon(n);
	var RSarray = hex2charArray(hexRS);
	if (string.length <= 255 - n){
		var enc = flagInvalidChars(string2charArray(string));
		enc = enc.concat(RSarray)
	}else{
		var groups = Math.floor(string.length / (255 - n)) + 1;
		var enc = [];
		for (var i = 0; i < groups; i++){
			enc = enc.concat(flagInvalidChars(string2charArray(string.slice((255-n)*i,(255-n)*(i+1)))));
			enc = enc.concat(RSarray.slice(n*i,n*(i+1)))
		};	
	};
	try{
		return rs.decode(enc)
	}catch(err){
		var msg = 'Error correction failed. Maybe retry without tags.';
		if(document.getElementById('lockscr').style.display == 'none'){
			document.getElementById('mainmsg').innerHTML = msg
		}else{
			document.getElementById('lockmsg').innerHTML = msg
		}		
	}
}

//flag invalid PassLok characters as erasures
function flagInvalidChars(array){
	for(var i=0;i<array.length;i++){
		if(array[i] == 227) array[i] = -1
	}
	return array	
}

//takes string three times, separated by @@ signs, if triple checkbox is on
function triple(string){
	if(document.getElementById('triple').checked){
		return string + '@@' + string + '@@' + string
	}else{
		return string
	}
}

//compare three versions of the same string, separted by @@ and come up with a good single version after errors, omissions, and additions are removed
function bestOfThree(text){
	var string = text.split('@@');
	if(string.length != 3) return text;													//if not three parts, return the original
	
	string = string.sort(function (x, y) { return x.length - y.length; });							//sort by size, longest first
	var result = '';
	for (var i = 0;i <= string[0].length; i++){
		if (string[0].charAt(i)==string[1].charAt(i)){												//find matches in two out of three
			result = result + string[0].charAt(i);
			if (string[0].charAt(i)!=string[2].charAt(i)){							//if the third is different, we need to do some work
				if(string[2].charAt(i)==string[0].charAt(i+1)){					//a character has been lost in string[2], so add it back
					var length2 = string[2].length;
					string[2] = [string[2].slice(0,i),string[0].charAt(i+1),string[2].slice(i,length2)].join('')
				} else if(string[2].charAt(i)==string[1].charAt(i+1)){
					var length2 = string[2].length;
					string[2] = [string[2].slice(0,i),string[1].charAt(i+1),string[2].slice(i,length2)].join('')
				} else if(string[2].charAt(i+1)==string[0].charAt(i) || string[2].charAt(i+1)==string[1].charAt(i)){	//a character has been added to string[2], so remove it
					var length2 = string[2].length;
					string[2] = [string[2].slice(0,i-1),string[2].slice(i,length2)].join('')
				}
			}
		}else if (string[0].charAt(i)==string[2].charAt(i)){
			result = result + string[0].charAt(i)
			if (string[0].charAt(i)!=string[1].charAt(i)){
				if(string[1].charAt(i)==string[0].charAt(i+1)){					//a character has been lost in string[1], so add it back
					var length2 = string[1].length;
					string[1] = [string[1].slice(0,i),string[0].charAt(i+1),string[1].slice(i,length2)].join('')
				} else if(string[1].charAt(i)==string[2].charAt(i+1)){
					var length2 = string[1].length;
					string[1] = [string[1].slice(0,i),string[2].charAt(i+1),string[1].slice(i,length2)].join('')
				} else if(string[1].charAt(i+1)==string[0].charAt(i) || string[1].charAt(i+1)==string[2].charAt(i)){	//a character has been added to string[1], so remove it
					var length2 = string[1].length;
					string[1] = [string[1].slice(0,i-1),string[1].slice(i,length2)].join('')
				}
			}			
		}else if (string[1].charAt(i)==string[2].charAt(i)){
			result = result + string[1].charAt(i)
			if (string[1].charAt(i)!=string[0].charAt(i)){
				if(string[0].charAt(i)==string[1].charAt(i+1)){					//a character has been lost in string[0], so add it back
					var length2 = string[0].length;
					string[0] = [string[0].slice(0,i),string[1].charAt(i+1),string[0].slice(i,length2)].join('')
				} else if(string[0].charAt(i)==string[2].charAt(i+1)){
					var length2 = string[0].length;
					string[0] = [string[0].slice(0,i),string[2].charAt(i+1),string[0].slice(i,length2)].join('')
				} else if(string[0].charAt(i+1)==string[1].charAt(i) || string[0].charAt(i+1)==string[2].charAt(i)){	//a character has been added to string[0], so remove it
					var length2 = string[0].length;
					string[0] = [string[0].slice(0,i-1),string[0].slice(i,length2)].join('')
				}
			}
		} else {																	//no match found in all three, can't find a solution
			var msg = 'No match in triple item. Maybe retry with a single item';
			if(document.getElementById('lockscr').style.display == 'none'){
				document.getElementById('mainmsg').innerHTML = msg
			}else{
				document.getElementById('lockmsg').innerHTML = msg
			}
			throw('no match in two out of three')
		}
	}
	return result
}