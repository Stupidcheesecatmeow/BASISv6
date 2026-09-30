<?php
declare(strict_types=1);
require_once __DIR__.'/db.php'; require_once __DIR__.'/http.php';
try {
 $pdo=db(); $user=requireUser($pdo); $method=$_SERVER['REQUEST_METHOD']??'GET'; $action=$_GET['action']??'profile'; $in=requestInput(); $uid=(int)$user['id'];
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
 if($action==='submit' && $method==='POST') { $activity=(int)($in['activity_id']??0);$type=($in['submission_type']??'attendance')==='absence'?'absence':'attendance';$name=trim((string)($in['file_name']??''));$data=(string)($in['file_data']??'');if(!$activity||$name===''||$data==='')jsonResponse(false,'Activity and file are required.',422);if(strlen($data)>8*1024*1024)jsonResponse(false,'File is too large (6 MB maximum).',413);$s=$pdo->prepare('SELECT generate_qr FROM activities WHERE id=?');$s->execute([$activity]);$mode=$s->fetchColumn();if($mode===false)jsonResponse(false,'Activity not found.',404);if(!in_array(strtolower((string)$mode),['proof','both'],true))jsonResponse(false,'Proof submission is disabled for this activity.',403);$s=$pdo->prepare("INSERT INTO submissions(activity_id,user_id,submission_type,file_name,file_data) VALUES(?,?,?,?,?) ON CONFLICT(activity_id,user_id,submission_type) DO UPDATE SET file_name=excluded.file_name,file_data=excluded.file_data,status='PENDING',submitted_at=CURRENT_TIMESTAMP");$s->execute([$activity,$uid,$type,$name,$data]);jsonResponse(true,'File submitted for verification.'); }
 if($action==='submissions' && $method==='GET') { $s=$pdo->prepare('SELECT s.id,s.activity_id,a.name AS activity_title,s.submission_type,s.file_name,s.status,s.submitted_at FROM submissions s JOIN activities a ON a.id=s.activity_id WHERE s.user_id=? ORDER BY s.submitted_at DESC');$s->execute([$uid]);jsonResponse(true,'',200,['submissions'=>$s->fetchAll()]); }
 if($action==='feedback' && $method==='GET') { $s=$pdo->prepare('SELECT f.id,f.type,f.title,f.message,f.status,f.created_at,u.name,u.email,u.contact_no AS contact,u.municipality,u.barangay FROM feedback f JOIN users u ON u.id=f.user_id WHERE f.user_id=? ORDER BY f.id DESC');$s->execute([$uid]);jsonResponse(true,'',200,['records'=>$s->fetchAll()]); }
 if($action==='feedback' && $method==='POST') { $title=trim((string)($in['title']??''));$message=trim((string)($in['message']??''));$type=trim((string)($in['type']??'Feedback'));if($title===''||$message==='')jsonResponse(false,'Title and message are required.',422);$s=$pdo->prepare('INSERT INTO feedback(user_id,type,title,message) VALUES(?,?,?,?)');$s->execute([$uid,$type,$title,$message]);jsonResponse(true,'Your message has been submitted.',201,['id'=>(int)$pdo->lastInsertId()]); }
 jsonResponse(false,'Unknown action.',400);
}catch(Throwable $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();error_log($e->getMessage());jsonResponse(false,'Server error.',500);}
