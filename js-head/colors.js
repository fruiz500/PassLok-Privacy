//this group creates dummy stylesheets for buttons, tabs, boxes, and background. One sheet for general color and another for text
var btnSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';				//a nonce added because otherwise the CSP of the extension will refuse next statement
    document.head.appendChild(style);
    return style.sheet
})();
var tabSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var boxSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var bgSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var btnTextSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var tabTextSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var boxTextSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();
var bgTextSheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    style.nonce = '4AEemGb0yJptoIGFP3Nd';
    document.head.appendChild(style);
    return style.sheet
})();

//these two are to add a rule (usually a changed color) to a dummy stylesheet, or to remove it
function addCSSRule(sheet, selector, rules, index) {
    if("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index)
    }
    else if("addRule" in sheet) {
        sheet.addRule(selector, rules, index)
    }
}
function removeCSSRule(sheet, selector, rules, index) {
    if("deleteRule" in sheet) {
        sheet.deleteRule(selector + "{" + rules + "}", index)
    }
    else if("removeRule" in sheet) {
        sheet.removeRule(selector, rules, index)
    }
}

//stores custom colors
function storeColors(){
    if(fullAccess){
        var hexCode = '';
        for(var i=0; i<4; i++) hexCode += bgColorStore[i];
        if(locDir['myself']){
            locDir['myself'][2] = hexCode;
            localStorage[userName] = JSON.stringify(locDir);

            if(ChromeSyncOn && chromeSyncMode.checked){
                syncChromeLock('myself',JSON.stringify(locDir['myself']))
            }
        }
    }
}

//retrieves custom colors from storage
function getCustomColors(){
    if(locDir['myself'][2]){
        var hexCode = locDir['myself'][2];
        while(hexCode.length < 24) hexCode = '0' + hexCode;
        for(var i=0; i<4; i++){
            bgColorStore[i] = hexCode.slice(i*6,(i+1)*6);
            bgColor[i] = bgColorStore[i];
            fgColorStore[i] = foregColor(bgColorStore[i]);
            fgColor[i] = fgColorStore[i]
        }
    }
}

//deduces foreground color (white or black) from hex background color
function foregColor(bgColor){
    var red = parseInt(bgColor.slice(0,2),16),
        green = parseInt(bgColor.slice(2,4),16),
        blue = parseInt(bgColor.slice(4,6),16);
    return 0.213 * red + 0.715 * green + 0.072 * blue < 128 ? 'FFFFFF' : '000000'
}

//returns a closer to neutral gray version of a hex color, as given by a hex offset (1 byte)
function milder(color, offset){
    var red = parseInt(color.slice(0,2),16),
        green = parseInt(color.slice(2,4),16),
        blue = parseInt(color.slice(4,6),16),
        offset10 = parseInt(offset, 16);
    if(0.213 * red + 0.715 * green + 0.072 * blue < 128){		//dark or light condition is the same as for foreground color
        red = Math.min((red + offset10),255).toString(16);
        green = Math.min((green + offset10),255).toString(16);
        blue = Math.min((blue + offset10),255).toString(16)
    }else{
        red = Math.max((red - offset10),0).toString(16);
        green = Math.max((green - offset10),0).toString(16);
        blue = Math.max((blue - offset10),0).toString(16)
    }
    if(red.length < 2) red = '0' + red;				//take care of single-digit colors
    if(green.length < 2) green = '0' + green;
    if(blue.length < 2) blue = '0' + blue;
    return red + green + blue
}

function updateColor(){
    if(editTabColor.checked) {updateTabColor(true)}
    else if(editBgColor.checked) {updateBgColor(true)}
    else if(editBtnColor.checked) {updateBtnColor(true)}
    else {updateBoxColor(true)}
}

//global variables containing hex screen colors. Default is Light. Indices: 0 = tabs, 1 = background, 2 = buttons, 3 = boxes
var	fgColor = ['202128','000000','666666','000000'],
    fgColorStore = ['202128','000000','666666','000000'],
    bgColor = ['c6d5c6','ffffff','e6e6e6','fffff5'],
    bgColorStore = ['c6d5c6','ffffff','e6e6e6','fffff5'];

//gets color from picker and puts it into global variables
function getColor(i,isPicker){
    if(customStyle.checked){
        if(isPicker){
            bgColor[i] = colorPicker.value;
            fgColor[i] = foregColor(bgColor[i]);
            bgColorStore[i] = bgColor[i];
            fgColorStore[i] = fgColor[i]
        }else{
            bgColor[i] = bgColorStore[i];
            fgColor[i] = fgColorStore[i]
        }
    }
}

//change tab colors (index 0); first delete all rules, then re-make them according to the current color; first background, then text
function updateTabColor(isPicker){
    getColor(0,isPicker);
    while(tabSheet.cssRules.length) removeCSSRule(tabSheet,"ul#tabs");
    addCSSRule(tabSheet, "ul#tabs", "background-color:#" + bgColor[0]);
    addCSSRule(tabSheet, "ul#tabs li a", "background-color:#" + bgColor[0]);
    addCSSRule(tabSheet, "ul#tabs li a:hover", "background-color:#" + milder(bgColor[0],'22'));
    while(tabTextSheet.cssRules.length) removeCSSRule(tabTextSheet,"ul#tabs");
    addCSSRule(tabTextSheet, "ul#tabs li a", "color:#" + milder(fgColor[0],'22'))
}

//same for general background (index 1)
function updateBgColor(isPicker){
    getColor(1,isPicker);
    while(bgSheet.cssRules.length){
        removeCSSRule(bgSheet,"body");
        removeCSSRule(bgSheet,".block_page");
        removeCSSRule(bgSheet,".white_content");
        removeCSSRule(bgSheet,"ul#tabs");
        removeCSSRule(bgSheet,"div.tabContent");
        removeCSSRule(bgSheet,".helpHeading:hover")
    }
    addCSSRule(bgSheet, "body", "background-color:#" + bgColor[1]);
    addCSSRule(bgSheet, ".block_page", "background-color:#" + bgColor[1]);
    addCSSRule(bgSheet, ".white_content", "background-color:#" + bgColor[1]);
    addCSSRule(bgSheet, "ul#tabs li a.selected", "background-color:#" + bgColor[1]);
    addCSSRule(bgSheet, "div.tabContent", "background-color:#" + bgColor[1]);
    addCSSRule(bgSheet, ".helpHeading:hover", "background-color:#" + milder(bgColor[1],'11'));
    while(bgTextSheet.cssRules.length){
        removeCSSRule(bgTextSheet,"body");
        removeCSSRule(bgTextSheet,".block_page");
        removeCSSRule(bgTextSheet,".white_content");
        removeCSSRule(bgTextSheet,"ul#tabs");
        removeCSSRule(bgTextSheet,"div.tabContent")
    }
    addCSSRule(bgTextSheet, "body", "color:#" + fgColor[1]);
    addCSSRule(bgTextSheet, ".block_page", "color:#" + fgColor[1]);
    addCSSRule(bgTextSheet, ".white_content", "color:#" + fgColor[1]);
    addCSSRule(bgTextSheet, "ul#tabs li a.selected", "color:#" + fgColor[1]);
    addCSSRule(bgTextSheet, "div.tabContent", "color:#" + fgColor[1])
}

//and for buttons (index 2)
function updateBtnColor(isPicker){
    getColor(2,isPicker);
    while(btnSheet.cssRules.length){
        removeCSSRule(btnSheet,".cssbutton");
        removeCSSRule(btnSheet,".cssbutton:hover");
        removeCSSRule(btnSheet,"#toolBar1")
    }
    addCSSRule(btnSheet, ".cssbutton", "background-color:#" + bgColor[2]);
    addCSSRule(btnSheet, ".cssbutton:hover", "background-color:#" + milder(bgColor[2],'22'));
    addCSSRule(btnSheet, "#toolBar1", "background-color:#" + bgColor[2]);
    while(btnTextSheet.cssRules.length){
        removeCSSRule(btnTextSheet,".cssbutton")
    }
    addCSSRule(btnTextSheet, ".cssbutton", "color:#" + milder(fgColor[2],'28'));
    decryptBtn.style.color = '#' + fgColor[2];
    decryptBtnBasic.style.color = '#' + fgColor[2];
    decryptBtnEmail.style.color = '#' + fgColor[2];
}

//and for boxes (index 3)
function updateBoxColor(isPicker){
    getColor(3,isPicker);
    while(boxSheet.cssRules.length){
        removeCSSRule(boxSheet,".cssbox");
        removeCSSRule(boxSheet,"select")
    }
    addCSSRule(boxSheet, ".cssbox", "background-color:#" + bgColor[3]);
    addCSSRule(boxSheet, "select", "background-color:#" + bgColor[3]);
    while(boxTextSheet.cssRules.length){
        removeCSSRule(boxTextSheet,".cssbox");
        removeCSSRule(boxTextSheet,"select")
    }
    addCSSRule(boxTextSheet, ".cssbox", "color:#" + fgColor[3]);
    addCSSRule(boxTextSheet, "select", "color:#" + fgColor[3]);
}

//initialize color picker
function initPicker(){
    if(editTabColor.checked){
        colorPicker.color.fromString(bgColor[0])
    }else if(editBgColor.checked){
        colorPicker.color.fromString(bgColor[1])
    }else if(editBtnColor.checked){
        colorPicker.color.fromString(bgColor[2])
    }else {
        colorPicker.color.fromString(bgColor[3])
    }
}

//this loads the pre-selected color schemes from Options
function selectStyle(){
    if(liteStyle.checked){
        customColors.style.display = 'none';
        bgColor[0] = 'c6d5c6';
        fgColor[0] = '202128';
        bgColor[1] = 'ffffff';
        fgColor[1] = '000000';
        bgColor[2] = 'e6e6e6';
        fgColor[2] = '666666';
        bgColor[3] = 'fffff5';
        fgColor[3] = '000000';
        updateTabColor(false);
        updateBgColor(false);
        updateBtnColor(false);
        updateBoxColor(false)
    }else if(darkStyle.checked){
        customColors.style.display = 'none';
        bgColor[0] = '455245';
        fgColor[0] = 'e9e9e9';
        bgColor[1] = '000000';
        fgColor[1] = 'ffffff';
        bgColor[2] = '7b7b7b';
        fgColor[2] = 'eeeeee';
        bgColor[3] = '111111';
        fgColor[3] = 'ffffff';
        updateTabColor(false);
        updateBgColor(false);
        updateBtnColor(false);
        updateBoxColor(false)
    }else if(redStyle.checked){
        customColors.style.display = 'none';
        bgColor[0] = '000000';
        fgColor[0] = 'efefef';
        bgColor[1] = 'cc3300';
        fgColor[1] = 'ffffff';
        bgColor[2] = '663333';
        fgColor[2] = 'dddddd';
        bgColor[3] = 'ffcc99';
        fgColor[3] = '000000';
        updateTabColor(false);
        updateBgColor(false);
        updateBtnColor(false);
        updateBoxColor(false)
    }else if(greenStyle.checked){
        customColors.style.display = 'none';
        bgColor[0] = '9999cc';
        fgColor[0] = 'ffffff';
        bgColor[1] = '99cc99';
        fgColor[1] = '000000';
        bgColor[2] = 'ddddaa';
        fgColor[2] = '666666';
        bgColor[3] = 'ffffcc';
        fgColor[3] = '000000';
        updateTabColor(false);
        updateBgColor(false);
        updateBtnColor(false);
        updateBoxColor(false)
    }else if(blueStyle.checked){
        customColors.style.display = 'none';
        bgColor[0] = '003399';
        fgColor[0] = 'efefef';
        bgColor[1] = '0099cc';
        fgColor[1] = 'ffffff';
        bgColor[2] = '1c57cc';
        fgColor[2] = 'dddddd';
        bgColor[3] = 'd7ffd7';
        fgColor[3] = '000000';
        updateTabColor(false);
        updateBgColor(false);
        updateBtnColor(false);
        updateBoxColor(false)
    }else{
        if(customColors.style.display == 'none'){
            customColors.style.display = 'block'
        }else{
            customColors.style.display = 'none'
        }
        bgColor[0] = bgColorStore[0];
        fgColor[0] = fgColorStore[0];
        updateTabColor(false);
        bgColor[1] = bgColorStore[1];
        fgColor[1] = fgColorStore[1];
        updateBgColor(false);
        bgColor[2] = bgColorStore[2];
        fgColor[2] = fgColorStore[2];
        updateBtnColor(false);
        bgColor[3] = bgColorStore[3];
        fgColor[3] = fgColorStore[3];
        updateBoxColor(false);
        initPicker()
    }
    checkboxStore()
}

//selects random colors for the custom setting
function randomColors(){
    editBoxColor.checked = true;
    for(var i=0; i<4; i++){
        bgColor[i] = Math.floor(Math.random()*16777216).toString(16);
        while(bgColor[i].length < 6) bgColor[i] = '0' + bgColor[i];
        fgColor[i] = foregColor(bgColor[i]);
        bgColorStore[i] = bgColor[i];
        fgColorStore[i] = fgColor[i]
    }
    initPicker();
    updateTabColor(false);
    updateBgColor(false);
    updateBtnColor(false);
    updateBoxColor(false)
}
//The main script in the head ends here.
