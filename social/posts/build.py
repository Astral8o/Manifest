"""Builds Instagram feed posts (1080x1350) for @eventory_tt. Run: python3 build.py, then render.js."""
import html, os
PUB = os.path.abspath('../../public')
INK, CREAM, PAPER, TOMATO, SUN, PINK, LILAC, LIME, SKY, ORANGE = '#141210', '#FFF6E5', '#FFFDF8', '#F0412F', '#FFC531', '#FF8FB8', '#B79CF0', '#C6E83C', '#7CC6F2', '#FF8A3D'
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

def cover(bg, chip, lines, pics=(), fg=None):
    cells = ''.join(f'<div class="card" style="width:340px;height:340px;flex:none;box-shadow:8px 8px 0 {INK};border-radius:30px"><img src="{img(p)}" style="width:100%;height:100%;object-fit:cover"></div>' for p in pics[:3])
    return f"""<div class="s stripes" style="background-color:{bg};color:{fg or INK}">
      <div style="position:absolute;left:70px;top:70px">{logo()}</div>
      <div class="chip" style="position:absolute;left:70px;top:200px;font-size:36px">{e(chip)}</div>
      <h1 class="d" style="position:absolute;left:70px;right:70px;top:300px;font-size:{190 if max(len(l) for l in lines) <= 12 else 160}px">{'<br>'.join(e(l) for l in lines)}</h1>
      <div style="position:absolute;left:-10px;right:-10px;bottom:130px;display:flex;gap:30px;justify-content:center;transform:rotate(-5deg)">{cells}</div>
      <div style="position:absolute;right:70px;bottom:50px;font-size:34px;font-weight:900">Swipe →</div></div>"""

def event(i, n, ev, color):
    return f"""<div class="s" style="background:{color}">
      <div class="card" style="position:absolute;left:70px;right:70px;top:70px;height:900px;background:{INK}">
        <img src="{img(ev['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(28px);opacity:.6;transform:scale(1.2)">
        <img src="{img(ev['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      </div>
      <div style="position:absolute;left:44px;top:40px;background:{SUN};border:5px solid {INK};border-radius:30px;padding:14px 26px;text-align:center;box-shadow:8px 8px 0 {INK}">
        <div style="font-weight:900;font-size:26px;letter-spacing:.1em">{e(ev['dow'])}</div>
        <div class="d" style="font-size:96px;line-height:.85">{e(ev['day'])}</div>
        <div class="d" style="font-size:34px">{e(ev['mon'])}</div>
      </div>
      <h2 class="d" style="position:absolute;left:70px;right:70px;top:1010px;font-size:{88 if len(ev['title'])<20 else 72}px">{e(ev['title'])}</h2>
      <div class="foot"><span class="chip" style="font-size:38px;background:{PAPER}">{e(ev['price'])}</span>{dots(i, n)}</div></div>"""

def deal(i, n, d, color):
    burst = f'<div class="burst" style="right:40px;top:760px">-{d["pct"]}%</div>' if d.get('pct') else ''
    was = f'<s style="font-size:46px;opacity:.6;margin-left:18px">TT${d["was"]:,}</s>' if d.get('was') else ''
    return f"""<div class="s" style="background:{color}">
      <div class="card" style="position:absolute;left:70px;right:70px;top:70px;height:900px;background:#fff">
        <img src="{img(d['img'])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
      </div>{burst}
      <div style="position:absolute;left:70px;right:70px;top:1000px">
        <h2 style="font-size:50px;font-weight:900;line-height:1.1">{e(d['title'])}</h2>
        <div style="display:flex;align-items:baseline;margin-top:6px"><span class="d" style="font-size:120px">{e(d['price'])}</span>{was}</div>
      </div>
      <div class="foot" style="justify-content:flex-end">{dots(i, n)}</div></div>"""

def end(bg, line, url='Link in bio', fg=None):
    return f"""<div class="s stripes" style="background-color:{bg};color:{fg or INK}">
      <div style="position:absolute;left:70px;top:70px">{logo()}</div>
      <h2 class="d" style="position:absolute;left:70px;right:70px;top:420px;font-size:150px">{line}</h2>
      <div class="chip" style="position:absolute;left:70px;bottom:120px;font-size:46px;background:{INK};color:{CREAM};padding:18px 40px">{e(url)}</div></div>"""

def page(name, slides):
    os.makedirs(name, exist_ok=True)
    open(f'{name}/slides.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>{"".join(slides)}</body></html>')

# ---------- Deal and event carousels (one category each, few words) ----------
def ev(img_, dow, day, mon, title, price): return dict(img=img_, dow=dow, day=day, mon=mon, title=title, price=price)

WK = [ev('/events/ttma-popup.webp','SAT–SUN','28','Nov','TTMA Christmas Pop-Up','Pop-up shop'),
      ev('/events/parang-lanterns.webp','SATURDAY','28','Nov','Parang Under the Lanterns','TT$350'),
      ev('/events/house-parang.webp','SUNDAY','29','Nov','House Parang','Coolers welcome'),
      ev('/events/taste-of-moruga.webp','SUNDAY','29','Nov','Taste of Moruga Tour','Book now')]
page('04-this-weekend', [cover(LILAC, 'Events', ['This weekend'], [w['img'] for w in WK])]
     + [event(k+1, len(WK)+2, w, [PAPER, SUN, PINK, LIME][k]) for k, w in enumerate(WK)] + [end(LILAC, 'Full events<br>calendar', 'eventorytt.com/things')])

SHOP = [dict(title='Serta Pillow Top Divan', price='TT$2,199', was=3999, pct=45, img='/deals/courts/serta-divan.webp'),
        dict(title='Mastertech Microwave', price='TT$499', was=799, pct=38, img='/deals/courts/mastertech-microwave.webp'),
        dict(title='RadioShack 15" Speaker', price='TT$1,599', was=2199, pct=27, img='/deals/courts/radioshack-speaker.webp'),
        dict(title='Mabe 6 Burner Stove', price='TT$2,499', was=3299, pct=24, img='/deals/courts/mabe-stove.webp'),
        dict(title='Skempton 6-Chair Dining Set', price='TT$6,999', was=8999, pct=22, img='/deals/courts/skempton.webp'),
        dict(title='TCL Side by Side Fridge', price='TT$6,999', was=8499, pct=18, img='/deals/courts/tcl-fridge.webp')]
page('05-shopping-courts', [cover(SUN, 'Shopping · Courts', ['Up to 45% off'], [d['img'] for d in SHOP])]
     + [deal(k+1, len(SHOP)+2, d, [PAPER, PINK, LIME, SKY, PAPER, PINK][k]) for k, d in enumerate(SHOP)] + [end(SUN, 'More Black<br>Friday deals')])

FOOD = [dict(title='Personal pizza, snack & drink · Mario’s', price='TT$39', img='/deals/marios/MAR-007.webp'),
        dict(title='Burger & slushie · Mario’s', price='TT$43', img='/deals/marios/MAR-001.webp'),
        dict(title='2 burgers & 2 drinks · Mario’s', price='TT$69', img='/deals/marios/MAR-010.webp'),
        dict(title='Any 1-topping pan pizza · Domino’s', price='TT$99', img='/deals/dominos/DOM-001.webp'),
        dict(title='XL 16" 1-topping pizza · Domino’s', price='TT$99', img='/deals/dominos/DOM-003.webp')]
page('06-food-under-100', [cover(ORANGE, 'Food', ['Under TT$100'], [d['img'] for d in FOOD])]
     + [deal(k+1, len(FOOD)+2, d, [SUN, PAPER, LIME, PINK, SKY][k]) for k, d in enumerate(FOOD)] + [end(TOMATO, 'More food<br>deals')])

BEAUTY = [dict(title='Sacha Cream-to-Powder Foundation', price='TT$75', was=100, pct=25, img='/deals/sacha/black-friday.webp'),
          dict(title='Beauté by KNJ · wigs, skincare, makeup', price='Up to 20% off', img='/deals/beautebyknj/BKJ-001.webp')]
page('07-beauty', [cover(PINK, 'Beauty', ['Black Friday', 'beauty'], [d['img'] for d in BEAUTY] + ['/deals/sacha/black-friday.webp'])]
     + [deal(k+1, len(BEAUTY)+2, d, [PAPER, LILAC][k]) for k, d in enumerate(BEAUTY)] + [end(PINK, 'More beauty<br>deals')])

PAR = [ev('/events/parang-pan-sunset.webp','SATURDAY','5','Dec','Parang & Pan Under the Sunset','TT$350'),
       ev('/events/de-pan-man.webp','FRIDAY','11','Dec','De Pan Man Parang','From TT$250'),
       ev('/events/parang-on-d-hills.webp','SATURDAY','12','Dec','Parang on D Hills','FREE'),
       ev('/events/black-cake-sorrel.webp','FRIDAY','18','Dec','Black Cake & Sorrel','TT$175'),
       ev('/events/believe.webp','SUNDAY','20','Dec','Believe: Carols by Candlelight','From TT$250'),
       ev('/events/monday-madness.webp','MONDAY','21','Dec','Monday Madness Parang','Tickets online'),
       ev('/events/trincity-parang.webp','SATURDAY','26','Dec','Boxing Day Parang','TT$80')]
page('08-parang-season', [cover(TOMATO, 'Events · December', ['Parang season'], [p['img'] for p in PAR])]
     + [event(k+1, len(PAR)+2, p, [SUN, PINK, LIME, PAPER, SKY, SUN, PINK][k]) for k, p in enumerate(PAR)] + [end(TOMATO, 'All parang<br>dates', 'eventorytt.com/things')])

NYE = [ev('/events/red-carpet.webp','THURSDAY','31','Dec','Red Carpet NYE Gala','Breakfast included'),
       ev('/events/jamboree-oyn.webp','THURSDAY','31','Dec','Jamboree OYN: Met Gala','Drinks included'),
       ev('/events/soca1st.webp','FRIDAY','1','Jan','Soca1st Boat Party','TT$250')]
page('09-old-years', [cover('#1E1A16', 'Events · Old Year’s', ['Ring in 2027'], [n['img'] for n in NYE], fg=CREAM)]
     + [event(k+1, len(NYE)+2, n, [SUN, PINK, SKY][k]) for k, n in enumerate(NYE)] + [end(SUN, 'More New<br>Year events', 'eventorytt.com/things')])

# ---------- Intro posts: one image each, one line per point ----------
def single(bg, inner, fg=INK):
    return f'<div class="s stripes" style="background-color:{bg};color:{fg}">{inner}</div>'

page('01-who-we-are', [single(TOMATO, f"""
  <div style="position:absolute;left:70px;right:70px;top:80px;transform:scale(1.5);transform-origin:left top">{logo()}</div>
  <h1 class="d" style="position:absolute;left:70px;right:70px;top:250px;font-size:170px">Every deal<br>in T&amp;T.<br>One place.</h1>
  <p style="position:absolute;left:70px;right:70px;top:820px;font-size:42px;font-weight:800">Food, shopping, beauty and things to do.</p>
  <div style="position:absolute;left:-20px;right:-20px;bottom:40px;display:flex;gap:28px;justify-content:center;transform:rotate(-5deg)">
    {''.join(f'<div class="card" style="width:260px;height:260px;flex:none;border-radius:28px;box-shadow:8px 8px 0 {INK}"><img src="{img(p)}" style="width:100%;height:100%;object-fit:cover"></div>' for p in ['/deals/courts/mabe-stove.webp','/deals/marios/MAR-001.webp','/events/believe.webp','/deals/dominos/DOM-001.webp'])}
  </div>""")])

page('02-how-it-works', [single(SUN, f"""
  <div style="position:absolute;left:70px;top:70px">{logo()}</div>
  <h1 class="d" style="position:absolute;left:70px;top:210px;font-size:150px">How it works</h1>
  <div style="position:absolute;left:70px;right:70px;top:450px;display:flex;flex-direction:column;gap:34px">
    {''.join(f'<div class="card" style="display:flex;align-items:center;gap:34px;padding:30px 40px;border-radius:36px;background:{c}"><span class="d" style="font-size:120px;width:80px">{n}</span><span style="font-size:58px;font-weight:900">{t}</span></div>' for n,t,c in [('1','Find a deal',PAPER),('2','Tap Get Deal',PAPER),('3','Buy from the store',PAPER)])}
  </div>
  <div class="chip" style="position:absolute;left:70px;bottom:70px;font-size:40px;background:{INK};color:{CREAM};padding:16px 34px">eventorytt.com</div>""")])

page('03-list-your-deal', [single(LIME, f"""
  <div style="position:absolute;left:70px;top:70px">{logo()}</div>
  <h1 class="d" style="position:absolute;left:70px;right:70px;top:230px;font-size:190px">Got a deal?<br>Tag us.</h1>
  <div class="card" style="position:absolute;left:70px;top:720px;padding:26px 46px;border-radius:999px;background:{INK};color:{CREAM};font-family:Anton;font-size:110px;box-shadow:12px 12px 0 {TOMATO}">@eventory_tt</div>
  <p style="position:absolute;left:70px;right:70px;top:960px;font-size:56px;font-weight:900">Free to list. We’ll put it up.</p>
  <p style="position:absolute;left:70px;right:70px;bottom:80px;font-size:36px;font-weight:800">Or WhatsApp 1-868-717-7720</p>""")])

print('built')
