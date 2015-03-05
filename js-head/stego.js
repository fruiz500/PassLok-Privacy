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
	var mainmsg = document.getElementById("mainmsg");
		mainmsg.innerHTML = "";
	var text = XSSfilter(document.getElementById('mainBox').innerHTML).replace(/_/g,'');
	if(text == ""){
		mainmsg.innerHTML = '<span style="color:red">No text in the box</span>';
		throw("no text")
	}
	if(legalItem(text)){										//legal item found: encode it
		if(document.getElementById('phrasemode').checked){
			toPhrases(text);
			mainmsg.innerHTML = 'Message encoded as sentences of varying length. Decoding does not require a Cover text'
		}else if(document.getElementById('wordmode').checked){
			toWords(text);
			mainmsg.innerHTML = 'Message encoded into words of this text. Decoding requires the same Cover text'
		}else if(document.getElementById('spacemode').checked){
			toSpaces(text);
			if(mainmsg.innerHTML=="") mainmsg.innerHTML = 'Message encoded into spaces of this text. Decoding does not require a Cover text.'	
		}else{
			toChains(text);
			mainmsg.innerHTML = 'Message encoded into sentences in this text. Decoding requires the same Cover text'
		}
	}else{												//no legal item found: try to decode
		var doublespaces = text.match(/ &nbsp;/g);
		if(doublespaces){
			if(doublespaces.length > 10) {				//detect at least 10 double spaces and then invoke spaces decoder
				fromSpaces(text);
				mainmsg.innerHTML = 'Message extracted from Spaces encoding';
				return
			}
		}
		if(text.match(':') != null){				//detect colons and if there are any invoke Sentences decoder
			fromPhrases(text);
			mainmsg.innerHTML = 'Message extracted from Sentences encoding'
		}else if(text.match(/[\?\uFF1A]/g) != null){		//detect question marks or Chinese colons, if present call chains decoder
			fromChains(text);
			mainmsg.innerHTML = 'Message extracted from Chains encoding'
		}else{												//no special characters detected: words decoder
			fromWords(text);
			mainmsg.innerHTML = 'Message extracted from Words encoding'
		}
	}
}

//chains encoder
function toChains(text){
	var mainmsg = document.getElementById("mainmsg");
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("The contents of the main box will be replaced with fake text containing it in encoded form. The recipient must have the same Cover text. Cancel if this is not what you want.");
		if(reply===false) throw("toChains canceled");
	}
	var stego = new MarkovTextStego(),
		model = new stego.NGramModel(2),
		corpus = covertext.split('.');
	model.import(corpus);
	var codec = new stego.Codec(model);
	document.getElementById('mainBox').innerHTML = codec.encode(text);
	randomBreaks(10);
	smallOutput();
}

//chains decoder
function fromChains(text){
	if (learnOn){
		var reply = confirm("The encoded text in the main box will be replaced with the original text. You must have loaded the appropriate cover text. Cancel if this is not what you want.");
		if(reply===false) throw("toChains canceled");
	}
	var text = text.replace(/&nbsp;/g,''),
		stego = new MarkovTextStego(),
		model = new stego.NGramModel(2);
		corpus = covertext.split('.');
	model.import(corpus);
	var codec = new stego.Codec(model);
	document.getElementById('mainBox').innerHTML = codec.decode(text);
}

//the following two are to encode or decode each character of the main box into a word from the covertext
function toWords(text){
	var mainmsg = document.getElementById("mainmsg");
		mainmsg.innerHTML = "";
	if (learnOn){
		var reply = confirm("The contents of the main box will be replaced with fake text containing it in encoded form. The recipient must have the same Cover text. Cancel if this is not what you want.");
		if(reply===false) throw("toWords canceled");
	}
	var code = makeCode(covertext);
	if(code.length < keyAlphabet.length){
		mainmsg.innerHTML = 'The Cover text does not contain enough unique words';
		throw('cover text too short')
	}
	var output = code[randomindex(code.length,keyAlphabet.indexOf(text[0]))];
	for (var i = 1; i < text.length; i++){
		var index = keyAlphabet.indexOf(text[i]);
		output = output + randompunct() + code[randomindex(code.length,index)]					//add some random commas and periods, and spaces between words
	}
	output = output.replace(/[.][\s\n][a-z]/g,function(a){return a.toUpperCase();}).replace(/[a-z]/,function(a){return a.toUpperCase();}) + "."; //capitalize initial and after period, add final period.
	document.getElementById('mainBox').innerHTML = output;
	randomBreaks(20);
	smallOutput();
}

function fromWords(text){
	if (learnOn){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. You must have loaded the appropriate cover text. Cancel if this is not what you want.");
		if(reply===false) throw("fromWords canceled");
	}
	var	textlow = text.toLowerCase().replace(/&nbsp;/g,'').replace(/[,\.]+/g,'').replace(/[\s\n]+/g,' '),		//make lowercase and strip periods, commas and newlines
		textvector = textlow.split(" "),											//break up the main box into an array of words
		code = makeCode(covertext),
		output = "";
	for (var i = 0; i < textvector.length; i++){									//find the words in the covertext
		var index = searchStringInArray(textvector[i],code);
		if(index == -1) {
			document.getElementById("mainmsg").innerHTML = 'Decoding has failed. Try with a different cover text';
			throw('words are not in code')			
		}
		output = output + keyAlphabet[index % keyAlphabet.length]
	}
	document.getElementById('mainBox').innerHTML = output
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
	var textArray = document.getElementById('mainBox').innerHTML.split('. '),
		output = textArray[0];
	for (var i = 1; i < textArray.length; i++){
		if (Math.ceil(Math.random() * 100) <= percentage){				//insert paragraph break after a certain percentage of periods.
			output = output + '. <br>' + textArray[i]
		}else{
			output = output + '. ' + textArray[i]
		}
	}
	document.getElementById('mainBox').innerHTML = output
}

//the following functions are to hide text into a text cover, as binary double spaces. It needs a little under 7 cover words for each ASCII characters, 42 for non-ASCII
function encoder(bin){
	var textsplit = covertext.split(" ");
	var spaces = textsplit.length - 1;
	var missing = bin.length - spaces;
	var turns = 0;
	if (spaces < bin.length){
		while (spaces < bin.length){
			textsplit = textsplit.concat(covertext.split(" "));
			spaces = textsplit.length - 1;
			turns = turns + 1
		}
		mainmsg.innerHTML = 'The cover text was too short. It was repeated ' + turns + ' times. If this is not acceptable, repeat with a larger cover.';
	}
		textsplit = textsplit.slice(0,bin.length+2);
	var newtext = textsplit[0];
	for(var i=0; i < textsplit.length-1; i++){
		newtext = newtext + stegospace(bin.slice(i,i+1)) + textsplit[i+1]
	}
	return newtext
}

function decoder(text){
	var bin = "";
	var textsplit = text.split(" ");
	for(var i=1; i < textsplit.length-1; i++){
		if (textsplit[i] == ""){
			bin = bin + "1";
			i = i + 1					//skip next word
		}else{
			bin = bin + "0"
		}
	}
	return bin
}

function stegospace(bin){
	if(bin == "1"){
		return " &nbsp;"				//HTML space
	}else{
		return " "						//regular space
	}
}

function toSpaces(text) {
	if (learnOn){
		var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as formatted spacing. Cancel if this is not what you want.");
		if(reply===false) throw("toSpaces canceled");
	}
	var output="";
    for (var i=0; i < text.length; i++) {
		var bin = "000" + text[i].charCodeAt(0).toString(2);
        output = output + bin.slice(bin.length-7,bin.length);
    }
	document.getElementById('mainBox').innerHTML = encoder(output);
	randomBreaks(30);
	smallOutput();
}

function fromSpaces(text) {
	if (learnOn){
		var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
		if(reply===false) throw("fromSpaces canceled");
	}
	var input=decoder(text.replace(/ &nbsp; ?/g,'  ')),
		output="";
    for (var i=0; i < input.length; i=i+7) {
		var bin = input.slice(i,i+7);
        output = output + String.fromCharCode(parseInt(bin,2));
    }
	document.getElementById('mainBox').innerHTML = output.replace(/\x00/g,'');		//take out nulls, in case text was added to finish the last sentence.
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
			document.getElementById('mainmsg').innerHTML = 'Please use a Cover text with more different sentences.';
			throw('Insufficient variety in covertext')
		}
	}
	return bins
}

//encodes text as sentences of varying length (12 different values)
function toPhrases(text){
var		phraseArray = makePhraseMatrix(covertext),
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
	document.getElementById('mainBox').innerHTML = out.trim();
	randomBreaks(40);
	smallOutput()
}

//decodes text encoded as sentences of varying length
function fromPhrases(text){
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
	document.getElementById('mainBox').innerHTML = out
}

//this one is to display the cover text or change it as requested
function newcover(string){
	var mainmsg = document.getElementById("mainmsg");
	mainmsg.innerHTML = "";
	
//remove multiple spaces, spaces after linefeed
	var newcovertext = string.replace(/   +/g, "\t").replace(/  +/g, " ").replace(/ &nbsp;+/g, " ").replace(/\n /g,"\n\t").replace(/--/g,', ').replace(/_/g,'');
	
//add spaces if Chinese, Korean, or Japanese
	if (newcovertext.match(/[\u3400-\u9FBF]/) != null) newcovertext = newcovertext.split('').join(' ').replace(/\s+/g, ' ');														
	covertext = newcovertext;
	mainmsg.innerHTML = '<span style="color:green">Cover text changed</span>'
}

// load image for hiding text
var importImage = function(e) {
	if (learnOn){
		var reply = confirm("An image stored in this device will replace the current image. Cancel if this is not what you want.");
		if(reply==false) throw("image import canceled");
	}

    var reader = new FileReader();

    reader.onload = function(event) {
        // set the preview
        document.getElementById('preview').style.display = 'block';
        document.getElementById('preview').src = XSSfilter(event.target.result);
    };

    reader.readAsDataURL(e.target.files[0]);
	document.getElementById('preview').onload = function(){updateCapacity()}
};

//show how much text can be hidden in the image
function updateCapacity(){
	var image = document.getElementById('preview');
	var capacity = Math.floor(image.naturalHeight*image.naturalWidth*3/8);
	var textsize = document.getElementById('mainBox').innerHTML.length;
	if(textsize <= capacity){
	document.getElementById('imagemsg').innerHTML='This image can hide ' + capacity + ' characters. The main box has ' + textsize + ' characters'
	}else{
		document.getElementById('imagemsg').innerHTML='This image can hide ' + capacity + ' characters. <span style="color:red">But the main box has ' + textsize + ' characters</span>'
	}
}

//put text into image, which turns into PNG
function encodeImage(){
	if (learnOn){
		var reply = confirm("The text in the previous box will be encoded into this image, which can then be copied and sent to others. Cancel if this is not what you want.");
		if(reply==false) throw("encode image canceled");
	}
	var text = document.getElementById('mainBox').innerHTML;
	var imagemsg = document.getElementById('imagemsg');

	//bail out if this is not a PassLok string. Otherwise, this method can handle the full UTF-16 character set
	if(!legalItem(text)){
		imagemsg.innerHTML = '<span style="color:red">The text contains illegal characters for a PassLok string</span>';
		throw("illegal characters in box")
	}
	var encodedImage = steganography.encode(text,document.getElementById('preview').src,{"codeUnitSize": 8});

    // view the new image
    document.getElementById('preview').src = XSSfilter(encodedImage);
	document.getElementById('preview').onload = function(){
		imagemsg.innerHTML = 'Text hidden in the image. Save it now.'
	}
}

//extract text from image
function decodeImage(){
	if (learnOn){
		var reply = confirm("The text hidden in this image, if any, will be extracted and placed in the previous box, replacing its contents. This does not yet work on mobile devices. Cancel if this is not what you want.");
		if(reply==false) throw("decode image canceled");
	}
	var imagemsg = document.getElementById('imagemsg');
	var loadedImage = XSSfilter(document.getElementById('preview').src);
	var text = steganography.decode(loadedImage,{"codeUnitSize": 8});
	if (text == ''){
		imagemsg.innerHTML = 'This image does not contain any hidden text'
	}else{
		document.getElementById('mainBox').innerHTML = text;
		imagemsg.innerHTML = 'Go back to see the text extracted from this image'
	}
}