//The following code is to convert the contents of main box into fake text, and back. This can be useful against email scanners.

if (typeof code == 'undefined'){			//default text for base64 to words conversion, global variable
    var defaultCoverText = "The licenses for most software and other practical works are designed to take away your freedom to share and change the works. By contrast, the GNU General Public License is intended to guarantee your freedom to share and change all versions of a program to make sure it remains free software for all its users. We, the Free Software Foundation, use the GNU General Public License for most of our software; it applies also to any other work released this way by its authors. You can apply it to your program, too. When we speak of free software, we are referring to freedom, not price. Our General Public Licenses are designed to make sure that you have the freedom to distribute copies of free softwares (and charge for them if you wish), that you receive source code or can get it if you want it, that you can change the software or use pieces of it in new free programs, and that you know you can do these things. To protect your rights, we need to prevent others from denying you these rights or asking you to surrender the rights. Therefore, you have certain responsibilities if you distribute copies of the software, or if you modify it: responsibilities to respect the freedom of others. For example, if you distribute copies of such a program, whether gratis or for a fee, you must pass on to the recipients the same freedoms that you received. You must make sure that they, too, receive or can get the source code. And you must show them these terms so they know their rights. Developers that use the GNU GPL protect your rights with two steps: (1) assert copyright on the software, and (2) offer you this License giving you legal permission to copy, distribute and or modify it. For the developers' and authors' protection, the GPL clearly explains that there is no warranty for this free software. For both users' and authors' sake, the GPL requires that modified versions be marked as changed, so that their problems will not be attributed erroneously to authors of previous versions.";
    var coverText = defaultCoverText;
        coverText = coverText.replace(/ +/g," ").replace(/ \n/g,"\n")									//remove multiple spaces, space before linefeed
}

//returns true if pure base64
function isBase64(string){
    return !string.match(/[^a-zA-Z0-9+\/]/)
}

//to remove duplicates in array much more quickly than with array.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    })
}

//This function checks for legal (base64 after tags are removed) PassLok output and calls the currently selected encoder. Otherwise it calls the decoder
function textStego(){
    var text = mainBox.innerHTML.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/">(.*?)\/a>$/,'').replace(/<br>/g,'').replace(/[\r\n]/g,'');
    if(text.match('==')) text = text.split('==')[1].replace(/-/g,'');						//remove tags and dashes
    text = text.replace(/<(.*?)>/gi,'');
    if(text == ""){
        mainMsg.textContent = 'No text in the box';
        return
    }

    blinkMsg(mainMsg);
setTimeout(function(){																			//the rest after a 20 ms delay
    if(isBase64(text)){										//pure base64 found: encode it
        if(sentenceMode.checked){
            toPhrases(text)
        }else if(wordMode.checked){
            toWords(text)
        }else if(spaceMode.checked){
            toSpaces(text)
        }else if(invisibleMode.checked){
            toInvisible(text)
        }else{
            toLetters(text)
        }
    }else{												//no legal item found: try to decode
        if(text.match('\u00ad')){						//detect soft hyphen
            fromInvisible(text);
            mainMsg.textContent = 'Message extracted from Invisible encoding'
        }else if(text.match('\u200c')){				//detect zero width non-joiner
            fromSpaces(text);
            mainMsg.textContent = 'Message extracted from Spaces encoding'
        }else if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){		//detect special characters used in Letters encoding
            fromLetters(text);
            mainMsg.textContent = 'Message extracted from Letters'
        }else if(text.match(':') != null){			//detect colons and if there are any invoke Sentences decoder
            fromPhrases(text);
            mainMsg.textContent = 'Message extracted from Sentences'
        }else{											//no special characters detected: words decoder
            fromWords(text);
            mainMsg.textContent = 'Message extracted from Words encoding'
        }
    }
    charsLeft()
},20);					//end of timeout
}

//makes array with words of 8 different lengths taken from the cover
function makeWordMatrix(cover){
    var wordArray = uniq(cover.replace(/[\.,!?\*;:{}_()\[\]"…“”‘’„‚«»‹›—–―¿¡]|_/g, "").replace(/[\s\n]+/g,' ').slice(0,-1).split(/ /)),
        bins = [[],[],[],[],[],[],[],[]];
    for(var i = 0; i < wordArray.length; i++){
        var lengthMod8 = wordArray[i].length % 8;
        bins[lengthMod8] = bins[lengthMod8].concat(wordArray[i])
    }
    for(var i = 0; i < 8; i++){
        if(bins[i].length == 0){
            mainMsg.textContent = 'Please use a Cover text with more variation';
            return
        }
    }
    return bins
}

//words encoder: each character is given a 2-digit base9 code, and replaced by two words of those lengths
function toWords(text){
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as words of varying length. Cancel if this is not what you want.");
        if(!reply) return
    }
    var	wordArray = makeWordMatrix(coverText),
        out = new Array(text.length * 2);

    //now get a 2-digit code for each character in the text; each digit goes from 0 to 7, so we have 64 possibilities to encode base64
    for(var i = 0; i < text.length; i++){
        var index = base64.indexOf(text[i]),
            word1Choices = wordArray[Math.floor(index / 8)],
            word2Choices = wordArray[index % 8];
        out[2*i] = word1Choices[Math.floor(Math.random()*word1Choices.length)] + randompunct();
        out[2*i+1] = word2Choices[Math.floor(Math.random()*word2Choices.length)] + randompunct()
    }
    var outStr = out.join('');

     //capitalize initial and after period, add final period.
    outStr = outStr.toLowerCase().replace(/[.][\s\n][a-z]/g,function(a){return a.toUpperCase();});
    outStr = outStr.replace(/[a-z]/,function(a){return a.toUpperCase();});
    outStr = outStr.slice(0,-1) + '.';
    mainBox.textContent = outStr.trim();
    mainMsg.textContent = 'Message encoded as words of varying length'
}

//words decoder. Takes groups of 2 words. Their lengths is the index of each characters, in base9
function fromWords(text){
    if(learnMode.checked){
        var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
        if(!reply) return
    }
    text = text.replace(/&nbsp;/g,'').replace(/[.,\n]/g,''); 		//remove extra spaces and punctuation
    var	textArray = text.split(/ /),
        out = new Array(textArray.length / 2);
    for(var i = 0; i < textArray.length; i=i+2){
        var index1 = textArray[i].trim().length % 8,
            index2 = textArray[i+1].trim().length % 8;
        out[i/2] = base64[index1 * 8 + index2]
    }
    mainBox.textContent = out.join('').trim()
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

//the following functions are to hide text into a text cover, as binary double spaces. It needs a little under 6 cover words for each base64 character, 36 for non-ASCII
function spacesEncoder(bin){
    var textsplit = coverText.split(" "),
        stegospace = [' ', ' \u200c'],
        spaces = textsplit.length - 1,
        turns = 0;
    if (spaces < bin.length){									//repeat cover text if too short
        while (spaces < bin.length){
            textsplit = textsplit.concat(coverText.split(" "));
            spaces = textsplit.length - 1;
            turns++
        }
        mainMsg.textContent = 'Message encoded into spaces of this text. It was repeated ' + turns + ' times.'
    }else{
        mainMsg.textContent = 'Message encoded into spaces of this text'
    }
    textsplit = textsplit.slice(0,bin.length + 1);		//take a sufficiently long piece of cover text
    var newtext = new Array(bin.length + 1);
    newtext[0] = textsplit[0];
    for(var i = 0; i < bin.length; i++){
        newtext[i+1] = stegospace[bin[i]] + textsplit[i+1]
    }
    return newtext.join('')
}

function spacesDecoder(text){
    var textsplit = text.split(" "),
        bin = new Array(textsplit.length - 1);

    for(var i = 0; i < textsplit.length - 1; i++){
        if (textsplit[i + 1].match('\u200c')){
            bin[i] = 1
        }else{
            bin[i] = 0
        }
    }
    return bin
}

//retrieves base64 string from binary array. No error checking
function fromBin(input){
    var length = input.length - (input.length % 6),
        output = new Array(length / 6),
        index = 0;

    for(var i = 0; i < length; i = i+6) {
        index = 0;
        for(var j = 0; j < 6; j++){
            index = 2 * index + input[i+j]
        }
        output[i / 6] = base64.charAt(index)
    }
    return output.join('')
}

//makes the binary equivalent (array) of a base64 string. No error checking
function toBin(input){
    var output = new Array(input.length * 6),
        code = 0,
        digit = 0,
        divider = 32;

    for(var i = 0; i < input.length; i++) {
        code = base64.indexOf(input.charAt(i));
        divider = 32;
        for(var j = 0; j < 5; j++){
            digit = code >= divider ? 1 : 0;
            code -= digit * divider;
            divider = divider / 2;
            output[6 * i + j] = digit
        }
        output[6 * i + 5] = code;
    }
    return output
}

function toSpaces(text) {
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as formatted spacing. Cancel if this is not what you want.");
        if(!reply) return
    }
    mainBox.textContent = spacesEncoder(toBin(text))
}

function fromSpaces(text) {
    if(learnMode.checked){
        var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
        if(!reply) return
    }
    mainBox.textContent = fromBin(spacesDecoder(text)).replace(/\x00/g,'').trim();		//take out nulls, in case text was added to finish the last sentence.
}

//the following functions are to hide text between two letters, as a binary string made of invisible characters.
function toInvisible(text) {
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be invisibly encoded (to a human) at the end of a sentence. Cancel if this is not what you want.");
        if(!reply) return
    }
    mainBox.textContent = 'Dear friend,' + invisibleEncoder(toBin(text)) + '\r\n\r\nBody of the message.'
}

function fromInvisible(text) {
    if(learnMode.checked){
        var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
        if(!reply) return
    }
    mainBox.textContent = fromBin(invisibleDecoder(text)).trim()
}

function invisibleEncoder(bin){
    var stegospace = ['\u00ad', '\u200c'],
        newtext = new Array(bin.length);

    for(var i = 0; i < bin.length; i++){
        newtext[i+1] = stegospace[bin[i]]
    }
    mainMsg.textContent = 'Message invisibly encoded at the end of the introduction in the box. Edit as needed';
    return newtext.join('')
}

function invisibleDecoder(text){
    var binStr = text.replace(/\u00ad/g,'0').replace(/\u200c/g,'1');
    binStr = binStr.match(/[01]+/)[0];									//keep binary part
    var length = binStr.length,
        bin = new Array(length);
    for(var i = 0; i < length; i++){
        if (binStr.charAt(i) == '0'){
            bin[i] = 0
        }else{
            bin[i] = 1
        }
    }
    return bin
}

//makes phrase matrix for a given cover text, where sentences are catalogued by length mod 11
function makePhraseMatrix(cover){
    var phraseArray = cover.replace(/["…“”‘’„‚«»‹›¿¡]+/g,'').slice(0,-1).split(/[.,;:?!] /),
        bins = [[],[],[],[],[],[],[],[],[],[],[]];
    for(var i = 0; i < phraseArray.length; i++){
        var lengthMod12 = phraseArray[i].length % 11;
        bins[lengthMod12] = bins[lengthMod12].concat(phraseArray[i])
    }
    for(var i = 0; i < 11; i++){
        if(bins[i].length == 0){
            mainMsg.textContent = 'Please use a Cover text with more variation.';
            return
        }
    }
    return bins
}

//encodes text as sentences of varying length (11 different values)
function toPhrases(text){
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as sentences of varying length. Cancel if this is not what you want.");
        if(!reply) return
    }
    var	phraseArray = makePhraseMatrix(coverText),
        punct = '.,;:!?',
        outArray = new Array(text.length);

    //now split the base64-encoded string into a base11 code to select sentence length, and a base6 code to select punctuation
    for(var i = 0; i < text.length; i++){
        var index = base64.indexOf(text[i]),
            phraseChoices = phraseArray[index % 11];
        outArray[i] = phraseChoices[Math.floor(Math.random()*phraseChoices.length)] + punct[Math.floor(index/11)] + ' '
    }
    var out = outArray.join('');
    out = out.replace(/[.!?][\s\n][a-z]/g,function(a){return a.toUpperCase();}).replace(/[,;:][\s\n][A-Z]/g,function(a){return a.toLowerCase();}).trim();  //capitalization
    out = out.charAt(0).toUpperCase() + out.slice(1);
    mainBox.textContent = out.trim();
    mainMsg.textContent = 'Message encoded as sentences of varying length'
}

//decodes text encoded as sentences of varying length
function fromPhrases(text){
    if(learnMode.checked){
        var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
        if(!reply) return
    }
    text = text.replace(/&nbsp;/g,'').replace(/\n/g,'');
    var	textArray = text.split(/[.,;:!?]/g).slice(0,-1),
        punctArray = text.match(/[.,;:!?]/g),
        punct = ".,;:!?",
        outArray = new Array(textArray.length);

    for(var i = 0; i < textArray.length; i++){
        var index11 = textArray[i].trim().length % 11,
            index6 = punct.indexOf(punctArray[i]);
        outArray[i] = base64[index6 * 11 + index11]
    }
    mainBox.textContent = outArray.join('').trim()
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
            bitcount = bitcount + charMappings[cover[i]].length
        }
    }
    return bitcount
}

//encodes text as special letters and spaces in the cover text, which replace the original ones
function toLetters(text){
    if(learnMode.checked){
        var reply = confirm("The contents of the main box will be replaced with encoded text which contains the original text as formatted special characters and spaces. Cancel if this is not what you want.");
        if(!reply) return
    }
    var textBin = toBin(text).join(''),				//string containing 1's and 0's
        cover = coverText,
        capacity = encodableBits(cover);
    if (capacity < textBin.length){						//repeat the cover text if it's too short
        var turns = Math.ceil(textBin.length / capacity),
            index = 0;
        while (index < turns){
            cover += ' ' + coverText;
            index++
        }
        mainMsg.textContent = 'Message encoded into letters of this text. It was repeated ' + turns + ' times.'
    }
    var finalString = "",
        bitsIndex = 0,
        i = 0,
        doneBits = '';
    while(doneBits.length < textBin.length){
        if (charMappings[cover[i]] === undefined){
            finalString = finalString + cover[i]
        }else{
            var tempBits = textBin.substring(bitsIndex,bitsIndex + charMappings[cover[i]].length);
            while(tempBits.length < charMappings[cover[i]].length){tempBits = tempBits + "0";} 			//Got to pad it out
            finalString += charMappings[cover[i] + tempBits];
            bitsIndex += charMappings[cover[i]].length;
            doneBits += tempBits
        }
        i++
    }
    mainBox.textContent = finalString + '.';								//period needed because there could be spaces at the end
    mainMsg.textContent = 'Message encoded into letters of this text.'
}

//gets the original text from Letters encoded text
function fromLetters(text){
    if(learnMode.checked){
        var reply = confirm("The encoded text in the main box will be replaced with the original text from which it came. Cancel if this is not what you want.");
        if(!reply) return
    }
    var bintemp = [],
        tempchar = "";
    for (var i = 0; i < text.length; i++){
        if (charMappings[text[i]] === undefined ){
        }else{
            tempchar = charMappings[text[i]];
            bintemp.push(tempchar)
        }
    }
    var binStr = bintemp.join(''),
        bin = new Array(binStr.length);
    for(var i = 0; i < binStr.length; i++) bin[i] = parseInt(binStr.charAt(i));
    mainBox.textContent = fromBin(bin.slice(0,bin.length-(bin.length % 6)))
}

//this one is to display the cover text or change it as requested
function newCover(string){
    coverText = addSpaces(string.replace(/[\n\s-]+/g,' '));		//newlines, dashes, and multiple spaces do weird things, so remove them
    mainMsg.textContent = 'Cover text changed'
}

//adds spaces that can be encoded if Chinese, Korean, or Japanese
function addSpaces(string){
    if (string.match(/[\u3400-\u9FBF]/) != null) string = string.split('').join(' ').replace(/\s+/g, ' ');
    return string
}
