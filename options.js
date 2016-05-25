chrome.runtime.getBackgroundPage(function (backgroundWindow) {
  STFU = backgroundWindow.STFU;

  chrome.storage.sync.get(null, function (config) {
    $('#mute-tabs-by-default').prop('checked', config.muteTabsByDefault);

    ruleSet = config.ruleSet || [];

    var blacklist = ruleSet.filter(function(rule) { return rule.mute; });
    var whitelist = ruleSet.filter(function(rule) { return !rule.mute; });

    $('#blacklist').val(blacklist.map(function(rule) { return rule.url }).join('\n'));
    $('#whitelist').val(whitelist.map(function(rule) { return rule.url }).join('\n'));


    $('#save-changes').click(function(e) {
      e.preventDefault();
      var ruleSet = [], list = "";

      list = $('#whitelist').val();
      list.trim().split('\n').forEach(function(line) {
        var url = line.trim();
        if(url.length > 0) { ruleSet.push({ mute: false, url: url }); }
      });

      list = $('#blacklist').val();
      list.trim().split('\n').forEach(function(line) { 
        var url = line.trim();
        if(url.length > 0) { ruleSet.push({ mute: true, url: url }); }
      });

      chrome.storage.sync.set({
        ruleSet: ruleSet, 
        muteTabsByDefault: $('#mute-tabs-by-default').prop('checked')
      });
    });
  });
});