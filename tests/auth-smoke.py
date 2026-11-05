# Test doubles only. Run a separate Metro on 8082 with the synthetic public config
# documented in docs/SUPABASE_SETUP.md. No production emails or credentials.
from playwright.sync_api import sync_playwright, expect
import base64, json, time, copy
BASE='http://127.0.0.1:8082'
AUTH='http://127.0.0.1:54321'
A='11111111-1111-1111-1111-111111111111'
B='22222222-2222-2222-2222-222222222222'
cloud={}
def token(uid):
 enc=lambda data:base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')
 return enc({'alg':'HS256','typ':'JWT'})+'.'+enc({'sub':uid,'role':'authenticated','exp':int(time.time())+3600,'iat':int(time.time())})+'.test_signature_only'
def identity(email):
 uid=A if email=='a@example.test' else B
 return {'id':uid,'aud':'authenticated','role':'authenticated','email':email,'email_confirmed_at':'2026-11-05T00:00:00Z','created_at':'2026-11-05T00:00:00Z','app_metadata':{},'user_metadata':{}}
def intercept(route):
 req=route.request; path=req.url.removeprefix(AUTH).split('?')[0]; body=req.post_data_json if req.post_data else {}
 headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'}
 def respond(data,status=200):route.fulfill(status=status,headers=headers,body=json.dumps(data))
 if req.method=='OPTIONS': respond({});return
 if path=='/auth/v1/otp': respond({});return
 if path=='/auth/v1/verify':
  user=identity(body['email']);respond({'access_token':token(user['id']),'refresh_token':'synthetic-refresh-'+user['id'],'token_type':'bearer','expires_in':3600,'user':user});return
 if path=='/auth/v1/logout': respond({});return
 bearer=req.headers.get('authorization','').removeprefix('Bearer ')
 uid=A if bearer==token(A) else None
 # Token iat may advance. Decode synthetic payload; this is a fixture, not app auth.
 try: uid=json.loads(base64.urlsafe_b64decode(bearer.split('.')[1]+'==='))['sub']
 except Exception: pass
 if path=='/auth/v1/user': respond(identity('a@example.test' if uid==A else 'b@example.test'));return
 if path=='/rest/v1/study_accounts': respond([cloud[uid]] if uid in cloud else []);return
 if path=='/rest/v1/rpc/save_study':
  current=cloud.get(uid,{}).get('revision',0)
  if current!=body['expected_revision']:respond({'code':'40001','message':'conflict'},409);return
  cloud[uid]={'revision':current+1,'document':body['new_document']};respond(current+1);return
 respond({'message':'Unimplemented test endpoint'},500)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':360,'height':800})
 page.route(AUTH+'/**',intercept)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle',timeout=120000)
 page.get_by_text('Daily missions',exact=True).wait_for(timeout=120000)
 original=json.loads(page.evaluate("localStorage.getItem('bk-data')"))
 def sign_in(email,register=False):
  page.goto(BASE+'/account',wait_until='networkidle')
  if register: page.get_by_role('button',name='Register a new account',exact=True).click()
  page.get_by_role('textbox',name='Email address',exact=True).fill(email)
  page.get_by_role('button',name='Send email code',exact=True).click()
  page.get_by_text('If this address can receive a code',exact=False).filter(visible=True).wait_for()
  page.get_by_label('Email verification code',exact=True).fill('TEST-ONLY-CODE')
  page.get_by_role('button',name='Verify code',exact=True).click()
  page.get_by_role('heading',name='Your study space',exact=True).wait_for()
  page.goto(BASE+'/account',wait_until='networkidle')
  page.get_by_text(email,exact=True).filter(visible=True).wait_for()
 def logout():
  page.get_by_role('button',name='Log out',exact=True).click()
  page.wait_for_url(BASE+'/')
 sign_in('a@example.test',True)
 page.get_by_role('button',name='Copy anonymous data into this account',exact=True).click()
 page.get_by_text('Imported on this device.',exact=False).filter(visible=True).wait_for()
 keyA='bk-data:user-'+A;keyB='bk-data:user-'+B
 assert len(json.loads(page.evaluate('(key)=>localStorage.getItem(key)',keyA))['chapters'])==len(original['chapters'])
 page.get_by_role('button',name='Sync now',exact=True).click()
 page.get_by_text('Synced.',exact=True).filter(visible=True).wait_for()
 assert cloud[A]['revision']==1
 logout();sign_in('b@example.test')
 assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',keyB))['chapters']==[]
 assert A in cloud and B not in cloud
 logout();sign_in('a@example.test')
 page.goto(BASE+'/subject/physics',wait_until='networkidle')
 page.get_by_role('button',name='Mark complete',exact=True).first.click()
 page.wait_for_function('(key)=>JSON.parse(localStorage.getItem(key)).sync.dirty',arg=keyA)
 cloud[A]['revision']=2
 page.goto(BASE+'/account',wait_until='networkidle')
 page.get_by_role('button',name='Sync now',exact=True).click()
 page.get_by_role('button',name='Use cloud version on device',exact=True).wait_for()
 device_before=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',keyA))
 assert cloud[A]['revision']==2 and device_before['sync']['dirty']
 page.get_by_role('button',name='Use cloud version on device',exact=True).click()
 page.get_by_text('Cloud version downloaded.',exact=True).filter(visible=True).wait_for()
 device_after=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',keyA))
 assert device_after['sync']=={'revision':2,'dirty':False}
 assert page.evaluate('(key)=>Object.keys(localStorage).some(k=>k.startsWith(key+"-conflict-"))',keyA)
 assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',keyB))['chapters']==[]
 assert json.loads(page.evaluate("localStorage.getItem('bk-data')"))['chapters']==original['chapters']
 assert not errors,errors
 print('PASS with safe provider doubles: OTP registration/login, A/B switching, explicit anonymous import, session reload, cloud push, divergent revision review and backed-up cloud resolution; no production authentication claim')
 browser.close()
