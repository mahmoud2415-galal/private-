import {database} from './postgres-adapter.mjs';
function storage(){
 const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Object.assign(Error('إعدادات حفظ الصور غير مكتملة'),{status:503});
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))throw Error('Invalid Supabase URL');
 return {base:url.replace(/\/$/,'')+'/storage/v1',headers:key.startsWith('sb_secret_')?{apikey:key}:{apikey:key,Authorization:'Bearer '+key}};
}
const path=key=>'invoice-files/'+key.split('/').map(encodeURIComponent).join('/');
const bucket={
 async put(key,bytes,options){const s=storage();const response=await fetch(s.base+'/object/'+path(key),{method:'POST',headers:{...s.headers,'Content-Type':options.httpMetadata.contentType,'x-upsert':'false'},body:bytes});if(!response.ok)throw Object.assign(Error('تعذر حفظ صورة الفاتورة'),{status:502});},
 async get(key){const s=storage();const response=await fetch(s.base+'/object/authenticated/'+path(key),{headers:s.headers,cache:'no-store'});if(response.status===404)return null;if(!response.ok)throw Object.assign(Error('تعذر تحميل صورة الفاتورة'),{status:502});return {body:response.body};},
 async delete(key){const s=storage();const response=await fetch(s.base+'/object/invoice-files',{method:'DELETE',headers:{...s.headers,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[key]})});if(!response.ok)throw Error('Storage deletion failed');}
};
export const env=new Proxy({DB:database,BUCKET:bucket},{get:(target,key)=>key in target?target[key]:key==='BOOTSTRAP_ACCOUNTS'?'[]':process.env[key]});
