<?php
declare(strict_types=1);
$dir='/var/www/html/var/anp-editions';$lock=fopen($dir.'/run.lock','c');if(!flock($lock,LOCK_EX|LOCK_NB))exit(0);
function run(array $args):void {$pipes=[];$proc=proc_open($args,[0=>['pipe','r'],1=>STDOUT,2=>STDERR],$pipes,'/var/www/html');if(!is_resource($proc))throw new RuntimeException('Could not start Mautic CLI');fclose($pipes[0]);$status=proc_close($proc);if($status!==0)throw new RuntimeException('Mautic CLI failed: '.$status);}
run([PHP_BINARY,$dir.'/provision.php']);
if(!is_file($dir.'/enabled'))exit(0);
$state=json_decode(file_get_contents($dir.'/state.json'),true,64,JSON_THROW_ON_ERROR);
foreach($state['editions'] as $edition=>$entry){if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$edition)||strtotime($edition.' 15:30:00 -0300')<=time())continue;$id=(int)$entry['campaign'];if($id<36)throw new RuntimeException('Out of scope campaign');run([PHP_BINARY,'bin/console','mautic:campaigns:rebuild','--campaign-id='.$id,'--no-interaction']);run([PHP_BINARY,'bin/console','mautic:campaigns:trigger','--campaign-id='.$id,'--no-interaction']);}
file_put_contents($dir.'/last-success.json',json_encode(['at'=>gmdate('c'),'editions'=>array_keys($state['editions'])]));
