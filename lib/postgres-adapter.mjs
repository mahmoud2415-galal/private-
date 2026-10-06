import pg from 'pg';
const {Pool}=pg;
let pool;
function connection(){
 if(!process.env.DATABASE_URL)throw Object.assign(Error('إعدادات قاعدة البيانات غير مكتملة'),{status:503});
 return pool ||= new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:20000,connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true,ca:Buffer.from("LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUR4RENDQXF5Z0F3SUJBZ0lVYkx4TW9kNjJQMmt0Q2lBa3huS0p3dEU5VlBZd0RRWUpLb1pJaHZjTkFRRUwKQlFBd2F6RUxNQWtHQTFVRUJoTUNWVk14RURBT0JnTlZCQWdNQjBSbGJIZGhjbVV4RXpBUkJnTlZCQWNNQ2s1bApkeUJEWVhOMGJHVXhGVEFUQmdOVkJBb01ERk4xY0dGaVlYTmxJRWx1WXpFZU1Cd0dBMVVFQXd3VlUzVndZV0poCmMyVWdVbTl2ZENBeU1ESXhJRU5CTUI0WERUSXhNRFF5T0RFd05UWTFNMW9YRFRNeE1EUXlOakV3TlRZMU0xb3cKYXpFTE1Ba0dBMVVFQmhNQ1ZWTXhFREFPQmdOVkJBZ01CMFJsYkhkaGNtVXhFekFSQmdOVkJBY01DazVsZHlCRApZWE4wYkdVeEZUQVRCZ05WQkFvTURGTjFjR0ZpWVhObElFbHVZekVlTUJ3R0ExVUVBd3dWVTNWd1lXSmhjMlVnClVtOXZkQ0F5TURJeElFTkJNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXFRWFcKUXlIT0IrcVIyR0pvYkNxL0NCbVE0MEcwb0RtQ0MzbXpWbm44c3Y0WE5lV3RFNVhjRUwwdVZpaDdKbzREa3gxUQpEbUdIQkgxekRmZ3MycVhpTGI2eHB3L0NLUVB5cFpXMUpzc09UTUlmUXBwTlE4N0s3NVlhMHAyNVkzZVBTMnQyCkd0dkh4TmpVVjZrak9aakVuMnlXRWNCZHBPVkNVWUJWRkJOTUI0WUJIa05SRGEvK1M0dXl3QW9hVFduQ0pMVWkKY3ZUbEhtTXc2eFNRUW4xVWZSUUhrNTBETUNFSjdDeTFSeHJaSnJrWFhSUDNMcVFMMmlqSjZGNHlNZmgrR3liNApPNFhham9Wai8rUjRHd3l3S1lyclM4UHJTTnR3eHI1U3RsUU84eklRVVNNaXEyNndNOG1nRUxGbFMvMzJVY2x0Ck5hUTF4QlJpemt6cFpjdDlEd0lEQVFBQm8yQXdYakFMQmdOVkhROEVCQU1DQVFZd0hRWURWUjBPQkJZRUZLalgKdVhZMzJDenRraEltbmc0eUpOVXRhVVlzTUI4R0ExVWRJd1FZTUJhQUZLalh1WFkzMkN6dGtoSW1uZzR5Sk5VdAphVVlzTUE4R0ExVWRFd0VCL3dRRk1BTUJBZjh3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUI4c3B6Tm4rNFZVCnRWeGJkTWFYKzM5WjUwc2M3dUFUbXVzMTZqbW1IamhJSHorbC85R2xKNUtxQU1PeDI2bVBaZ2Z6RzdvbmVMMmIKVlcrV2dZVWtUVDNYRVBGV25UcDJSSndRYW84L3RZUFhXRUpEYzBXVlFIcnBtbldPRktVL2QzTXFCZ0JtNXkrNgpqQjgxVFUvUkcyclZlclBEV1ArMU1NY05OeTA0OTFDVEw1WFFaN0pmREpKOUNDbVhTZHRUbDR1VVFuU3V2L1F4CkNlYTEzQlgyWmdKYzdBdTMwdmloTGh1YjUyRGU0UC80Z29uS3NOSFlkYldqZzdPV0t3TnYveml0R0RWREI5WTIKQ01UeVpLRzNYRXU1R2hsMUxFbkkzUW1FS3NxYUNMdjEyQm5WamJrU2Vac01uZXZKUHMxWWU2VGpqSndkaWs1UApvL2JLaUl6K0ZxOD0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=","base64").toString("utf8")}});
}
export function convertSql(query){
 let sql=query.replace(/INSERT OR IGNORE INTO/gi,'INSERT INTO');
 if(/INSERT OR IGNORE INTO/i.test(query))sql+=' ON CONFLICT DO NOTHING';
 sql=sql.replace(/json_each\(requests.data,'\$\.items'\)/g,"jsonb_array_elements(requests.data::jsonb->'items') AS item(value)");
 sql=sql.replace(/requests r,json_each\(r.data,'\$\.items'\) j/g,"requests r CROSS JOIN LATERAL jsonb_array_elements(r.data::jsonb->'items') AS j(value)");
 sql=sql.replace(/json_extract\((j\.value|value),'\$\.(\w+)'\)/g,"($1::jsonb->>'$2')");
 sql=sql.replace(/ AS REAL/gi,' AS DOUBLE PRECISION').replace(/ AS approvedValue/g,' AS "approvedValue"');
 if(sql.startsWith('INSERT INTO login_attempts'))sql=sql.replace(/WHEN expires</g,'WHEN login_attempts.expires<').replace(/ELSE count\+1/g,'ELSE login_attempts.count+1').replace(/ELSE expires END/g,'ELSE login_attempts.expires END');
 if(sql.startsWith('INSERT INTO sync_status'))sql=sql.replace(/ELSE last_success END/g,'ELSE sync_status.last_success END').replace(/ELSE line_count END/g,'ELSE sync_status.line_count END').replace(/CASE WHEN \? THEN/g,'CASE WHEN ?::integer<>0 THEN');
 // Preserve placeholders in quoted strings and only number parameter markers.
 let out='',i=0,quote=false;
 for(let at=0;at<sql.length;at++){const c=sql[at];if(c==="'"){out+=c;if(quote&&sql[at+1]==="'"){out+=sql[++at];continue;}quote=!quote;}else out+=c==='?'&&!quote?'$'+(++i):c;}
 return out;
}
const numeric=new Set(['count','value','approvedValue','paid_cents','file_count','n']);
function rows(result){return result.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,numeric.has(k)&&typeof v==='string'&&/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(v)?Number(v):v])));}
export function createDatabase(getPool=connection){
 function statement(sql,args=[]){
  const execute=client=>client.query(convertSql(sql),args);
  return {sql,args,bind:(...values)=>statement(sql,values),
   first:async()=>rows(await execute(getPool()))[0]||null,
   all:async()=>({results:rows(await execute(getPool()))}),
   run:async()=>transaction([statement(sql,args)]).then(r=>r[0])};
 }
 async function transaction(statements){const client=await getPool().connect();try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(640017)");const results=[];for(const s of statements){const result=await client.query(convertSql(s.sql),s.args);results.push({results:rows(result),meta:{changes:result.rowCount||0}});}await client.query('COMMIT');return results;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
 return {prepare:statement,batch:transaction};
}
export const database=createDatabase();
