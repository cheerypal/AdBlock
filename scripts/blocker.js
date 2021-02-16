/* Blocking requests */
/* Ad-requests and sketchy sites will be blocked here */

// init counters
var overall = 0;
var currentAds = 0;
var currentScripts = 0;
var currentGen = 0;

// Init storage space for the total blocked stat
if (!localStorage.tot_blocked) {
  localStorage.setItem("tot_blocked", 0);
}

// assign overall variable to the storage value.
overall = localStorage.getItem("tot_blocked");

// if the current page the user is on is in loading state then the stats that are recorded are reset - page stats.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    currentAds = 0;
    currentScripts = 0;
    currentGen = 0;
    chrome.browserAction.setBadgeText({ text: "0" });
  }
});

// Blocking section. This section is grouped by type of blocking measure. Hostname, AA, General -> general paths that are related to advertisement
if (typeof Storage !== "undefined") {
  // blocks adservers and url based requests
  // this element uses *://*.<url>/<pages>
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      if (localStorage.BLKState === "On") {
        currentAds++;
        localStorage.setItem("tot_blocked", overall++);
        try {
          chrome.runtime.onMessage.addListener((req, send, res) => {
            if (req.reqAds) {
              res({ cur_ads: currentAds });
            }
          });
        } catch (e) {}
        chrome.browserAction.setBadgeText({ text: "" + currentAds });
        return { cancel: true };
      } else return { cancel: false };
    },
    { urls: hosts["hosts"] },
    ["blocking"]
  );

  // blocks anti ad scripts
  // this element uses *://*/*/*script.*
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      if (localStorage.BLKState === "On") {
        currentScripts++;
        localStorage.setItem("tot_blocked", overall++);
        try {
          chrome.runtime.onMessage.addListener((req, send, res) => {
            if (req.reqScripts) {
              res({ cur_scripts: currentScripts });
            }
          });
        } catch (e) {}
        return { cancel: true };
      } else return { cancel: false };
    },
    { urls: formatFilterList(anti_ad["filter"], "*://*/*/*") },
    ["blocking"]
  );

  // blocks everything else
  // this element uses *://*/*/<item>.* or *://*/*/<item>/*
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      if (localStorage.BLKState === "On") {
        currentGen++;
        localStorage.setItem("tot_blocked", overall++);
        try {
          chrome.runtime.onMessage.addListener((req, send, res) => {
            if (req.reqGen) {
              res({ cur_gen: currentGen });
            }
          });
        } catch (e) {}
        return { cancel: true };
      } else return { cancel: false };
    },
    { urls: formatFilterList(general["block"], "*://*/*/") },
    ["blocking"]
  );

  // removes CSS that is associated with ads.
  // This will send the css that is stored in blockCSS.js to the content script - index.js
  chrome.runtime.onMessage.addListener((req, send, res) => {
    if (req.inject) {
      if (localStorage.BLKState === "On") {
        res({ styling: css["style"] });
      }
    }
  });
}

// i aim to do this next stage using the regex -> *://*/*/*script.*
// this will categorise requests by finding the protocol but also the website and sub paths within the website

// take in a filter element and change it to *://*/*/*<script>
// outputs a list full of adblock ready filters
function formatFilterList(list, prefix) {
  let improvedList = [];
  for (i in list) {
    improvedList.push(prefix + list[i]);
  }
  return improvedList;
}
