'use strict';

(function ($, chrome) {
  
  var app = {
    
    metadata: {
      alerts: null,
      count: 0
    },

    elNews: document.querySelector('#dashboard .news'),

    // update metadata according to the changing of dashboard area DOM, 
    // in case user loaded more news 
    initDashboardObserver: function () {

      var self = this;
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

      var observer = new MutationObserver(function () {
        self.metadata.alerts = self.elNews.querySelectorAll('.alert');
        self.metadata.count = self.metadata.alerts.length;
      });

      observer.observe(this.elNews, {
        subtree: true,
        childList: true,
        attributes: true
      });

      Object.observe(this.metadata, function (changed) {
        changed.forEach(function (changing) {
          if (changing.name === 'count') {
            self.changeAlertAvatarsFromIndex(changing.oldValue);
          }
        });
      });
    },

    changeAlertAvatarsFromIndex: function (startIndex) {

      var self = this;
      var endIndex = this.metadata.count;
      var avatarPool = [];
      var userElemMap = {};

      // collect user names and elements
      for (var i = startIndex, len = endIndex; i < len; i += 1) {
        avatarPool = avatarPool.concat(this.dismemberSingleAlert($(this.metadata.alerts[i])));
      }

      if (!this.displayAllAvatars) {
        return;
      }

      // rebuild user <=> elem arr map
      var user, $el;

      avatarPool.forEach(function (raw) {
        user = raw.user;
        $el = raw.$el;

        $el.css('paddingLeft', '24px');
        $(self.makeSingleAvatarHTMLStr(user)).insertBefore($el);

        if (userElemMap.hasOwnProperty(user)) {
          userElemMap[user].push($el);
        } else {
          userElemMap[user] = [$el];
        }
      });

      // make requests, get avatar from GitHub
      var users = Object.keys(userElemMap).map(function (userName) {
        return 'user%3A' + userName;
      });
      var url = 'https://api.github.com/search/users?q=' + users.join('+') + '&per_page=' + users.length;
  
      $.get(url, function (res) {
        if (res.items instanceof Array) {
          self.arouseSleepingAvatars(res.items);
        }
      });
    },

    dismemberSingleAlert: function ($el) {
      var res = [];

      if ($el.hasClass('git_hub')) {
        return res;
      }

      $el.find('.details img.gravatar').hide();
      $el.find('.details blockquote').css('paddingLeft', '0px');
      $el.find('.commits').css('paddingLeft', '0px');
      $el.find('.commits img').css({ 'width': '20px', 'height': '20px' });
      $el.find('.release-assets').css('paddingLeft', '4px');

      if (!this.displayAllAvatars) {
        
        $el.find('.details img').hide();
        $el.find('.commits ul').css('paddingLeft', '0px');

        return res;
      }

      if ($el.find('.commits img').length > 0) {
        var commitImgArr = $el.find('.commits img');
        for (var i = 0, len = commitImgArr.length; i < len; i++) {
          var $elCommitAuthor = $(commitImgArr[i].parentNode);
          var $elCode = $elCommitAuthor.next();

          if (!$elCommitAuthor.attr('title') || !$elCode) {
            continue;
          }

          res.push({
            $el: $elCode,
            user: $elCommitAuthor.attr('title')
          });
          $elCommitAuthor.remove();
        }
      }

      var anchors = $el.find('.title a');

      var $elUserName = $(anchors[0]);
      var $repo;

      var secondAnchor = anchors[1];
      var thirdAnchor = anchors[2];

      if (($el.hasClass('push') || $el.hasClass('create') || $el.hasClass('release')) && !!thirdAnchor) {
        $repo = $(thirdAnchor);
      } else {
        $repo = $(secondAnchor);
      }

      if ($el.hasClass('member_add')) {
        res.push({
          $el: $(thirdAnchor),
          user: $(thirdAnchor).text().split('/')[0]
        });
      }

      var userName = $elUserName.text();
      var repoUserName = $repo.text().split('/')[0];

      res.push({
        $el: $elUserName,
        user: userName
      });

      if (repoUserName !== userName) {
        res.push({
          $el: $repo,
          user: repoUserName
        });
      }

      return res;
    },

    makeSingleAvatarHTMLStr: function (user) {
      var str = [
        '<a href="javascript:;">',
        '<img class="generated-sleeping-avatar-img" ',
        ' data-user="', user, '"',
        ' width="20" height="20" ',
        ' style="position: absolute; box-shadow: 0 1px 0 #fff; border-radius: 2px;',
        '" />',
        '</a>'
      ].join('');

      return str;
    },

    arouseSleepingAvatars: function (users) {
      var userMap = {};
      var sleepings = this.elNews.querySelectorAll('.generated-sleeping-avatar-img');

      users.forEach(function (user) {
        userMap[user.login] = {
          avatar_url: user.avatar_url + '&s=80',
          html_url: user.html_url
        };
      });

      [].forEach.call(sleepings, function (el) {
        var user = el.dataset.user;
        el.className = '';
        if (user in userMap) {
          el.src = userMap[user].avatar_url;
          el.parentNode.href = userMap[user].html_url;
        }
      });
    },

    init: function () {
      var self = this;

      // get display mode ['all' || 'none'], might be set at options page
      chrome.runtime.sendMessage({method: 'getStorage', key: 'display'}, function (response) {
        self.displayAllAvatars = (response.data !== 'none');
        self.metadata.alerts = self.elNews.querySelectorAll('.alert');
        self.metadata.count = self.metadata.alerts.length;

        self.initDashboardObserver();
        self.changeAlertAvatarsFromIndex(0);
      });
    }
  };

  if ($(document.body).hasClass('page-dashboard')) {
    app.init();
  }

})(window.jQuery, window.chrome);
