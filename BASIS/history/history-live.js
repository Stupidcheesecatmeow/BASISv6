document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.toLowerCase();
    const isAdmin = page.includes('/admin/');
    const isRep = page.includes('/representative/');
    const baseScript = [...document.scripts].find(item => item.src.includes('/history-live.js'));
    if (!baseScript) return;
    const api = new URL('../admin/api/account_api.php', baseScript.src);
    const fetchData = async action => {
        const url = new URL(api.href); url.searchParams.set('action', action);
        const response = await fetch(url, {credentials:'same-origin',cache:'no-store'});
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'History could not be loaded.');
        return data;
    };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
    const formatDate = value => {
        if (!value) return '—';
        const date = new Date(String(value).slice(0,10) + (String(value).length <= 10 ? 'T00:00:00' : ''));
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
    };
    const views = isAdmin
            ? {announcements:'view-history-admin-announcements',announcementDetail:'view-history-admin-announcement-detail',notifications:'view-history-admin-notifications',notificationDetail:'view-history-admin-notification-detail',announcementList:'adminAnnouncementHistoryList',notificationList:'adminNotificationHistoryList',title:'adminAnnouncementDetailTitle',date:'adminAnnouncementDetailDate',description:'adminAnnouncementDetailDescription',image:'adminAnnouncementDetailImage',noticeTitle:'adminNotificationDetailTitle',noticeDate:'adminNotificationDetailDate',noticeBody:'adminNotificationDetailBody',activityPage:'../admin/activity_menu-admin.html',selectedActivity:'basisAdminSelectedActivityId'}
        : isRep
            ? {announcements:'view-history-rep-announcements',announcementDetail:'view-history-rep-announcement-detail',notifications:'view-history-rep-notifications',notificationDetail:'view-history-rep-notification-detail',announcementList:'repAnnouncementHistoryList',notificationList:'repNotificationHistoryList',title:'repAnnouncementDetailTitle',date:'repAnnouncementDetailDate',description:'repAnnouncementDetailDescription',image:'repAnnouncementDetailImage',noticeTitle:'repNotificationDetailTitle',noticeDate:'repNotificationDetailDate',noticeBody:'repNotificationDetailBody',activityPage:'../representative/activity_menu-rep.html',selectedActivity:'basisRepresentativeSelectedActivityId'}
            : {announcements:'view-history-announcements',announcementDetail:'view-history-announcement-detail',notifications:'view-history-notifications',notificationDetail:'view-history-notification-detail',announcementList:'announcementHistoryList',notificationList:'notificationHistoryList',title:'',date:'',description:'',image:'',noticeTitle:'',noticeDate:'',noticeBody:'',activityPage:'../activity/activity.html',selectedActivity:'basisSelectedActivityId'};
    const setText = (id, value, fallbackSelector = '') => { const node = (id ? document.getElementById(id) : null) || (fallbackSelector ? document.querySelector(fallbackSelector) : null); if (node) node.textContent = value || ''; };
    const showView = id => {
        const custom = isAdmin ? window.showAdminHistoryView : isRep ? window.showRepHistoryView : window.showSubView;
        if (typeof custom === 'function') custom(id);
        else { document.querySelectorAll('.page-view').forEach(view => view.classList.toggle('active', view.id === id)); }
    };
    const announceList = document.getElementById(views.announcementList);
    const notificationList = document.getElementById(views.notificationList);
    const addEmpty = (container, text) => { if (!container) return; const message=document.createElement('div');message.className='history-empty-message';message.innerHTML=`<i class="fa-solid fa-clock-rotate-left"></i><h3>${escape(text)}</h3>`;container.replaceChildren(message); };
    const openAnnouncement = item => {
        setText(views.title,item.title,'.detail-title');
        setText(views.date,formatDate(item.date || item.created_at),'.detail-date');
        setText(views.description,item.message || item.description || '',`#${views.announcementDetail} .desc-text`);
        const image=views.image?document.getElementById(views.image):document.querySelector('#view-history-announcement-detail .announcement-img');
        const media=image?.closest('.media-placeholder-box') || image?.parentElement;
        if(media)media.hidden=!item.attachment_data;
        let link=media?.querySelector('.history-announcement-attachment');
        if (item.attachment_data && String(item.attachment_data).startsWith('data:image/')) {
            if(image){image.src=item.attachment_data;image.hidden=false;}
            if(link)link.hidden=true;
        } else {
            if(image){image.hidden=true;image.removeAttribute('src');}
            if(item.attachment_data && media){
                if(!link){link=document.createElement('a');link.className='history-announcement-attachment';media.appendChild(link);}
                link.href=item.attachment_data;link.download=item.attachment_name||'announcement-attachment';link.textContent=`Download attachment: ${item.attachment_name||'file'}`;link.hidden=false;
            } else if(link) link.hidden=true;
        }
        showView(views.announcementDetail);
    };
    try {
        const [announcementData, notificationData] = await Promise.all([fetchData('announcements'),fetchData('notifications')]);
        const announcements=announcementData.announcements||[];
        if (announceList) {
            announceList.replaceChildren();
            if(!announcements.length) addEmpty(announceList,'No announcement history yet.');
            announcements.forEach(item=>{
                const row=document.createElement('button');row.type='button';row.className='history-item-row history-clickable-row';
                row.style.cssText='width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;';
                row.innerHTML=`<h4>${escape(item.title||'ANNOUNCEMENT')}</h4><div class="history-item-meta"><span>${escape(formatDate(item.date||item.created_at))}</span></div>`;
                row.addEventListener('click',()=>openAnnouncement(item));announceList.appendChild(row);
            });
        }
        const selectedId=sessionStorage.getItem('basisSelectedAnnouncementId');
        if(selectedId){const selected=announcements.find(item=>String(item.id)===String(selectedId));sessionStorage.removeItem('basisSelectedAnnouncementId');if(selected)openAnnouncement(selected);}
        const notices=notificationData.notifications||[];
        const activityList=document.getElementById(isAdmin?'adminActivityHistoryList':isRep?'repActivityHistoryList':'activityHistoryList');
        if(activityList){
            try {
                const activityData=await fetchData('activities');
                const today=new Date();today.setHours(0,0,0,0);
                const ended=(activityData.activities||[]).filter(item=>{const raw=String(item.deadlineDate||item.deadline_date||item.date||item.activity_date||'').slice(0,10);if(!raw)return false;const due=new Date(raw+'T00:00:00');return !Number.isNaN(due.getTime())&&due<=today;});
                activityList.replaceChildren();if(!ended.length)addEmpty(activityList,'No activity history yet.');
                ended.forEach(item=>{const row=document.createElement('article');row.className='history-item-row';const title=document.createElement('h4');title.textContent=item.name||item.title||'ACTIVITY';const meta=document.createElement('div');meta.className='history-item-meta';meta.textContent=formatDate(item.deadlineDate||item.deadline_date||item.date||item.activity_date);const status=document.createElement('p');status.textContent=['PRESENT','ATTENDED'].includes(String(item.attendance_status||'').toUpperCase())?'Attended':'Absent';row.append(title,meta,status);activityList.appendChild(row);});
            }catch(error){console.warn('Could not load activity history:',error.message);}
        }
        if(notificationList){
            notificationList.replaceChildren();
            if(!notices.length) addEmpty(notificationList,'No notification history yet.');
            notices.forEach(item=>{
                const row=document.createElement('button');row.type='button';row.className='history-item-row history-clickable-row';
                row.style.cssText='width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;';
                row.innerHTML=`<h4>${escape(item.title||'NOTIFICATION')}</h4><div class="history-item-meta"><span>${escape(formatDate(item.createdAt))}</span></div><p>${escape(item.message||'')}</p>`;
                row.addEventListener('click',()=>{
                    if(item.type==='new_activity' && item.activityId){sessionStorage.setItem(views.selectedActivity,String(item.activityId));window.location.href=new URL(views.activityPage,baseScript.src).href;return;}
                    setText(views.noticeTitle,item.title,'.notification-title');setText(views.noticeDate,formatDate(item.createdAt),'.notification-date');setText(views.noticeBody,item.message,'.notification-body');showView(views.notificationDetail);
                });
                notificationList.appendChild(row);
            });
        }
        fetch(new URL('../admin/api/account_api.php?action=notifications',baseScript.src),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
    } catch(error) {
        console.warn('Could not load live history:',error.message);
    }
});
