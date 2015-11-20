(function() {

function set_mute_icon(tab) {
  chrome.browserAction.setIcon({path: "audio-muted.png", tabId:tab.id});
}

function set_audible_icon(tab) {
  chrome.browserAction.setIcon({path: "audio-on.png", tabId:tab.id});
}

function set_icon(tab) {
  if(tab.mutedInfo.muted) {
    set_mute_icon(tab);
  } else {
    set_audible_icon(tab);
  }
}

function mute_tab(tab) {
  set_mute_icon(tab);
  chrome.tabs.update(tab.id, { muted: true });
}

function unmute_tab(tab) {
  set_audible_icon(tab);
  chrome.tabs.update(tab.id, { muted: false });
}

chrome.tabs.onCreated.addListener(function(tab) {
  if(tab.openerTabId) {
    chrome.tabs.get(tab.openerTabId, function(opener_tab) {
      chrome.tabs.update(tab.id, { muted: opener_tab.mutedInfo.muted });
    });
  } else {
    mute_tab(tab);
  }
})

chrome.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
  set_icon(tab);
});

chrome.browserAction.onClicked.addListener(function(tab) {
  if(tab.mutedInfo.muted) {
    unmute_tab(tab);
  } else {
    mute_tab(tab);
  }
});

chrome.tabs.query({}, function(tabs) { 
  for(var i=0; i < tabs.length; i++) {
    mute_tab(tabs[i]);
  }
})

})();
