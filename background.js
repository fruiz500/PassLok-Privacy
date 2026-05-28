chrome.action.onClicked.addListener(function() {
    // This dynamically grabs your exact chrome-extension://[ID]/ path
    const localUrl = chrome.runtime.getURL("extension.html");
    
    chrome.tabs.create({ url: localUrl });
});