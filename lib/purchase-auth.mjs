import {env} from './runtime.mjs';
import {required,fail} from './purchase-domain.mjs';
import {permissions} from './permissions.mjs';
import {checkPassword} from './passwords.mjs';
const COOKIE='purchase_session';const enc=new TextEncoder();
function db(){if(!env.DB)fail('قاعدة البيانات غير متاحة',503);return env.DB;}
function secret(){if(!env.AUTH_SECRET||env.AUTH_SECRET.length<32)fail('إعدادات الدخول غير مكتملة',503);return env.AUTH_SECRET;}
async function hmac(value){const key=await crypto.subtle.importKey('raw',enc.encode(secret()),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function hashCode(code){return hmac('CODE:'+code.trim().toUpperCase());}
async function sign(value){return hmac('SESSION:'+value);}
async function account(request){const raw=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!raw)fail('سجّل الدخول أولًا',401);const [body,mac]=raw.split('.');if(!body||!mac||mac!==await sign(body))fail('انتهت الجلسة، سجّل الدخول',401);let session;try{session=JSON.parse(atob(body));}catch{fail('جلسة غير صحيحة',401);}if(!Number.isFinite(session.exp)||session.exp<Date.now())fail('انتهت الجلسة',401);const a=await db().prepare('SELECT id,role,name,active,version,permissions FROM accounts WHERE id=?').bind(session.id).first();if(!a?.active||a.version!==session.version)fail('تم تعطيل الجلسة، سجّل الدخول',401);return a;}
function safeAccount(a){return {id:a.id,role:a.role,name:a.name,active:a.active,permissions:permissions(a)};}
async function credentialMatches(a,value){return a.password_hash?checkPassword(value,a.password_hash):await hashCode(required(value,120))===a.code_hash;}
async function cookieFor(a){const body=btoa(JSON.stringify({id:a.id,version:a.version,exp:Date.now()+43200000}));return COOKIE+'='+body+'.'+await sign(body)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200';}
export {COOKIE,db,account,safeAccount,credentialMatches,cookieFor,hashCode};
