const ICONS = { true: 'audio-muted.png', false: 'audio-on.png' }

const wildcardToRegex = function(str) {
  var quoted = (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + '-]', 'g'), '\\$&');
  return new RegExp(quoted.replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'g');
}

const matchTab = function(ruleSet, url) {
  if (!ruleSet) {
    return null
  }

  for (var i = 0; i < ruleSet.length; i++) {
    var rule = ruleSet[i];
    if (!rule.regex) {
      rule.regex = wildcardToRegex(rule.url);
    }

    if (url.match(rule.regex)) {
      return rule.mute;
    }
  }
  return null;
}

const setIcon = async (tab, muted) => {
  if (typeof muted == 'undefined') {
    if (!tab.mutedInfo) {
      tab = await chrome.tabs.get(tab.tabId);
    }

    muted = tab.mutedInfo.muted;
  }

  return chrome.action.setIcon({ path: ICONS[muted], tabId: tab.id });
}

const setMute = (tab, muted) => {
  if (typeof muted == 'undefined') {
    muted = true;
  }

  return Promise.all([
    setIcon(tab, muted),
    chrome.tabs.update(tab.id, { muted: muted })
  ])
}

const toggleMute = (tab) => setMute(tab, !tab.mutedInfo.muted)
const eachTab = (fn) => chrome.tabs.query({}, (tabs) => tabs.forEach(fn))
const currentTab = async () => {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true})
  return tabs[0]
}
const initialAction = async (tab) => {
  const config = await chrome.storage.sync.get(null)
  if (tab.url) {
    const match = matchTab(config.ruleSet, tab.url)
    console.log("initialAction details for ", tab.url)
    if (match !== null) {
      setMute(tab, match)
    } else {
      if (tab.openerTabId) {
        const openerTab = await chrome.tabs.get(tab.openerTabId)
        const muted = config.muteTabsByDefault && openerTab.mutedInfo.muted
        setMute(tab, muted)
      } else if (config.muteTabsByDefault) {
        setMute(tab, true)
      } else {
        setIcon(tab)
      }
    }
  } else if (config.muteTabsByDefault) {
    setMute(tab, true)
  } else {
    setIcon(tab)
  }
}


chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install" && details.reason !== "update") return;

  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "muteAllTabs",
    title: "Mute all tabs",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "unmuteAllTabs",
    title: "Unmute all tabs",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "muteOtherTabs",
    title: "Mute all other tabs",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "unmuteOtherTabs",
    title: "Unmute all other tabs",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "blacklistDomain",
    title: "Blacklist this domain",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "whitelistDomain",
    title: "Whitelist this domain",
    contexts: ["action"]
  });

  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "muteAllTabs") {
      eachTab(tab => setMute(tab, true))
    } else if (info.menuItemId === "unmuteAllTabs") {
      eachTab(tab => setMute(tab, false))
    } else if (info.menuItemId === "muteOtherTabs") {
      currentTab().then(activeTab => eachTab(tab => setMute(tab, tab.id != activeTab.id)))
    } else if (info.menuItemId === "unmuteOtherTabs") {
      currentTab().then(activeTab => eachTab(tab => setMute(tab, tab.id == activeTab.id)))
    } else if (info.menuItemId === "blacklistDomain") {
      currentTab().then(activeTab => {
        chrome.storage.sync.get('ruleSet', function(config) {
          var ruleSet = config.ruleSet;
          var url = activeTab.url.split('/');
          ruleSet.unshift({ mute: true, url: url[0] + "//" + url[2] + "*" });
          chrome.storage.sync.set({ ruleSet: ruleSet });
        });
      });
    } else if (info.menuItemId === "whitelistDomain") {
      currentTab().then(activeTab => {
        chrome.storage.sync.get('ruleSet', function(config) {
          var ruleSet = config.ruleSet;
          var url = activeTab.url.split('/');
          ruleSet.unshift({ mute: false, url: url[0] + "//" + url[2] + "*" });
          chrome.storage.sync.set({ ruleSet: ruleSet });
        });
      });
    }
  });
});

let justOpenedTabIds = []
chrome.tabs.onCreated.addListener(tab => {
  justOpenedTabIds.push(tab.id)
});
chrome.tabs.onUpdated.addListener((tabId, changedInfo, tab) => {
  console.log('tabs.onUpdated', tab, changedInfo, 'just opened?', justOpenedTabIds.includes(tabId))
  setIcon(tab);
  if (changedInfo.url && tab.url !== changedInfo.url || justOpenedTabIds.includes(tabId)) {
    justOpenedTabIds.splice(justOpenedTabIds.indexOf(tabId), 1)
    initialAction(tab);
  }
});
chrome.tabs.onActivated.addListener(tab => setIcon(tab))

chrome.action.onClicked.addListener(function(tab) {
  console.log('action.onClicked', tab)
  toggleMute(tab);
});
chrome.runtime.onStartup.addListener(function() {
  console.log('runtime.onStartup')
  chrome.storage.sync.get({ muteTabsByDefault: true }, function(config) {
    if (config.muteTabsByDefault === true) {
      eachTab((tab) => setMute(tab, true))
    }
  });

  eachTab((tab) => setIcon(tab))
})
