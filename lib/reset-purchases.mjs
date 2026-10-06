export async function resetPurchases({database,bucket,operationId}){
 const key='purchase-reset:'+operationId;
 let stored=await database.prepare('SELECT value FROM app_settings WHERE id=?').bind(key).first();
 if(!stored){
  const files=(await database.prepare('SELECT blob_key FROM invoice_files').all()).results;
  if(files.length&&!bucket)throw Error('تخزين صور الفواتير غير متاح');
  const names=['requests','supplier_invoices','invoice_payments','invoice_files'];const counts={};
  for(const name of names)counts[name]=(await database.prepare('SELECT COUNT(*) AS count FROM '+name).first()).count;
  const state={counts,pendingKeys:files.map(f=>f.blob_key),done:false};
  await database.batch([
   database.prepare('DELETE FROM invoice_payments'),database.prepare('DELETE FROM invoice_files'),database.prepare('DELETE FROM supplier_invoices'),database.prepare('DELETE FROM requests'),
   database.prepare('INSERT INTO app_settings(id,value,revision,updated) VALUES(?,?,1,?)').bind(key,JSON.stringify(state),new Date().toISOString())
  ]);
  stored={value:JSON.stringify(state)};
 }
 const state=JSON.parse(stored.value);
 // The operation log makes retries delete only the original objects, never new records.
 while(state.pendingKeys.length){const keys=state.pendingKeys.slice(0,100);await bucket.delete(keys);state.pendingKeys=state.pendingKeys.slice(keys.length);await database.prepare('UPDATE app_settings SET value=?,revision=revision+1,updated=? WHERE id=?').bind(JSON.stringify(state),new Date().toISOString(),key).run();}
 state.done=true;await database.prepare('UPDATE app_settings SET value=?,revision=revision+1,updated=? WHERE id=?').bind(JSON.stringify(state),new Date().toISOString(),key).run();
 const remaining={};for(const name of ['requests','supplier_invoices','invoice_payments','invoice_files'])remaining[name]=(await database.prepare('SELECT COUNT(*) AS count FROM '+name).first()).count;
 return {ok:true,deleted:state.counts,remaining,imagesDeleted:state.counts.invoice_files,preserved:['accounts','suppliers','stock_moves','settings']};
}
