chrome.runtime.getBackgroundPage(function (backgroundWindow) {
  STFU = backgroundWindow.STFU;

  show_muted_status = function () {
    $('header').addClass('muted');
  }

  show_unmuted_status = function () {
    $('header').removeClass('muted');
  }

  update_status = function () {
    STFU.forCurrentTab(function (tab) {
      tab.mutedInfo.muted ? show_muted_status() : show_unmuted_status();
    })
  }

  $('#settings').hide();

  $('#button-settings').on('click', function (e) {
    $('#content').hide();
    $('#settings').show();
  });

  $('#button-back').on('click', function (e) {
    $('#content').show();
    $('#settings').hide();
  });

  $('#mute-tabs-by-default').on('click', function (e) {
    chrome.storage.sync.set({muteTabsByDefault: $(this).prop('checked')});
  });

  chrome.storage.sync.get({muteTabsByDefault: true}, function (config) {
    $('#mute-tabs-by-default').prop('checked', config.muteTabsByDefault);
  });

  $('#mute-this-tab').on('click', function () {
    STFU.muteCurrent(function () {
      update_status();
    });
  });
  $('#unmute-this-tab').on('click', function () {
    STFU.unmuteCurrent(function () {
      update_status();
    });
  });
  $('#mute-all-tabs').on('click', function () {
    STFU.muteAll(function () {
      update_status();
    });
  });
  $('#unmute-all-tabs').on('click', function () {
    STFU.unmuteAll(function () {
      update_status();
    });
  });
  $('#mute-other-tabs').on('click', function () {
    STFU.muteOthers(function () {
      update_status();
    });
  });
  $('#unmute-other-tabs').on('click', function () {
    STFU.unmuteOthers(function () {
      update_status();
    });
  });

  $('button').on('click', function () {
    update_status();
  });

  update_status();
});


