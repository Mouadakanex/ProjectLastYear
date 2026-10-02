const $=selector=>document.querySelector(selector);
const button=$('#agentButton'),panel=$('#agentPanel'),messages=$('#messages');
let photo=null,audio=null;
function openChat(){panel.hidden=false;panel.setAttribute('aria-hidden','false');button.setAttribute('aria-expanded','true');$('#messageInput').focus()}
function closeChat(){panel.hidden=true;panel.setAttribute('aria-hidden','true');button.setAttribute('aria-expanded','false');button.focus()}
button.addEventListener('click',()=>panel.hidden?openChat():closeChat());
$('#closeAgent').addEventListener('click',closeChat);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)closeChat()});
function bubble(text,role='assistant'){const item=document.createElement('div');item.className=`agent-message ${role}`;item.textContent=text;messages.append(item);messages.scrollTop=messages.scrollHeight;return item}
function showFiles(){const box=$('#attachment'),items=[];if(photo)items.push(`Photo: ${photo.name} <button type="button" data-file="photo" aria-label="Remove photo">×</button>`);if(audio)items.push(`Audio: ${audio.name} <button type="button" data-file="audio" aria-label="Remove audio">×</button>`);box.innerHTML=items.join(' · ');box.hidden=!items.length;box.querySelectorAll('button').forEach(item=>item.addEventListener('click',()=>{if(item.dataset.file==='photo'){photo=null;$('#photoInput').value=''}else{audio=null;$('#audioInput').value=''}showFiles()}))}
$('#photoButton').addEventListener('click',()=>$('#photoInput').click());$('#audioButton').addEventListener('click',()=>$('#audioInput').click());
$('#photoInput').addEventListener('change',event=>{photo=event.target.files[0]||null;showFiles()});$('#audioInput').addEventListener('change',event=>{audio=event.target.files[0]||null;showFiles()});
function toBase64(file){if(file.size>10*1024*1024)throw Error('Choose a file smaller than 10 MB.');return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('Could not read that file.'));reader.readAsDataURL(file)})}
$('#chatForm').addEventListener('submit',async event=>{
 event.preventDefault();const text=$('#messageInput').value.trim(),sentPhoto=photo,sentAudio=audio;if(!text&&!sentPhoto&&!sentAudio)return;
 const sent=bubble(text||'Please help me with this attachment.','user');if(sentPhoto){const img=document.createElement('img');img.className='agent-photo';img.alt='Attached product';img.src=URL.createObjectURL(sentPhoto);sent.append(img)}if(sentAudio){const label=document.createElement('small');label.textContent=`Audio attached: ${sentAudio.name}`;sent.append(document.createElement('br'),label)}
 $('#messageInput').value='';photo=null;audio=null;$('#photoInput').value='';$('#audioInput').value='';showFiles();const pending=bubble('Thinking…','pending');const send=$('#sendButton');send.disabled=true;
 try{const payload={message:text,products:[{title:'Iphone 18',price:3000,city:'Casablanca',category:'Electro'}]};if(sentPhoto){payload.image=await toBase64(sentPhoto);payload.imageMime=sentPhoto.type}if(sentAudio){payload.audio=await toBase64(sentAudio);payload.audioMime=sentAudio.type}
  const response=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw Error(result.error||'The AI assistant could not reply.');pending.remove();bubble(result.reply||'How can I help?');
  if(result.action?.type==='create_listing'){let image='';if(sentPhoto){const encoded=await toBase64(sentPhoto);image=`data:${sentPhoto.type};base64,${encoded}`}localStorage.setItem('movite-draft',JSON.stringify({...result.action,image,category:result.action.category||'Electronics',city:result.action.city||'Casablanca'}));location.href='/edit.html'}
  if(result.action?.type==='search'&&result.action.query){const search=$('#searchInput');if(search){search.value=result.action.query;search.dispatchEvent(new Event('input',{bubbles:true}))}}
 }catch(error){pending.textContent=error.message.includes('Failed to fetch')?'Can’t reach the AI server. Open the site through the local server and make sure GEMINI_API_KEY is set.':error.message;pending.classList.add('pending');if(sentPhoto){photo=sentPhoto;$('#photoInput').value=''}if(sentAudio){audio=sentAudio;$('#audioInput').value=''}showFiles()}finally{send.disabled=false}
});
