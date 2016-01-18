
var repeat = function(s, n, d) {
    if (n <= 0) return "";
    return --n ? s + (d || "") + repeat(s, n, d) : "" + s;
};

function padding(n, m){
    var s1 = "" + n;
    return repeat("0", m - s1.length) + s1;
};

function notifyTimeout(num, myInterval)
{
    clearInterval(myInterval);
    chrome.runtime.sendMessage({command: "bookNow", numSites: num}, function(response){
	window.close();
    });
}

function showTimer(bookTime) {
    var timeDiff = bookTime - (new Date());
    var t = Math.floor(timeDiff/1000);
    if (t < 0) return;
    var h = padding(Math.floor(t/(60*60)), 2);
    var m = padding(Math.floor((t%(60*60))/60), 2);
    var s = padding(Math.floor(t%60), 2);
    document.getElementById("timer").innerHTML = "Timer " + h+":"+m+":"+s;
}

function submitForm(event)
{
    event = event || window.event;
    event.preventDefault();
    var numSites = 1;
    var numSitesStr = document.getElementById("numSites").value;
    if (parseInt(numSitesStr) >= 0)
	numSites = parseInt(numSitesStr);

    var timeStr = document.getElementById("bookTime").value;

    var now = new Date();
    var timeout = 0;
    if (timeStr.indexOf(":") > 0)
    {
	var str = now.toLocaleDateString() + ", " + timeStr
	var bookTime = new Date(str);
	timeout = bookTime - now;
    }
    else if (parseInt(timeStr) > 0)
    {
	timeout = parseInt(timeStr) * 1000;
	var bookTime = new Date(now.getTime() + timeout);
    }
    else {
	var bookTime = now;
    }
    //console.log("book time is " + bookTime.toLocaleString());
    var myInterval = setInterval(function(){showTimer(bookTime);}, 1000);

    if (timeout < 0) timeout = 0;
    myTimeout = setTimeout(function(){notifyTimeout(numSites, myInterval);}, timeout);
    
    return false;
}

document.getElementById("bookTimeForm").onsubmit = submitForm;

