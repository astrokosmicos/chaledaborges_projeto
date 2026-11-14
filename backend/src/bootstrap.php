<?php
declare(strict_types=1);
ini_set('display_errors','0');
ini_set('session.use_strict_mode','1');
ini_set('session.use_only_cookies','1');
ini_set('session.cookie_httponly','1');
ini_set('session.gc_maxlifetime','7200');
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
if (getenv('APP_ENV') === 'production' && !$https && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') !== 'https') { http_response_code(503); exit('HTTPS obrigatório'); }
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
if ($https) header('Strict-Transport-Security: max-age=31536000');
session_name('chale_session');
session_set_cookie_params(['path'=>'/','secure'=>$https || getenv('APP_ENV')==='production','httponly'=>true,'samesite'=>'Strict']);
session_start();
if (!isset($_SESSION['last_seen'])) $_SESSION['last_seen']=time();
if (time()-(int)$_SESSION['last_seen']>1800) { $_SESSION=[]; session_regenerate_id(true); }
$_SESSION['last_seen']=time();
function db(): PDO { static $pdo; if (!$pdo) $pdo=new PDO('mysql:host='.getenv('DB_HOST').';dbname='.getenv('DB_NAME').';charset=utf8mb4',getenv('DB_USER'),getenv('DB_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]); return $pdo; }
function send(array $data,int $status=200): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit; }
function payload(): array { $raw=file_get_contents('php://input');if(strlen($raw)>32768)send(['error'=>'Dados muito grandes'],413);$b=json_decode($raw,true);if(!is_array($b))send(['error'=>'JSON inválido'],400);return $b; }
function strvalsafe(mixed $v,int $max,bool $required=true): string {if(!is_string($v)||strlen(trim($v))>$max||($required&&trim($v)===''))send(['error'=>'Campo inválido'],422);return trim($v);}
function requireUser(): int {if(empty($_SESSION['uid']))send(['error'=>'Faça login para continuar'],401);return (int)$_SESSION['uid'];}
function requireAdmin(): int {$uid=requireUser();if(($_SESSION['role']??'')!=='admin')send(['error'=>'Sem permissão'],403);return $uid;}
function csrf(): void {if(isset($_SERVER['HTTP_ORIGIN'])){$origin=parse_url($_SERVER['HTTP_ORIGIN'],PHP_URL_HOST);$host=explode(':',$_SERVER['HTTP_HOST']??'')[0];if(!$origin||!hash_equals(strtolower($host),strtolower($origin)))send(['error'=>'Origem não autorizada'],403);}if(!is_string($_SERVER['HTTP_X_CSRF_TOKEN']??null)||!hash_equals($_SESSION['csrf']??'',$_SERVER['HTTP_X_CSRF_TOKEN']))send(['error'=>'Sessão expirada. Atualize a página.'],403);}
function resetCsrf(): string {return $_SESSION['csrf']=bin2hex(random_bytes(32));}
function safeUser(): ?array {if(empty($_SESSION['uid']))return null;$s=db()->prepare('SELECT id,name,email,phone,role FROM users WHERE id=?');$s->execute([$_SESSION['uid']]);$u=$s->fetch();return $u?:null;}
function logEvent(int $order,int $actor,string $event): void {$s=db()->prepare('INSERT INTO order_events(order_id,actor_id,event) VALUES(?,?,?)');$s->execute([$order,$actor,$event]);}
