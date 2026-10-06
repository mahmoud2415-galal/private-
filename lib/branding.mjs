export const defaultLabels=Object.freeze({systemName:'مسار',systemSubtitle:'متابعة المشتريات',requestsPage:'الطلبات',suppliersPage:'الموردون',usersPage:'المستخدمون والصلاحيات',syncPage:'مزامنة Google Sheets'});
export const labelLimits=Object.freeze({systemName:60,systemSubtitle:80,requestsPage:40,suppliersPage:40,usersPage:40,syncPage:40});
export function validateLabels(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!Object.hasOwn(defaultLabels,k)))throw new Error('بيانات المسميات غير صحيحة');
 const labels={};for(const key of Object.keys(defaultLabels)){const value=input[key];if(typeof value!=='string'||!value.trim()||value.trim().length>labelLimits[key]||/[\u0000-\u001f\u007f]/.test(value))throw new Error('أدخل مسميات غير فارغة ضمن الحد المحدد');labels[key]=value.trim();}return labels;
}
export async function readBranding(database){
 const record=await database.prepare("SELECT value,revision FROM app_settings WHERE id='branding'").first();if(!record)return {labels:{...defaultLabels},revision:0};
 return {labels:validateLabels(JSON.parse(record.value)),revision:record.revision};
}
