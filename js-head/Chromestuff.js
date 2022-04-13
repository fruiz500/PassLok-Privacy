//to put Lock into sync storage
function syncChromeLock(name,data) {
    var syncName = userName + '.' + name,
        jsonfile = {};
    jsonfile[syncName.toLowerCase()] = data;
    chrome.storage.sync.set(jsonfile);

    //now update the list, also in Chrome sync
    if(name != 'myself') updateChromeSyncList()
}

//to update the stored list
function updateChromeSyncList(){
    var ChromeSyncList = lockNames.join('|'),
        jsonfile2 = {};
    jsonfile2[userName + '.ChromeSyncList'] = ChromeSyncList;
    chrome.storage.sync.set(jsonfile2)
}

//to retrieve Lock from sync storage. The code specifying what to do with the item is here because the get operation is asynchronous
function getChromeLock(name) {
    var syncName = userName + '.' + name;
    chrome.storage.sync.get(syncName.toLowerCase(), function (obj){
        var lockdata = obj[syncName.toLowerCase()];
        if(lockdata){
            storeChromeLock(name,lockdata)
        }else if(name.slice(0,2) != '--'){
            var name2 = '--' + name.toLowerCase() + '--';			//it may be a List, so change the name and try again
            lockdata = obj[name2];
            getChromeLock(name2)
        }else{
            if (name.slice(0,2) == '--') name = name.slice(2,name.length-2);
            lockMsg.textContent = name + ' not found in Chrome sync'
        }
    })
}

//this one is called by the above function
function storeChromeLock(name,lockdata){
    locDir[name] = JSON.parse(lockdata);
    lockBox.textContent = removeHTMLtags(locDir[name][0]);			//extra precaution, in case something slipped in
    lockMsg.textContent = name + ' added from Chrome sync';
    locDir = sortObject(locDir);
    localStorage[userName] = JSON.stringify(locDir);
    lockNames = Object.keys(locDir);
    fillList();
    updateChromeSyncList()
}

//to completely remove an entry
function remChromeLock(name){
    var syncName = userName + '.' + name;
    chrome.storage.sync.remove(syncName.toLowerCase());
    updateChromeSyncList()
}

//this one controls an asynchronous loop
var asyncLoop = function(o){
    var i=-1;

    var loop = function(){
        i++;
        if(i==o.length){o.callback(); return;}
        o.functionToLoop(loop, i)
    }
    loop()		//init
}

//get Lock list	from Chrome sync, then call an asynchronous loop to retrieve the data
function retrieveAllSync(){
    var syncName = userName + '.ChromeSyncList';
    chrome.storage.sync.get(syncName, function(obj){
        var lockdata = obj[syncName];
        if(lockdata){
            var ChromeSyncList = lockdata.split('|');

//asynchronous loop to fill local directory
            asyncLoop({
                length : ChromeSyncList.length,

                functionToLoop : function(loop, i){
                    if (ChromeSyncList[i] != 'myself'){
                        var syncName2 = userName + '.' + ChromeSyncList[i];
                        var lockdata2 = {};
                        chrome.storage.sync.get(syncName2.toLowerCase(), function (obj) {
                            lockdata2 = obj[syncName2.toLowerCase()];
                            locDir[ChromeSyncList[i]] = JSON.parse(lockdata2);
                            locDir = sortObject(locDir);
                            localStorage[userName] = JSON.stringify(locDir);
                            lockNames = Object.keys(locDir);
                            fillList()
                        })
                    }
                    loop()
                },

                callback : function(){	//not used here
                }
            })
//end of asynchronous loop, any code below won't wait for it to be done

        }
    })
}
