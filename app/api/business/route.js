export const runtime='nodejs';
import {env} from '@/lib/runtime.mjs';
import {account} from '@/lib/purchase-auth.mjs';
import {createBusinessHandlers} from '@/lib/business.mjs';
export const dynamic='force-dynamic';
export async function GET(request){return createBusinessHandlers({database:env.DB,account}).GET(request);}
export async function POST(request){return createBusinessHandlers({database:env.DB,account}).POST(request);}
