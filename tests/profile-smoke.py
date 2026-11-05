from playwright.sync_api import sync_playwright, expect
import json, os
BASE=os.environ.get('BK_TEST_URL','http://127.0.0.1:8081')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':360,'height':800},reduced_motion='reduce')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m: errors.append(m.text) if m.type=='error' else None)
 page.goto(BASE,wait_until='networkidle',timeout=120000)
 page.get_by_text('Daily missions',exact=True).filter(visible=True).wait_for(timeout=120000)
 page.get_by_role('button',name='Suggest today’s missions',exact=True).click()
 page.get_by_text('50 / 60 minutes planned',exact=True).filter(visible=True).wait_for()
 before=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 page.get_by_role('button',name='Set up academic profile',exact=True).click()
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('button',name='Science PCMB',exact=True).click()
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('button',name='English · Remove',exact=True).click()
 page.get_by_role('textbox',name='Add school subject',exact=True).fill('Computer Science')
 page.get_by_role('button',name='Add subject',exact=True).click()
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('button',name='JEE Main',exact=True).click()
 page.get_by_role('button',name='NEET UG',exact=True).click()
 page.get_by_role('button',name='Continue',exact=True).click()
 page.get_by_role('textbox',name='Academic year',exact=True).fill('2026-27')
 page.get_by_role('textbox',name='Target exam year',exact=True).fill('2027')
 page.get_by_role('button',name='Save academic profile',exact=True).click()
 page.get_by_role('heading',name='Class 12 · CBSE · 2026-27',exact=True).filter(visible=True).wait_for()
 page.get_by_text('Physics: Curriculum pending verification. Only your custom chapters are shown.',exact=True).filter(visible=True).wait_for()
 after=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 assert after['chapters']==before['chapters'] and after['sessions']==before['sessions']
 assert after['motivation']['stage']==before['motivation']['stage']
 assert after['motivation']['missions']==before['motivation']['missions']
 assert 'Biology' in after['profile']['subjects'] and 'Computer Science' in after['profile']['subjects'] and 'English' not in after['profile']['subjects']
 page.get_by_role('button',name='JEE Main · 2027',exact=True).click()
 page.get_by_text('syllabus unavailable pending official verification.',exact=False).filter(visible=True).wait_for()
 page.get_by_role('button',name='School',exact=True).click()
 page.get_by_role('button',name='Add chapter',exact=True).click()
 page.get_by_role('textbox',name='Chapter name',exact=True).fill('My custom revision')
 page.get_by_role('button',name='Save to today’s plan',exact=True).click()
 page.wait_for_function("JSON.parse(localStorage.getItem('bk-data')).chapters.some(c=>c.title==='My custom revision')")
 page.goto(BASE+'/subject/physics',wait_until='networkidle')
 page.get_by_role('heading',name='My custom revision',exact=True).filter(visible=True).wait_for()
 page.goto(BASE,wait_until='networkidle')
 page.reload(wait_until='networkidle')
 after=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 assert len(after['chapters'])==len(before['chapters'])+1
 assert after['chapters'][-1]['origin']=='custom'
 page.get_by_role('button',name='Saved chapters · all preserved data',exact=True).click()
 page.get_by_text('Saved chapters include legacy/unverified topics.',exact=False).filter(visible=True).wait_for()
 page.goto(BASE+'/account',wait_until='networkidle')
 page.get_by_text('Accounts are not connected yet',exact=True).filter(visible=True).wait_for()
 page.screenshot(path=os.path.join(os.path.dirname(__file__),'..','artifacts','v03-account.png'),full_page=True)
 assert not errors,errors
 print('PASS: six-step PCMB onboarding, optional subjects, multi-exam selection, pending curricula, school/exam separation, preserved v0.2 data, custom chapter/reload, unconfigured-account messaging; no page/console errors')
 browser.close()
