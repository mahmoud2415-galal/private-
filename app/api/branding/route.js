export const runtime='nodejs';
import {env} from '@/lib/runtime.mjs';
import {readBranding} from '@/lib/branding.mjs';
export const dynamic='force-dynamic';
export async function GET(){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 try{return Response.json(await readBranding(env.DB),{headers});}
 catch{return Response.json({error:'تعذر تحميل اسم النظام'},{status:503,headers});}
}
