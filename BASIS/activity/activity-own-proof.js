let ownProofType='attendance';
window.setOwnSubmissionTab=function(type){ownProofType=type==='absence'?'absence':'attendance';document.getElementById('tabAttendance')?.classList.toggle('active',ownProofType==='attendance');document.getElementById('tabAbsence')?.classList.toggle('active',ownProofType==='absence');const input=document.getElementById('fileUploadInput'),hint=document.getElementById('proofFileTypeHint');if(input)input.accept=ownProofType==='attendance'?'.jpg,.jpeg,image/jpeg':'.pdf,application/pdf';if(hint)hint.textContent=ownProofType==='attendance'?'JPG only':'PDF only';const selected=document.querySelector('#selectedFile span');if(selected&&input?.files?.length&&!isOwnProofFileAllowed(input.files[0])){input.value='';selected.textContent='No file selected';}const status=document.getElementById('uploadStatus');if(status)status.textContent='';};
function isOwnProofFileAllowed(file){return ownProofType==='attendance'?(/\.jpe?g$/i.test(file.name)&&file.type==='image/jpeg'):(/\.pdf$/i.test(file.name)&&file.type==='application/pdf');}
document.addEventListener('DOMContentLoaded',()=>{
    const input=document.getElementById('fileUploadInput'),drop=document.getElementById('uploadDropArea'),selected=document.getElementById('selectedFile'),submit=document.getElementById('submitFileBtn'),status=document.getElementById('uploadStatus');
    if(!input||!submit||!drop)return;
    // The label's `for` attribute opens the native picker; don't trigger it twice.
    input.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;if(!isOwnProofFileAllowed(file)){input.value='';selected?.querySelector('span')&&(selected.querySelector('span').textContent='No file selected');status.textContent=ownProofType==='attendance'?'Attendance proof must be a JPG image.':'Absence proof must be a PDF letter.';return;}const span=selected?.querySelector('span');if(span)span.textContent=file.name;status.textContent='';});
    const isRep=location.pathname.toLowerCase().includes('/representative/');
    submit.addEventListener('click',async()=>{
        const file=input.files?.[0],activityId=sessionStorage.getItem(isRep?'basisRepresentativeSelectedActivityId':'basisAdminSelectedActivityId');
        if(!file){status.textContent=`Select a ${ownProofType==='attendance'?'JPG photo':'PDF excuse letter'} first.`;return;}
        if(!isOwnProofFileAllowed(file)){status.textContent=ownProofType==='attendance'?'Attendance proof must be a JPG image.':'Absence proof must be a PDF letter.';return;}
        if(file.size>6*1024*1024){status.textContent='The file must be 6 MB or smaller.';return;}
        if(!activityId){status.textContent='Open an activity first.';return;}
        submit.disabled=true;status.textContent='Uploading…';
        try{const fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file);});const response=await fetch('../admin/api/account_api.php?action=submit',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity_id:Number(activityId),submission_type:ownProofType,file_name:file.name,file_data:fileData})});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.message||'Submission failed.');status.textContent=`${ownProofType==='attendance'?'Attendance JPG':'Absence PDF'} submitted and is waiting for review.`;input.value='';const span=selected?.querySelector('span');if(span)span.textContent='No file selected';}catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
    });
});
