import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readApiResponse,platformSignInMessage} from '../lib/api-response.mjs';
test('JSON success and application errors retain their status',async()=>{assert.deepEqual(await readApiResponse(Response.json({ok:true})),{ok:true});await assert.rejects(readApiResponse(Response.json({error:'انتهت الجلسة'},{status:401})),e=>e.status===401&&e.message==='انتهت الجلسة');});
test('HTML login and platform redirects become actionable authentication errors',async()=>{await assert.rejects(readApiResponse(new Response('<!DOCTYPE html><html>Sign in</html>',{status:200})),e=>e.code==='SITE_AUTH_REQUIRED'&&e.message===platformSignInMessage);await assert.rejects(readApiResponse({type:'opaqueredirect',status:0}),e=>e.code==='SITE_AUTH_REQUIRED');});
test('HTML service errors and truncated replies never expose parser errors or claim success',async()=>{await assert.rejects(readApiResponse(new Response('<!DOCTYPE html><html>Bad gateway</html>',{status:502})),e=>e.code==='SERVICE_UNAVAILABLE'&&!e.message.includes('Unexpected token'));await assert.rejects(readApiResponse(new Response('{"ok":')) ,e=>e.code==='INVALID_RESPONSE');});
