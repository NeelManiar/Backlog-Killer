from playwright.sync_api import sync_playwright, expect
import json
import os
from pathlib import Path
BASE = os.environ.get("BK_TEST_URL", "http://127.0.0.1:8081")
ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':360,'height':800},reduced_motion='reduce')
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('console',lambda msg: errors.append(msg.text) if msg.type=='error' else None)
 page.goto(BASE,wait_until='networkidle',timeout=120000)
 page.get_by_text('Daily missions',exact=True).wait_for(timeout=120000)
 page.get_by_role('textbox',name='Available study minutes').fill('50')
 page.get_by_role('button',name='Suggest today’s missions').click()
 page.get_by_text('50 / 50 minutes planned',exact=True).wait_for()
 page.get_by_role('button',name='Choose another chapter',exact=True).first.click()
 page.get_by_role('button',name='Electrostatics · 25m',exact=True).click()
 page.get_by_role('button',name='Skip mission',exact=True).first.click()
 page.get_by_text('25 / 50 minutes planned',exact=True).wait_for()
 page.reload(wait_until='networkidle')
 page.get_by_text('25 / 50 minutes planned',exact=True).wait_for()
 page.get_by_role('button',name='Mark chapter complete',exact=True).click()
 page.get_by_text('1 unique chapters completed since v0.2 tracking began.',exact=True).wait_for()
 page.goto(BASE + '/timer',wait_until='networkidle')
 page.get_by_role('textbox',name='Focus duration in minutes').fill('1')
 before_focus=json.loads(page.evaluate("localStorage.getItem('bk-data')"))['chapters']
 page.get_by_role('button',name='Start session',exact=True).click()
 page.get_by_role('button',name='Pause',exact=True).wait_for()
 page.get_by_role('button',name='Pause',exact=True).click()
 page.get_by_role('button',name='Resume',exact=True).wait_for()
 page.reload(wait_until='networkidle')
 page.get_by_role('button',name='Resume',exact=True).wait_for()
 page.get_by_role('button',name='Resume',exact=True).click()
 page.get_by_role('button',name='Pause',exact=True).wait_for()
 page.evaluate('Date.now = (() => { const original = Date.now; return () => original() + 61000; })()')
 page.get_by_text('Focus session saved. Mark your chapter complete only when the work is done.',exact=True).wait_for(timeout=10000)
 data=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 assert data['chapters']==before_focus
 assert len(data['sessions'])==1 and data['sessions'][0]['minutes']==1
 assert len(data['motivation']['earned'])==1
 page.reload(wait_until='networkidle')
 data2=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 assert len(data2['sessions'])==1 and data2['motivation']['focus'] is None
 page.goto(BASE + '/progress',wait_until='networkidle')
 page.get_by_text('Your comeback story',exact=True).wait_for()
 page.screenshot(path=str(ROOT / 'artifacts/v03-progress.png'),full_page=True)
 assert not errors, errors
 print('PASS: missions budget/skip/completion/reload; companion milestone; focus pause/reload/resume/completion/exactly-once logging; unchanged chapter on timer finish; progress rendering; reduced-motion viewport 360px; no page errors')
 # Actual v1 data migration in a fresh browser context.
 context=browser.new_context()
 legacy=context.new_page()
 old={'chapters':[{'id':f'legacy-{i}','subject':'physics','title':f'Keep this chapter {i}','status':'active','minutes':15,'planned':True} for i in range(3)], 'sessions':[{'id':'legacy-session','subject':'physics','title':'Earlier study','minutes':8,'finishedAt':'2026-10-01T00:00:00Z'}]}
 legacy.add_init_script("if (!localStorage.getItem('bk-data')) localStorage.setItem('bk-data',"+json.dumps(json.dumps(old))+");")
 legacy.goto(BASE,wait_until='networkidle')
 legacy.get_by_text('Daily missions',exact=True).wait_for()
 migrated=json.loads(legacy.evaluate("localStorage.getItem('bk-data')"))
 assert all(all(migrated['chapters'][i][k]==v for k,v in c.items()) for i,c in enumerate(old['chapters'])) and migrated['sessions']==old['sessions']
 baseline=migrated['motivation']['history'][0]['at']
 legacy.reload(wait_until='networkidle')
 assert json.loads(legacy.evaluate("localStorage.getItem('bk-data')"))['motivation']['history'][0]['at']==baseline
 print('PASS: real localStorage v1 migration preserves chapters/sessions and baseline after reload')
 legacy.goto(BASE + '/subject/physics',wait_until='networkidle')
 for i in range(3):
  legacy.get_by_role('button',name='Mark complete',exact=True).first.click()
  expect(legacy.get_by_role('button',name='Mark complete',exact=True)).to_have_count(2-i)
 legacy.get_by_text('Subject complete. You did the work!',exact=False).wait_for()
 state=json.loads(legacy.evaluate("localStorage.getItem('bk-data')"))
 assert state['motivation']['stage']==1 and len(state['motivation']['earned'])==3
 legacy.get_by_role('button',name='Reopen chapter',exact=True).first.click()
 legacy.goto(BASE,wait_until='networkidle')
 legacy.get_by_text('Vellum · Fan',exact=True).wait_for()
 legacy.reload(wait_until='networkidle')
 legacy.get_by_text('Vellum · Fan',exact=True).wait_for()
 legacy.screenshot(path=str(ROOT / 'artifacts/v03-home.png'),full_page=True)
 assert json.loads(legacy.evaluate("localStorage.getItem('bk-data')"))['motivation']['stage']==1
 print('PASS: subject completion celebration, companion evolves after 3 actual UI completions and retains stage after reopen/reload')
 browser.close()
