document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('activityOwnProof');
    if(!form)return;
    form.addEventListener('submit',async event=>{
        event.preventDefault();
        const file=document.getElementById('activityOwnProofFile')?.files?.[0];
        const status=document.getElementById('activityOwnProofStatus');
        const button=form.querySelector('button[type="submit"]');
        const id=sessionStorage.getItem(location.pathname.toLowerCase().includes('/representative/')?'basisRepresentativeSelectedActivityId':'basisAdminSelectedActivityId');
        if(!file||!id)return;
        if(file.size>6*1024*1024){status.textContent='File must be 6 MB or smaller.';return;}
        button.disabled=true;status.textContent='Uploading…';
        try{
            const fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file);});
            const response=await fetch('../admin/api/account_api.php?action=submit',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({activity_id:Number(id),submission_type:'attendance',file_name:file.name,file_data:fileData})});
            const data=await response.json();if(!response.ok||!data.success)throw new Error(data.message||'Proof could not be uploaded.');
            status.textContent='Proof uploaded and waiting for verification.';form.reset();
        }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
});
