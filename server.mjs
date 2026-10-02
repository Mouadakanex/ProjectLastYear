import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host}`);if(req.method==='POST'&&url.pathname==='/api/agent')return agent(req,res);const pathname=url.pathname==='/'?'/so9.html':decodeURIComponent(url.pathname),file=path.resolve(root,`.${pathname}`);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
async function agent(req,res){
 if(!process.env.GEMINI_API_KEY)return send(res,503,{error:'Set GEMINI_API_KEY in your environment, then restart the server.'});
 try{
  const body=await readBody(req),content=[];
  if(!body.message&&!body.image&&!body.audio)return send(res,400,{error:'Write a message or attach a photo/audio.'});
  if(body.image){if(!/^image\/(jpeg|png|webp)$/.test(body.imageMime||'')||body.image.length>11_000_000)return send(res,400,{error:'Use a JPG, PNG, or WEBP photo under 8 MB.'});content.push({type:'image',data:body.image,mime_type:body.imageMime})}
  if(body.audio){if(!/^audio\/(mpeg|mp4|wav|webm|ogg|aac|flac)$/.test(body.audioMime||'')||body.audio.length>14_000_000)return send(res,400,{error:'Use supported audio under 10 MB.'});content.push({type:'audio',data:body.audio,mime_type:body.audioMime})}
  const products=Array.isArray(body.products)?body.products.slice(0,30):[];
  content.unshift({type:'text',text:`You are Movite, a helpful Moroccan marketplace assistant. Reply in the user's language, with a warm concise tone. Current listings: ${JSON.stringify(products)}. User says: ${String(body.message||'').slice(0,1500)}. Always return JSON with reply and action. action includes type (none, search, create_listing), query, category, title, description, price, price_basis, city, condition, icon. Use empty strings and price 0 for irrelevant fields. For item search use search with query/category. If the user sends a photo and wants to list it, identify brand/model only when visible; use a realistic local MAD price based on current comparable Moroccan listings; do not invent a car's year/mileage or unseen condition facts. Use Google Search to compare current local prices where available; say in price_basis when comparisons are scarce and label the amount as a suggestion. A listing action creates a draft the user can edit before publishing. Categories: Electronics, Home, Fashion, Sports, Cars. Default city Casablanca.`});
  const schema={type:'text',mime_type:'application/json',schema:{type:'object',properties:{reply:{type:'string'},action:{type:'object',properties:{type:{type:'string',enum:['none','search','create_listing']},query:{type:'string'},category:{type:'string'},title:{type:'string'},description:{type:'string'},price:{type:'number'},price_basis:{type:'string'},city:{type:'string'},condition:{type:'string'},icon:{type:'string'}},required:['type','query','category','title','description','price','price_basis','city','condition','icon']}},required:['reply','action']}};
  let response,data,temporary=false;
  for(const model of ['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash','gemini-3.5-flash-lite']){
   for(let attempt=0;attempt<2;attempt++){
    response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({model,input:content,response_format:schema,...(body.image?{tools:[{type:'google_search'}]}:{})})});
    data=await response.json();if(response.ok)break;const reason=String(data.error?.message||'').toLowerCase();temporary=[429,503].includes(response.status)||reason.includes('high demand')||reason.includes('try again later');if(!temporary)break;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,700))
   }
   if(response.ok||!temporary)break
  }
  if(!response.ok)return send(res,502,{error:temporary?'Gemini is busy right now. Please try again shortly.':data.error?.message||'Gemini request failed.'});
  const text=data.output_text||data.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content||[]).map(c=>c.text||'').join('')||'{}';send(res,200,JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,'')))
 }catch(e){send(res,500,{error:e.message||'Assistant error.'})}
}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))}
function readBody(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>28_000_000){reject(Error('Request too large.'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(raw))}catch{reject(Error('Invalid request.'))}});req.on('error',reject)})}
server.listen(Number(process.env.PORT||3000),()=>console.log(`Movite is ready at http://localhost:${process.env.PORT||3000}`));
