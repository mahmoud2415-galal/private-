export const platformSignInMessage='انتهت جلسة الدخول إلى الموقع. جدّد الدخول ثم أعد إرسال الطلب؛ لا تغيّر الأصناف.';
export async function readApiResponse(response){
 if(response.type==='opaqueredirect'||response.status===0)throw Object.assign(new Error(platformSignInMessage),{code:'SITE_AUTH_REQUIRED'});
 const text=await response.text();const html=/^\s*(?:<!doctype\s+html|<html|<)/i.test(text);
 if(html){const auth=response.redirected||[401,403].includes(response.status)||/signin-with-chatgpt|sign in|log in|تسجيل الدخول/i.test(text);throw Object.assign(new Error(auth?platformSignInMessage:'تعذر الوصول إلى خدمة النظام مؤقتًا. احتفظ بالطلب وحاول إرساله مرة أخرى.'),{code:auth?'SITE_AUTH_REQUIRED':'SERVICE_UNAVAILABLE',status:response.status>=400?response.status:502});}
 let data;try{data=JSON.parse(text);}catch{throw Object.assign(new Error('وصل رد غير مكتمل من النظام. أعد المحاولة بنفس الطلب.'),{code:'INVALID_RESPONSE',status:502});}
 if(!response.ok)throw Object.assign(new Error(data?.error||(response.status===401?'انتهت جلسة الحساب. سجّل الدخول مجددًا.':'تعذر الاتصال بالنظام')),{status:response.status});
 return data;
}
