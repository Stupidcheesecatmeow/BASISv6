<?php
declare(strict_types=1);
require_once __DIR__.'/db.php'; require_once __DIR__.'/http.php';
try {
 $pdo=db(); $user=requireUser($pdo); $method=$_SERVER['REQUEST_METHOD']??'GET'; $action=$_GET['action']??'profile'; $in=requestInput(); $uid=(int)$user['id'];
 if($action==='announcements' && $method==='GET') { $s=$pdo->query('SELECT id,title,announcement_date AS date,message,attachment_name,attachment_data,created_at FROM announcements ORDER BY created_at DESC,id DESC');jsonResponse(true,'',200,['announcements'=>$s->fetchAll()]); }
 if($action==='notifications' && $method==='GET') { $s=$pdo->prepare('SELECT id,type,title,message,activity_id AS activityId,created_at AS createdAt,is_read AS isRead FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC');$s->execute([$uid]);jsonResponse(true,'',200,['notifications'=>$s->fetchAll()]); }
 if($action==='notifications' && $method==='POST') { $s=$pdo->prepare('UPDATE notifications SET is_read=1 WHERE user_id=?');$s->execute([$uid]);jsonResponse(true,'Notifications marked as read.'); }
 if($action==='announcements' && $method==='POST') { if(!in_array(($user['role']??''),['ADMIN','REPRESENTATIVE'],true))jsonResponse(false,'Only admins and representatives can publish announcements.',403);$title=trim((string)($in['title']??''));$date=trim((string)($in['date']??''));$message=trim((string)($in['message']??''));$attachmentName=trim((string)($in['attachment_name']??''));$attachmentData=(string)($in['attachment_data']??'');if($title===''||$date===''||$message==='')jsonResponse(false,'Please complete the announcement details.',422);if(strlen($attachmentData)>7*1024*1024)jsonResponse(false,'Announcement attachment is too large (5 MB maximum).',413);if($attachmentData!==''&&!preg_match('#\\Adata:[^;,]+;base64,[A-Za-z0-9+/]+={0,2}\\z#',$attachmentData))jsonResponse(false,'Announcement attachment is invalid.',422);$s=$pdo->prepare('INSERT INTO announcements(title,announcement_date,message,attachment_name,attachment_data,created_by) VALUES(?,?,?,?,?,?)');$s->execute([$title,$date,$message,$attachmentName,$attachmentData,$uid]);jsonResponse(true,'Announcement published to all users.',201,['id'=>(int)$pdo->lastInsertId()]); }
 if($action==='scorecard' && $method==='GET') {
     $s=$pdo->prepare('SELECT u.id,u.control_number,u.name,u.email,u.role,u.status,u.municipality,u.barangay,u.given_name,u.middle_name,u.surname,u.suffix,u.sex,u.birthday,u.contact_no,u.religion,u.school,u.program,u.year_level,u.profile_completed,p.profile_json FROM users u LEFT JOIN account_profiles p ON p.user_id=u.id WHERE u.id=?');
     $s->execute([$uid]);
     $row=$s->fetch();
     $extra=json_decode((string)($row['profile_json']??'{}'),true);
     unset($row['profile_json']);
     $profile=array_merge(is_array($extra)?$extra:[],$row);
     $profile['givenName']=$row['given_name']??'';
     $profile['middleName']=$row['middle_name']??'';
     $profile['surname']=$row['surname']??'';
     $profile['suffix']=$row['suffix']??'';
     $profile['contact']=$row['contact_no']??'';
     $profile['yearLevel']=$row['year_level']??'';
     $s=$pdo->prepare("SELECT a.id,a.name AS title,a.name,a.type,a.activity_date AS date,a.academic_year AS academicYear,a.semester,COALESCE(NULLIF(x.attendance_date,''),NULLIF(scan.attendance_date,''),'') AS attendance_date,COALESCE(NULLIF(x.time_in,''),NULLIF(scan.time_in,''),'') AS time_in,COALESCE(NULLIF(x.time_out,''),NULLIF(scan.time_out,''),'') AS time_out,CASE WHEN UPPER(COALESCE(x.status,'')) IN ('PRESENT','ATTENDED') OR scan.user_id IS NOT NULL OR EXISTS(SELECT 1 FROM submissions sub WHERE sub.activity_id=a.id AND sub.user_id=? AND sub.status='VERIFIED' AND sub.submission_type='attendance') THEN 'ATTENDED' ELSE COALESCE(x.status,'') END AS status FROM activities a LEFT JOIN activity_attendance x ON x.activity_id=a.id AND x.user_id=? LEFT JOIN (SELECT activity_id,user_id,MIN(attendance_date) AS attendance_date,MIN(time_in) AS time_in,MAX(time_out) AS time_out FROM activity_attendance_scans GROUP BY activity_id,user_id) scan ON scan.activity_id=a.id AND scan.user_id=? WHERE UPPER(COALESCE(x.status,'')) IN ('PRESENT','ATTENDED') OR scan.user_id IS NOT NULL OR EXISTS(SELECT 1 FROM submissions sub WHERE sub.activity_id=a.id AND sub.user_id=? AND sub.status='VERIFIED' AND sub.submission_type='attendance') ORDER BY a.activity_date DESC,a.id DESC");
     $s->execute([$uid,$uid,$uid,$uid]);
     jsonResponse(true,'',200,['profile'=>$profile,'profileComplete'=>(int)($row['profile_completed']??0)===1,'activities'=>$s->fetchAll()]);
 }
 if($action==='admin-dashboard' && $method==='GET') { if(($user['role']??'')!=='ADMIN')jsonResponse(false,'Admin access required.',403);$latest=$pdo->query('SELECT id,name,activity_date AS date FROM activities ORDER BY created_at DESC,id DESC LIMIT 1')->fetch();if(!$latest){jsonResponse(true,'',200,['activity'=>null,'totalParticipants'=>0,'attended'=>0,'absent'=>0]);}$count=$pdo->prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN (UPPER(COALESCE(x.status,'')) IN ('PRESENT','ATTENDED') AND TRIM(COALESCE(x.time_in,''))<>'') OR EXISTS(SELECT 1 FROM submissions s WHERE s.activity_id=? AND s.user_id=u.id AND s.status='VERIFIED' AND s.submission_type='attendance') THEN 1 ELSE 0 END) AS attended FROM users u LEFT JOIN activity_attendance x ON x.activity_id=? AND x.user_id=u.id WHERE UPPER(u.status)='ACTIVE'");$count->execute([(int)$latest['id'],(int)$latest['id']]);$stats=$count->fetch();$total=(int)$stats['total'];$attended=(int)$stats['attended'];jsonResponse(true,'',200,['activity'=>$latest,'totalParticipants'=>$total,'attended'=>$attended,'absent'=>max(0,$total-$attended)]); }
 if($action==='representative-dashboard' && $method==='GET') {
     if (($user['role'] ?? '') !== 'REPRESENTATIVE') jsonResponse(false,'Representative access required.',403);
     $assignment=$pdo->prepare('SELECT profile_json FROM account_profiles WHERE user_id=?');
     $assignment->execute([$uid]);
     $extra=json_decode((string)($assignment->fetchColumn() ?: '{}'),true);
     $assignedBarangay=is_array($extra)?trim((string)($extra['assignedBarangay']??'')):'';
     if ($assignedBarangay==='') jsonResponse(true,'',200,['assignedBarangay'=>'','users'=>[]]);
     $normalizeBarangay=static fn(string $value): string => preg_replace('/[^a-z0-9]/i','',strtolower(trim($value))) ?? '';
     $users=$pdo->query("SELECT id,name,role,status,sex,barangay FROM users WHERE status='ACTIVE'")->fetchAll();
     $members=[];
     foreach($users as $member) {
         if ($normalizeBarangay((string)($member['barangay']??''))===$normalizeBarangay($assignedBarangay)) $members[]=$member;
     }
     jsonResponse(true,'',200,['assignedBarangay'=>$assignedBarangay,'users'=>$members]);
 }
 if($action==='profile' && $method==='GET') { $s=$pdo->prepare('SELECT u.id,u.control_number,u.name,u.email,u.role,u.status,u.municipality,u.barangay,u.given_name,u.surname,u.middle_name,u.suffix,u.sex,u.birthday,u.contact_no,u.religion,u.school,u.program,u.year_level,u.profile_completed,p.profile_json FROM users u LEFT JOIN account_profiles p ON p.user_id=u.id WHERE u.id=?');$s->execute([$uid]);$row=$s->fetch();$extra=json_decode($row['profile_json']??'{}',true);unset($row['profile_json']);$profile=array_merge(is_array($extra)?$extra:[],$row);$profile['registrationStatus']=in_array(strtolower($row['status']),['active','inactive'],true)?'approved':'pending';$profile['controlNumber']=$row['control_number'];$profile['givenName']=$row['given_name']??'';$profile['middleName']=$row['middle_name']??'';$profile['surname']=$row['surname']??'';$profile['suffix']=$row['suffix']??'';$profile['sex']=$row['sex']??'';$profile['birthday']=$row['birthday']??'';$profile['contact']=$row['contact_no']??'';$profile['religion']=$row['religion']??'';$profile['municipality']=$row['municipality']??'';$profile['barangay']=$row['barangay']??'';$profile['school']=$row['school']??'';$profile['program']=$row['program']??'';$profile['yearLevel']=$row['year_level']??'';$profile['studentStatus']=$row['status'];jsonResponse(true,'',200,['profile'=>$profile]); }
 if ($action === 'profile' && $method === 'PUT') {
     $profile = $in['profile'] ?? null;
     if (!is_array($profile)) jsonResponse(false, 'Profile data is required.', 422);

     $email = strtolower(trim((string)($profile['email'] ?? '')));
     if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
         jsonResponse(false, 'Enter a valid email address.', 422);
     }
     $duplicate = $pdo->prepare('SELECT 1 FROM users WHERE LOWER(email)=? AND id<>? LIMIT 1');
     $duplicate->execute([$email, $uid]);
     if ($duplicate->fetchColumn()) {
         jsonResponse(false, 'That email is already used by another account.', 409);
     }

     $profile['email'] = $email;
     $json = json_encode($profile, JSON_UNESCAPED_UNICODE);
     if ($json === false) jsonResponse(false, 'Profile data could not be saved.', 422);
     if (strlen($json) > 2000000) jsonResponse(false, 'Profile data exceeds the allowed size.', 413);

     $pdo->beginTransaction();
     $saveProfile = $pdo->prepare('INSERT INTO account_profiles(user_id,profile_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET profile_json=excluded.profile_json,updated_at=CURRENT_TIMESTAMP');
     $saveProfile->execute([$uid, $json]);

     $name = trim(implode(' ', array_filter([
         $profile['givenName'] ?? '',
         $profile['middleName'] ?? '',
         $profile['surname'] ?? '',
         $profile['suffix'] ?? ''
     ])));
     $requiredFields = ['givenName', 'surname', 'birthday', 'contact', 'municipality', 'barangay', 'school', 'program', 'yearLevel'];
     $complete = 1;
     foreach ($requiredFields as $key) {
         if (trim((string)($profile[$key] ?? '')) === '') {
             $complete = 0;
             break;
         }
     }

     $updateUser = $pdo->prepare("UPDATE users SET email=?,name=CASE WHEN ?<>'' THEN ? ELSE name END,given_name=?,middle_name=?,surname=?,suffix=?,sex=?,birthday=?,contact_no=?,religion=?,municipality=?,barangay=?,school=?,program=?,year_level=?,profile_completed=?,updated_at=CURRENT_TIMESTAMP WHERE id=?");
     $updateUser->execute([
         $email,
         $name,
         $name,
         $profile['givenName'] ?? '',
         $profile['middleName'] ?? '',
         $profile['surname'] ?? '',
         $profile['suffix'] ?? '',
         $profile['sex'] ?? '',
         $profile['birthday'] ?? '',
         $profile['contact'] ?? '',
         $profile['religion'] ?? '',
         $profile['municipality'] ?? 'BAGAC',
         $profile['barangay'] ?? '',
         $profile['school'] ?? '',
         $profile['program'] ?? '',
         $profile['yearLevel'] ?? '',
         $complete,
         $uid
     ]);
     $pdo->commit();
     jsonResponse(true, 'Profile saved.');
 }
 if($action==='activities' && $method==='GET') { $s=$pdo->query("SELECT a.*,a.activity_date AS date,a.start_time AS startTime,a.end_time AS endTime,a.venue_address AS venueAddress,a.deadline_date AS deadlineDate,a.deadline_time AS deadlineTime,a.academic_year AS academicYear,COALESCE(x.status,'') AS attendance_status,COALESCE(x.time_in,'') AS time_in,COALESCE(x.time_out,'') AS time_out FROM activities a LEFT JOIN activity_attendance x ON x.activity_id=a.id AND x.user_id=".(int)$uid." ORDER BY a.activity_date DESC,a.id DESC");jsonResponse(true,'',200,['activities'=>$s->fetchAll()]); }
 if($action==='attendance' && $method==='GET') { $s=$pdo->prepare('SELECT a.name AS activity_title,x.attendance_date,x.time_in,x.time_out,x.status FROM activity_attendance x JOIN activities a ON a.id=x.activity_id WHERE x.user_id=? ORDER BY x.attendance_date DESC,x.id DESC');$s->execute([$uid]);jsonResponse(true,'',200,['attendance'=>$s->fetchAll()]); }
 if($action==='submit' && $method==='POST') { $activity=(int)($in['activity_id']??0);$type=($in['submission_type']??'attendance')==='absence'?'absence':'attendance';$name=trim((string)($in['file_name']??''));$data=(string)($in['file_data']??'');if(!$activity||$name===''||$data==='')jsonResponse(false,'Activity and proof file are required.',422);$isJpg=$type==='attendance'&&preg_match('/\\.jpe?g$/i',$name)&&preg_match('#\\Adata:image/jpeg;base64,([A-Za-z0-9+/]+={0,2})\\z#',$data,$match);$isPdf=$type==='absence'&&preg_match('/\\.pdf$/i',$name)&&preg_match('#\\Adata:application/pdf;base64,([A-Za-z0-9+/]+={0,2})\\z#',$data,$match);if(!$isJpg&&!$isPdf)jsonResponse(false,$type==='attendance'?'Attendance proof must be a JPG/JPEG photo.':'Absence proof must be a PDF excuse letter.',422);if(strlen($data)>8*1024*1024)jsonResponse(false,'File is too large (6 MB maximum).',413);$bytes=base64_decode($match[1],true);if($bytes===false||strlen($bytes)>6*1024*1024||($isJpg&&(strlen($bytes)<3||ord($bytes[0])!==255||ord($bytes[1])!==216||ord($bytes[2])!==255))||($isPdf&&!str_starts_with($bytes,'%PDF-')))jsonResponse(false,'The uploaded file is invalid or exceeds 6 MB.',422);$s=$pdo->prepare('SELECT generate_qr FROM activities WHERE id=?');$s->execute([$activity]);$mode=$s->fetchColumn();if($mode===false)jsonResponse(false,'Activity not found.',404);if(!in_array(strtolower((string)$mode),['proof','both'],true))jsonResponse(false,'Proof submission is disabled for this activity.',403);$s=$pdo->prepare("INSERT INTO submissions(activity_id,user_id,submission_type,file_name,file_data) VALUES(?,?,?,?,?) ON CONFLICT(activity_id,user_id,submission_type) DO UPDATE SET file_name=excluded.file_name,file_data=excluded.file_data,status='PENDING',submitted_at=CURRENT_TIMESTAMP");$s->execute([$activity,$uid,$type,$name,$data]);jsonResponse(true,$type==='attendance'?'Attendance JPG submitted for verification.':'Absence PDF submitted for verification.'); }
 if($action==='submissions' && $method==='GET') { $s=$pdo->prepare('SELECT s.id,s.activity_id,a.name AS activity_title,s.submission_type,s.file_name,s.status,s.submitted_at FROM submissions s JOIN activities a ON a.id=s.activity_id WHERE s.user_id=? ORDER BY s.submitted_at DESC');$s->execute([$uid]);jsonResponse(true,'',200,['submissions'=>$s->fetchAll()]); }
 if($action==='feedback' && $method==='GET') { $s=$pdo->prepare('SELECT f.id,f.type,f.title,f.message,f.status,f.image_name,f.image_data,f.admin_reply,f.replied_at,f.created_at,u.name,u.email,u.contact_no AS contact,u.municipality,u.barangay FROM feedback f JOIN users u ON u.id=f.user_id WHERE f.user_id=? ORDER BY f.id DESC');$s->execute([$uid]);jsonResponse(true,'',200,['records'=>$s->fetchAll()]); }
 if($action==='feedback' && $method==='POST') {
     $title=trim((string)($in['title']??''));
     $message=trim((string)($in['message']??''));
     $type=trim((string)($in['type']??'Feedback'));
     $imageName=trim((string)($in['image_name']??''));
     $imageData=trim((string)($in['image_data']??''));
     if($title===''||$message==='')jsonResponse(false,'Title and message are required.',422);
     if(!in_array($type,['Feedback','Concern'],true))jsonResponse(false,'Choose Feedback or Concern.',422);
     if($imageData!==''){
         if(strlen($imageData)>3*1024*1024||!preg_match('#\\Adata:image/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})\\z#',$imageData,$match))jsonResponse(false,'Upload a JPG, PNG, or WebP image up to 2 MB.',422);
         $imageBytes=base64_decode($match[2],true);
         if($imageBytes===false||strlen($imageBytes)>2*1024*1024)jsonResponse(false,'Upload a JPG, PNG, or WebP image up to 2 MB.',422);
     }else{$imageName='';}
     $pdo->beginTransaction();
     try {
         $s=$pdo->prepare('INSERT INTO feedback(user_id,type,title,message,image_name,image_data) VALUES(?,?,?,?,?,?)');
         $s->execute([$uid,$type,$title,$message,$imageName,$imageData]);
         $feedbackId=(int)$pdo->lastInsertId();
         $admins=$pdo->query("SELECT id FROM users WHERE UPPER(role)='ADMIN'")->fetchAll(PDO::FETCH_COLUMN);
         if($admins){
             $notify=$pdo->prepare("INSERT INTO notifications(user_id,type,title,message) VALUES(?,'new_feedback','Someone sent a feedback/concern',?)");
             $noticeBody=$type.' from '.(string)($user['name']??'a user').': '.$title;
             foreach($admins as $adminId)$notify->execute([(int)$adminId,$noticeBody]);
         }
         $pdo->commit();
     } catch(Throwable $error) {
         $pdo->rollBack();
         throw $error;
     }
     jsonResponse(true,'Your message has been submitted.',201,['id'=>$feedbackId]);
 }
 if($action==='feedback-inbox' && $method==='GET') {
     if(($user['role']??'')!=='ADMIN')jsonResponse(false,'Admin access required.',403);
     $s=$pdo->query('SELECT f.id,f.user_id,f.type,f.title,f.message,f.status,f.image_name,f.image_data,f.admin_reply,f.replied_at,f.created_at,u.name,u.email,u.contact_no AS contact,u.municipality,u.barangay,u.role FROM feedback f JOIN users u ON u.id=f.user_id ORDER BY f.id DESC');
     jsonResponse(true,'',200,['records'=>$s->fetchAll()]);
 }
 if($action==='feedback-reply' && $method==='POST') {
     if(($user['role']??'')!=='ADMIN')jsonResponse(false,'Admin access required.',403);
     $feedbackId=(int)($in['feedback_id']??0);
     $reply=trim((string)($in['reply']??''));
     if($feedbackId<=0||$reply==='')jsonResponse(false,'Write a response before sending.',422);
     if(strlen($reply)>4000)jsonResponse(false,'The response must be 4,000 characters or fewer.',422);
     $find=$pdo->prepare('SELECT user_id,title FROM feedback WHERE id=?');
     $find->execute([$feedbackId]);
     $record=$find->fetch();
     if(!$record)jsonResponse(false,'Feedback or concern not found.',404);
     $pdo->beginTransaction();
     try {
         $update=$pdo->prepare("UPDATE feedback SET admin_reply=?,replied_at=CURRENT_TIMESTAMP,replied_by=?,status='REPLIED' WHERE id=?");
         $update->execute([$reply,$uid,$feedbackId]);
         $notification=$pdo->prepare("INSERT INTO notifications(user_id,type,title,message) VALUES(?,'feedback_response','A reply from your feedback/concern has come',?)");
         $notification->execute([(int)$record['user_id'],'The Admin responded to “'.(string)$record['title'].'”. Open Feedback and Concern History to read the reply.']);
         $pdo->commit();
     } catch(Throwable $error) {
         $pdo->rollBack();
         throw $error;
     }
     jsonResponse(true,'Your response was sent to the user.');
 }
 jsonResponse(false,'Unknown action.',400);
}catch(Throwable $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();error_log($e->getMessage());jsonResponse(false,'Server error.',500);}
