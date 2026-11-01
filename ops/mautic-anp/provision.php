<?php
declare(strict_types=1);
ob_start();
define('MAUTIC_ROOT_DIR','/var/www/html'); define('IN_MAUTIC_CONSOLE',1); require MAUTIC_ROOT_DIR.'/autoload.php';
$dir=MAUTIC_ROOT_DIR.'/var/anp-editions';$lock=fopen($dir.'/provision.lock','c');if(!flock($lock,LOCK_EX|LOCK_NB))exit(0);
$kernel=new AppKernel('prod',false);$kernel->boot();$container=$kernel->getContainer();$c=$container->get('doctrine')->getConnection();
$ctx=stream_context_create(['http'=>['timeout'=>20,'follow_location'=>0],'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
$raw=file_get_contents('https://agenciadoco.com.br/webinario/a-nova-psicologia/editions.json',false,$ctx);$registry=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
if(($registry['funnel']??'')!=='a-nova-psicologia'||!isset($registry['editions'][$registry['current']]))throw new RuntimeException('Invalid registry');
$selfTest=in_array('--self-test',$argv??[],true);
if($selfTest){$fixture=$registry['editions'][$registry['current']];$fixture['startsAt']='2030-11-07T14:00:00-03:00';$fixture['endsAt']='2030-11-07T15:30:00-03:00';$registry=['funnel'=>'a-nova-psicologia','current'=>'2030-11-07','editions'=>['2030-11-07'=>$fixture]];$c->beginTransaction();}
$templates=json_decode(file_get_contents($dir.'/emails.json'),true,64,JSON_THROW_ON_ERROR);if(array_column($templates,'key')!==['DX','D5','D4','D3','D2','D1','D0_09','D0_13'])throw new RuntimeException('Invalid eight-email sequence');
$stateFile=$dir.'/state.json';$state=is_file($stateFile)?json_decode(file_get_contents($stateFile),true,64,JSON_THROW_ON_ERROR):['version'=>1,'editions'=>[]];
$utc=new DateTimeZone('UTC');$brazil=new DateTimeZone('America/Sao_Paulo');$now=new DateTimeImmutable('now',$utc);$nowSql=$now->format('Y-m-d H:i:s');
function fresh(array $row,string $now):array {unset($row['id']);foreach(['checked_out','checked_out_by','checked_out_by_user']as $key)if(array_key_exists($key,$row))$row[$key]=null;foreach(['date_added','date_modified'] as $key)if(array_key_exists($key,$row))$row[$key]=$now;return $row;}
function insertRow($c,string $table,array $row):int {$c->insert('mautic_'.$table,$row);return (int)$c->lastInsertId();}
function sqlTime(DateTimeImmutable $d):string{return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');}
function schedule(string $edition):array {$day=new DateTimeImmutable($edition.' 00:00:00',new DateTimeZone('America/Sao_Paulo'));$result=[['key'=>'DX','at'=>null,'until'=>$day->setTime(15,30)]];for($i=5;$i>=1;$i--){$at=$day->modify('-'.$i.' days')->setTime(14,0);$result[]=['key'=>'D'.$i,'at'=>$at,'until'=>$at->setTime(0,0)->modify('+1 day')];}$result[]=['key'=>'D0_09','at'=>$day->setTime(9,0),'until'=>$day->setTime(13,0)];$result[]=['key'=>'D0_13','at'=>$day->setTime(13,0),'until'=>$day->setTime(14,0)];return $result;}
function renderEmail(array $template,string $edition,array $event):array {
 $group=htmlspecialchars($event['groupUrl'],ENT_QUOTES,'UTF-8');$class='https://agenciadoco.com.br/webinario/a-nova-psicologia/aula/?edition='.$edition.'&amp;utm_source=mautic&amp;utm_medium=email&amp;utm_campaign=anp_'.str_replace('-','',$edition).'&amp;utm_content='.$template['key'];
 $style='style="display:inline-block;background:#34402f;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:5px;font-weight:bold;"';
 $html=str_replace(['{{group_button}}','{{class_button}}'],['<a href="'.$group.'" '.$style.'>Entrar no grupo do WhatsApp</a>','<a href="'.$class.'" '.$style.'>Acessar a aula</a>'],$template['html']);
 if(strpos($html,'{{')!==false)throw new RuntimeException('Unresolved template');
 $html=preg_replace('/class="cta"/',$style,$html);
 $plain=preg_replace_callback('~<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>~si',static function($m){return strip_tags($m[2]).' ('.html_entity_decode($m[1],ENT_QUOTES|ENT_HTML5,'UTF-8').')';},$html);
 $plain=preg_replace('~</(?:p|div|tr|h[1-6])>|<br\s*/?>~i',"\n\n",$plain);$plain=html_entity_decode(strip_tags($plain),ENT_QUOTES|ENT_HTML5,'UTF-8');$plain=trim(preg_replace('/\n\s*\n\s*\n/',"\n\n",$plain));
 if(preg_match('/(?:outubro|novembro|\b2026\b|\d{2}\/\d{2})/iu',strip_tags(preg_replace('/https?:[^\s<)]+/','',$plain))))throw new RuntimeException('Date in reusable text');
 return [$html,$plain];
}
$public=['version'=>2,'current'=>$registry['current'],'editions'=>[]];
foreach($registry['editions'] as $edition=>$event){
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$edition))throw new RuntimeException('Invalid edition');
 if(($event['status']??'')!=='scheduled')continue;
 $start=new DateTimeImmutable($event['startsAt']);$end=new DateTimeImmutable($event['endsAt']);if($end<=$now)continue;
 if($start->setTimezone($brazil)->format('Y-m-d H:i')!==$edition.' 14:00'||$end<=$start||($event['timezone']??'')!=='America/Sao_Paulo')throw new RuntimeException('Invalid date/time');
 if(!preg_match('~^https://chat\.whatsapp\.com/[A-Za-z0-9]+$~D',$event['groupUrl'])||!preg_match('~^https://meet\.google\.com/[a-z-]+$~D',$event['meetUrl']))throw new RuntimeException('Invalid links');
 $entry=$state['editions'][$edition]??null;
 if($entry&&$entry['config_hash']!==hash('sha256',json_encode($event)))throw new RuntimeException('Existing edition config changed; review required: '.$edition);
 if(!$entry||($entry['layout']??1)!==2){
  if($entry&&!is_file($dir.'/before-layout-v2.json')){file_put_contents($dir.'/before-layout-v2.json',json_encode(['state'=>$state,'emails'=>$c->fetchAllAssociative('SELECT * FROM mautic_emails WHERE id BETWEEN 71 AND 78'),'form_actions'=>$c->fetchAllAssociative('SELECT * FROM mautic_form_actions WHERE form_id=12'),'campaign'=>$c->fetchAssociative('SELECT * FROM mautic_campaigns WHERE id=36')],JSON_UNESCAPED_UNICODE));}
  $day=(new DateTimeImmutable($edition))->format('d/m/Y');$alias='anp-'.str_replace('-','',$edition).'-inscritos';
  $c->beginTransaction();try{
   if(!$entry){
    $segment=(int)$c->fetchOne('SELECT id FROM mautic_lead_lists WHERE alias=?',[$alias]);
    if(!$segment){$row=fresh($c->fetchAssociative('SELECT * FROM mautic_lead_lists WHERE id=33'),$nowSql);$row=array_merge($row,['name'=>'[ANP '.$day.'] Inscritos','public_name'=>'Webinário A Nova Psicologia — '.$day,'alias'=>$alias,'description'=>'Inscritos exclusivos desta edição; histórico preservado.','filters'=>serialize([]),'is_global'=>0,'last_built_date'=>null]);$segment=insertRow($c,'lead_lists',$row);}
    $row=fresh($c->fetchAssociative('SELECT * FROM mautic_forms WHERE id=12'),$nowSql);$row=array_merge($row,['name'=>'[ANP '.$day.'] Webinário A Nova Psicologia','alias'=>'anp'.str_replace('-','',$edition),'cached_html'=>null,'publish_up'=>null,'publish_down'=>sqlTime($end)]);$form=insertRow($c,'forms',$row);
    foreach($c->fetchAllAssociative('SELECT * FROM mautic_form_fields WHERE form_id=12 ORDER BY field_order')as $field){$field=fresh($field,$nowSql);$field['form_id']=$form;insertRow($c,'form_fields',$field);}
    foreach($c->fetchAllAssociative('SELECT * FROM mautic_form_actions WHERE form_id=12 ORDER BY action_order')as $action){$action=fresh($action,$nowSql);$action['form_id']=$form;if($action['type']==='lead.changelist'){$action['name']='['.$day.'] Adicionar inscrito à edição';$action['properties']=serialize(['addToLists'=>[$segment],'removeFromLists'=>[]]);}insertRow($c,'form_actions',$action);}
    $ids=[];$slots=schedule($edition);$emailTemplate=$c->fetchAssociative('SELECT * FROM mautic_emails WHERE id=66');
    foreach($templates as $i=>$t){$slot=$slots[$i];[$html,$plain]=renderEmail($t,$edition,$event);$email=fresh($emailTemplate,$nowSql);$email=array_merge($email,['name'=>'[ANP '.$day.'] '.$t['key'],'description'=>$i===0?'E-mail de campanha; confirmação imediata pelo formulário.':'E-mail de segmento; ajustar segmento e janela de publicação para cada edição.','subject'=>$t['subject'],'custom_html'=>$html,'plain_text'=>$plain,'content'=>null,'dynamic_content'=>serialize([]),'utm_tags'=>serialize(['utmSource'=>'mautic','utmMedium'=>'email','utmCampaign'=>'anp_'.str_replace('-','',$edition),'utmContent'=>$t['key']]),'email_type'=>$i===0?'template':'list','is_published'=>1,'publish_up'=>$slot['at']?sqlTime($slot['at']):null,'publish_down'=>sqlTime($slot['until']),'read_count'=>0,'sent_count'=>0,'variant_sent_count'=>0,'variant_read_count'=>0,'revision'=>1,'variant_parent_id'=>null,'translation_parent_id'=>null]);$emailId=insertRow($c,'emails',$email);$ids[$t['key']]=['email'=>$emailId,'at'=>$email['publish_up'],'until'=>$email['publish_down']];}
    $entry=['segment'=>$segment,'form'=>$form,'emails'=>$ids,'config_hash'=>hash('sha256',json_encode($event))];
   }
   if(isset($entry['campaign'])){$c->update('mautic_campaigns',['is_published'=>0,'description'=>'Arquivada: substituída por DX no formulário e sete e-mails de segmento. Histórico preservado.'],['id'=>$entry['campaign']]);$entry['legacy_campaign']=$entry['campaign'];unset($entry['campaign']);}
   foreach($entry['emails'] as $key=>&$message){$emailId=(int)$message['email'];$isWelcome=$key==='DX';$c->update('mautic_emails',['email_type'=>$isWelcome?'template':'list','date_modified'=>$nowSql],['id'=>$emailId]);
    if(!$isWelcome&&!$c->fetchOne('SELECT COUNT(*) FROM mautic_email_list_xref WHERE email_id=? AND leadlist_id=?',[$emailId,$entry['segment']]))$c->insert('mautic_email_list_xref',['email_id'=>$emailId,'leadlist_id'=>$entry['segment']]);
    if(isset($message['event'])){$message['legacy_event']=$message['event'];unset($message['event']);}
   }unset($message);
   $welcomeActions=$c->fetchAllAssociative("SELECT id FROM mautic_form_actions WHERE form_id=? AND type='email.send.lead'",[$entry['form']]);if(count($welcomeActions)>1)throw new RuntimeException('Duplicate welcome action');
   $welcome=['name'=>'DX — Enviar boas-vindas com acesso ao grupo','description'=>'E-mail de campanha enviado ao contato após cada inscrição bem-sucedida.','properties'=>serialize(['email'=>(string)$entry['emails']['DX']['email']])];
   if($welcomeActions)$c->update('mautic_form_actions',$welcome,['id'=>$welcomeActions[0]['id']]);else{$welcome['form_id']=$entry['form'];$welcome['type']='email.send.lead';$welcome['action_order']=(int)$c->fetchOne('SELECT MAX(action_order) FROM mautic_form_actions WHERE form_id=?',[$entry['form']])+1;insertRow($c,'form_actions',$welcome);}
   $entry['layout']=2;$c->commit();
  }catch(Throwable $e){$c->rollBack();throw $e;}
  if($selfTest){
   if($entry['form']===12||$entry['segment']===33||count($entry['emails'])!==8)throw new RuntimeException('Future edition not isolated');
   $count=(int)$c->fetchOne('SELECT COUNT(*) FROM mautic_email_list_xref WHERE leadlist_id=?',[$entry['segment']]);if($count!==7)throw new RuntimeException('Seven segment emails required');
   $action=$c->fetchOne("SELECT properties FROM mautic_form_actions WHERE form_id=? AND type='email.send.lead'",[$entry['form']]);if((int)unserialize($action)['email']!==$entry['emails']['DX']['email'])throw new RuntimeException('Future welcome action wrong');
   $model=$container->get('mautic.form.model.form');$html=$model->generateHtml($model->getEntity($entry['form']));if(strpos($html,'mauticform[formId]')===false)throw new RuntimeException('Future form HTML failed');
   if($entry['emails']['D5']['at']!=='2030-11-02 17:00:00'||$entry['emails']['D0_09']['at']!=='2030-11-07 12:00:00'||$entry['emails']['D0_13']['at']!=='2030-11-07 16:00:00')throw new RuntimeException('Future schedule wrong');
   $c->rollBack();if($c->fetchOne('SELECT id FROM mautic_lead_lists WHERE alias=?',[$alias]))throw new RuntimeException('Test did not roll back');echo 'PASS future edition: exclusive segment, native form welcome action, one campaign email and seven segment emails; correct dates; all test rows rolled back'.PHP_EOL;exit(0);
  }
  $state['editions'][$edition]=$entry;$state['version']=2;file_put_contents($stateFile.'.tmp',json_encode($state,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));rename($stateFile.'.tmp',$stateFile);echo 'CONFIGURED_LAYOUT_V2 '.$edition.PHP_EOL;
 }
 $model=$container->get('mautic.form.model.form');$formEntity=$model->getEntity($entry['form']);$model->createTableSchema($formEntity);$html=$model->generateHtml($formEntity);$dom=new DOMDocument();@$dom->loadHTML($html);$formName=(new DOMXPath($dom))->evaluate('string(//input[@name="mauticform[formName]"]/@value)');if(!$formName)throw new RuntimeException('Missing generated form name');
 $public['editions'][$edition]=['formId'=>$entry['form'],'formName'=>$formName,'segmentId'=>$entry['segment']];
}
$path=MAUTIC_ROOT_DIR.'/media/images/anp-editions.json';file_put_contents($path.'.tmp',json_encode($public,JSON_UNESCAPED_UNICODE));chmod($path.'.tmp',0644);rename($path.'.tmp',$path);echo 'READY '.json_encode($public,JSON_UNESCAPED_UNICODE).PHP_EOL;
