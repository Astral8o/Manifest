// The floating "Demo" button: a short script for showing Eventory to a
// vendor in person, with one-tap shortcuts and a reset.
(function () {
  var css = [
    '#evd-btn{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;background:#171717;color:#fff;font:700 13px Manrope,sans-serif;padding:10px 16px;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;gap:8px;align-items:center;cursor:pointer}',
    '#evd-btn i{width:8px;height:8px;border-radius:50%;background:#E0512B;display:block}',
    '#evd-bg{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2147483001}',
    '#evd{position:fixed;left:0;right:0;bottom:0;z-index:2147483002;background:#fff;color:#171717;border-radius:22px 22px 0 0;max-height:86vh;overflow:auto;padding:20px 18px calc(20px + env(safe-area-inset-bottom));font:500 15px/1.45 Manrope,sans-serif;box-shadow:0 -10px 40px rgba(0,0,0,.2)}',
    '@media(min-width:700px){#evd{left:auto;right:20px;bottom:20px;width:420px;border-radius:22px;max-height:calc(100vh - 40px)}}',
    '#evd h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}',
    '#evd .ey{font:400 11px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:#7A7A7A}',
    '#evd .top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}',
    '#evd .x{border:0;background:#F3F3EF;border-radius:999px;width:36px;height:36px;font-size:18px;cursor:pointer}',
    '#evd .logins{display:grid;gap:6px;background:#F3F3EF;border-radius:14px;padding:12px 14px;margin:10px 0 16px;font-size:14px}',
    '#evd .logins b{font-family:"IBM Plex Mono",monospace;font-weight:400}',
    '#evd ol{list-style:none;margin:0;padding:0;display:grid;gap:8px;counter-reset:s}',
    '#evd li{counter-increment:s;border:1px solid #E9E9E4;border-radius:16px;padding:12px 14px;display:grid;gap:8px}',
    '#evd li .h{display:flex;gap:10px;align-items:baseline;font-weight:800}',
    '#evd li .h:before{content:counter(s);font:400 12px "IBM Plex Mono",monospace;color:#E0512B}',
    '#evd li p{margin:0;color:#4A4A4A;font-size:14px}',
    '#evd .go{justify-self:start;border:1px solid #D7D7D2;background:#fff;border-radius:999px;padding:8px 14px;font:700 13px Manrope,sans-serif;cursor:pointer;color:#171717}',
    '#evd .go.acc{background:#E0512B;border-color:#E0512B;color:#fff}',
    '#evd .foot{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid #E9E9E4}',
    '#evd .note{font-size:12px;color:#7A7A7A}',
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function go(path) { location.hash = path; close(); window.scrollTo(0, 0); }
  function signIn(email, path) {
    close();
    var db = window.EVDB;
    db.signOut().then(function () { location.hash = path; return db.signIn(email, 'demo1234'); }).then(function () { window.scrollTo(0, 0); });
  }
  var STEPS = [
    ['Planners find you', 'Home: planners browse by event and category, or search. Your listing shows where it matches.', 'Show home', function () { go('/'); }],
    ['Your profile', 'Photos, packages with your own names and prices, the events you do and where you’re based.', 'Open a profile', function () { go('/vendors/frame-focus-studio/'); }],
    ['A planner sends an inquiry', 'Tap “Send an inquiry” on the profile and fill it in like a planner would. No account needed.', 'Start an inquiry', function () { go('/vendors/frame-focus-studio/'); setTimeout(function () { var b = [].filter.call(document.querySelectorAll('button'), function (x) { return /send an inquiry/i.test(x.textContent) && x.offsetParent; })[0]; if (b) b.click(); }, 350); }],
    ['It lands in your inbox', 'Signed in as the vendor: every inquiry with the date, guests, budget and how to reply (WhatsApp, call or email).', 'Open the vendor inbox', function () { signIn('vendor@demo.tt', '/inbox/'); }],
    ['No-cost vs Spotlight', 'Every listing gets unlimited inquiries at no cost. Spotlight (TTD $175, one-time payment) adds visibility: featured placement, email marketing, social media and Magazine features.', 'Show the plans', function () { signIn('vendor@demo.tt', '/inbox/'); setTimeout(function () { var el = document.getElementById('spotlight-tiers'); if (el) el.scrollIntoView(); }, 900); }],
    ['Sign up in two minutes', 'Five short steps: business, category, packages, photos, publish. It’s live straight away.', 'Start sign-up', function () { window.EVDB.signOut().then(function () { go('/join/'); }); }],
  ];

  var btn = document.createElement('button');
  btn.id = 'evd-btn'; btn.type = 'button'; btn.innerHTML = '<i></i>Demo';
  btn.onclick = open;
  document.body.appendChild(btn);
  var bg, panel;
  function close() { if (panel) { panel.remove(); bg.remove(); panel = bg = null; } }
  function open() {
    close();
    var up = window.EVDEMO.pendingUpgrade();
    bg = document.createElement('div'); bg.id = 'evd-bg'; bg.onclick = close;
    panel = document.createElement('div'); panel.id = 'evd'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Demo guide');
    panel.innerHTML = '<div class="top"><div><div class="ey">Offline demo · sample vendors</div><h2>Show a vendor Eventory</h2></div><button class="x" aria-label="Close">×</button></div>' +
      '<div class="logins"><div>Vendor: <b>vendor@demo.tt</b> · <b>demo1234</b></div><div>Planner: <b>planner@demo.tt</b> · <b>demo1234</b></div></div>' +
      (up ? '<ol style="margin-bottom:12px"><li style="border-color:#E0512B"><div class="h">Upgrade requested: ' + window.EVDEMO.planName(up.tier) + '</div><p>In real life the Eventory team arranges billing, then switches it on. Do that now:</p><button class="go acc" data-up>Approve as Eventory</button></li></ol>' : '') +
      '<ol>' + STEPS.map(function (s, i) { return '<li><div class="h">' + s[0] + '</div><p>' + s[1] + '</p><button class="go" data-i="' + i + '">' + s[2] + '</button></li>'; }).join('') + '</ol>' +
      '<div class="foot"><span class="note">Nothing here is sent anywhere. Works with no internet.</span><button class="go" data-reset>Reset demo</button></div>';
    document.body.appendChild(bg); document.body.appendChild(panel);
    panel.querySelector('.x').onclick = close;
    [].forEach.call(panel.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { STEPS[+b.dataset.i][3](); }; });
    panel.querySelector('[data-reset]').onclick = function () { if (confirm('Reset the demo? Sign-ups, inquiries and changes made during the demo are cleared.')) window.EVDEMO.reset(); };
    var u = panel.querySelector('[data-up]');
    if (u) u.onclick = function () { window.EVDEMO.approveUpgrade(); location.hash = '/inbox/'; location.reload(); };
  }
})();
