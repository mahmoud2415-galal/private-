import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {createDatabase} from '../lib/postgres-adapter.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createBusinessHandlers,cents,stockRows} from '../lib/business.mjs';
import {createInvoiceHandlers} from '../lib/invoice-files.mjs';
test('PostgreSQL invoices, payments, inventory and private image metadata obey the same boundaries',async()=>{
 const engine=new PGlite();try{
 await engine.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await engine.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
 const query=async(sql,args=[])=>{if(sql.startsWith('SELECT pg_advisory_xact_lock'))return {rows:[],rowCount:0};const r=await engine.query(sql,args);return {rows:r.rows,rowCount:r.affectedRows};};
 const DB=createDatabase(()=>({query,connect:async()=>({query,release(){}})}));
 const admin={id:'admin',name:'المدير',role:'admin'},site={id:'S01',name:'الموقع الأول',role:'site'};
 const account=async r=>{const role=r.headers.get('test-role');if(!role)throw Object.assign(Error('دخول'),{status:401});return role==='admin'?admin:role==='viewer'?{id:'V',name:'مشاهد',role:'site',permissions:{allSites:true,prices:true}}:site;};
 await DB.prepare('INSERT INTO accounts (id,role,name,code_hash) VALUES (?,?,?,?)').bind(site.id,site.role,site.name,'none').run();
 const requestId=randomUUID(),otherId=randomUUID();const data={siteName:site.name,supplier:{id:'SUP',name:'المورد'},items:[{name:'ورق',spec:'A4',unit:'علبة',qty:10,approved:10,price:10,received:4}]};
 for(const id of [requestId,otherId])await DB.prepare('INSERT INTO requests(id,site_id,state,created,updated,data) VALUES (?,?,?,?,?,?)').bind(id,site.id,id===requestId?'partial':'new','2026-10-06','2026-10-06',JSON.stringify(data)).run();
 const api=createBusinessHandlers({database:DB,account});const origin='https://example.test';const get=async role=>{const r=await api.GET(new Request(origin+'/api/business',{headers:role?{'test-role':role}:{}}));return {status:r.status,data:await r.json()};};
 const post=async(body,role='admin',customOrigin=origin)=>{const r=await api.POST(new Request(origin+'/api/business',{method:'POST',headers:{Origin:customOrigin,'test-role':role,'Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
 assert.equal((await get()).status,401);assert.equal((await get('site')).status,403);assert.equal((await get('viewer')).status,403);
 const invoice={op:'invoice',id:randomUUID(),requestId,number:'INV-1',date:'2026-10-06',total:'115.50',due:'2026-10-20'};
 assert.equal((await post(invoice,'site')).status,403);assert.equal((await post(invoice,'viewer')).status,403);assert.equal((await post(invoice,'admin','https://evil.test')).status,403);assert.equal((await post({...invoice,requestId:otherId})).status,400);
 assert.equal((await post(invoice)).status,201);assert.equal((await post(invoice)).data.duplicate,true);assert.equal((await post({...invoice,id:randomUUID()})).status,409);assert.equal((await post({...invoice,total:'2'})).status,409);
 const payment={op:'payment',id:randomUUID(),invoiceId:invoice.id,amount:'40.25',date:'2026-10-06',method:'نقدي'};assert.equal((await post(payment)).status,201);assert.equal((await post(payment)).data.duplicate,true);
 let snapshot=(await get('admin')).data;assert.equal(snapshot.invoices[0].paid_cents,4025);assert.equal(snapshot.invoices[0].remaining_cents,7525);assert.equal(snapshot.payments.length,1);
 assert.equal((await post({...payment,id:randomUUID(),amount:'75.26'})).status,409);assert.equal((await post({...payment,id:randomUUID(),amount:'75.25'})).status,201);assert.equal((await post({...payment,id:randomUUID(),amount:'0.01'})).status,409);assert.equal((await get('admin')).data.invoices[0].remaining_cents,0);
 assert.throws(()=>cents('0'));assert.throws(()=>cents('1.005'));assert.throws(()=>cents('-1'));assert.equal(cents('0.10'),10);
 const move={op:'stock',id:randomUUID(),siteId:site.id,name:'ورق',spec:'A4',unit:'علبة',kind:'out',qty:3,date:'2026-10-06',note:'استهلاك'};
 assert.equal((await get('admin')).data.stock[0].balance,4); // Drafts are excluded from inventory.
 assert.equal((await post(move)).status,201);assert.equal((await post(move)).data.duplicate,true);assert.equal((await post({...move,id:randomUUID(),qty:6})).status,409);
 // Only approved/ordered/received records are included in stock; remove artificial draft receipts.
 const clean={...data,items:data.items.map(i=>({...i,received:0}))};await DB.prepare('UPDATE requests SET data=? WHERE id=?').bind(JSON.stringify(clean),otherId).run();
 assert.equal((await get('admin')).data.stock[0].balance,1);assert.equal((await post({...move,id:randomUUID(),qty:2})).status,409);
 const incoming={...move,id:randomUUID(),kind:'in',qty:2};assert.equal((await post(incoming)).status,201);assert.equal((await post({...move,id:randomUUID(),qty:3})).status,201);assert.equal((await get('admin')).data.stock[0].balance,0);
 await DB.prepare('UPDATE requests SET data=? WHERE id=?').bind(JSON.stringify({...data,items:data.items.map(i=>({...i,received:6}))}),requestId).run();assert.equal((await get('admin')).data.stock[0].balance,2);
 const inventory=await api.GET(new Request(origin+'/api/business?view=inventory&site=OTHER',{headers:{'test-role':'site'}}));const siteStock=await inventory.json();assert.equal(inventory.status,200);assert.equal(siteStock.invoices.length,0);assert.equal(siteStock.approved.length,0);assert.ok(siteStock.stock.every(i=>i.siteId===site.id));assert.ok(siteStock.moves.every(i=>i.site_id===site.id));
 assert.equal(stockRows([{site_id:'S',data:{items:[{name:'x',spec:'',unit:'u',received:1}]}}],[])[0].balance,1);
 const objects=new Map(),bucket={put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)};const files=createInvoiceHandlers({database:DB,bucket,account});
 const jpg=new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,1]);const fileId=randomUUID();const upload=async invoiceId=>{const form=new FormData();form.set('id',fileId);form.set('requestId',requestId);form.set('invoiceId',invoiceId);form.set('file',new Blob([jpg],{type:'image/jpeg'}),'فاتورة.jpg');const r=await files.POST(new Request(origin+'/api/invoice-files',{method:'POST',headers:{Origin:origin,'test-role':'admin'},body:form}));return {status:r.status,data:await r.json()};};
 assert.equal((await upload(randomUUID())).status,403);assert.equal((await upload(invoice.id)).status,201);assert.equal((await upload(invoice.id)).data.duplicate,true);
 const fileList=await files.GET(new Request(origin+'/api/invoice-files?requestId='+requestId+'&invoiceId='+invoice.id,{headers:{'test-role':'admin'}}));assert.equal((await fileList.json()).files.length,1);assert.equal((await get('admin')).data.invoices[0].file_count,1);assert.equal((await get('admin')).data.legacyFiles.length,0);
 const second={...invoice,id:randomUUID(),number:'INV-2',total:'25.00'};assert.equal((await post(second)).status,201);const secondList=await files.GET(new Request(origin+'/api/invoice-files?requestId='+requestId+'&invoiceId='+second.id,{headers:{'test-role':'admin'}}));assert.equal((await secondList.json()).files.length,0);
 const persisted=createBusinessHandlers({database:DB,account});assert.equal((await (await persisted.GET(new Request(origin+'/api/business',{headers:{'test-role':'admin'}}))).json()).invoices.length,2);
 }finally{await engine.close();}
});
