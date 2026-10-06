export const runtime='nodejs';
import {COOKIE,db,account,safeAccount,credentialMatches,cookieFor,hashCode} from '@/lib/purchase-auth.mjs';
import {env} from '@/lib/runtime.mjs';
import {createPayload,transition,publicRecord,clean,required,fail} from '@/lib/purchase-domain.mjs';
import {can,permissions,normalizePermissions} from '@/lib/permissions.mjs';
import {makePassword} from '@/lib/passwords.mjs';
import {readBranding,validateLabels} from '@/lib/branding.mjs';
export const dynamic='force-dynamic';
function output(value,status=200,headers={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
function parse(r){return r?{...r,data:JSON.parse(r.data)}:null;}
async function initializeAccounts(database){
 if(JSON.parse(env.BOOTSTRAP_ACCOUNTS||'[]').length)return;
 if(await database.prepare("SELECT id FROM accounts WHERE id='admin'").first())return;
 const password=process.env.ADMIN_INITIAL_PASSWORD;
 if(!password||password.length<12)fail('اضبط كلمة مرور المدير الأولية في إعدادات الاستضافة',503);
 const nowHash=await makePassword(password);
 const seeds=[database.prepare("INSERT INTO accounts(id,role,name,code_hash,password_hash,active) VALUES ('admin','admin',?,?,?,1) ON CONFLICT(id) DO NOTHING").bind('المدير',await hashCode(crypto.randomUUID()),nowHash)];
 for(let i=1;i<=4;i++)seeds.push(database.prepare("INSERT INTO accounts(id,role,name,code_hash,active) VALUES (?,'site',?,?,0) ON CONFLICT(id) DO NOTHING").bind('S0'+i,'الموقع '+i,await hashCode(crypto.randomUUID())));
 await database.batch(seeds);
}
async function login(request,input){
 const database=db();await initializeAccounts(database);const key=await hashCode('RATE:'+(request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'));const now=Date.now();
 await database.prepare('INSERT INTO login_attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN ? ELSE expires END').bind(key,now+900000,now,now,now+900000).run();
 const attempt=await database.prepare('SELECT count FROM login_attempts WHERE key=?').bind(key).first();if(attempt.count>20)fail('محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة',429);
 const hash=await hashCode(required(input.code,120));const initial=JSON.parse(env.BOOTSTRAP_ACCOUNTS);const rows=(await database.prepare('SELECT * FROM accounts').all()).results;
 const username=clean(input.username??'',80).toUpperCase();let a;if(username){const found=rows.find(x=>x.id.toUpperCase()===username&&x.active===1);if(found&&await credentialMatches(found,input.code))a=found;}else a=rows.find(x=>!x.password_hash&&x.code_hash===hash&&x.active===1);
 if(!a){const seed=initial.find(x=>x.hash===hash&&!rows.some(y=>y.id===x.id));if(seed&&(!username||seed.id.toUpperCase()===username)){await database.batch(initial.map(x=>database.prepare('INSERT OR IGNORE INTO accounts (id,role,name,code_hash) VALUES (?,?,?,?)').bind(x.id,x.role,x.name,x.hash)));a=await database.prepare('SELECT * FROM accounts WHERE id=?').bind(seed.id).first();}}
 if(!a?.active)fail('كود الدخول غير صحيح أو تم إيقافه',401);
 await database.prepare('DELETE FROM login_attempts WHERE key=?').bind(key).run();
 return output({user:safeAccount(a)},200,{'Set-Cookie':await cookieFor(a)});
}
export async function GET(request){try{
 const a=await account(request);const url=new URL(request.url);const operation=url.searchParams.get('op')||'list';if(operation==='me')return output({user:safeAccount(a)});
 const admin=can(a,'allSites');const prices=can(a,'prices');const conditions=[],args=[];if(!admin){conditions.push('site_id=?');args.push(a.id);}
 const status=url.searchParams.get('state');if(status){conditions.push('state=?');args.push(status);}const site=url.searchParams.get('site');if(site&&admin){conditions.push('site_id=?');args.push(site);}
 const period=[],periodArgs=[];for(const key of ['from','to']){const value=url.searchParams.get(key);if(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail('الفترة غير صحيحة');period.push(key==='from'?'created>=?':'created<?');periodArgs.push(key==='from'?value+'T00:00:00.000Z':new Date(Date.parse(value)+86400000).toISOString());}}if(url.searchParams.get('from')&&url.searchParams.get('to')&&url.searchParams.get('from')>url.searchParams.get('to'))fail('بداية الفترة بعد نهايتها');conditions.push(...period);args.push(...periodArgs);
 const where=conditions.length?' WHERE '+conditions.join(' AND '):'';const statsConditions=admin?[...period]:['site_id=?',...period];const statsWhere=statsConditions.length?' WHERE '+statsConditions.join(' AND '):'';const statsArgs=admin?[...periodArgs]:[a.id,...periodArgs];
 const stats=(await db().prepare("SELECT state,COUNT(*) AS count,SUM(received_value) AS value,SUM(CASE WHEN state IN ('approved','ordered','partial','received') THEN (SELECT SUM(CAST(json_extract(value,'$.approved') AS REAL)*CAST(json_extract(value,'$.price') AS REAL)) FROM json_each(requests.data,'$.items')) ELSE 0 END) AS approvedValue FROM requests"+statsWhere+' GROUP BY state').bind(...statsArgs).all()).results;
 const offset=Math.floor(Math.max(0,Math.min(1e6,Number(url.searchParams.get('offset'))||0)));const rows=(await db().prepare('SELECT * FROM requests'+where+' ORDER BY seq DESC LIMIT 101 OFFSET ?').bind(...args,offset).all()).results;
 const sites=(await db().prepare("SELECT id,name,active FROM accounts WHERE role='site' ORDER BY id").all()).results;const suppliers=(can(a,'suppliers')||can(a,'review')||can(a,'dispatch'))?(await db().prepare('SELECT * FROM suppliers ORDER BY name').all()).results:[];
 const users=can(a,'users')?(await db().prepare('SELECT id,role,name,active,permissions FROM accounts ORDER BY id').all()).results.map(safeAccount):[];const sync=can(a,'users')?await db().prepare("SELECT * FROM sync_status WHERE id='google'").first():null;
 return output({branding:await readBranding(db()),users,sync,syncEnabled:!!env.SYNC_READ_TOKEN_HASH,user:safeAccount(a),requests:rows.slice(0,100).map(r=>publicRecord(parse(r),a)),more:rows.length>100,stats:stats.map(({state,count,value,approvedValue})=>prices?{state,count,value,approvedValue}:{state,count}),sites:admin?sites:sites.filter(x=>x.id===a.id),suppliers});
 }catch(e){return output({error:e.status?e.message:'تعذر تحميل البيانات'},e.status||500);}}
export async function POST(request){try{
 const origin=request.headers.get('Origin');if(!origin||origin!==new URL(request.url).origin)fail('مصدر الطلب غير صحيح',403);
 if(Number(request.headers.get('Content-Length'))>100000)fail('الطلب كبير جدًا',413);
 const reader=request.body?.getReader();let size=0;const chunks=[];if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();fail('الطلب كبير جدًا',413);}chunks.push(value);}}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const text=new TextDecoder().decode(bytes);let input;try{input=JSON.parse(text);}catch{fail('بيانات غير صحيحة');}if(!input||typeof input!=='object'||Array.isArray(input))fail('بيانات غير صحيحة');
 if(input.op==='login')return await login(request,input);
 if(input.op==='logout')return output({ok:true},200,{'Set-Cookie':COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
 const a=await account(request);const database=db();const now=new Date().toISOString();
 if(input.op==='settings'){
  if(a.id!=='admin'||a.role!=='admin')fail('يعدّل المدير الرئيسي مسميات النظام فقط',403);
  if(!Number.isInteger(input.revision)||input.revision<0)fail('نسخة الإعدادات غير صحيحة');
  let labels;try{labels=validateLabels(input.labels);}catch(e){fail(e.message);}
  const result=await database.prepare("INSERT INTO app_settings (id,value,revision,updated) SELECT 'branding',?,1,? WHERE ?=0 OR EXISTS (SELECT 1 FROM app_settings WHERE id='branding') ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated=excluded.updated,revision=app_settings.revision+1 WHERE app_settings.revision=?").bind(JSON.stringify(labels),now,input.revision,input.revision).run();
  if(result.meta.changes!==1)fail('تغيرت المسميات من جهاز آخر. حدّث الصفحة قبل إعادة الحفظ',409);
  return output({ok:true,branding:await readBranding(database)});
 }
 if(input.op==='create'){
  if(!/^[0-9a-f-]{36}$/.test(input.id||''))fail('معرف الطلب غير صحيح');
  const previous=parse(await database.prepare('SELECT * FROM requests WHERE id=?').bind(input.id).first());if(previous){if(previous.site_id!==a.id)fail('غير مسموح',403);return output({request:publicRecord(previous,a),duplicate:true});}
  const payload=createPayload(input,a,now);await database.prepare('INSERT INTO requests (id,site_id,state,created,updated,data) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(input.id,a.id,'new',now,now,JSON.stringify(payload)).run();
  const inserted=parse(await database.prepare('SELECT * FROM requests WHERE id=?').bind(input.id).first());if(inserted.site_id!==a.id)fail('غير مسموح',403);return output({request:publicRecord(inserted,a)});
 }
 if(input.op==='supplier'){
  if(!can(a,'suppliers'))fail('لا تملك صلاحية إدارة الموردين',403);const id=input.id||crypto.randomUUID();await database.prepare('INSERT INTO suppliers (id,name,phone,email,notes,active) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,email=excluded.email,notes=excluded.notes,active=excluded.active').bind(required(id,80),required(input.name,160),clean(input.phone??'',80),clean(input.email??'',120),clean(input.notes??'',1000),input.active===false?0:1).run();return output({ok:true});
 }
 if(input.op==='site'||input.op==='user'){
  if(!can(a,'users'))fail('لا تملك صلاحية إدارة المستخدمين',403);const target=await database.prepare('SELECT * FROM accounts WHERE id=?').bind(required(input.id,80)).first();if(!target)fail('المستخدم غير موجود',404);
  if(target.role==='admin'&&target.id!==a.id)fail('الحساب الرئيسي يعدّل بياناته بنفسه',403);
  if(target.role==='admin'&&input.active===false)fail('لا يمكن تعطيل الحساب الرئيسي');
  const name=required(input.name,160);const active=target.role==='admin'?1:input.active===false?0:1;
  let flags=permissions(target);if(input.permissions&&target.role!=='admin'){try{flags=normalizePermissions(input.permissions);}catch(e){fail(e.message);}}
  const fresh=input.newCode?required(input.newCode,120):'';if(fresh&&fresh.length<10)fail('الكود يجب أن يتكون من 10 أحرف أو أرقام على الأقل');const password=input.newPassword??'';if(fresh&&password)fail('اختر كلمة مرور أو كودًا جديدًا');
  if((fresh||password)&&target.id===a.id&&!await credentialMatches(target,input.currentPassword??''))fail('أدخل كلمة المرور أو الكود الحالي بشكل صحيح',403);
  let passwordHash=target.password_hash,hash=target.code_hash;if(password){try{passwordHash=await makePassword(password);}catch(e){fail(e.message);}hash=await hashCode(crypto.randomUUID());}else if(fresh){hash=await hashCode(fresh);passwordHash='';}
  const duplicate=await database.prepare('SELECT id FROM accounts WHERE code_hash=? AND id<>?').bind(hash,target.id).first();if(duplicate)fail('الكود مستخدم لحساب آخر');
  await database.prepare('UPDATE accounts SET name=?,active=?,code_hash=?,password_hash=?,permissions=?,version=version+1 WHERE id=?').bind(name,active,hash,passwordHash,JSON.stringify(flags),target.id).run();const changed=await database.prepare('SELECT * FROM accounts WHERE id=?').bind(target.id).first();
  return output({ok:true,user:safeAccount(changed)},200,target.id===a.id?{'Set-Cookie':await cookieFor(changed)}:{});
 }
 if(input.op==='update'){
  const record=parse(await database.prepare('SELECT * FROM requests WHERE id=?').bind(required(input.id,80)).first());if(!record)fail('الطلب غير موجود',404);if(!can(a,'allSites')&&record.site_id!==a.id)fail('غير مسموح',403);
  if(input.action==='receipt'&&(a.role!=='site'||!can(a,'receive')||record.site_id!==a.id))fail('يسجل الاستلام مسؤول الموقع فقط',403);if(input.action==='receipt'&&record.data.receipts.some(x=>x.id===input.operationId))return output({request:publicRecord(record,a),duplicate:true});if(record.revision!==input.revision)fail('تم تحديث الطلب من جهاز آخر. حدّث الصفحة وحاول مجددًا',409);
  let supplier=null;if(input.action==='review'&&input.decision==='approve')supplier=await database.prepare('SELECT * FROM suppliers WHERE id=?').bind(input.supplierId||'').first();const changed=transition(record,input,a,now,supplier);
  const result=await database.prepare('UPDATE requests SET state=?,updated=?,data=?,revision=revision+1,received_value=? WHERE id=? AND revision=?').bind(changed.state,now,JSON.stringify(changed.data),changed.receivedValue,record.id,record.revision).run();if(result.meta.changes!==1)fail('تغير الطلب أثناء الحفظ. حدّث الصفحة',409);
  return output({request:publicRecord(parse(await database.prepare('SELECT * FROM requests WHERE id=?').bind(record.id).first()),a)});
 }
 fail('إجراء غير معروف');
 }catch(e){return output({error:e.status?e.message:'تعذر حفظ العملية'},e.status||500);}}
