// Persist feedback on the server so senders and Admins see the same records.
window.BASISFeedbackLive = true;

document.addEventListener('DOMContentLoaded', () => {
    const script = [...document.scripts].find(item => item.src.includes('/feedback-live.js'));
    if (!script) return;
    const api = new URL('admin/api/account_api.php', script.src);
    const isAdmin = window.location.pathname.toLowerCase().includes('/admin/');
    const form = document.getElementById('feedbackForm');
    const statusNode = document.getElementById('feedbackStatus');
    const inputName = document.getElementById('feedbackName');
    const records = [];
    let profile = {};

    const request = async (action, options = {}) => {
        const url = new URL(api.href); url.searchParams.set('action', action);
        const response = await fetch(url, {credentials:'same-origin',cache:'no-store',...options});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Request failed.');
        return data;
    };
    const text = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value || 'Not available'; };
    const formatDate = value => {
        if (!value) return '—';
        const date = new Date(String(value).replace(' ', 'T'));
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});
    };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const readImage = file => new Promise((resolve,reject) => {
        if (!file) return resolve({image_name:'',image_data:''});
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Choose a JPG, PNG, or WebP image.'));
        if (file.size > 2 * 1024 * 1024) return reject(new Error('The image must be 2 MB or smaller.'));
        const reader = new FileReader(); reader.onload = () => resolve({image_name:file.name,image_data:String(reader.result || '')}); reader.onerror = () => reject(new Error('Could not read the image.')); reader.readAsDataURL(file);
    });

    async function loadProfile() {
        const data = await request('profile'); profile = data.profile || {};
        const fullName = [profile.givenName || profile.given_name,profile.middleName || profile.middle_name,profile.surname,profile.suffix].map(value => String(value || '').trim()).filter(Boolean).join(' ');
        text('feedbackName', profile.name || fullName);
        text('feedbackEmail', profile.email);
        text('feedbackContact', profile.contact || profile.contact_no);
        text('feedbackMunicipality', profile.municipality);
        text('feedbackBarangay', profile.barangay);
    }

    async function loadHistory() {
        const data = await request(isAdmin ? 'feedback-inbox' : 'feedback');
        records.splice(0, records.length, ...(data.records || []));
        if (isAdmin) renderInbox(); else renderHistory();
    }
    function showModal(record) {
        document.getElementById('liveFeedbackModal')?.remove();
        const overlay = document.createElement('div'); overlay.id='liveFeedbackModal'; overlay.className='live-feedback-overlay';
        const card = document.createElement('section'); card.className='live-feedback-modal';
        const close = document.createElement('button'); close.type='button'; close.className='live-feedback-close'; close.textContent='×'; close.setAttribute('aria-label','Close'); close.onclick=()=>overlay.remove();
        const heading = document.createElement('h2'); heading.textContent=record.title || record.type || 'Feedback';
        const meta = document.createElement('p'); meta.className='live-feedback-meta'; meta.textContent=[record.type,formatDate(record.created_at),record.name,record.email,record.contact].filter(Boolean).join(' · ');
        const body = document.createElement('p'); body.className='live-feedback-message'; body.textContent=record.message || '';
        card.append(close,heading,meta,body);
        if (record.image_data) { const image=document.createElement('img');image.className='live-feedback-image';image.src=record.image_data;image.alt=record.image_name || 'Feedback attachment';card.appendChild(image); }
        if (isAdmin) {
            const replyForm=document.createElement('form');replyForm.className='live-feedback-reply-form';
            const label=document.createElement('label');label.textContent='Your response';
            const reply=document.createElement('textarea');reply.maxLength=4000;reply.required=true;reply.rows=5;reply.placeholder='Type a response to the sender…';reply.value=record.admin_reply||'';
            const footer=document.createElement('div');footer.className='live-feedback-reply-footer';
            const feedback=document.createElement('span');feedback.className='live-feedback-reply-status';feedback.setAttribute('aria-live','polite');
            const submit=document.createElement('button');submit.type='submit';submit.className='live-feedback-reply-submit';submit.textContent=record.admin_reply?'Update response':'Send response';
            footer.append(feedback,submit);replyForm.append(label,reply,footer);
            replyForm.addEventListener('submit',async event=>{
                event.preventDefault();const value=reply.value.trim();if(!value){feedback.textContent='Please enter a response.';return;}
                submit.disabled=true;feedback.textContent='Sending…';
                try {
                    await request('feedback-reply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({feedback_id:Number(record.id),reply:value})});
                    feedback.textContent='Response sent to the user.';
                    try { await loadHistory();const updated=records.find(item=>Number(item.id)===Number(record.id));if(updated)showModal(updated); }
                    catch(refreshError){ feedback.textContent='Response sent. Refresh the inbox to view it.';submit.disabled=false; }
                } catch(error){feedback.textContent=error.message;submit.disabled=false;}
            });
            card.appendChild(replyForm);
        } else if (record.admin_reply) {
            const response=document.createElement('section');response.className='live-feedback-admin-response';
            const responseHeading=document.createElement('h3');responseHeading.textContent='Admin response';
            const responseDate=document.createElement('small');responseDate.textContent=formatDate(record.replied_at);
            const responseBody=document.createElement('p');responseBody.textContent=record.admin_reply;
            response.append(responseHeading,responseDate,responseBody);card.appendChild(response);
        }
        overlay.appendChild(card); overlay.addEventListener('click',event=>{if(event.target===overlay)overlay.remove();}); document.body.appendChild(overlay);
    }
    function filteredRecords(search, type) {
        const query=String(search || '').trim().toLowerCase();
        return records.filter(record=>(type==='All'||record.type===type) && (!query||[record.title,record.message,record.name,record.email,record.contact,record.type].some(value=>String(value||'').toLowerCase().includes(query))));
    }
    function renderHistory() {
        const list=document.getElementById('feedbackHistoryList');if(!list)return;
        const filtered=filteredRecords(document.getElementById('feedbackHistorySearch')?.value,document.getElementById('feedbackHistoryFilter')?.dataset.filter||'All');
        list.replaceChildren();
        if(!filtered.length){const empty=document.createElement('div');empty.className='feedback-history-empty';empty.innerHTML='<i class="fas fa-history"></i><h3>No feedback or concern history yet.</h3><p>Your submitted feedback and concerns will appear here.</p>';list.appendChild(empty);return;}
        filtered.forEach(record=>{const item=document.createElement('button');item.type='button';item.className='feedback-history-item live-feedback-row';const info=document.createElement('span');info.className='feedback-history-info';const title=document.createElement('strong');title.textContent=record.title;const date=document.createElement('small');date.textContent=formatDate(record.created_at);info.append(title,date);const type=document.createElement('span');type.className='feedback-history-type';type.textContent=record.type;item.append(info,type);if(record.admin_reply){const badge=document.createElement('span');badge.className='live-feedback-replied';badge.textContent='ADMIN REPLIED';item.appendChild(badge);}if(record.image_data){const badge=document.createElement('span');badge.className='live-feedback-attachment';badge.textContent='IMAGE';item.appendChild(badge);}item.onclick=()=>showModal(record);list.appendChild(item);});
    }
    function renderInbox() {
        const list=document.getElementById('feedbackInboxList');if(!list)return;
        const filtered=filteredRecords(document.getElementById('feedbackInboxSearch')?.value,document.getElementById('feedbackInboxFilter')?.dataset.filter||'All');
        list.replaceChildren();
        if(!filtered.length){const empty=document.createElement('div');empty.className='feedback-history-empty feedback-inbox-empty';empty.innerHTML='<i class="fa-solid fa-inbox"></i><h3>No feedback or concerns received yet.</h3>';list.appendChild(empty);return;}
        filtered.forEach(record=>{const item=document.createElement('button');item.type='button';item.className='feedback-inbox-item live-feedback-row';const info=document.createElement('span');info.className='feedback-inbox-info';const title=document.createElement('strong');title.textContent=record.title;const sender=document.createElement('small');sender.textContent=[record.name,record.email].filter(Boolean).join(' · ');const date=document.createElement('small');date.textContent=formatDate(record.created_at);info.append(title,sender,date);const type=document.createElement('span');type.className='feedback-inbox-type';type.textContent=record.type;item.append(info,type);if(record.admin_reply){const badge=document.createElement('span');badge.className='live-feedback-replied';badge.textContent='REPLIED';item.appendChild(badge);}if(record.image_data){const badge=document.createElement('span');badge.className='live-feedback-attachment';badge.textContent='IMAGE';item.appendChild(badge);}item.onclick=()=>showModal(record);list.appendChild(item);});
    }
    function setStatus(message, error=false) { if(!statusNode)return;statusNode.textContent=message;statusNode.dataset.error=error?'true':'false'; }

    if (form) {
        loadProfile().catch(error=>console.warn('Could not load feedback contact details:',error.message));
        form.addEventListener('submit',async event=>{
            event.preventDefault();
            const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
            try {
                const file=document.getElementById('feedbackImage')?.files?.[0];
                const image=await readImage(file);
                const payload={type:document.getElementById('messageType')?.value||'Feedback',title:document.getElementById('messageTitle')?.value.trim()||'',message:document.getElementById('messageBody')?.value.trim()||'',...image};
                const data=await request('feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                form.reset(); if(statusNode)statusNode.textContent=data.message||'Your message was submitted.';
                if(document.getElementById('feedbackHistoryView')?.style.display==='block') await loadHistory();
            } catch(error) { setStatus(error.message,true); }
            finally { if(submit)submit.disabled=false; }
        });
    }
    const historySearch=document.getElementById('feedbackHistorySearch');
    const historyFilter=document.getElementById('feedbackHistoryFilter');
    historySearch?.addEventListener('input',renderHistory);
    historyFilter?.addEventListener('click',()=>{const current=historyFilter.dataset.filter||'All';const next=current==='All'?'Feedback':current==='Feedback'?'Concern':'All';historyFilter.dataset.filter=next;historyFilter.textContent=next==='All'?'FILTER':next.toUpperCase();renderHistory();});
    const inboxSearch=document.getElementById('feedbackInboxSearch');
    const inboxFilter=document.getElementById('feedbackInboxFilter');
    inboxSearch?.addEventListener('input',renderInbox);
    inboxFilter?.addEventListener('click',()=>{const current=inboxFilter.dataset.filter||'All';const next=current==='All'?'Feedback':current==='Feedback'?'Concern':'All';inboxFilter.dataset.filter=next;inboxFilter.textContent=next==='All'?'FILTER':next.toUpperCase();renderInbox();});
    document.addEventListener('click',event=>{
        const view=event.target.closest('[data-open-view]')?.dataset.openView;
        if(view==='feedbackView')loadProfile().catch(error=>console.warn(error));
        if(view==='feedbackHistoryView'||view==='feedbackInboxView')loadHistory().catch(error=>console.warn('Could not load feedback records:',error.message));
    });
    if (isAdmin) loadHistory().catch(error=>console.warn('Could not load Admin feedback inbox:',error.message));
});
