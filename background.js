STFU = {
  browserAction: {
    set_mute_icon: function (tab) {
      chrome.browserAction.setIcon({path: "audio-muted.png", tabId: tab.id});
    },

    set_audible_icon: function (tab) {
      chrome.browserAction.setIcon({path: "audio-on.png", tabId: tab.id});
    },

    update_icon_state: function (tab) {
      if (tab.mutedInfo.muted) {
        STFU.browserAction.set_mute_icon(tab);
      } else {
        STFU.browserAction.set_audible_icon(tab);
      }
    }
  },

  forEachTab: function (fn) {
    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        fn(tabs[i]);
      }
    });
  },

  forCurrentTab: function (fn) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      fn(tabs[0]);
    });
  },

  mute: function (tab, fn) {
    STFU.browserAction.set_mute_icon(tab);
    chrome.tabs.update(tab.id, {muted: true});
    if (fn && fn.call) fn(tab);
  },

  unmute: function (tab, fn) {
    STFU.browserAction.set_audible_icon(tab);
    chrome.tabs.update(tab.id, {muted: false});
    if (fn && fn.call) fn(tab);
  },

  muteCurrent: function (fn) {
    STFU.forCurrentTab(function (tab) {
      STFU.mute(tab, fn);
    });
  },

  unmuteCurrent: function (fn) {
    STFU.forCurrentTab(function (tab) {
      STFU.unmute(tab, fn);
    });
  },

  muteAll: function (fn) {
    STFU.forEachTab(function (tab) {
      STFU.mute(tab, fn);
    });
  },

  unmuteAll: function (fn) {
    STFU.forEachTab(function (tab) {
      STFU.unmute(tab, fn);
    });
  },

  muteOthers: function (fn) {
    STFU.forCurrentTab(function (current_tab) {
      STFU.forEachTab(function (tab) {
        if (tab.id != current_tab.id) {
          STFU.mute(tab, fn);
        }
      });
    });
  },

  unmuteOthers: function (fn) {
    STFU.forCurrentTab(function (current_tab) {
      STFU.forEachTab(function (tab) {
        if (tab.id != current_tab.id) {
          STFU.unmute(tab, fn);
        }
      });
    });
  },

  toggle: function (tab, fn) {
    tab.mutedInfo.muted ? STFU.mute(tab, fn) : STFU.unmute(tab, fn);
  },

}

chrome.tabs.onCreated.addListener(function (tab) {
  if (tab.openerTabId) {
    chrome.tabs.get(tab.openerTabId, function (opener_tab) {
      chrome.storage.sync.get({muteTabsByDefault: true}, function (config) {
        chrome.tabs.update(tab.id, {muted: config.muteTabsByDefault && opener_tab.mutedInfo.muted});
      });
    });
  } else {
    STFU.mute(tab);
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changedInfo, tab) {
  STFU.browserAction.update_icon_state(tab);
});

chrome.storage.sync.get({muteTabsByDefault: true}, function (config) {
  if (config.muteTabsByDefault === true) {
    STFU.muteAll();
  }
});


STFU.forEachTab(function (tab) {
  STFU.update_icon_state(tab);
})