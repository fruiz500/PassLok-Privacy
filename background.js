//this one opens tabs as directed by the extension
chrome.action.onClicked.addListener(function(){
                chrome.tabs.create({url: 'index.html'})
      }
);