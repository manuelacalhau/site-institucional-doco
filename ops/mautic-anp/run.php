<?php
declare(strict_types=1);
$dir='/var/www/html/var/anp-editions';$lock=fopen($dir.'/run.lock','c');if(!flock($lock,LOCK_EX|LOCK_NB))exit(0);
function run(array $args):void {$pipes=[];$proc=proc_open($args,[0=>['pipe','r'],1=>STDOUT,2=>STDERR],$pipes,'/var/www/html');if(!is_resource($proc))throw new RuntimeException('Could not start Mautic CLI');fclose($pipes[0]);$status=proc_close($proc);if($status!==0)throw new RuntimeException('Mautic CLI failed: '.$status);}
run([PHP_BINARY,$dir.'/provision.php']);if(!is_file($dir.'/enabled'))exit(0);
$state=json_decode(file_get_contents($dir.'/state.json'),true,64,JSON_THROW_ON_ERROR);
define('MAUTIC_ROOT_DIR','/var/www/html');define('IN_MAUTIC_CONSOLE',1);require MAUTIC_ROOT_DIR.'/autoload.php';$k=new AppKernel('prod',false);$k->boot();$c=$k->getContainer()->get('doctrine')->getConnection();
foreach($state['editions'] as $entry){if(($entry['layout']??0)!==2)throw new RuntimeException('Unmigrated email layout');foreach($entry['emails'] as $key=>$message){if($key==='DX')continue;$id=(int)$message['email'];$active=$c->fetchOne("SELECT id FROM mautic_emails WHERE id=? AND email_type='list' AND is_published=1 AND (publish_up IS NULL OR publish_up<=UTC_TIMESTAMP()) AND (publish_down IS NULL OR publish_down>UTC_TIMESTAMP())",[$id]);if($active)run([PHP_BINARY,'bin/console','mautic:broadcasts:send','--channel=email','--id='.$id,'--no-interaction']);}}
file_put_contents($dir.'/last-success.json',json_encode(['at'=>gmdate('c'),'layout'=>2,'editions'=>array_keys($state['editions'])]));
