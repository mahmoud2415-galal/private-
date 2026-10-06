import {can} from './permissions.mjs';
export const stateLabels={new:'بانتظار المراجعة',needs_revision:'مطلوب تعديل',approved:'معتمد',rejected:'مرفوض',ordered:'قيد التوريد',partial:'استلام جزئي',received:'تم الاستلام',cancelled:'ملغي'};
export function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
export function clean(value,max=1000){if(typeof value!=='string')fail('قيمة نصية غير صحيحة');const s=value.trim();if(s.length>max)fail('النص أطول من المسموح');return s;}
export function required(value,max=1000){const s=clean(value,max);if(!s)fail('أكمل الحقول المطلوبة');return s;}
export function num(value,max=1e7){if(value===''||value===null||typeof value==='boolean'||typeof value==='object'||value===undefined)fail('الكمية أو السعر غير صحيح');const n=Number(value);if(!Number.isFinite(n)||n<0||n>max)fail('الكمية أو السعر غير صحيح');return n;}
export const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function normalizeItems(items){if(!Array.isArray(items)||!items.length||items.length>50)fail('أضف من صنف واحد إلى 50 صنفًا');return items.map((x,i)=>{const qty=num(x.qty);if(qty<=0)fail('الكمية المطلوبة يجب أن تكون أكبر من صفر');return {id:String(i+1),name:required(x.name,160),spec:clean(x.spec??'',500),unit:required(x.unit,40),qty,approved:0,price:0,received:0};});}
export function createPayload(input,actor,now){if(actor.role!=='site'||!can(actor,'create'))fail('لا تملك صلاحية إنشاء الطلبات',403);const priority=input.priority;if(!['عادية','عاجلة','طارئة'].includes(priority))fail('الأولوية غير صحيحة');return {requester:required(input.requester,120),reason:required(input.reason,1000),priority,items:normalizeItems(input.items),supplier:null,reviewNote:'',order:null,receipts:[],history:[{at:now,event:'إرسال طلب',by:actor.name}],siteName:actor.name};}
export function transition(record,input,actor,now,supplier){
 if(!can(actor,'allSites')&&record.site_id!==actor.id)fail('لا تملك صلاحية هذا الطلب',403);
 const data=structuredClone(record.data);let state=record.state;
 if(input.action==='review'){
  if(!can(actor,'review'))fail('لا تملك صلاحية المراجعة',403);
  if(!['new','needs_revision','approved'].includes(state))fail('لا يمكن تعديل المراجعة بعد التوريد أو إغلاق الطلب',409);
  if(!['approve','reject','revise'].includes(input.decision))fail('قرار غير صحيح');
  data.reviewNote=clean(input.note??'',1000);
  if(input.decision==='approve'){
   if(!supplier?.active)fail('اختر موردًا نشطًا');
   if(!Array.isArray(input.items)||input.items.length!==data.items.length)fail('راجع جميع الأصناف');
   data.items=data.items.map((x,i)=>{const approved=num(input.items[i].approved);const price=num(input.items[i].price);if(approved>x.qty)fail('الكمية المعتمدة تتجاوز المطلوبة');return {...x,approved,price,received:0};});
   if(!data.items.some(x=>x.approved>0))fail('اعتمد كمية واحدة على الأقل أو اختر رفض');
   data.supplier={id:supplier.id,name:supplier.name,phone:supplier.phone,email:supplier.email};state='approved';
  }else{if(!data.reviewNote)fail('اكتب سبب الرفض أو التعديل');state=input.decision==='reject'?'rejected':'needs_revision';data.supplier=null;data.items=data.items.map(x=>({...x,approved:0,price:0,received:0}));}
  data.history.push({at:now,event:state==='approved'&&data.items.some(x=>x.approved<x.qty)?'اعتماد جزئي':stateLabels[state],by:actor.name,note:data.reviewNote});
 }else if(input.action==='resubmit'){
  if(actor.role!=='site'||!can(actor,'create')||record.site_id!==actor.id||state!=='needs_revision')fail('التعديل متاح للموقع عندما يطلبه المدير',403);
  const fresh=createPayload(input,actor,now);Object.assign(data,{requester:fresh.requester,reason:fresh.reason,priority:fresh.priority,items:fresh.items,supplier:null,order:null});state='new';data.history.push({at:now,event:'إعادة إرسال بعد التعديل',by:actor.name});
 }else if(input.action==='dispatch'){
  if(!can(actor,'dispatch'))fail('لا تملك صلاحية التوريد',403);if(state!=='approved')fail('اعتمد الطلب قبل التوريد',409);
  const expected=clean(input.expected??'',10);if(expected&&(!/^\d{4}-\d{2}-\d{2}$/.test(expected)||!Number.isFinite(Date.parse(expected))||new Date(expected).toISOString().slice(0,10)!==expected))fail('تاريخ التوريد غير صحيح');
  data.order={number:required(input.orderNumber,80),expected,at:now};state='ordered';data.history.push({at:now,event:'تجهيز أمر الشراء وبدء التوريد',by:actor.name});
 }else if(input.action==='receipt'){
  if(actor.role!=='site'||!can(actor,'receive')||record.site_id!==actor.id)fail('الاستلام متاح لمسؤول موقع الطلب المصرح له',403);
  if(!['ordered','partial'].includes(state))fail('الطلب ليس قيد التوريد',409);
  const token=required(input.operationId,80);if(data.receipts.some(x=>x.id===token))return {state,data,duplicate:true};
  if(!Array.isArray(input.quantities)||input.quantities.length!==data.items.length)fail('راجع جميع كميات الاستلام');
  let any=false;data.items=data.items.map((x,i)=>{const receivedNow=num(input.quantities[i]);if(receivedNow>0)any=true;if(x.received+receivedNow>x.approved+1e-8)fail('الكمية المستلمة تتجاوز الكمية المعتمدة');return {...x,received:Math.min(x.approved,x.received+receivedNow)};});
  if(!any)fail('أدخل كمية مستلمة أكبر من صفر');
  const receipt={id:token,at:now,quantities:input.quantities.map(x=>num(x)),note:clean(input.note??'',1000),by:actor.name};data.receipts.push(receipt);state=data.items.every(x=>Math.abs(x.received-x.approved)<1e-8)?'received':'partial';data.history.push({at:now,event:stateLabels[state],by:actor.name,note:receipt.note});
 }else if(input.action==='cancel'){
  if(!can(actor,'review'))fail('لا تملك صلاحية إلغاء الطلب',403);if(!['new','needs_revision','approved'].includes(state))fail('لا يمكن إلغاء طلب بدأ توريده',409);const note=required(input.note,1000);state='cancelled';data.history.push({at:now,event:'إلغاء الطلب',by:actor.name,note});
 }else fail('إجراء غير معروف');
 return {state,data,receivedValue:round(data.items.reduce((sum,x)=>sum+round(x.received*x.price),0))};
}
export function publicRecord(record,actor){const r=structuredClone(record);if(!can(actor,'prices')){r.data.items=r.data.items.map(({price,...item})=>item);delete r.received_value;if(r.data.supplier)r.data.supplier={name:r.data.supplier.name};}return r;}
