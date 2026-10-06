import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdir,readFile} from 'node:fs/promises';
import {resetPurchases} from '../lib/reset-purchases.mjs';
test('authorized reset removes purchases and images, preserves master data, and retries never remove new records',async()=>{
 const sqlite=new DatabaseSync(':memory:');try{
 for(const name of (await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())sqlite.exec(await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const stmt=(sql,args=[])=>({bind:(...a)=>stmt(sql,a),first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>{const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
 const database={prepare:stmt,batch:async qs=>{sqlite.exec('BEGIN');try{const result=[];for(const q of qs)result.push(await q.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 sqlite.exec("INSERT INTO accounts(id,role,name,code_hash) VALUES('admin','admin','manager','hash'); INSERT INTO suppliers(id,name,phone,email,notes) VALUES('supplier','supplier','','',''); INSERT INTO app_settings(id,value,updated) VALUES('branding','{}','today'); INSERT INTO requests(id,site_id,state,created,updated,data) VALUES('old','S01','received','today','today','{}'); INSERT INTO supplier_invoices(id,request_id,supplier_id,number,date,total_cents,created,by) VALUES('invoice','old','supplier','1','today',100,'today','admin'); INSERT INTO invoice_payments(id,invoice_id,amount_cents,date,method,created,by) VALUES('payment','invoice',100,'today','cash','today','admin'); INSERT INTO invoice_files(id,request_id,uploader,filename,mime,size,blob_key,created) VALUES('file','old','admin','invoice.jpg','image/jpeg',12,'blob','today'); INSERT INTO stock_moves(id,site_id,item_key,name,unit,qty,kind,date,note,created,by) VALUES('move','S01','key','item','unit',1,'in','today','opening','today','admin');");
 const objects=new Set(['blob']);let fail=true;const bucket={delete:async keys=>{if(fail)throw Error('temporary storage failure');for(const key of keys)objects.delete(key);}};
 await assert.rejects(resetPurchases({database,bucket,operationId:'once'}));
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM requests').get().n,0);
 sqlite.exec("INSERT INTO requests(id,site_id,state,created,updated,data) VALUES('new','S01','new','later','later','{}')");
 fail=false;const result=await resetPurchases({database,bucket,operationId:'once'});assert.equal(result.imagesDeleted,1);assert.equal(objects.size,0);assert.equal(result.remaining.requests,1);
 for(const table of ['accounts','suppliers','stock_moves'])assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,1);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM app_settings WHERE id='branding'").get().n,1);
 for(const table of ['supplier_invoices','invoice_payments','invoice_files'])assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);
 await resetPurchases({database,bucket,operationId:'once'});assert.equal(sqlite.prepare('SELECT id FROM requests').get().id,'new');
 }finally{sqlite.close();}
});
