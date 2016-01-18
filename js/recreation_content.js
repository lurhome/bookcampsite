var DEBUG_MODE = false;

function DEBUG_TRACE(str) {
    if (DEBUG_MODE)
	console.log(new Date().toLocaleTimeString() + " " + str);
}

function checkReload(response){
    if (response && response.action == "reload"){
	url = response.url;
	if (url.length > 0)
	    window.location.replace(url);
    }
}

function submitSearchRequest()
{
    chrome.runtime.sendMessage({command: "setNextAction", action: "submitSearchResultForm"});
    var f = document.forms["unifSearchForm"];
    if (f) {
	document.getElementById("filter").click(); //submit();
    }
}

function submitSearchResultForm(){
    var searchResult = document.getElementsByClassName("matchSummary");
    DEBUG_TRACE("in submitSearcResultForm " + JSON.stringify(searchResult));
    if (searchResult.length > 0)
    {
	var matchSites = document.getElementsByClassName("book now");
	if (matchSites.length > 0)
	{
	    // book one of them randomly
	    var index = Math.floor(Math.random() * matchSites.length);
	    chrome.runtime.sendMessage({command: "setNextAction", action: "submitBookSiteForm", url: window.location.href});
	    //index = 0; // test for out of inventary
	    matchSites[index].click();
	}
	else
	{
	    chrome.runtime.sendMessage({command: "setNextAction", action: "done"});
	}
	return false;
    }
}

function submitBookSiteForm(){
    var bookSiteForm = document.forms["booksiteform"];
    if (bookSiteForm)
    {
	chrome.runtime.sendMessage({command: "setNextAction", action: "checkBookStatus"});
	bookSiteForm.submit();
    }
}

function checkBookStatus(){
    if (document.title.startsWith("Order Detail")){
	var pk = "";
	var tb = document.getElementsByClassName("parkNameAndState")[0];
	if (tb) {
	    pk = tb.getElementsByTagName("h2")[3].innerHTML.toString();
	}
	chrome.runtime.sendMessage({command: "succeed", site: pk}, checkReload);
    }
    else
    {
	// failed at last step
	var errMsgTable = document.getElementById("errorMessages");
	if (errMsgTable) {
	    var msg = errMsgTable.innerHTML.toString();
	    if (msg.search(maximumErrMsg) != -1) {
		// maximum booking reached
		var ret = {command: "setNextAction", action: "done", reason: "maximum booking number reached"};
		chrome.runtime.sendMessage(ret);
	    }
	    else if (msg.search(outOfInventoryErrMsg) != -1) {
		var ret = {command: "refresh", reason: "Inventory not available"};
		chrome.runtime.sendMessage(ret, checkReload);
	    }
	}
	else {
	    chrome.runtime.sendMessage({command: "failed", reason: "unknown"}, checkReload);
	}
    }
}

function checkSignedIn(){
    if (document.getElementById("myaccountlink")){
	return true;
    }
    return false;
}

function checkMaximumReached(){
    var errMsgTable = document.getElementById("errorMessages");
    if (errMsgTable && (errMsgTable.innerHTML.toString().search(maximumErrMsg) != -1)) {
	chrome.runtime.sendMessage({command: "setNextAction", action: "done"});
	return true;
    }
    else {
	return false;
    }
}

function jobRequestHandler(response){
    DEBUG_TRACE("content script got response: " + JSON.stringify(response));
    if (response && response.command != "done" ) {
	switch (response.command){
	case "submitSearchRequest":
	    submitSearchRequest();
	    break;
	case "reload":
	case "submitSearchResultForm":
	    submitSearchResultForm();
	    break;
	case "submitBookSiteForm":
	    submitBookSiteForm();
	    break;
	case "checkBookStatus":
	    checkBookStatus();
	    break;
	default:
	    break;
	}
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
	if (request.command == "submitSearchRequest")
	{
	    submitSearchRequest();
	    return false;
	}
    }
);

function isEntry() {
    var unifSearchForm = document.forms["unifSearchForm"];
    if (unifSearchForm && unifSearchForm.getAttribute("action") != "/unifSearch.do")
	return true;
    else
	return false;
}

chrome.runtime.sendMessage({command: "jobRequest", isEntryPage: (isEntry() ? "true" : "false")}, jobRequestHandler);

