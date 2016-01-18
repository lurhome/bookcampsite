var rootTab = {};
var reloadUrl = "";
var nextAction = "done";
var siteRemain = 0, retryRemain = 30;
var contextMenuItem = {id: 0, isCreated: false};
var DEBUG_MODE = true;

function reset(){
    rootTab = {};
    reloadUrl = "";
    nextAction = "done";
    siteRemain = 0;
    retryRemain = 30;
}

function DEBUG_TRACE(str) {
    if (DEBUG_MODE)
	console.log(new Date().toLocaleTimeString() + " " + str);
}

function messageHandler (request, sender, sendResponse) {
    DEBUG_TRACE("background got message: " + JSON.stringify(request));
    switch (request.command) {
    case "bookNow":
	sendResponse({farewell: "start booking"});
	nextAction = "submitSearchRequest";
	siteRemain = request.numSites;
	chrome.tabs.sendMessage(rootTab.id, {command: nextAction});
	break;
    case "jobRequest":
	if (nextAction == "done") {
	    if (request.isEntryPage == "true") {
		createOrEnableContextMenu();
	    }
	    else {
		disableContextMenu();
	    }
	}
	ret = {command: nextAction};
	sendResponse(ret);
	break;
    case "setNextAction":
	nextAction = request.action;
	if (nextAction == "submitBookSiteForm")
	    reloadUrl = request.url;
	else if (nextAction == "done")
	    reset();
	break;
    case "failed":
	retryRemain -= 1;
	if (retryRemain <= 0){
	    reset();
	    sendResponse({action: nextAction});
	}
	else {
	    nextAction = "reload";
	    sendResponse({action: "reload", url: reloadUrl});
	}
	break;
    case "succeed":
	siteRemain -=1;
	if (siteRemain > 0)
	{
	    nextAction = "reload";
	    sendResponse({action: "reload", url:reloadUrl});
	}
	else
	{
	    reset();
	    sendResponse({action: "done"}); 
	}
	break;
    default:
	break;
    }
}

function contextMenuOnClick(info, tab) {
    DEBUG_TRACE("contex menu tab: " + JSON.stringify(tab));
    chrome.windows.create({url: "window.html", type: "popup", width: 200, height: 200});
    nextAction = "done";
    rootTab = tab;
}

function createOrEnableContextMenu() {
    if (contextMenuItem.isCreated) {
	chrome.contextMenus.update(contextMenuItem.id, {enabled: true});
    }
    else{
	//Create one item in context menu for particular pages
	var showForPages = ["*://www.recreation.gov/*", "*://www.reserveamerica.com/*"];
	contextMenuItem.id = chrome.contextMenus.create({"title": "Book Camping Site ...",
					 "contexts":["page"],
					 "documentUrlPatterns": showForPages,
					 "onclick": contextMenuOnClick},
					function (){
					    contextMenuItem.isCreated = true;});
    }
}

function disableContextMenu(){
    if (contextMenuItem.isCreated) {
	chrome.contextMenus.update(contextMenuItem.id, {enabled: false});
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

