'use strict';

(function ($, chrome) {

  chrome.storage.sync.get('display', function (stored) {
    var display = stored.display || 'all';
    chrome.storage.sync.set({'display': display});
    $('input[value="' + display + '"]').attr('checked', true);
  });
  
  $('input[name="display"]').change(function () {
    chrome.storage.sync.set({'display': $(this).val()}, function() {
      $('.saved').show();
    });
  });
})(window.jQuery, window.chrome);