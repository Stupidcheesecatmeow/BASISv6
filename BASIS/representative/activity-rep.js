/* BASIS ADMIN — ACTIVITY DATA LOGIC
   No template/sample activity data.
   Activities appear only after the admin creates one. */

const ACTIVITY_STORAGE_KEY = 'basisRepresentativeActivities';
const SELECTED_ACTIVITY_KEY = 'basisRepresentativeSelectedActivityId';
let pendingSubmissions = [];
let currentSubmission = null;
let activityVerifiedRows = [];
let activityParticipantRows = [];
let verifiedFilterMode = 'all';
let participantFilterMode = 'all';

async function activityRequest(action, body){ const r=await fetch(`../admin/api/activity_api.php?action=${action}`,{method:body?'POST':'GET',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}); const d=await r.json(); if(!r.ok||!d.success)throw new Error(d.message||'Activity request failed.'); return d; }
async function getActivities(){ return (await activityRequest('list')).activities||[]; }
async function getSelectedActivity(){ const id=sessionStorage.getItem(SELECTED_ACTIVITY_KEY); if(!id)return null; return (await activityRequest(`get&id=${encodeURIComponent(id)}`)).activity; }
function escapeHtml(v){ return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function formatDate(v){ if(!v)return ''; const d=new Date(v+'T00:00:00'); return Number.isNaN(d.getTime())?v:d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}); }
function formatSubmissionDateTime(v){if(!v)return '';const raw=String(v).trim();const normalized=/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)?raw:`${raw.replace(' ','T')}Z`;const date=new Date(normalized);return Number.isNaN(date.getTime())?raw:new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(date);}
function hasActivityDeadlinePassed(a,now=new Date()){const explicit=a.deadlineDate||a.deadline_date||'',date=explicit||a.date||a.activity_date||'';if(!date)return false;const time=explicit?(a.deadlineTime||a.deadline_time||'23:59:59'):(a.endTime||a.end_time||'23:59:59');const due=new Date(`${String(date).slice(0,10)}T${time}`);return !Number.isNaN(due.getTime())&&due<=now;}
function setText(id,v){ const e=document.getElementById(id); if(e)e.textContent=v||''; }
function setAll(sel,v){ document.querySelectorAll(sel).forEach(e=>e.textContent=v||''); }
function semesterLabel(a){ return [a?.academicYear||'',a?.semester||''].filter(Boolean).join(' '); }
async function loadPersonalActivityQr(image, activityId){
 if(!image)return;
 try{const response=await fetch(`../admin/api/activity_qr.php?id=${encodeURIComponent(activityId)}`,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('QR could not be loaded.');const blob=await response.blob();if(image.dataset.qrObjectUrl)URL.revokeObjectURL(image.dataset.qrObjectUrl);image.dataset.qrObjectUrl=URL.createObjectURL(blob);image.src=image.dataset.qrObjectUrl;}catch(error){image.removeAttribute('src');console.error(error.message);}
}
window.downloadPersonalActivityQr=function(){const image=document.getElementById('activityQrImage');if(!image?.dataset.qrObjectUrl)return;const link=document.createElement('a');link.href=image.dataset.qrObjectUrl;link.download='BASIS-activity-attendance-QR.svg';link.click();};
async function fillPersonalActivityQrDetails(a,date,time,deadline,sem){[['activityQrSemester',sem],['activityQrTitle',a.name],['activityQrType',a.type],['activityQrDate',date],['activityQrTime',time],['activityQrVenue',a.venue],['activityQrVenueAddress',a.venueAddress],['activityQrMunicipality',a.municipality],['activityQrBarangay',a.barangay],['activityQrDeadline',deadline]].forEach(([id,value])=>setText(id,value));try{const response=await fetch('../admin/api/account_api.php?action=profile',{credentials:'same-origin',cache:'no-store'});const data=await response.json();if(response.ok&&data.success){const p=data.profile||{};const fullName=[p.givenName,p.middleName,p.surname,p.suffix].map(value=>String(value||'').trim()).filter(Boolean).join(' ');setText('activityQrParticipant',fullName||p.name||'—');setText('activityQrParticipantBarangay',p.barangay||'—');}}catch(error){console.error('Unable to load QR profile details:',error.message);}}

function fillActivityDetails(a){
 if(!a)return;
 const sem=semesterLabel(a), date=formatDate(a.date), time=[a.startTime,a.endTime].filter(Boolean).join(' - '), deadline=[formatDate(a.deadlineDate),a.deadlineTime].filter(Boolean).join(' ');
 setText('detailActivityTitle',a.name); setText('detailActivityType',a.type); setText('detailSemester',sem); setText('detailDate',date); setText('detailTime',time); setText('detailVenue',a.venue); setText('detailVenueAddress',a.venueAddress); setText('detailDescription',a.description); setText('detailDeadline',deadline);
 const descriptionImage=document.getElementById('detailDescriptionImage');
 const imageEmpty=document.getElementById('activityDetailImageEmpty');
 const imageSource=a.description_image||a.descriptionImage||'';
 if(descriptionImage){
   descriptionImage.hidden=!imageSource;
   if(imageSource){
     descriptionImage.src=imageSource;
     descriptionImage.onload=()=>{descriptionImage.hidden=false;if(imageEmpty)imageEmpty.hidden=true;};
     descriptionImage.onerror=()=>{descriptionImage.hidden=true;if(imageEmpty)imageEmpty.hidden=false;};
   }else{
     descriptionImage.removeAttribute('src');
   }
 }
 if(imageEmpty)imageEmpty.hidden=!!imageSource;
 setText('qrSemester',sem); setText('qrTitle',a.name); setText('qrType',a.type); setText('qrDate',date); setText('qrTime',time); setText('qrVenue',a.venue); setText('qrVenueAddress',a.venueAddress); setText('qrName',a.name); setText('qrMunicipality',a.municipality); setText('qrBarangay',a.barangay); setText('qrDeadline',deadline);
 const qrImage=document.getElementById('activityQrImage'); if(qrImage){const enabled=['qr','both'].includes(String(a.generateQr||a.generate_qr||'').toLowerCase());qrImage.hidden=!enabled;if(enabled)loadPersonalActivityQr(qrImage,a.id);}
 fillPersonalActivityQrDetails(a,date,time,deadline,sem);
 setText('submissionSemester',sem); setText('submissionDeadline',formatDate(a.deadlineDate)); setText('submissionDate',date); setText('submissionTime',a.deadlineTime); setText('submissionTitle',a.name); setText('submissionType',a.type); setText('submissionActivityTime',time); setText('submissionInfoDate',date); setText('submissionInfoTime',time); setText('submissionVenue',a.venue); setText('submissionVenueAddress',a.venueAddress); setText('submissionName',a.name); setText('submissionMunicipality',a.municipality); setText('submissionBarangay',a.barangay);
 setText('menuActivityTitle',a.name); setText('participantsActivityTitle',a.name); setText('scanActivityTitle',a.name); setText('scanSemester',sem); setText('scanDate',date); setText('scanTime',time); setText('scanVenue',a.venue); setText('scanVenueAddress',a.venueAddress); setText('scanDeadline',deadline); setText('scanDescription',a.description);
 const canQr=['qr','both'].includes(String(a.generateQr||a.generate_qr||'').toLowerCase());document.querySelectorAll('[data-requires-qr]').forEach(el=>el.hidden=!canQr);document.querySelectorAll('[data-requires-proof]').forEach(el=>el.hidden=!['proof','both'].includes(String(a.generateQr||a.generate_qr||'').toLowerCase()));
 setAll('.verify-title',a.name); setAll('.verify-sem',sem); setAll('.verify-date',date); setAll('.verify-time',time); setAll('.verify-venue',a.venue); setAll('.verify-address',a.venueAddress); setAll('.verify-name',a.name); setAll('.verify-municipality',a.municipality); setAll('.verify-barangay',a.barangay); setAll('.verify-deadline',deadline);
}


async function renderActivityList(){
 const list=document.getElementById('adminActivityList'); if(!list)return; let items=[]; try{items=(await getActivities()).filter(a=>!hasActivityDeadlinePassed(a));}catch(e){list.textContent=e.message;return;} list.innerHTML='';
 if(!items.length){ list.innerHTML='<div class="admin-no-activity"><i class="fa-solid fa-book-open"></i><h3>No activities yet.</h3><p>Created activities will appear here.</p></div>'; return; }
 items.forEach(a=>{ const card=document.createElement('div'); card.className='admin-activity-card'; card.innerHTML=`<div><h3>${escapeHtml(a.name)}</h3><span>${escapeHtml(formatDate(a.date||a.activity_date))}</span></div><button class="open-activity-btn" type="button">OPEN</button>`; card.querySelector('button').onclick=()=>{sessionStorage.setItem(SELECTED_ACTIVITY_KEY,String(a.id));window.location.href='activity_menu-rep.html';}; list.appendChild(card); });
}

function bindActivityImagePreview(){ const input=document.getElementById('activityDescriptionImage'),preview=document.getElementById('activityImagePreview'); if(!input||!preview)return; input.addEventListener('change',()=>{const file=input.files?.[0];if(!file){preview.hidden=true;preview.removeAttribute('src');return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){alert('Choose a JPG, PNG, or WebP image up to 2 MB.');input.value='';preview.hidden=true;preview.removeAttribute('src');return;}preview.src=URL.createObjectURL(file);preview.hidden=false;}); }
function readActivityDescriptionImage(){ const input=document.getElementById('activityDescriptionImage'),file=input?.files?.[0];if(!file)return Promise.resolve('');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)return Promise.reject(new Error('Choose a JPG, PNG, or WebP image up to 2 MB.'));return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Could not read the selected image.'));reader.readAsDataURL(file);}); }
window.editSelectedActivity=function(){const id=sessionStorage.getItem(SELECTED_ACTIVITY_KEY);if(!id){alert('Open an activity first.');return;}sessionStorage.setItem('basisActivityEditMode','1');window.location.href='activity_create-rep.html';};
window.deleteSelectedActivity=async function(){const id=sessionStorage.getItem(SELECTED_ACTIVITY_KEY);if(!id){alert('Open an activity first.');return;}if(!confirm('Are you sure you want to delete this activity? Its attendance and submissions will also be deleted. This cannot be undone.'))return;try{await activityRequest('delete',{id:Number(id)});sessionStorage.removeItem(SELECTED_ACTIVITY_KEY);sessionStorage.removeItem('basisActivityEditMode');alert('Activity deleted.');window.location.href='activity-rep.html';}catch(error){alert(error.message);}};
function setActivityFormFromRecord(a){const values={activityName:a.name,activityType:a.type,activityDate:a.date||a.activity_date,activityStartTime:a.startTime||a.start_time,activityEndTime:a.endTime||a.end_time,activityVenue:a.venue,activityVenueAddress:a.venueAddress||a.venue_address,generateQr:a.generateQr||a.generate_qr,activityDeadlineDate:a.deadlineDate||a.deadline_date,activityDeadlineTime:a.deadlineTime||a.deadline_time,academicYear:a.academicYear||a.academic_year,semester:a.semester,activityDescription:a.description};Object.entries(values).forEach(([id,value])=>{const field=document.getElementById(id);if(field)field.value=value||'';});const image=a.description_image||'';const preview=document.getElementById('activityImagePreview');if(preview&&image){preview.src=image;preview.hidden=false;}}
function setupCreateActivity(){
 const btn=document.querySelector('.create-btn');if(!btn)return;bindActivityImagePreview();const editing=sessionStorage.getItem('basisActivityEditMode')==='1';const title=document.getElementById('activityFormTitle'),back=document.getElementById('activityFormBack');if(editing){btn.disabled=true;btn.textContent='SAVE CHANGES';if(title)title.textContent='EDIT ACTIVITY';if(back)back.onclick=()=>{sessionStorage.removeItem('basisActivityEditMode');window.location.href='activity_menu-rep.html';};getSelectedActivity().then(a=>{if(a)setActivityFormFromRecord(a);else{alert('Activity not found.');window.location.href='activity-rep.html';}}).catch(error=>alert(error.message)).finally(()=>btn.disabled=false);}
 btn.onclick=async function(e){e.preventDefault();const name=document.getElementById('activityName')?.value.trim()||'';if(!name){alert('Please enter an activity name.');return;}try{const descriptionImage=await readActivityDescriptionImage();const a={name,type:document.getElementById('activityType')?.value||'',date:document.getElementById('activityDate')?.value||'',startTime:document.getElementById('activityStartTime')?.value||'',endTime:document.getElementById('activityEndTime')?.value||'',venue:document.getElementById('activityVenue')?.value.trim()||'',venueAddress:document.getElementById('activityVenueAddress')?.value.trim()||'',generateQr:document.getElementById('generateQr')?.value||'',deadlineDate:document.getElementById('activityDeadlineDate')?.value||'',deadlineTime:document.getElementById('activityDeadlineTime')?.value||'',academicYear:document.getElementById('academicYear')?.value.trim()||'',semester:document.getElementById('semester')?.value||'',description:document.getElementById('activityDescription')?.value.trim()||'',municipality:'',barangay:''};if(descriptionImage)a.descriptionImage=descriptionImage;if(editing){a.id=Number(sessionStorage.getItem(SELECTED_ACTIVITY_KEY));await activityRequest('update',a);sessionStorage.removeItem('basisActivityEditMode');alert('Activity updated.');window.location.href='activity_menu-rep.html';}else{const result=await activityRequest('create',a);sessionStorage.setItem(SELECTED_ACTIVITY_KEY,String(result.id));window.location.href='activity-rep.html';}}catch(error){alert(error.message);}};
}

window.setSubmissionTab=function(t){const a=document.getElementById('tabAttendance'),b=document.getElementById('tabAbsence');if(!a||!b)return;a.classList.toggle('active',t==='attendance');b.classList.toggle('active',t==='absence');};
let activeScannerStream=null; let activeHtml5Scanner=null; let scanHandled=false;
async function submitScannedActivityQr(value, activity){let payload;let qrPayload=value;try{payload=JSON.parse(value);}catch{payload=null;}if(!payload){const parts=String(value).split(/\r?\n/).map(part=>part.trim()).filter(Boolean);if(parts.length===3){payload={activity_name:parts[0],name:parts[1],barangay:parts[2]};qrPayload=JSON.stringify(payload);}}const newFormat=payload&&payload.activity_name&&payload.name&&Object.prototype.hasOwnProperty.call(payload,'barangay');const oldFormat=payload?.kind==='BASIS_ACTIVITY_ATTENDANCE';const tokenFormat=/^BASIS1:[a-f0-9]{48}$/.test(value);if(!newFormat&&!oldFormat&&!tokenFormat)throw new Error('This is not a valid BASIS activity QR.');if(oldFormat&&Number(payload.activity_id)!==Number(activity.id))throw new Error('This QR belongs to a different activity.');if(newFormat&&String(payload.activity_name)!==String(activity.name))throw new Error('This QR belongs to a different activity.');const preview=await activityRequest('preview-check-in',{activity_id:Number(activity.id),qr_payload:qrPayload});const participant=preview.participant||{};const modal=document.getElementById('qrConfirmModal'),photo=document.getElementById('qrConfirmPhoto'),name=document.getElementById('qrConfirmName'),barangay=document.getElementById('qrConfirmBarangay'),confirmButton=document.getElementById('qrConfirmSubmit');if(!modal||!photo||!name||!barangay||!confirmButton)throw new Error('The participant confirmation dialog is unavailable.');photo.src=participant.profilePhoto||'../images/profile_default.jpg';photo.onerror=()=>{photo.onerror=null;photo.src='../images/profile_default.jpg';};name.textContent=participant.name||'Unknown participant';barangay.textContent=participant.barangay||'Barangay not provided';modal.hidden=false;confirmButton.disabled=false;confirmButton.textContent='CONFIRM CHECK-IN';return new Promise((resolve,reject)=>{const cancelButtons=[document.getElementById('qrConfirmCancel'),document.getElementById('qrConfirmCancelClose')].filter(Boolean);const finish=(confirmed)=>{modal.hidden=true;cancelButtons.forEach(button=>button.removeEventListener('click',cancel));confirmButton.removeEventListener('click',accept);document.removeEventListener('keydown',onKeydown);if(!confirmed){resolve({message:'Scan cancelled.'});return;}confirmButton.disabled=true;confirmButton.textContent='RECORDING…';activityRequest('check-in',{activity_id:Number(activity.id),qr_payload:qrPayload}).then(resolve,reject).finally(()=>{confirmButton.disabled=false;confirmButton.textContent='CONFIRM CHECK-IN';});};const cancel=()=>finish(false);const accept=()=>finish(true);const onKeydown=event=>{if(event.key==='Escape')cancel();};cancelButtons.forEach(button=>button.addEventListener('click',cancel));confirmButton.addEventListener('click',accept);document.addEventListener('keydown',onKeydown);confirmButton.focus();});}
async function prepareQrImageVariants(file){const variants=[file];if(!('createImageBitmap'in window))return variants;let bitmap;try{bitmap=await createImageBitmap(file);for(const scale of [2,3]){const canvas=document.createElement('canvas');const maxSide=1800;const factor=Math.min(scale,maxSide/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));const context=canvas.getContext('2d');context.filter='grayscale(1) contrast(1.35)';context.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(blob)variants.push(blob);}}catch{}finally{bitmap?.close();}return variants;}
window.importActivityQr=async function(){const input=document.getElementById('qrImportFile'),mount=document.getElementById('qrScannerMount'),status=document.getElementById('scanStatus'),file=input?.files?.[0];if(!file)return;try{const activity=await getSelectedActivity();if(!activity)throw new Error('Open an activity first.');if(status)status.textContent='Reading QR image…';const variants=await prepareQrImageVariants(file);let decoded='';for(const image of variants){if(window.Html5Qrcode){let decoder;try{mount.hidden=false;decoder=new Html5Qrcode('qrScannerMount',{formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE]});decoded=await decoder.scanFile(image,false);if(decoded)break;}catch{}finally{if(decoder){try{await decoder.clear();}catch{}}mount.hidden=true;}}if(!decoded&&'BarcodeDetector'in window){let bitmap;try{bitmap=await createImageBitmap(image);const codes=await new BarcodeDetector({formats:['qr_code']}).detect(bitmap);if(codes.length){decoded=codes[0].rawValue||'';if(decoded)break;}}catch{}finally{bitmap?.close();}}}if(!decoded)throw new Error('Could not read a QR code from this image. Try a sharper, uncropped QR image with the whole code visible.');const result=await submitScannedActivityQr(decoded,activity);if(status)status.textContent=result.message;}catch(error){if(status)status.textContent=error.message||'Could not read that QR image.';}finally{if(mount)mount.hidden=true;if(input)input.value='';}};
window.runScan=async function(){
 const button=document.getElementById('scanActionBtn');
 const mount=document.getElementById('qrScannerMount');
 const fallbackVideo=document.getElementById('qrScanVideo');
 const status=document.getElementById('scanStatus');
 if(!button||!mount)return;
 const setStatus=message=>{if(status)status.textContent=message||'';};
 const activity=await getSelectedActivity();
 if(!activity){setStatus('Open an activity first.');return;}
 const stop=async()=>{
   if(activeHtml5Scanner){
     try{if(activeHtml5Scanner.isScanning)await activeHtml5Scanner.stop();}catch(error){console.warn('Could not stop QR scanner:',error);}
     try{await activeHtml5Scanner.clear();}catch(error){console.warn('Could not clear QR scanner:',error);}
     activeHtml5Scanner=null;
   }
   if(activeScannerStream){activeScannerStream.getTracks().forEach(track=>track.stop());activeScannerStream=null;}
   mount.hidden=true;
   mount.replaceChildren();
   if(fallbackVideo){fallbackVideo.pause?.();fallbackVideo.srcObject=null;fallbackVideo.hidden=true;}
   const preview=mount.closest('.scan-preview');preview?.classList.remove('is-scanning');
   button.disabled=false;button.textContent='SCAN WITH CAMERA';
 };
 window.stopActivityScanner=stop;
 if(!navigator.mediaDevices?.getUserMedia){
   setStatus('Camera access is unavailable. Open BASIS on localhost and allow camera permission, or use Import QR Image.');
   return;
 }
 if(!window.Html5Qrcode||!window.Html5QrcodeSupportedFormats){
   setStatus('The QR scanner library did not load. Refresh the page or use Import QR Image.');
   return;
 }
 try{
   button.disabled=true;
   button.textContent='SCANNING…';
   setStatus('Starting camera…');
   if(fallbackVideo)fallbackVideo.hidden=true;
   mount.hidden=false;
   mount.replaceChildren();
   mount.style.display='block';
   mount.style.position='relative';
   mount.style.inset='auto';
   mount.style.width='100%';
   mount.style.height='100%';
   mount.style.minHeight='280px';
   mount.style.maxWidth='100%';
   mount.style.overflow='hidden';
   mount.style.boxSizing='border-box';
   mount.closest('.scan-preview')?.classList.add('is-scanning');
   activeHtml5Scanner=new Html5Qrcode('qrScannerMount',{
     verbose:false,
     formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE]
   });
   const availableCameras=await Html5Qrcode.getCameras();
   if(!availableCameras||!availableCameras.length)throw new Error('No camera was found. Check that the camera is connected and allowed in Chrome.');
   const preferredCamera=availableCameras.find(camera=>/back|rear|environment/i.test(camera.label||''))||availableCameras[0];
   await activeHtml5Scanner.start(
     preferredCamera.id,
     {
       fps:10,
       qrbox:(width,height)=>{
         const size=Math.floor(Math.min(width,height)*0.72);
         return {width:size,height:size};
       },
       aspectRatio:1.0
     },
     async decodedText=>{
       if(!activeHtml5Scanner||scanHandled)return;
       scanHandled=true;
       await stop();
       try{
         const result=await submitScannedActivityQr(decodedText,activity);
         setStatus(result.message||'Attendance recorded.');
       }catch(error){setStatus(error.message||'Unable to record this QR code.');}
       finally{scanHandled=false;}
     },
     ()=>{}
   );
   setStatus('Camera is on. Point the QR code inside the preview.');
 }catch(error){
   await stop();
   setStatus('Could not start camera: '+(error?.message||'Check camera permission and close other apps using the camera.'));
 }
};
async function loadSubmissionData(){
 const activity=await getSelectedActivity();
 if(!activity)return;
 const listResults=await Promise.allSettled([
   activityRequest(`submissions&activity_id=${encodeURIComponent(activity.id)}&status=pending`),
   activityRequest(`submissions&activity_id=${encodeURIComponent(activity.id)}&status=verified`),
   activityRequest(`participants&activity_id=${encodeURIComponent(activity.id)}`)
 ]);
 const pendingResult=listResults[0],verifiedResult=listResults[1],participantsResult=listResults[2];

 if(pendingResult.status==='fulfilled'){
   pendingSubmissions=Array.isArray(pendingResult.value.submissions)?pendingResult.value.submissions:[];
   renderSubmissionList('verifyListContainer',pendingSubmissions,true);
 }else{
   const list=document.getElementById('verifyListContainer');
   if(list)list.innerHTML=`<div class="admin-empty-subview"><h4>Unable to load submissions.</h4><p>${escapeHtml(pendingResult.reason?.message||'Please check the activity API.')}</p></div>`;
 }

 if(verifiedResult.status==='fulfilled'){
   activityVerifiedRows=Array.isArray(verifiedResult.value.submissions)?verifiedResult.value.submissions:[];
   renderSubmissionList('verifiedSubmissionList',activityVerifiedRows,false);
 }else{
   const list=document.getElementById('verifiedSubmissionList');
   if(list)list.innerHTML=`<div class="admin-empty-subview"><h4>Unable to load verified activities.</h4><p>${escapeHtml(verifiedResult.reason?.message||'Please check the activity API.')}</p></div>`;
 }

 if(participantsResult.status==='fulfilled'){
   const people=participantsResult.value;
   activityParticipantRows=Array.isArray(people.participants)?people.participants:[];
   renderParticipants(activityParticipantRows);
 }else{
   const body=document.getElementById('participantsTableBody');
   if(body)body.innerHTML=`<tr><td colspan="5" class="empty-table-cell">Unable to load participants: ${escapeHtml(participantsResult.reason?.message||'Please check the activity API.')}</td></tr>`;
 }
}

function renderSubmissionList(id,rows,actionable){
 const list=document.getElementById(id);if(!list)return;
 const query=actionable?'':(document.getElementById('verifiedSearchInput')?.value||'').trim().toLowerCase();
 const filtered=(Array.isArray(rows)?rows:[]).filter(row=>{
   const haystack=[row.name,row.full_name,row.submission_type,row.file_name,row.status].map(v=>String(v||'')).join(' ').toLowerCase();
   if(query&&!haystack.includes(query))return false;
   if(!actionable){
     const type=String(row.submission_type||row.type||'').toLowerCase();
     if(verifiedFilterMode==='attendance'&&type!=='attendance')return false;
     if(verifiedFilterMode==='absence'&&type!=='absence')return false;
   }
   return true;
 });
 list.innerHTML='';
 if(!filtered.length){
   const title=actionable?'No submissions yet.':'No verified activities found.';
   list.innerHTML=`<div class="admin-empty-subview"><h4>${title}</h4><p>${query?'Try another search term or filter.':'Submitted records will appear here when available.'}</p></div>`;
   return;
 }
 filtered.forEach(row=>{
   const name=row.name||row.full_name||row.fullName||'Unknown participant';
   const type=row.submission_type||row.type||'Submission';
   const fileName=row.file_name||row.fileName||'No filename';
   const status=row.status||'';
   const card=document.createElement('div');card.className='submission-review-card';
   const nameEl=document.createElement('strong');nameEl.textContent=name;
   const detailEl=document.createElement('span');detailEl.textContent=[type,fileName,status].filter(Boolean).join(' · ');
   card.append(nameEl,detailEl);
   if(actionable){
     const button=document.createElement('button');button.type='button';button.textContent='REVIEW';
     button.addEventListener('click',()=>openSubmission(row));card.appendChild(button);
   }
   list.appendChild(card);
 });
}

function renderParticipants(rows){
 activityParticipantRows=Array.isArray(rows)?rows:[];
 applyParticipantFilters();
}
function participantValue(row,...keys){
 for(const key of keys){const value=row?.[key];if(value!==undefined&&value!==null&&String(value).trim()!=='')return value;}
 return '';
}
function applyParticipantFilters(){
 const body=document.getElementById('participantsTableBody');if(!body)return;
 const query=(document.getElementById('participantsSearchInput')?.value||'').trim().toLowerCase();
 const rows=activityParticipantRows.filter(row=>{
   const name=participantValue(row,'name','full_name','fullName');
   const barangay=participantValue(row,'barangay','barangay_name','barangayName');
   const timeIn=participantValue(row,'time_in','timeIn');
   const timeOut=participantValue(row,'time_out','timeOut');
   const submission=participantValue(row,'submission','submission_status','submissionStatus','status');
   const submittedAt=participantValue(row,'submitted_at','submittedAt');
   const haystack=[name,barangay,timeIn,timeOut,submission,submittedAt].join(' ').toLowerCase();
   if(query&&!haystack.includes(query))return false;
   const submitted=String(submission||'').trim().toLowerCase();
   if(participantFilterMode==='pending'&&submitted!=='submitted')return false;
   if(participantFilterMode==='verified'&&!['attended','absent','excused'].includes(submitted))return false;
   return true;
 });
 body.innerHTML='';
 if(!rows.length){
   body.innerHTML=`<tr><td colspan="6" class="empty-table-cell">${query||participantFilterMode!=='all'?'No matching participants found.':'No participants yet.'}</td></tr>`;
   return;
 }
 rows.forEach(row=>{
   const tr=document.createElement('tr');
   const values=[
     participantValue(row,'name','full_name','fullName')||'—',
     participantValue(row,'barangay','barangay_name','barangayName')||'—',
     participantValue(row,'time_in','timeIn')||'—',
     participantValue(row,'time_out','timeOut')||'—',
     participantValue(row,'submission','submission_status','submissionStatus','status'),
     formatSubmissionDateTime(participantValue(row,'submitted_at','submittedAt'))
   ];
   values.forEach(value=>{const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td);});
   body.appendChild(tr);
 });
}
function cycleVerifiedFilter(){
 const modes=['all','attendance','absence'];
 const labels={all:'FILTER: ALL',attendance:'FILTER: ATTENDANCE',absence:'FILTER: ABSENCE'};
 verifiedFilterMode=modes[(modes.indexOf(verifiedFilterMode)+1)%modes.length];
 const button=document.getElementById('verifiedFilterBtn');if(button)button.textContent=labels[verifiedFilterMode];
 renderSubmissionList('verifiedSubmissionList',activityVerifiedRows,false);
}
window.exportActivityParticipants=function(){
 if(!activityParticipantRows.length){alert('There are no participant records to export yet.');return;}
 if(!window.XLSX){alert('Excel export could not load. Refresh the page and try again.');return;}
 const rows=activityParticipantRows.map(row=>({
   'NAME':participantValue(row,'name','full_name','fullName'),
   'BARANGAY':participantValue(row,'barangay','barangay_name','barangayName'),
   'TIME IN':participantValue(row,'time_in','timeIn'),
   'TIME OUT':participantValue(row,'time_out','timeOut'),
   'SUBMISSION':participantValue(row,'submission','submission_status','submissionStatus','status')||'—',
   'SUBMITTED AT':formatSubmissionDateTime(participantValue(row,'submitted_at','submittedAt'))||'—'
 }));
 const wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Participants');
 const title=(document.getElementById('participantsActivityTitle')?.textContent||'activity').replace(/[^a-z0-9-_]+/gi,'_');
 XLSX.writeFile(wb,`BASIS_${title}_participants.xlsx`);
};
function openSubmission(row){currentSubmission=row;const view=row.submission_type==='absence'?'view-activity-verify-absence':'view-activity-verify-attendance';showSubView(view);setAll('.verify-name',row.name);const preview=document.querySelector(`#${view} .submitted-file-preview`);if(!preview)return;preview.replaceChildren();if(row.submission_type==='attendance'){const image=document.createElement('img');image.src=row.file_data;image.alt=`Attendance proof submitted by ${row.name||'user'}`;image.className='proof-image-preview';preview.appendChild(image);}else{const pdf=document.createElement('iframe');pdf.src=row.file_data;pdf.title=`Absence excuse letter submitted by ${row.name||'user'}`;pdf.className='proof-pdf-preview';preview.appendChild(pdf);}}
window.openVerifyDetail=function(t){const row=pendingSubmissions.find(s=>s.submission_type===t);if(row)openSubmission(row);else alert('No pending '+t+' submissions.');};
window.resolveVerification=async function(status){if(!currentSubmission)return;try{await activityRequest('verify',{id:currentSubmission.id,status});currentSubmission=null;await loadSubmissionData();showSubView('view-activity-verify');}catch(e){alert(e.message);}};
window.submitNewActivity=function(){document.querySelector('.create-btn')?.click();};

document.addEventListener('DOMContentLoaded',()=>{
 const verifiedSearch=document.getElementById('verifiedSearchInput');
 const participantsSearch=document.getElementById('participantsSearchInput');
 verifiedSearch?.addEventListener('input',()=>renderSubmissionList('verifiedSubmissionList',activityVerifiedRows,false));
 participantsSearch?.addEventListener('input',applyParticipantFilters);
 document.getElementById('verifiedFilterBtn')?.addEventListener('click',cycleVerifiedFilter);
 document.getElementById('participantsFilterBtn')?.addEventListener('change',event=>{participantFilterMode=event.target.value||'all';applyParticipantFilters();});
});
document.addEventListener('DOMContentLoaded',async()=>{ if(document.getElementById('adminActivityList'))renderActivityList(); if(document.getElementById('activityName'))setupCreateActivity(); if(document.getElementById('scanActionBtn'))document.getElementById('qrImportFile')?.addEventListener('change',window.importActivityQr); if(document.getElementById('scanActionBtn'))document.addEventListener('visibilitychange',()=>{if(document.hidden)window.stopActivityScanner?.();}); try{const a=await getSelectedActivity();if(a)fillActivityDetails(a);if(document.getElementById('verifyListContainer')||document.getElementById('participantsTableBody'))await loadSubmissionData();}catch(e){console.warn(e.message);} });

// =====================================================
// BASIS ADMIN — ACTIVITY SUBVIEW NAVIGATION FIX
// Fix overlapping pages and broken close/back buttons
// =====================================================

window.showSubView = async function (viewId) {
    const target = document.getElementById(viewId);

    if (!target || !target.classList.contains("page-view")) {
        console.error("Activity view not found:", viewId);
        alert("Hindi makita ang page na ito: " + viewId);
        return;
    }

    // Stop the camera when leaving the scan page.
    if (
        viewId !== "view-activity-scan" &&
        typeof window.stopActivityScanner === "function"
    ) {
        try {
            await window.stopActivityScanner();
        } catch (error) {
            console.warn("Could not stop scanner:", error);
        }
    }

    // Hide ALL previous pages, including Details, QR and Submission.
    const allViews = Array.from(
        document.querySelectorAll(".page-view")
    );

    allViews.forEach(view => {
        const isTarget = view === target;

        view.hidden = !isTarget;
        view.classList.toggle("active", isTarget);
        view.setAttribute(
            "aria-hidden",
            isTarget ? "false" : "true"
        );
    });

    // Remove stale inline display styles.
    allViews.forEach(view => {
        view.style.removeProperty("display");
    });

    // Reset the scroll position when opening another page.
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });

    // Refresh the selected activity without changing the page.
    try {
        const activity = await getSelectedActivity();

        if (!activity) {
            console.warn("No selected activity ID was found.");

            const status = document.getElementById("scanStatus");

            if (
                viewId === "view-activity-scan" &&
                status
            ) {
                status.textContent =
                    "Walang napiling activity. Bumalik sa Activities at buksan ulit ang activity.";
            }

            return;
        }

        fillActivityDetails(activity);

        // Refresh records only for the relevant pages.
        if (
            viewId === "view-activity-verify" ||
            viewId === "view-activity-verified" ||
            viewId === "view-activity-participants"
        ) {
            await loadSubmissionData();
        }

    } catch (error) {
        console.error(
            "Unable to load activity view:",
            error
        );

        const status = document.getElementById("scanStatus");

        if (
            viewId === "view-activity-scan" &&
            status
        ) {
            status.textContent =
                "Hindi ma-load ang activity. Pakisuri ang connection sa API.";
        }
    }
};


// =====================================================
// INITIAL PAGE VISIBILITY
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    const allViews = Array.from(
        document.querySelectorAll(".page-view")
    );

    if (!allViews.length) return;

    // Preserve the HTML's initially active page if available.
    let initialView = allViews.find(view =>
        view.classList.contains("active") &&
        !view.hidden
    );

    // Otherwise, open the Activity Menu by default.
    if (!initialView) {
        initialView =
            document.getElementById("view-activity-menu") ||
            allViews[0];
    }

    allViews.forEach(view => {
        const isInitial = view === initialView;

        view.hidden = !isInitial;
        view.classList.toggle("active", isInitial);

        view.setAttribute(
            "aria-hidden",
            isInitial ? "false" : "true"
        );

        view.style.removeProperty("display");
    });
});
