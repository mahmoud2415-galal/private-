export const runtime='nodejs';
import {env} from '@/lib/runtime.mjs';
import {account} from '@/lib/purchase-auth.mjs';
import {createInvoiceHandlers} from '@/lib/invoice-files.mjs';
export const dynamic='force-dynamic';
export async function GET(request){return createInvoiceHandlers({database:env.DB,bucket:env.BUCKET,account}).GET(request);}
export async function POST(request){return createInvoiceHandlers({database:env.DB,bucket:env.BUCKET,account}).POST(request);}
