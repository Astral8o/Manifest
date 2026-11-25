"""Builds Instagram feed posts (1080x1350) for @eventory_tt. Run: python3 build.py, then render.js."""
import html, os
PUB = os.path.abspath('../../public')
INK, CREAM, PAPER, TOMATO, SUN, PINK, LILAC, LIME, SKY = '#141210', '#FFF6E5', '#FFFDF8', '#F0412F', '#FFC531', '#FF8FB8', '#B79CF0', '#C6E83C', '#7CC6F2'
e = html.escape
img = lambda p: 'file://' + PUB + p

CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#888;font-family:Archivo,sans-serif;color:{INK}}}
.s{{width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:20px}}
.d{{font-family:Anton,sans-serif;font-weight:400;text-transform:uppercase;line-height:.9}}
.chip{{color:{INK};display:inline-block;border:4px solid {INK};border-radius:999px;padding:10px 26px;font-weight:800;font-size:30px;background:{CREAM}}}
.card{{border:5px solid {INK};border-radius:44px;box-shadow:12px 12px 0 {INK};overflow:hidden;background:{PAPER}}}
.logo{{display:flex;align-items:center;gap:12px}}.logo b{{font-family:Anton;font-weight:400;font-size:54px;letter-spacing:.02em}}
.tt{{font-family:Anton;font-size:24px;background:{TOMATO};color:{CREAM};width:66px;height:66px;border-radius:50%;display:grid;place-items:center;border:4px solid {INK};transform:rotate(-12deg)}}
.burst{{position:absolute;width:230px;height:230px;background:{SUN};display:grid;place-items:center;font-family:Anton;font-size:64px;border:0;
 clip-path:polygon(50% 0%,60.35% 11.36%,75% 6.7%,78.28% 21.72%,93.3% 25%,88.64% 39.65%,100% 50%,88.64% 60.35%,93.3% 75%,78.28% 78.28%,75% 93.3%,60.35% 88.64%,50% 100%,39.65% 88.64%,25% 93.3%,21.72% 78.28%,6.7% 75%,11.36% 60.35%,0% 50%,11.36% 39.65%,6.7% 25%,21.72% 21.72%,25% 6.7%,39.65% 11.36%)}}
.stripes{{background-image:repeating-linear-gradient(135deg,rgba(20,18,16,.07) 0 3px,transparent 3px 22px)}}
.foot{{position:absolute;left:70px;right:70px;bottom:56px;display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:30px}}
.dots{{display:flex;gap:10px}}.dots i{{width:16px;height:16px;border-radius:50%;border:3px solid {INK};display:block}}
"""

def logo(): return '<div class="logo"><b>EVENTORY</b><span class="tt">TT</span></div>'
def dots(i, n): return '<div class="dots">' + ''.join(f'<i style="background:{INK if k==i else "transparent"}"></i>' for k in range(n)) + '</div>'

def cover(bg, kicker, lines, sub, pics=(), brand=True, swipe=True, fg=None):
    grid = ''
    if pics:
        cells = ''.join(f'<div class="card" style="width:300px;height:300px;box-shadow:8px 8px 0 {INK};border-radius:30px"><img src="{img(p)}" style="width:100%;height:100%;object-fit:cover"></div>' for p in pics[:6])
        grid = f'<div style="position:absolute;left:-30px;right:-30px;bottom:-60px;display:grid;grid-template-columns:repeat(3,300px);gap:34px;justify-content:center;transform:rotate(-6deg)">{cells}</div>'
    return f'''<div class="s stripes" style="background-color:{bg};color:{fg or INK}">
      <div style="position:absolute;left:70px;top:70px;right:70px">
        {logo() if brand else ''}
        <div class="chip" style="margin-top:{40 if brand else 0}px">{e(kicker)}</div>
        <h1 class="d" style="font-size:{min(150, int(1250/max(len(l) for l in lines)*1.05))}px;margin-top:34px">{'<br>'.join(e(l) for l in lines)}</h1>
        <p style="font-size:36px;font-weight:700;margin-top:30px;line-height:1.3;max-width:900px">{e(sub)}</p>
        {f'<p style="font-size:30px;font-weight:800;margin-top:26px">Swipe →</p>' if swipe else ''}
      </div>{grid}</div>'''

def event(i, n, ev, color):
    return f'''<div class="s" style="background:{color}">
      <div class="card" style="position:absolute;left:70px;right:70px;top:70px;height:780px;background:{INK}">
        <img src="{img(ev['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(28px);opacity:.6;transform:scale(1.2)">
        <img src="{img(ev['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      </div>
      <div style="position:absolute;left:70px;top:40px;background:{SUN};border:5px solid {INK};border-radius:30px;padding:14px 26px;text-align:center;box-shadow:8px 8px 0 {INK}">
        <div style="font-weight:900;font-size:26px;letter-spacing:.1em">{e(ev['dow'])}</div>
        <div class="d" style="font-size:96px;line-height:.85">{e(ev['day'])}</div>
        <div class="d" style="font-size:34px">{e(ev['mon'])}</div>
      </div>
      <div style="position:absolute;left:70px;right:70px;top:885px">
        <div style="font-size:28px;font-weight:800;letter-spacing:.04em;opacity:.8">{e(ev['time'])}</div>
        <h2 class="d" style="font-size:{86 if len(ev['title'])<22 else 70}px;margin-top:10px">{e(ev['title'])}</h2>
        <div style="font-size:32px;font-weight:700;margin-top:14px">📍 {e(ev['where'])}</div>
      </div>
      <div class="foot"><span class="chip" style="font-size:34px;background:{PAPER}">{e(ev['price'])}</span>{dots(i, n)}</div></div>'''

def deal(i, n, d, color):
    burst = f'<div class="burst" style="right:40px;top:640px">-{d["pct"]}%</div>' if d.get('pct') else ''
    was = f'<s style="font-size:44px;opacity:.6;margin-left:18px">TT${d["was"]:,}</s>' if d.get('was') else ''
    return f'''<div class="s" style="background:{color}">
      <div class="card" style="position:absolute;left:70px;right:70px;top:70px;height:800px;background:#fff">
        <img src="{img(d['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      </div>{burst}
      <div style="position:absolute;left:70px;right:70px;top:905px">
        <div style="font-size:30px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">{e(d['biz'])}</div>
        <h2 style="font-size:52px;font-weight:800;line-height:1.1;margin-top:8px">{e(d['title'])}</h2>
        <div style="display:flex;align-items:baseline;margin-top:16px"><span class="d" style="font-size:110px">{e(d['price'])}</span>{was}</div>
      </div>
      <div class="foot" style="justify-content:flex-end">{dots(i, n)}</div></div>'''

def end(bg, title, lines, url):
    return f'''<div class="s stripes" style="background-color:{bg}">
      <div style="position:absolute;left:70px;right:70px;top:70px">{logo()}</div>
      <div style="position:absolute;left:70px;right:70px;top:300px">
        <h2 class="d" style="font-size:130px">{title}</h2>
        <div style="margin-top:44px;display:flex;flex-direction:column;gap:22px">{''.join(f'<div style="font-size:40px;font-weight:700;display:flex;gap:18px"><span style="font-family:Anton">→</span><span>{e(l)}</span></div>' for l in lines)}</div>
        <div class="chip" style="margin-top:60px;font-size:40px;background:{INK};color:{CREAM};padding:16px 34px">{e(url)}</div>
      </div></div>'''

def page(name, slides):
    os.makedirs(name, exist_ok=True)
    open(f'{name}/slides.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(slides)}</body></html>')

# ---------- 1. Welcome ----------
page('01-welcome', [
    cover(CREAM, 'New in T&T', ['Today’s best', 'deals in T&T'], 'Sales, deals and things to do across Trinidad & Tobago. All in one place.',
          ['/deals/courts/mabe-stove.webp', '/events/believe.webp', '/deals/dominos/DOM-001.webp', '/deals/sacha/black-friday.webp', '/events/house-parang.webp', '/deals/marios/MAR-001.webp']),
    f'''<div class="s" style="background:{SUN}"><div style="position:absolute;left:70px;right:70px;top:90px">
      <h2 class="d" style="font-size:120px">What you’ll<br>find</h2>
      <div style="margin-top:50px;display:flex;flex-direction:column;gap:26px">
      {''.join(f'<div class="card" style="padding:26px 34px;display:flex;align-items:center;gap:26px;background:{c};box-shadow:8px 8px 0 {INK};border-radius:30px"><span style="font-size:60px">{ic}</span><span><b style="font-size:42px;display:block">{t}</b><span style="font-size:30px;font-weight:600">{s}</span></span></div>' for ic, t, s, c in [('🍕','Food & drink','Pizza, burgers, combos and family meals',PAPER),('🛋️','Shopping','Appliances, furniture, phones and more',PAPER),('💄','Beauty','Makeup, skincare, hair and wigs',PAPER),('🎶','Things to do','Parang, concerts, parties, tours',LILAC)])}
      </div></div><div class="foot" style="justify-content:flex-end">{dots(1,3)}</div></div>''',
    end(LIME, 'How it<br>works', ['Find a deal or event', 'Tap Get Deal or Get Tickets', 'Buy straight from the business', 'Save your favourites with ♡'], 'Link in bio · eventorytt.com'),
])

# ---------- 2. This weekend (27–29 Nov) ----------
WK = [
  dict(img='/events/ttma-popup.webp', dow='SAT–SUN', day='28', mon='Nov', time='SAT 28 – SUN 29 NOV · 10AM–6PM', title='TTMA Christmas Pop-Up & Parang', where='Centre of Excellence, Macoya', price='Pop-up shop'),
  dict(img='/events/parang-lanterns.webp', dow='SATURDAY', day='28', mon='Nov', time='SAT 28 NOV · 6PM–MIDNIGHT', title='Parang Under the Lanterns', where='Immortelle, Santa Cruz', price='TT$350 · food included'),
  dict(img='/events/house-parang.webp', dow='SUNDAY', day='29', mon='Nov', time='SUN 29 NOV · 4–11PM', title='House Parang', where='Anchorage Beach Club, Chaguaramas', price='Coolers welcome'),
  dict(img='/events/taste-of-moruga.webp', dow='SUNDAY', day='29', mon='Nov', time='SUN 29 NOV · DAY TRIP', title='A Taste of Moruga Tour', where='Departs Curepe', price='Book now'),
]
page('02-this-weekend', [cover(LILAC, 'Fri 27 – Sun 29 Nov', ['This weekend', 'in T&T'], 'Parang, a Christmas pop-up and a day trip down south.', [w['img'] for w in WK] + ['/events/parang-pan-sunset.webp', '/events/de-pan-man.webp'])]
     + [event(i+1, len(WK)+2, w, [PAPER, SUN, PINK, LIME][i]) for i, w in enumerate(WK)]
     + [end(LILAC, 'Full events<br>calendar', ['Every event, in date order', 'Tap a day to see what’s on', 'Add events to your calendar'], 'eventorytt.com/things')])

# ---------- 3. Parang season ----------
PAR = [
  dict(img='/events/parang-pan-sunset.webp', dow='SATURDAY', day='5', mon='Dec', time='SAT 5 DEC · BOARDS 3PM', title='Parang & Pan Under the Sunset', where='Harbour Master cruise', price='TT$350 early bird'),
  dict(img='/events/de-pan-man.webp', dow='FRIDAY', day='11', mon='Dec', time='FRI 11 DEC · 7PM', title='De Pan Man Parang', where='The Royal Hotel, San Fernando', price='From TT$250'),
  dict(img='/events/parang-on-d-hills.webp', dow='SATURDAY', day='12', mon='Dec', time='SAT 12 DEC · FROM 7PM', title='Parang on D Hills', where='John Mader Grounds, Paramin', price='FREE'),
  dict(img='/events/black-cake-sorrel.webp', dow='FRIDAY', day='18', mon='Dec', time='FRI 18 DEC', title='Black Cake & Sorrel III', where='Trinidad All Stars Panyard, POS', price='TT$175'),
  dict(img='/events/believe.webp', dow='SUNDAY', day='20', mon='Dec', time='SUN 20 DEC · 6PM', title='Believe: Carols by Candlelight', where='Church of the Assumption, Maraval', price='From TT$250'),
  dict(img='/events/monday-madness.webp', dow='MONDAY', day='21', mon='Dec', time='MON 21 DEC · 6:30PM–1AM', title='Monday Madness Parang', where='Los Alumnos de San Juan, 40th', price='Tickets online'),
  dict(img='/events/trincity-parang.webp', dow='SATURDAY', day='26', mon='Dec', time='SAT 26 DEC · 7PM–2AM', title='Boxing Day Parang', where='Montague Grounds, Trincity', price='TT$80'),
]
cols = [SUN, PINK, LIME, PAPER, SKY, SUN, PINK]
page('03-parang-season', [cover(TOMATO, 'December 2026', ['Parang season', 'is here'], '7 parang nights and Christmas shows worth your December.', [p['img'] for p in PAR[:6]])]
     + [event(i+1, len(PAR)+2, p, cols[i]) for i, p in enumerate(PAR)]
     + [end(TOMATO, 'Never miss<br>a parang', ['All dates on our calendar', 'Free events marked FREE', 'Add to your calendar in one tap'], 'eventorytt.com/things')])

# ---------- 4. Old Year's ----------
NYE = [
  dict(img='/events/red-carpet.webp', dow='THURSDAY', day='31', mon='Dec', time='THU 31 DEC · 10PM', title='The Red Carpet Event: NYE Gala', where='Cascadia Hotel, St. Ann’s', price='Breakfast included'),
  dict(img='/events/jamboree-oyn.webp', dow='THURSDAY', day='31', mon='Dec', time='THU 31 DEC · 9PM–4AM', title='Jamboree OYN: Met Gala', where='Hilton Trinidad, poolside', price='Drinks included'),
  dict(img='/events/soca1st.webp', dow='FRIDAY', day='1', mon='Jan', time='FRI 1 JAN · BOARDS 3PM', title='Soca1st Boat Party', where='New Year’s Day cruise', price='TT$250'),
]
page('04-old-years', [cover('#1E1A16', 'Old Year’s Night', ['Where to ring', 'in 2027'], 'Two galas and a New Year’s Day boat ride.', [n['img'] for n in NYE], fg=CREAM)]
     + [event(i+1, len(NYE)+2, n, [SUN, PINK, SKY][i]) for i, n in enumerate(NYE)]
     + [end(SUN, 'Plan your<br>holidays', ['Every Christmas and New Year event', 'Prices, times and ticket links', 'Free to use'], 'eventorytt.com/things')])

# ---------- 5. Black Friday savings ----------
BF = [
  dict(biz='Courts', title='Serta Midnight Magic Pillow Top Divan', price='TT$2,199', was=3999, pct=45, img='/deals/courts/serta-divan.webp'),
  dict(biz='Courts', title='Mastertech 0.7 ft³ Microwave', price='TT$499', was=799, pct=38, img='/deals/courts/mastertech-microwave.webp'),
  dict(biz='Courts', title='RadioShack 15" 2-Way Active Speaker', price='TT$1,599', was=2199, pct=27, img='/deals/courts/radioshack-speaker.webp'),
  dict(biz='Sacha Cosmetics', title='Cream-to-Powder Foundation', price='TT$75', was=100, pct=25, img='/deals/sacha/black-friday.webp'),
  dict(biz='Courts', title='Mabe 30" 6 Burner Stove', price='TT$2,499', was=3299, pct=24, img='/deals/courts/mabe-stove.webp'),
]
page('05-black-friday', [cover(SUN, 'Black Friday', ['Biggest', 'savings', 'right now'], 'Up to 45% off. Prices from the stores, while stock lasts.', [b['img'] for b in BF] + ['/deals/beautebyknj/BKJ-001.webp'], brand=False)]
     + [deal(i+1, len(BF)+2, b, [PAPER, PINK, LIME, PAPER, SKY][i]) for i, b in enumerate(BF)]
     + [end(SUN, 'More Black<br>Friday deals', ['Courts, Sacha, Beauté by KNJ and more', 'Sorted by biggest savings', 'Tap through to buy direct'], 'Link in bio')])

# ---------- 6. For businesses ----------
page('06-list-free', [f'''<div class="s stripes" style="background-color:{TOMATO}">
  <div style="position:absolute;left:70px;right:70px;top:70px">{logo()}
    <div class="chip" style="margin-top:44px">For businesses</div>
    <h1 class="d" style="font-size:150px;margin-top:34px">List your<br>deal free</h1>
    <div style="margin-top:40px;display:flex;flex-direction:column;gap:18px;font-size:44px;font-weight:800">
      <div>✓ No follower minimum</div><div>✓ No like count</div><div>✓ Live in 2 business days</div></div>
    <div class="card" style="margin-top:56px;padding:30px 36px;box-shadow:10px 10px 0 {INK}">
      <div style="font-size:30px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.7">3 ways to send it</div>
      <div style="font-size:38px;font-weight:700;margin-top:14px;line-height:1.5">1. Form at eventorytt.com<br>2. WhatsApp 1-868-717-7720<br>3. Tag @eventory_tt in your post</div>
    </div></div></div>'''])
print('built')
