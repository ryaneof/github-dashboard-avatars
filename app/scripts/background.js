'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method === 'getStorage') {
    chrome.storage.sync.get('display', function (stored) {
      sendResponse({data: stored[request.key]});
    });
  } else {
    sendResponse({});
  }
  return true;
});

