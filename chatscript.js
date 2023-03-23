window.onload = function() {
	chatFrame.src = "https://passlok.com/chat/chat.html" + chatToken;			//includes the # sign	
	chatFrame.height = document.documentElement.clientHeight			
}

//this is extracted from the loading URL, and passed on to the frame
var chatToken = decodeURI(location.hash)