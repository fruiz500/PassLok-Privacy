//The following code is to convert the contents of main box into fake text, and back. This can be useful against email scanners.

if (typeof code == 'undefined'){			//default text for base64 to words conversion, global variable
	var defaultcovertext = "The licenses for most software and other practical works are designed to take away your freedom to share and change the works. By contrast, the GNU General Public License is intended to guarantee your freedom to share and change all versions of a program to make sure it remains free software for all its users. We, the Free Software Foundation, use the GNU General Public License for most of our software; it applies also to any other work released this way by its authors. You can apply it to your program, too. When we speak of free software, we are referring to freedom, not price. Our General Public Licenses are designed to make sure that you have the freedom to distribute copies of free softwares (and charge for them if you wish), that you receive source code or can get it if you want it, that you can change the software or use pieces of it in new free programs, and that you know you can do these things. To protect your rights, we need to prevent others from denying you these rights or asking you to surrender the rights. Therefore, you have certain responsibilities if you distribute copies of the software, or if you modify it: responsibilities to respect the freedom of others. For example, if you distribute copies of such a program, whether gratis or for a fee, you must pass on to the recipients the same freedoms that you received. You must make sure that they, too, receive or can get the source code. And you must show them these terms so they know their rights. Developers that use the GNU GPL protect your rights with two steps: (1) assert copyright on the software, and (2) offer you this License giving you legal permission to copy, distribute and or modify it. For the developers' and authors' protection, the GPL clearly explains that there is no warranty for this free software. For both users' and authors' sake, the GPL requires that modified versions be marked as changed, so that their problems will not be attributed erroneously to authors of previous versions.";
	var covertext = defaultcovertext;
		covertext = covertext.replace(/   +/g, "\t").replace(/  +/g, " ").replace(/\n /g,"\n\t");	//remove multiple spaces, space after linefeed
	var keyAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=~!@#$*%";	//base64 plus other characters used in PassLok strings
}

//detexts that all the characters in the text are in keyAlphabet
function legalItem(text){
	for (var i = 0; i < text.length; i++){
		var index = keyAlphabet.indexOf(text[i]);
		if(index == -1){
			return false
		}
	}
	return true
}

//to remove duplicates in array much more quickly than with array.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

//This function checks for legal PassLok output and calls the currently selected encoder. Otherwise it calls the decoder
function textStego(){
	mainMsg.innerHTML = "";
	var text = XSSfilter(mainBox.innerHTML).replace(/-/g,'');
	if(text == ""){
		mainMsg.innerHTML = '<span style="color:red">No text in the box</span>';
		throw("no text")
	}
	if(legalItem(text)){										//legal item found: encode it
		if(sentenceMode.checked){
			toPhrases(text);
			mainMsg.innerHTML = 'Message encoded as sentences of varying length. Decoding requires no Cover text'
		}else if(wordMode.checked){
			toWords(text);
			mainMsg.innerHTML = 'Message encoded into words of this text. Decoding requires the same Cover text'
		}else if(spaceMode.checked){
			toSpaces(text);
			if(mainMsg.innerHTML=="") mainMsg.innerHTML = 'Message encoded into spaces of this text. Decoding does not require a Cover text.'
		}else if(letterMode.checked){
			toLetters(text);
			if(mainMsg.innerHTML=="") mainMsg.innerHTML = 'Message encoded into letters of this text. Decoding does not require a Cover text. Please complete it.'	
		}else{
			toChains(text);
			mainMsg.innerHTML = 'Message encoded into sentences in this text. Decoding requires the same Cover text'
		}
	}else{												//no legal item found: try to decode
		var doublespaces = text.match(/ &nbsp;/g);
		if(doublespaces){
			if(doublespaces.length > 10) {				//detect at least 10 double spaces and then invoke spaces decoder
				fromSpaces(text);
				mainMsg.innerHTML = 'Message extracted from Spaces encoding';
				return
			}
		}else if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){			//detect special characters used in Letters encoding
			fromLetters(text);
			mainMsg.innerHTML = 'Message extracted from Letters'
		}else if(text.match(':') != null){				//detect colons and if there are any invoke Sentences decoder
			fromPhrases(text);
			mainMsg.innerHTML = 'Message extracted from Sentences'
		}else if(text.match(/[\?\uFF1A]/g) != null){		//detect question marks or Chinese colons, if present call chains decoder
			try{
				fromChains(text);
				mainMsg.innerHTML = 'Message extracted from Chains encoding'
			}catch(err){
				mainMsg.innerHTML = 'Decoding has failed. Try with a different cover text'
			}
		}else{												//no special characters detected: words decoder
			fromWords(text);
			mainMsg.innerHTML = 'Message extracted from Words encoding'
		}
	}
}

//chains encoder
function toChains(text){
	mainMsg.innerHTML = "";
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be replaced with fake text containing it in encoded form. The recipient must have the same Cover text. Cancel if this is not what you want.");
		if(!reply) throw("toChains canceled");
	}
	var stego = new MarkovTextStego(),
		model = new stego.NGramModel(2),
		corpus = covertext.split('.');
	model.import(corpus);
	var codec = new stego.Codec(model);
	mainBox.innerHTML = codec.encode(text);
	randomBreaks(10);
	smallOutput();
}

//chains decoder
function fromChains(text){
	if (learnMode.checked){
		var reply = confirm("The encoded text in the main box will be replaced with the original text. You must have loaded the appropriate cover text. Cancel if this is not what you want.");
		if(!reply) throw("toChains canceled");
	}
	var text = text.replace(/&nbsp;/g,''),
		stego = new MarkovTextStego(),
		model = new stego.NGramModel(2);
		corpus = covertext.split('.');
	model.import(corpus);
	var codec = new stego.Codec(model);
	mainBox.innerHTML = codec.decode(text)
}

//the following two are to encode or decode each character of the main box into a word from the covertext
function toWords(text){
	mainMsg.innerHTML = "";
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be replaced with fake text containing it in encoded form. The recipient must have the same Cover text. Cancel if this is not what you want.");
		if(!reply) throw("toWords canceled");
	}
	var code = makeCode(covertext);
	if(code.length < keyAlphabet.length){
		mainMsg.innerHTML = 'The Cover text does not contain enough unique words';
		throw('cover text too short')
	}
	var output = code[randomindex(code.length,keyAlphabet.indexOf(text[0]))];
	for (var i = 1; i < text.length; i++){
		var index = keyAlphabet.indexOf(text[i]);
		output = output + randompunct() + code[randomindex(code.length,index)]					//add some random commas and periods, and spaces between words
	}
	output = output.replace(/[.][\s\n][a-z]/g,function(a){return a.toUpperCase();}).replace(/[a-z]/,function(a){return a.toUpperCase();}) + "."; //capitalize initial and after period, add final period.
	mainBox.innerHTML = output;
	randomBreaks(20);
	smallOutput();
}

function fromWords(text){
	if (learnMode.checked){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. You must have loaded the appropriate cover text. Cancel if this is not what you want.");
		if(!reply) throw("fromWords canceled");
	}
	var	textlow = text.toLowerCase().replace(/&nbsp;/g,' ').replace(/[,\.]+/g,'').replace(/[\s\n]+/g,' '),		//make lowercase and strip periods, commas and newlines
		textvector = textlow.split(" "),											//break up the main box into an array of words
		code = makeCode(covertext),
		output = "";
	for (var i = 0; i < textvector.length; i++){									//find the words in the covertext
		var index = searchStringInArray(textvector[i],code);
		if(index == -1) {
			mainMsg.innerHTML = 'Decoding has failed. Try with a different cover text';
			throw('words are not in code')			
		}
		output = output + keyAlphabet[index % keyAlphabet.length]
	}
	mainBox.innerHTML = output
}

//to make unique word list from a certain covertext
function makeCode(text){
	var code = text.toLowerCase().replace(/[\.,!?\*;:{}_()\[\]"…“”‘’„‚«»‹›—–―¿¡]|_/g, "").replace(/\s+/g, " ").split(" ");
	code = code.filter(function(n){return n});													//remove nulls
	return uniq(code);															//global array containing the words, no duplicates	
}

//Computes an index taking the full range of words in the covertext
function randomindex(codelength,index){
	var remainder = codelength % keyAlphabet.length,
		noptions = Math.floor(codelength / keyAlphabet.length);
	if(index >= remainder){
		var choice = Math.floor(Math.random() * noptions)
	}else{
		var choice = Math.floor(Math.random() * (noptions + 1))
	}
	return index + choice*keyAlphabet.length
}

//To find words in the code. Returns the index if found, or -1 if not found
function searchStringInArray (str, strArray) {
    for (var j = 0; j < strArray.length; j++) {
        if (strArray[j] == str) return j;
    }
    return -1;
}

//This is to generate random periods, commans and newlines, per the percentage brackets below, plus spaces when appropriate
function randompunct(){
	var percent = Math.ceil(Math.random() * 100);
	if (percent < 8) {
		return ". "
	} else if(percent < 14) {
		return ", "
	} else {
		return " "
	}
}

//inserts random newlines in main Box to break up long paragraphs
function randomBreaks(percentage){
	var textArray = mainBox.innerHTML.split('. '),
		output = textArray[0];
	for (var i = 1; i < textArray.length; i++){
		if (Math.ceil(Math.random() * 100) <= percentage){				//insert paragraph break after a certain percentage of periods.
			output = output + '. <br>' + textArray[i]
		}else{
			output = output + '. ' + textArray[i]
		}
	}
	mainBox.innerHTML = output
}

//the following functions are to hide text into a text cover, as binary double spaces. It needs a little under 7 cover words for each ASCII characters, 42 for non-ASCII
function encoder(bin){
	var textsplit = covertext.split(" ");
	var stegospace = {'0':' ','1':' &nbsp;'};
	var spaces = textsplit.length - 1;
	var turns = 0;
	if (spaces < bin.length){
		while (spaces < bin.length){
			textsplit = textsplit.concat(covertext.split(" "));
			spaces = textsplit.length - 1;
			turns = turns + 1
		}
		mainMsg.innerHTML = 'Message encoded into spaces of this text. It was repeated ' + turns + ' times.';
	}
		textsplit = textsplit.slice(0,bin.length + 1);
	var newtext = textsplit[0];
	var i = 0;
	for(i = 0; i < bin.length; i++){
		newtext = newtext + stegospace[bin.charAt(i)] + textsplit[i+1]
	}
	return newtext
}

function decoder(text){
	var bin = "";
	var textsplit = text.split(" ");
	for(var i=1; i < textsplit.length; i++){
		if (textsplit[i] == ""){
			bin = bin + "1";
			i = i + 1					//skip next word
		}else{
			bin = bin + "0"
		}
	}
	return bin
}

function toSpaces(text) {
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as formatted spacing. Cancel if this is not what you want.");
		if(!reply) throw("toSpaces canceled");
	}
	mainBox.innerHTML = encoder(toBin(text));
	randomBreaks(30);
	smallOutput();
}

//makes the binary equivalent (string) of an ASCII string
function toBin(text){
	var output="";
    for (var i = 0; i < text.length; i++) {
		var bin = text.charCodeAt(i).toString(2);
		while(bin.length < 7) bin = '0' + bin;
        output = output + bin;
    }
	return output	
}

function fromSpaces(text) {
	if (learnMode.checked){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
		if(!reply) throw("fromSpaces canceled");
	}
	var input = decoder(text.replace(/\.&nbsp;/g,'. ').replace(/ &nbsp; ?/g,'  ')),
		output = "";
    for (var i = 0; i < input.length; i = i+7) {
		var bin = input.slice(i,i+7);
        output = output + String.fromCharCode(parseInt(bin,2));
    }
	mainBox.innerHTML = output.replace(/\x00/g,'');		//take out nulls, in case text was added to finish the last sentence.
}

//makes phrase matrix for a given cover text, where sentences are catalogued by length mod 12
function makePhraseMatrix(cover){
	var phraseArray = cover.replace(/["…“”‘’„‚«»‹›¿¡]+/g,'').replace(/[\s\n]+/g,' ').slice(0,-1).split(/[.,;:?!] /),
		bins = [[],[],[],[],[],[],[],[],[],[],[],[]];
	for(var i = 0; i < phraseArray.length; i++){
		var lengthMod12 = phraseArray[i].length % 12;
		bins[lengthMod12] = bins[lengthMod12].concat(phraseArray[i]);
	}
	for(var i = 0; i < 12; i++){
		if(bins[i].length == 0){
			mainMsg.innerHTML = 'Please use a Cover text with more variation.';
			throw('Insufficient variety in covertext')
		}
	}
	return bins
}

//encodes text as sentences of varying length (12 different values)
function toPhrases(text){
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as sentences of varying length. Cancel if this is not what you want.");
		if(!reply) throw("toPhrases canceled");
	}
	var	phraseArray = makePhraseMatrix(covertext),
		punct = '.,;:!?',
		out = '';
	
	//now split the Base72-encoded string into a Base12 code to select sentence length, and a Base6 code to select punctuation
	for(var i = 0; i < text.length; i++){
		var index = keyAlphabet.indexOf(text[i]),
			phraseChoices = phraseArray[index % 12];
		out = out + phraseChoices[Math.floor(Math.random()*phraseChoices.length)] + punct[Math.floor(index/12)] + ' '
	}
	out = out.replace(/[.!?][\s\n][a-z]/g,function(a){return a.toUpperCase();}).replace(/[,;:][\s\n][A-Z]/g,function(a){return a.toLowerCase();}).trim();  //capitalization
	out = out.charAt(0).toUpperCase() + out.slice(1);
	mainBox.innerHTML = out.trim();
	randomBreaks(40);
	smallOutput()
}

//decodes text encoded as sentences of varying length
function fromPhrases(text){
	if (learnMode.checked){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
		if(!reply) throw("fromPhrases canceled");
	}
	text = text.replace(/&nbsp;/g,'').replace(/\n/g,'');
	var	textArray = text.split(/[.,;:!?]/g).slice(0,-1),
		punctArray = text.match(/[.,;:!?]/g),
		punct = ".,;:!?",
		out = '';
	for(var i = 0; i < textArray.length; i++){
		var index12 = textArray[i].trim().length % 12,
			index6 = punct.indexOf(punctArray[i]);
		out = out + keyAlphabet[index6 * 12 + index12]
	}
	mainBox.innerHTML = out
}

//Letters encoding is based on code at: http://www.irongeek.com/i.php?page=security/unicode-steganography-homoglyph-encoder, by Adrian Crenshaw, 2013
//first the object containing the Unicode character substitutions
var charMappings = {//Aa
					"a":"0", "a0":"a", "\u0430":"1", "a1":"\u0430",
					"A":"0", "A0":"A", "\u0391":"1", "A1":"\u0391",
					//Bb
					"B":"0", "B0":"B", "\u0392":"1", "B1":"\u0392",
					//Cc
					"c":"0", "c0":"c", "\u0441":"1", "c1":"\u0441",
					"C":"0", "C0":"C", "\u0421":"1", "C1":"\u0421",
					//Ee
					"e":"0", "e0":"e", "\u0435":"1", "e1":"\u0435",
					"E":"0", "E0":"E", "\u0415":"1", "E1":"\u0415",
					//Gg
					"g":"0", "g0":"g", "\u0261":"1", "g1":"\u0261",
					"G":"0", "G0":"G", "\u050C":"1", "G1":"\u050C",
					//Hh
					"H":"0", "H0":"H", "\u041D":"1", "H1":"\u041D",
					//Ii
					"i":"0", "i0":"i", "\u0456":"1", "i1":"\u0456",
					"I":"0", "I0":"I", "\u0406":"1", "I1":"\u0406",
					//Jj
					"j":"0", "j0":"j", "\u03F3":"1", "j1":"\u03F3",
					"J":"0", "J0":"J", "\u0408":"1", "J1":"\u0408",
					//Kk
					"K":"0", "K0":"K", "\u039A":"1", "K1":"\u039A",
					//Mm
					"M":"0", "M0":"M", "\u039C":"1", "M1":"\u039C",
					//Nn
					"N":"0", "N0":"N", "\u039D":"1", "N1":"\u039D",
					//Oo
					"o":"0", "o0":"o", "\u03BF":"1", "o1":"\u03BF",
					"O":"0", "O0":"O", "\u039F":"1", "O1":"\u039F",
					//Pp
					"p":"0", "p0":"p", "\u0440":"1", "p1":"\u0440",
					"P":"0", "P0":"P", "\u03A1":"1", "P1":"\u03A1",
					//Ss
					"s":"0", "s0":"s", "\u0455":"1", "s1":"\u0455",
					"S":"0", "S0":"S", "\u0405":"1", "S1":"\u0405",
					//Tt
					"T":"0", "T0":"T", "\u03A4":"1", "T1":"\u03A4",
					//Xx
					"x":"0", "x0":"x", "\u0445":"1", "x1":"\u0445",
					"X":"0", "X0":"X", "\u03A7":"1", "X1":"\u03A7",
					//Yy
					"y":"0", "y0":"y", "\u0443":"1", "y1":"\u0443",
					"Y":"0", "Y0":"Y", "\u03A5":"1", "Y1":"\u03A5",
					//Zz
					"Z":"0", "Z0":"Z", "\u0396":"1", "Z1":"\u0396",
					//Spaces
					" ":"000",
					" 000":" ",	
					"\u2004":"001",
					" 001":"\u2004",
					"\u2005":"010",
					" 010":"\u2005",
					"\u2006":"011",
					" 011":"\u2006",
					"\u2008":"100",
					" 100":"\u2008",
					"\u2009":"101",
					" 101":"\u2009",
					"\u202f":"110",
					" 110":"\u202F",
					"\u205F":"111",
					" 111":"\u205F"
					};

//counts the number of encodable bits in the cover text
function encodableBits(cover){
	var bitcount = 0;
	for (var i = 0; i < cover.length; i++){
		if (charMappings[cover[i]] !== undefined){
			bitcount = bitcount + charMappings[cover[i]].length;
		}
	}
	return bitcount
}

//encodes text as special letters and spaces in the cover text, which replace the original ones
function toLetters(text){
	if (learnMode.checked){
		var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as formatted special characters and spaces. Cancel if this is not what you want.");
		if(!reply) throw("toLetters canceled");
	}
	var textBin = toBin(text),
		cover = covertext,
		capacity = encodableBits(cover);
	if (capacity < textBin.length){						//repeat the cover text if it's too short
		var turns = Math.ceil(textBin.length / capacity);
		var index = 0;
		while (index < turns){
			cover = cover + ' ' + covertext;
			index++;
		};
		capacity = encodableBits(cover);
		mainMsg.innerHTML = 'Message encoded into letters of this text. It was repeated ' + turns + ' times. Please complete it.';
	}
	var finalString = "",
		bitsIndex = 0,
		i = 0,
		doneBits = '';
	while(doneBits.length < textBin.length){
		if (charMappings[cover[i]] === undefined){
			finalString = finalString + cover[i];
		}else{
			var tempBits = textBin.substring(bitsIndex,bitsIndex + charMappings[cover[i]].length);
			while(tempBits.length < charMappings[cover[i]].length){tempBits = tempBits + "0";} 			//Got to pad it out
			finalString = finalString + charMappings[cover[i] + tempBits];
			bitsIndex = bitsIndex + charMappings[cover[i]].length;
			doneBits = doneBits + tempBits;
		}
		i++;
	}
	mainBox.innerHTML = finalString;
}

//gets the original text from Letters encoded text
function fromLetters(text){
	if (learnMode.checked){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
		if(!reply) throw("fromLetters canceled");
	}
	var bintemp = "",
		finalString = "",
		tempchar = "";
	for (i = 0; i < text.length; i++){
		if (charMappings[text[i]] === undefined ){
		}else{
			tempchar = charMappings[text[i]];
			bintemp = bintemp + tempchar;
		}
	}
	for (i = 0; i < bintemp.length; i=i+7){
		var mybyte = String.fromCharCode(parseInt(bintemp.substring(i,i+7),2));
		if (mybyte == '\0'){
		}else{
			finalString = finalString + mybyte;
		}
	}
	mainBox.innerHTML = finalString;
}

//this one is to display the cover text or change it as requested
function newcover(string){
	mainMsg.innerHTML = "";
	
//remove multiple spaces, spaces after linefeed
	var newcovertext = string.replace(/   +/g, "\t").replace(/  +/g, " ").replace(/ &nbsp;+/g, " ").replace(/\n /g,"\n\t").replace(/--/g,', ').replace(/-/g,'');
	
//add spaces if Chinese, Korean, or Japanese
	if (newcovertext.match(/[\u3400-\u9FBF]/) != null) newcovertext = newcovertext.split('').join(' ').replace(/\s+/g, ' ');														
	covertext = newcovertext;
	mainMsg.innerHTML = '<span style="color:green">Cover text changed</span>'
}

// load image for hiding text
var importImage = function(e) {
	if (learnMode.checked){
		var reply = confirm("An image stored in this device will replace the current image. Cancel if this is not what you want.");
		if(!reply) throw("image import canceled");
	}

    var reader = new FileReader();

    reader.onload = function(event) {
        // set the preview
        preview.style.display = 'block';
        preview.src = XSSfilter(event.target.result);
    };

    reader.readAsDataURL(e.target.files[0]);
	preview.onload = function(){updateCapacity()}
};

//show how much text can be hidden in the image
function updateCapacity(){
	var capacity = Math.floor(preview.naturalHeight*preview.naturalWidth*3/8);
	var textsize = mainBox.innerHTML.length;
	if(textsize <= capacity){
	imagemsg.innerHTML='This image can hide ' + capacity + ' characters. The main box has ' + textsize + ' characters'
	}else{
		imagemsg.innerHTML='This image can hide ' + capacity + ' characters. <span style="color:red">But the main box has ' + textsize + ' characters</span>'
	}
}

//put text into image, which turns into PNG
function encodeImage(){
	if (learnMode.checked){
		var reply = confirm("The text in the previous box will be encoded into this image, which can then be copied and sent to others. Cancel if this is not what you want.");
		if(!reply) throw("encode image canceled");
	}
	var text = XSSfilter(mainBox.innerHTML).replace(/-/g,'');

	//bail out if this is not a PassLok string. Otherwise, this method can handle the full UTF-16 character set
	if(!legalItem(text)){
		imagemsg.innerHTML = '<span style="color:red">The text contains illegal characters for a PassLok string</span>';
		throw("illegal characters in box")
	}
	var encodedImage = steganography.encode(text,preview.src,{"codeUnitSize": 8});

    // view the new image
    preview.src = XSSfilter(encodedImage);
	preview.onload = function(){
		imagemsg.innerHTML = 'Text hidden in the image. Save it now.'
	}
}

//extract text from image
function decodeImage(){
	if (learnMode.checked){
		var reply = confirm("The text hidden in this image, if any, will be extracted and placed in the previous box, replacing its contents. This does not yet work on mobile devices. Cancel if this is not what you want.");
		if(!reply) throw("decode image canceled");
	}
	var loadedImage = XSSfilter(preview.src);
	var text = steganography.decode(loadedImage,{"codeUnitSize": 8});
	if (text == ''){
		imagemsg.innerHTML = 'This image does not contain any hidden text'
	}else{
		mainBox.innerHTML = text;
		imagemsg.innerHTML = 'Go back to see the text extracted from this image'
	}
}