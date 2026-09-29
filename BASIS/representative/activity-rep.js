/* BASIS REPRESENTATIVE — ACTIVITY DATA LOGIC
   No template/sample activity data.
   Activities appear only after the admin creates one. */

const ACTIVITY_STORAGE_KEY = 'basisRepresentativeActivities';
const SELECTED_ACTIVITY_KEY = 'basisRepresentativeSelectedActivityId';

function getActivities(){ try { const d=JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY)||'[]'); return Array.isArray(d)?d:[]; } catch(e){ return []; } }
function saveActivities(a){ localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(a)); }
function getSelectedActivity(){ const id=localStorage.getItem(SELECTED_ACTIVITY_KEY); return id ? getActivities().find(a=>String(a.id)===String(id))||null : null; }
function escapeHtml(v){ return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function formatDate(v){ if(!v)return ''; const d=new Date(v+'T00:00:00'); return Number.isNaN(d.getTime())?v:d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}); }
function setText(id,v){ const e=document.getElementById(id); if(e)e.textContent=v||''; }
function setAll(sel,v){ document.querySelectorAll(sel).forEach(e=>e.textContent=v||''); }
function semesterLabel(a){ return [a?.academicYear||'',a?.semester||''].filter(Boolean).join(' '); }

function fillActivityDetails(a){
 if(!a)return;
 const sem=semesterLabel(a), date=formatDate(a.date), time=[a.startTime,a.endTime].filter(Boolean).join(' - '), deadline=[formatDate(a.deadlineDate),a.deadlineTime].filter(Boolean).join(' ');
 setText('detailActivityTitle',a.name); setText('detailActivityType',a.type); setText('detailSemester',sem); setText('detailDate',date); setText('detailTime',time); setText('detailVenue',a.venue); setText('detailVenueAddress',a.venueAddress); setText('detailDescription',a.description); setText('detailDeadline',deadline);
 setText('qrSemester',sem); setText('qrTitle',a.name); setText('qrType',a.type); setText('qrDate',date); setText('qrTime',time); setText('qrVenue',a.venue); setText('qrVenueAddress',a.venueAddress); setText('qrName',a.name); setText('qrMunicipality',a.municipality); setText('qrBarangay',a.barangay); setText('qrDeadline',deadline);
 setText('submissionSemester',sem); setText('submissionDate',date); setText('submissionTime',a.deadlineTime); setText('submissionTitle',a.name); setText('submissionType',a.type); setText('submissionInfoDate',date); setText('submissionInfoTime',time); setText('submissionVenue',a.venue); setText('submissionVenueAddress',a.venueAddress); setText('submissionName',a.name); setText('submissionMunicipality',a.municipality); setText('submissionBarangay',a.barangay);
 setText('menuActivityTitle',a.name); setText('participantsActivityTitle',a.name); setText('scanActivityTitle',a.name); setText('scanSemester',sem); setText('scanDate',date); setText('scanTime',time); setText('scanVenue',a.venue); setText('scanVenueAddress',a.venueAddress); setText('scanDeadline',deadline); setText('scanDescription',a.description);
 setAll('.verify-title',a.name); setAll('.verify-sem',sem); setAll('.verify-date',date); setAll('.verify-time',time); setAll('.verify-venue',a.venue); setAll('.verify-address',a.venueAddress); setAll('.verify-name',a.name); setAll('.verify-municipality',a.municipality); setAll('.verify-barangay',a.barangay); setAll('.verify-deadline',deadline);
}

function renderActivityList(){
 const list=document.getElementById('adminActivityList'); if(!list)return; const items=getActivities(); list.innerHTML='';
 if(!items.length){ list.innerHTML='<div class="admin-no-activity"><i class="fa-solid fa-book-open"></i><h3>No activities yet.</h3><p>Created activities will appear here.</p></div>'; return; }
 items.forEach(a=>{ const card=document.createElement('div'); card.className='admin-activity-card'; card.innerHTML=`<div><h3>${escapeHtml(a.name)}</h3><span>${escapeHtml(formatDate(a.date))}</span></div><button class="open-activity-btn" type="button">OPEN</button>`; card.querySelector('button').onclick=()=>{localStorage.setItem(SELECTED_ACTIVITY_KEY,String(a.id));window.location.href='activity_menu-rep.html';}; list.appendChild(card); });
}

function setupCreateActivity(){
 const btn=document.querySelector('.create-btn'); if(!btn)return; btn.onclick=function(e){ e.preventDefault(); const name=document.getElementById('activityName')?.value.trim()||''; if(!name){alert('Please enter an activity name.');return;} const a={id:Date.now(),name,type:document.getElementById('activityType')?.value||'',date:document.getElementById('activityDate')?.value||'',startTime:document.getElementById('activityStartTime')?.value||'',endTime:document.getElementById('activityEndTime')?.value||'',venue:document.getElementById('activityVenue')?.value.trim()||'',venueAddress:document.getElementById('activityVenueAddress')?.value.trim()||'',generateQr:document.getElementById('generateQr')?.value||'',deadlineDate:document.getElementById('activityDeadlineDate')?.value||'',deadlineTime:document.getElementById('activityDeadlineTime')?.value||'',academicYear:document.getElementById('academicYear')?.value.trim()||'',semester:document.getElementById('semester')?.value||'',description:document.getElementById('activityDescription')?.value.trim()||'',municipality:'',barangay:'',submissions:[],participants:[],createdAt:new Date().toISOString()}; const all=getActivities(); all.push(a); saveActivities(all); localStorage.setItem(SELECTED_ACTIVITY_KEY,String(a.id)); window.location.href='activity-rep.html'; };
}

window.setSubmissionTab=function(t){const a=document.getElementById('tabAttendance'),b=document.getElementById('tabAbsence');if(!a||!b)return;a.classList.toggle('active',t==='attendance');b.classList.toggle('active',t==='absence');};
window.runScan=function(){const b=document.getElementById('scanActionBtn');if(!b)return;b.textContent='SCANNING...';b.disabled=true;setTimeout(()=>{b.textContent='SCAN';b.disabled=false;},1200);};
window.openVerifyDetail=function(t){showSubView(t==='attendance'?'view-activity-verify-attendance':'view-activity-verify-absence');};
window.resolveVerification=function(){showSubView('view-activity-verify');};
window.submitNewActivity=function(){document.querySelector('.create-btn')?.click();};

document.addEventListener('DOMContentLoaded',()=>{ if(document.getElementById('adminActivityList'))renderActivityList(); if(document.getElementById('activityName'))setupCreateActivity(); const a=getSelectedActivity(); if(a)fillActivityDetails(a); });
window.addEventListener('storage',e=>{if(e.key===ACTIVITY_STORAGE_KEY||e.key===SELECTED_ACTIVITY_KEY){renderActivityList();const a=getSelectedActivity();if(a)fillActivityDetails(a);}});
