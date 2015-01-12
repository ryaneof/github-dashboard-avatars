'use strict';

(function ($) {
  
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

      // make requests, get avatar from Github
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
      var $elUserName = $el.find('.title a:eq(0)');
      var userName = $elUserName.text();
      var sourceRepo = $el.find('.title a:eq(1)');
      var sourceUserName = sourceRepo.text().split('/')[0];

      res.push({
        $el: $elUserName,
        user: userName
      });

      if (sourceUserName !== userName) {
        res.push({
          $el: sourceRepo,
          user: sourceUserName
        });
      }

      // hide pull request / comments avatar, adjust left padding 
      $el.find('.details img').hide();
      $el.find('.details blockquote').css('paddingLeft', '0px');

      return res;
    },

    makeSingleAvatarHTMLStr: function (user) {
      var str = [
        '<img class="generated-sleeping-avatar-img" ',
        ' data-user="', user, '"',
        ' width="20" height="20" ',
        ' style="position: absolute; box-shadow: 0 1px 0 #fff; border-radius: 2px;',
        '" />'
      ].join('');

      return str;
    },

    arouseSleepingAvatars: function (users) {
      var userAvatarMap = {};
      var sleepings = this.elNews.querySelectorAll('.generated-sleeping-avatar-img');

      users.forEach(function (user) {
        userAvatarMap[user.login] = user.avatar_url;
      });

      [].forEach.call(sleepings, function (el) {
        el.className = '';
        el.src = (el.dataset.user in userAvatarMap) ? userAvatarMap[el.dataset.user] : 'http://404';
      });
    },

    init: function () {
      this.metadata.alerts = this.elNews.querySelectorAll('.alert');
      this.metadata.count = this.metadata.alerts.length;

      this.initDashboardObserver();
      this.changeAlertAvatarsFromIndex(0);
    }
  };

  if ($(document.body).hasClass('page-dashboard')) {
    app.init();
  }

})(window.jQuery);
