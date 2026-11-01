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
$public=['version'=>1,'current'=>$registry['current'],'editions'=>[]];
foreach($registry['editions'] as $edition=>$event){
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$edition))throw new RuntimeException('Invalid edition');
 if(($event['status']??'')!=='scheduled')continue;
 $start=new DateTimeImmutable($event['startsAt']);$end=new DateTimeImmutable($event['endsAt']);
 if($end<=$now)continue;
 if($start->setTimezone($brazil)->format('Y-m-d H:i')!==$edition.' 14:00'||$end<=$start||($event['timezone']??'')!=='America/Sao_Paulo')throw new RuntimeException('Invalid date/time');
 if(!preg_match('~^https://chat\.whatsapp\.com/[A-Za-z0-9]+$~D',$event['groupUrl'])||!preg_match('~^https://meet\.google\.com/[a-z-]+$~D',$event['meetUrl']))throw new RuntimeException('Invalid links');
 if(isset($state['editions'][$edition])){
  $entry=$state['editions'][$edition];
  if($entry['config_hash']!==hash('sha256',json_encode($event)))throw new RuntimeException('Existing edition config changed; review required: '.$edition);
 }else{
  $day=(new DateTimeImmutable($edition))->format('d/m/Y');$alias='anp-'.str_replace('-','',$edition).'-inscritos';
  $c->beginTransaction();try {
   $segment=(int)$c->fetchOne('SELECT id FROM mautic_lead_lists WHERE alias=?',[$alias]);
   if(!$segment){$row=fresh($c->fetchAssociative('SELECT * FROM mautic_lead_lists WHERE id=33'),$nowSql);$row=array_merge($row,['name'=>'[ANP '.$day.'] Inscritos','public_name'=>'Webinário A Nova Psicologia — '.$day,'alias'=>$alias,'description'=>'Inscritos exclusivos desta edição; histórico de outras edições preservado.','filters'=>serialize([]),'is_global'=>0,'last_built_date'=>null]);$segment=insertRow($c,'lead_lists',$row);}
   $form=$edition==='2026-11-07'?12:0;
   if(!$form){$row=fresh($c->fetchAssociative('SELECT * FROM mautic_forms WHERE id=12'),$nowSql);$row=array_merge($row,['name'=>'[ANP '.$day.'] Webinário A Nova Psicologia','alias'=>'anp'.str_replace('-','',$edition),'cached_html'=>null,'publish_up'=>null,'publish_down'=>sqlTime($end)]);$form=insertRow($c,'forms',$row);foreach($c->fetchAllAssociative('SELECT * FROM mautic_form_fields WHERE form_id=12 ORDER BY field_order')as $field){$field=fresh($field,$nowSql);$field['form_id']=$form;insertRow($c,'form_fields',$field);}foreach($c->fetchAllAssociative('SELECT * FROM mautic_form_actions WHERE form_id=12 ORDER BY action_order')as $action){$action=fresh($action,$nowSql);$action['form_id']=$form;if($action['type']==='lead.changelist'){$action['name']='['.$day.'] Adicionar inscrito à edição';$action['properties']=serialize(['addToLists'=>[$segment],'removeFromLists'=>[]]);}insertRow($c,'form_actions',$action);}}
   $camp=fresh($c->fetchAssociative('SELECT * FROM mautic_campaigns WHERE id=35'),$nowSql);$camp=array_merge($camp,['name'=>'[ANP '.$day.'] Aquecimento — 8 e-mails','description'=>'DX após inscrição; D5 a D1 às 14h; D0 às 9h e 13h de Brasília. Segmento exclusivo; lembretes expiram. Automação ANP v1.','is_published'=>0,'allow_restart'=>0,'publish_up'=>null,'publish_down'=>sqlTime($end),'canvas_settings'=>serialize([])]);$campaign=insertRow($c,'campaigns',$camp);
   $c->insert('mautic_campaign_leadlist_xref',['campaign_id'=>$campaign,'leadlist_id'=>$segment]);$c->insert('mautic_campaign_form_xref',['campaign_id'=>$campaign,'form_id'=>$form]);
   $ids=[];$nodes=[['id'=>'lists','positionX'=>'200','positionY'=>'40'],['id'=>'forms','positionX'=>'600','positionY'=>'40']];$connections=[];$eventTemplate=$c->fetchAssociative('SELECT * FROM mautic_campaign_events WHERE id=255');$emailTemplate=$c->fetchAssociative('SELECT * FROM mautic_emails WHERE id=66');$slots=schedule($edition);
   foreach($templates as $i=>$t){$slot=$slots[$i];[$html,$plain]=renderEmail($t,$edition,$event);$email=fresh($emailTemplate,$nowSql);$email=array_merge($email,['name'=>'[ANP '.$day.'] '.$t['key'],'description'=>'Modelo reutilizável sem datas no conteúdo.','subject'=>$t['subject'],'custom_html'=>$html,'plain_text'=>$plain,'content'=>null,'dynamic_content'=>serialize([]),'utm_tags'=>serialize(['utmSource'=>'mautic','utmMedium'=>'email','utmCampaign'=>'anp_'.str_replace('-','',$edition),'utmContent'=>$t['key']]),'is_published'=>1,'publish_up'=>$slot['at']?sqlTime($slot['at']):null,'publish_down'=>sqlTime($slot['until']),'read_count'=>0,'sent_count'=>0,'variant_sent_count'=>0,'variant_read_count'=>0,'revision'=>1,'variant_parent_id'=>null,'translation_parent_id'=>null]);$emailId=insertRow($c,'emails',$email);
    $ev=fresh($eventTemplate,$nowSql);$ev=array_merge($ev,['campaign_id'=>$campaign,'parent_id'=>null,'name'=>$t['key'].' — '.$t['subject'],'event_order'=>$i+1,'trigger_mode'=>$i===0?'immediate':'date','trigger_date'=>$slot['at']?sqlTime($slot['at']):null,'trigger_interval'=>0,'channel_id'=>$emailId,'temp_id'=>'anp'.$campaign.'_'.$t['key']]);$p=unserialize($eventTemplate['properties'],['allowed_classes'=>['DateTime']]);foreach(['id','tempId','contactLog','changes']as $key)unset($p[$key]);$p=array_merge($p,['name'=>$ev['name'],'order'=>$i,'email'=>(string)$emailId,'channelId'=>$emailId,'campaignId'=>(string)$campaign,'triggerMode'=>$ev['trigger_mode'],'triggerDate'=>$slot['at']?new DateTime(sqlTime($slot['at']),new DateTimeZone('UTC')):null,'triggerInterval'=>0,'email_type'=>'marketing','properties'=>['email'=>(string)$emailId,'email_type'=>'marketing','priority'=>'2','attempts'=>'3'],'anchor'=>'leadsource','anchorEventType'=>'source']);$ev['properties']=serialize($p);$evId=insertRow($c,'campaign_events',$ev);$p['id']=$evId;$c->update('mautic_campaign_events',['properties'=>serialize($p)],['id'=>$evId]);$ids[$t['key']]=['email'=>$emailId,'event'=>$evId,'at'=>$ev['trigger_date'],'until'=>$email['publish_down']];$nodes[]=['id'=>(string)$evId,'positionX'=>(string)(50+$i*260),'positionY'=>'230'];foreach(['lists','forms']as $source)$connections[]=['sourceId'=>$source,'targetId'=>(string)$evId,'anchors'=>['source'=>'leadsource','target'=>'top']];
   }
   $c->update('mautic_campaigns',['canvas_settings'=>serialize(['nodes'=>$nodes,'connections'=>$connections])],['id'=>$campaign]);$c->commit();
  }catch(Throwable $e){$c->rollBack();throw $e;}
  $entry=['segment'=>$segment,'form'=>$form,'campaign'=>$campaign,'emails'=>$ids,'config_hash'=>hash('sha256',json_encode($event))];
  if($selfTest){
   if($form===12||$segment===33||count($ids)!==8)throw new RuntimeException('Future edition not isolated');
   $action=$c->fetchOne("SELECT properties FROM mautic_form_actions WHERE form_id=? AND type='lead.changelist'",[$form]);if(unserialize($action)['addToLists']!==[$segment])throw new RuntimeException('Future action wrong segment');
   $model=$container->get('mautic.form.model.form');$generated=$model->generateHtml($model->getEntity($form));if(strpos($generated,'mauticform[formId]')===false)throw new RuntimeException('Future form HTML failed');
   if($ids['D5']['at']!=='2030-11-02 17:00:00'||$ids['D0_09']['at']!=='2030-11-07 12:00:00'||$ids['D0_13']['at']!=='2030-11-07 16:00:00')throw new RuntimeException('Future schedule wrong');
   $c->rollBack();if($c->fetchOne('SELECT id FROM mautic_lead_lists WHERE alias=?',[$alias]))throw new RuntimeException('Test did not roll back');echo 'PASS future edition creates isolated segment, native form, campaign and eight emails; correct schedule; all test rows rolled back'.PHP_EOL;exit(0);
  }
  $state['editions'][$edition]=$entry;file_put_contents($stateFile.'.tmp',json_encode($state,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));rename($stateFile.'.tmp',$stateFile);
  echo 'CREATED '.$edition.' '.json_encode($entry).PHP_EOL;
 }
 // Use the native model to build the result table and cached form HTML.
 $model=$container->get('mautic.form.model.form');$formEntity=$model->getEntity($entry['form']);$model->createTableSchema($formEntity);$html=$model->generateHtml($formEntity);
 $dom=new DOMDocument();@$dom->loadHTML($html);$xpath=new DOMXPath($dom);$formName=$xpath->evaluate('string(//input[@name="mauticform[formName]"]/@value)');if(!$formName)throw new RuntimeException('Missing generated form name');
 $public['editions'][$edition]=['formId'=>$entry['form'],'formName'=>$formName,'segmentId'=>$entry['segment']];
 // Only campaigns explicitly created by this provisioner may be enabled.
 if(is_file($dir.'/enabled') && empty($entry['activated'])) {
  $c->update('mautic_campaigns',['is_published'=>1],['id'=>$entry['campaign']]);
  $state['editions'][$edition]['activated']=true;
  file_put_contents($stateFile.'.tmp',json_encode($state,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));rename($stateFile.'.tmp',$stateFile);
 }
}
$path=MAUTIC_ROOT_DIR.'/media/images/anp-editions.json';file_put_contents($path.'.tmp',json_encode($public,JSON_UNESCAPED_UNICODE));chmod($path.'.tmp',0644);rename($path.'.tmp',$path);
echo 'READY '.json_encode($public,JSON_UNESCAPED_UNICODE).PHP_EOL;
