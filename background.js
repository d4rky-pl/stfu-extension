// background.js

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'INIT') {
    initialize();
  }
});

function initialize() {
  var STFUTabMatcher = function(ruleSet) {
    this.ruleSet = ruleSet;
  }

  STFUTabMatcher.prototype = {
    WILDCARD_MODE: 0,
    REGEX_MODE: 1,

    match: function(url) {
      for (var i = 0; i < this.ruleSet.length; i++) {
        var rule = this.ruleSet[i];
        if (!rule.regex) {
          rule.regex = this.wildcardToRegex(rule.url);
        }

        if (url.match(rule.regex)) {
          return rule.mute;
        }
      }
      return null;
    },

    wildcardToRegex: function(str) {
      var quoted = (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + '-]', 'g'), '\\$&');
      return new RegExp(quoted.replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'g');
    }
  }

  var Stfu = function() {
    var self = this;

    chrome.tabs.onCreated.addListener(function(tab) {
      self.initialAction(tab);
    });
    chrome.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
      if (changedInfo.url) {
        self.initialAction(tab);
      }
      self.setIcon(tab);
    });
    chrome.action.onClicked.addListener(function(tab) {
      self.toggleMute(tab);
    });

    chrome.storage.sync.get({ muteTabsByDefault: true }, function(config) {
      if (config.muteTabsByDefault === true) {
        self.eachTab(function(tab) {
          self.setMute(tab, true);
        });
      }
    });

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
        self.eachTab(function(tab) {
          self.setMute(tab, true);
        });
      } else if (info.menuItemId === "unmuteAllTabs") {
        self.eachTab(function(tab) {
          self.setMute(tab, false);
        });
      } else if (info.menuItemId === "muteOtherTabs") {
        self.currentTab(function(current_tab) {
          self.eachTab(function(tab) {
            self.setMute(tab, tab.id != current_tab.id);
          });
        });
      } else if (info.menuItemId === "unmuteOtherTabs") {
        self.currentTab(function(current_tab) {
          self.eachTab(function(tab) {
            self.setMute(tab, tab.id == current_tab.id);
          });
        });
      } else if (info.menuItemId === "blacklistDomain") {
        self.currentTab(function(current_tab) {
          chrome.storage.sync.get('ruleSet', function(config) {
            var ruleSet = config.ruleSet;
            var url = current_tab.url.split('/');
            ruleSet.unshift({ mute: true, url: url[0] + "//" + url[2] + "*" });
            chrome.storage.sync.set({ ruleSet: ruleSet });
          });
        });
      } else if (info.menuItemId === "whitelistDomain") {
        self.currentTab(function(current_tab) {
          chrome.storage.sync.get('ruleSet', function(config) {
            var ruleSet = config.ruleSet;
            var url = current_tab.url.split('/');
            ruleSet.unshift({ mute: false, url: url[0] + "//" + url[2] + "*" });
            chrome.storage.sync.set({ ruleSet: ruleSet });
          });
        });
      }
    });

    self.eachTab(function(tab) {
      self.setIcon(tab);
    });
  }

  Stfu.prototype = {
    icons: { true: 'audio-muted.png', false: 'audio-on.png' },

    setIcon: function(tab, muted) {
      if (typeof muted == 'undefined') {
        muted = tab.mutedInfo.muted;
      }
      chrome.action.setIcon({ path: this.icons[muted], tabId: tab.id });
    },

    setMute: function(tab, muted) {
      if (typeof muted == 'undefined') {
        muted = true;
      }

      this.setIcon(tab, muted);
      chrome.tabs.update(tab.id, { muted: muted });
    },

    toggleMute: function(tab) {
      this.setMute(tab, !tab.mutedInfo.muted);
    },

    eachTab: function(fn) {
      chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          fn(tabs[i]);
        }
      });
    },

    currentTab: function(fn) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        fn(tabs[0]);
      });
    },

    initialAction: function(tab) {
      var self = this;

      chrome.storage.sync.get(null, function(config) {
        if (tab.url) {
          var matcher = new STFUTabMatcher(config.ruleSet);
          var match = matcher.match(tab.url);

          if (match !== null) {
            self.setMute(tab, match);
          } else {
            if (tab.openerTabId) {
              chrome.tabs.get(tab.openerTabId, function(opener_tab) {
                var muted = config.muteTabsByDefault && opener_tab.mutedInfo.muted;
                self.setMute(tab, muted);
              });
            } else if (config.muteTabsByDefault) {
              self.setMute(tab, true);
            } else {
              self.setIcon(tab);
            }
          }
        } else if (config.muteTabsByDefault) {
          self.setMute(tab, true);
        } else {
          self.setIcon(tab);
        }
      });
    }
  }

  STFU = new Stfu();
}

initialize();
