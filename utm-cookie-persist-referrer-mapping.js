(function () {
  function detectRootDomain() {
    var host = window.location.hostname;
    if (host === 'localhost' || /^[\d.]+$/.test(host)) return '';
    var parts = host.split('.');
    if (parts.length <= 2) return '.' + host;
    var twoLevelTlds = ['com.br','co.uk','com.au','co.jp','co.kr','com.mx','com.ar','co.nz','co.za','com.sg','com.pt','net.br','org.br'];
    var tail2 = parts.slice(-2).join('.');
    if (twoLevelTlds.indexOf(tail2) !== -1 && parts.length >= 3) {
      return '.' + parts.slice(-3).join('.');
    }
    return '.' + parts.slice(-2).join('.');
  }

  var COOKIE_DOMAIN = detectRootDomain();
  var COOKIE_DURATION = 63072000;
  var UTM_PARAMS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
  var GOOGLE_ADS_PARAMS = ['gclid','gad_campaignid'];
  var FB_PARAMS = ['fbp','fbc'];
  var ALL_URL_PARAMS = UTM_PARAMS.concat(GOOGLE_ADS_PARAMS, FB_PARAMS);
  var SAFE_TO_PROPAGATE = UTM_PARAMS.concat(FB_PARAMS);
  var FB_REGEX = /^fb\.[0-2]\.\d+\..+$/;

  var PROPAGATION_BLOCKLIST = [
    'facebook.com','instagram.com','twitter.com','x.com','linkedin.com',
    'tiktok.com','youtube.com','pinterest.com','whatsapp.com','t.me','telegram.org',
    'reddit.com','google.com','bing.com','yahoo.com','duckduckgo.com','yandex.com',
    'baidu.com','wikipedia.org','chatgpt.com','chat.openai.com','claude.ai',
    'gemini.google.com','bard.google.com','poe.com','character.ai','github.com',
    'stackoverflow.com'
  ];

  function setCookie(name, value) {
    var domainPart = COOKIE_DOMAIN ? '; domain=' + COOKIE_DOMAIN : '';
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; max-age=' + COOKIE_DURATION +
      '; path=/' + domainPart +
      '; SameSite=None; Secure';
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getParam(name, urlString) {
    try {
      var u = new URL(urlString || window.location.href);
      return u.searchParams.get(name);
    } catch (e) { return null; }
  }

  function isValidFb(v) {
    return typeof v === 'string' && FB_REGEX.test(v);
  }

  function isInternalReferrer(referrer) {
    if (!referrer) return false;
    var currentDomain = window.location.hostname;
    try {
      var r = new URL(referrer);
      return r.hostname === currentDomain ||
             r.hostname.endsWith('.' + currentDomain.replace('www.', '')) ||
             currentDomain.endsWith('.' + r.hostname.replace('www.', ''));
    } catch (e) { return false; }
  }

  function isInternalDestination(href) {
    try {
      var u = new URL(href, window.location.href);
      var root = COOKIE_DOMAIN.replace(/^\./, '');
      return u.hostname === window.location.hostname ||
             (root && (u.hostname === root || u.hostname.endsWith('.' + root)));
    } catch (e) { return false; }
  }

  function shouldPropagateTo(href) {
    try {
      var u = new URL(href, window.location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

      for (var i = 0; i < PROPAGATION_BLOCKLIST.length; i++) {
        var blocked = PROPAGATION_BLOCKLIST[i];
        if (u.hostname === blocked || u.hostname.endsWith('.' + blocked)) {
          return false;
        }
      }
      return true;
    } catch (e) { return false; }
  }

  function getParamsForDestination(href) {
    return isInternalDestination(href) ? ALL_URL_PARAMS : SAFE_TO_PROPAGATE;
  }

  var referrerMappings = {
    'google.com': { utm_source: 'google', utm_medium: 'organic' },
    'bing.com': { utm_source: 'bing', utm_medium: 'organic' },
    'yahoo.com': { utm_source: 'yahoo', utm_medium: 'organic' },
    'duckduckgo.com': { utm_source: 'duckduckgo', utm_medium: 'organic' },
    'yandex.com': { utm_source: 'yandex', utm_medium: 'organic' },
    'baidu.com': { utm_source: 'baidu', utm_medium: 'organic' },
    'instagram.com': { utm_source: 'instagram', utm_medium: 'organic' },
    'youtube.com': { utm_source: 'youtube', utm_medium: 'organic' },
    'facebook.com': { utm_source: 'facebook', utm_medium: 'organic' },
    'twitter.com': { utm_source: 'twitter', utm_medium: 'organic' },
    'x.com': { utm_source: 'twitter', utm_medium: 'organic' },
    'linkedin.com': { utm_source: 'linkedin', utm_medium: 'organic' },
    'tiktok.com': { utm_source: 'tiktok', utm_medium: 'organic' },
    'pinterest.com': { utm_source: 'pinterest', utm_medium: 'organic' },
    'whatsapp.com': { utm_source: 'whatsapp', utm_medium: 'organic' },
    'telegram.org': { utm_source: 'telegram', utm_medium: 'organic' },
    'reddit.com': { utm_source: 'reddit', utm_medium: 'organic' },
    'gemini.google.com': { utm_source: 'gemini', utm_medium: 'ai' },
    'chat.openai.com': { utm_source: 'chatgpt', utm_medium: 'ai' },
    'chatgpt.com': { utm_source: 'chatgpt', utm_medium: 'ai' },
    'bard.google.com': { utm_source: 'bard', utm_medium: 'ai' },
    'claude.ai': { utm_source: 'claude', utm_medium: 'ai' },
    'bing.com/chat': { utm_source: 'bing_chat', utm_medium: 'ai' },
    'poe.com': { utm_source: 'poe', utm_medium: 'ai' },
    'character.ai': { utm_source: 'character_ai', utm_medium: 'ai' },
    'wikipedia.org': { utm_source: 'wikipedia', utm_medium: 'referral' },
    'github.com': { utm_source: 'github', utm_medium: 'referral' },
    'stackoverflow.com': { utm_source: 'stackoverflow', utm_medium: 'referral' }
  };

  function processCookies() {
    GOOGLE_ADS_PARAMS.forEach(function (p) {
      var v = getParam(p);
      if (v !== null && v !== '') setCookie(p, v);
    });

    var urlUtms = {};
    var urlHasAnyUtm = false;
    UTM_PARAMS.forEach(function (p) {
      var v = getParam(p);
      if (v !== null) {
        urlUtms[p] = v;
        if (v !== '') urlHasAnyUtm = true;
      }
    });

    if (urlHasAnyUtm) {
      UTM_PARAMS.forEach(function (p) {
        setCookie(p, urlUtms[p] !== undefined ? urlUtms[p] : '');
      });
    } else {
      var referrer = document.referrer;
      if (referrer && !isInternalReferrer(referrer)) {
        for (var domain in referrerMappings) {
          if (referrer.indexOf(domain) !== -1) {
            var mapping = referrerMappings[domain];
            UTM_PARAMS.forEach(function (p) {
              setCookie(p, mapping[p] || '');
            });
            console.log('[tracking] UTM via referrer:', referrer, mapping);
            break;
          }
        }
      }
      UTM_PARAMS.forEach(function (p) {
        if (document.cookie.indexOf(p + '=') === -1) setCookie(p, '');
      });
    }
  }

  function getTrackingData() {
    var data = {};
    UTM_PARAMS.forEach(function (p) { data[p] = getCookie(p); });
    GOOGLE_ADS_PARAMS.forEach(function (p) { data[p] = getCookie(p); });

    var fbpUrl = getParam('fbp');
    data.fbp = isValidFb(fbpUrl) ? fbpUrl : (getCookie('_fbp') || '');

    var fbcUrl = getParam('fbc');
    var fbcMeta = getCookie('_fbc');
    var fbclid = getParam('fbclid');
    if (isValidFb(fbcUrl)) data.fbc = fbcUrl;
    else if (isValidFb(fbcMeta)) data.fbc = fbcMeta;
    else if (fbclid) data.fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    else data.fbc = '';

    return data;
  }

  function updateCurrentUrl(data) {
    try {
      var url = new URL(window.location.href);
      var changed = false;
      ALL_URL_PARAMS.forEach(function (p) {
        var v = data[p];
        if (v && url.searchParams.get(p) !== v) {
          url.searchParams.set(p, v);
          changed = true;
        }
      });
      if (changed) window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  function propagateToLinks(data) {
    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) continue;
      if (!shouldPropagateTo(href)) continue;
      try {
        var u = new URL(href, window.location.href);
        var paramsToApply = getParamsForDestination(href);
        var changed = false;
        paramsToApply.forEach(function (p) {
          var v = data[p];
          if (v && !u.searchParams.has(p)) {
            u.searchParams.set(p, v);
            changed = true;
          }
        });
        if (changed) a.setAttribute('href', u.toString());
      } catch (e) {}
    }
  }

  function attachClickInterceptor() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (!shouldPropagateTo(href)) return;
      try {
        var data = getTrackingData();
        var u = new URL(href, window.location.href);
        var paramsToApply = getParamsForDestination(href);
        paramsToApply.forEach(function (p) {
          if (data[p]) u.searchParams.set(p, data[p]);
        });
        a.setAttribute('href', u.toString());
      } catch (e) {}
    }, true);
  }

  var propTimeout;
  function schedulePropagate() {
    clearTimeout(propTimeout);
    propTimeout = setTimeout(function () {
      propagateToLinks(getTrackingData());
    }, 150);
  }

  function init() {
    processCookies();
    var data = getTrackingData();
    updateCurrentUrl(data);
    propagateToLinks(data);
    attachClickInterceptor();

    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(schedulePropagate);
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    setTimeout(function () {
      var freshData = getTrackingData();
      updateCurrentUrl(freshData);
      propagateToLinks(freshData);
    }, 2000);

    console.log('[tracking] root domain:', COOKIE_DOMAIN, '| cookies:', document.cookie);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
