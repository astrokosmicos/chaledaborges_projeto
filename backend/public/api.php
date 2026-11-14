<?php
require '/var/www/app/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($path === '/api/session' && $method === 'GET') {
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
        send([
            'csrf' => $_SESSION['csrf'],
            'user' => safeUser()
        ]);
    }

    if ($path === '/api/products' && $method === 'GET') {
        send([
            'products' => db()->query(
                'SELECT id,category,name,description,price_cents,active
                 FROM products
                 WHERE active=1
                 ORDER BY id'
            )->fetchAll()
        ]);
    }

    if ($path === '/api/settings' && $method === 'GET') {
        $s = db()->query(
            'SELECT setting_value FROM settings WHERE setting_key="business"'
        );
        $v = $s->fetchColumn();

        send([
            'business' => $v ? json_decode($v, true) : null
        ]);
    }

    if ($path === '/api/settings' && $method === 'PATCH') {
        requireAdmin();
        csrf();

        $v = payload();
        $business = $v['business'] ?? null;

        if (!is_array($business)) {
            send(['error' => 'Dados inválidos'], 422);
        }

        $fields = [
            'name' => 120,
            'tagline' => 200,
            'about' => 1000,
            'eta' => 100,
            'whatsapp' => 30
        ];

        $clean = [];

        foreach ($fields as $k => $max) {
            $clean[$k] = strvalsafe($business[$k] ?? '', $max, false);
        }

        $sched = $business['schedule'] ?? [];

        if (
            !is_array($sched) ||
            !is_array($sched['days'] ?? null) ||
            count($sched['days']) > 7
        ) {
            send(['error' => 'Horários inválidos'], 422);
        }

        foreach ($sched['days'] as $d) {
            if (!is_int($d) || $d < 0 || $d > 6) {
                send(['error' => 'Dias inválidos'], 422);
            }
        }

        foreach (['open', 'close'] as $k) {
            if (!preg_match(
                '/^([01][0-9]|2[0-3]):[0-5][0-9]$/',
                $sched[$k] ?? ''
            )) {
                send(['error' => 'Horário inválido'], 422);
            }
        }

        $clean['schedule'] = [
            'days' => array_values(array_unique($sched['days'])),
            'open' => $sched['open'],
            'close' => $sched['close']
        ];

        db()->prepare(
            'INSERT INTO settings(setting_key,setting_value)
             VALUES("business",?)
             ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)'
        )->execute([
            json_encode($clean, JSON_UNESCAPED_UNICODE)
        ]);

        send(['ok' => true]);
    }

    if ($path === '/api/areas/manage' && $method === 'GET') {
        requireAdmin();

        send([
            'areas' => db()->query(
                'SELECT * FROM delivery_areas ORDER BY name'
            )->fetchAll()
        ]);
    }

    if ($path === '/api/areas' && $method === 'POST') {
        requireAdmin();
        csrf();

        $v = payload();

        $id = strvalsafe($v['id'] ?? null, 60);
        $name = strvalsafe($v['name'] ?? null, 100);
        $fee = $v['fee_cents'] ?? null;
        $min = $v['min_minutes'] ?? null;
        $max = $v['max_minutes'] ?? null;

        if (
            !is_int($fee) ||
            $fee < 0 ||
            $fee > 100000 ||
            !is_int($min) ||
            !is_int($max) ||
            $min < 1 ||
            $max < $min ||
            $max > 500
        ) {
            send(['error' => 'Taxa ou prazo inválido'], 422);
        }

        try {
            db()->prepare(
                'INSERT INTO delivery_areas
                 (id,name,fee_cents,min_minutes,max_minutes)
                 VALUES(?,?,?,?,?)'
            )->execute([$id, $name, $fee, $min, $max]);

        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                send(['error' => 'Bairro já cadastrado'], 409);
            }

            throw $e;
        }

        send(['ok' => true], 201);
    }

    if (
        preg_match('~^/api/areas/([a-zA-Z0-9_-]+)$~', $path, $m) &&
        $method === 'PATCH'
    ) {
        requireAdmin();
        csrf();

        $v = payload();

        $name = strvalsafe($v['name'] ?? null, 100);
        $fee = $v['fee_cents'] ?? null;
        $min = $v['min_minutes'] ?? null;
        $max = $v['max_minutes'] ?? null;
        $active = $v['active'] ?? null;

        if (
            !is_int($fee) ||
            $fee < 0 ||
            $fee > 100000 ||
            !is_int($min) ||
            !is_int($max) ||
            $min < 1 ||
            $max < $min ||
            $max > 500 ||
            !is_bool($active)
        ) {
            send(['error' => 'Dados inválidos'], 422);
        }

        db()->prepare(
            'UPDATE delivery_areas
             SET name=?,fee_cents=?,min_minutes=?,max_minutes=?,active=?
             WHERE id=?'
        )->execute([
            $name,
            $fee,
            $min,
            $max,
            (int)$active,
            $m[1]
        ]);

        send(['ok' => true]);
    }

    if ($path === '/api/areas' && $method === 'GET') {
        send([
            'areas' => db()->query(
                'SELECT id,name,fee_cents,min_minutes,max_minutes
                 FROM delivery_areas
                 WHERE active=1
                 ORDER BY fee_cents,name'
            )->fetchAll()
        ]);
    }

    if ($path === '/api/register' && $method === 'POST') {
        csrf();

        $ip = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');

        $lim = db()->prepare(
            'SELECT COUNT(*)
             FROM login_attempts
             WHERE ip_digest=?
             AND created_at>DATE_SUB(NOW(), INTERVAL 1 HOUR)'
        );

        $lim->execute([$ip]);

        if ((int)$lim->fetchColumn() >= 30) {
            send([
                'error' => 'Muitas tentativas. Tente novamente mais tarde.'
            ], 429);
        }

        $b = payload();

        $name = strvalsafe($b['name'] ?? null, 120);
        $email = strtolower(strvalsafe($b['email'] ?? null, 190));
        $phone = strvalsafe($b['phone'] ?? '', 30, false);
        $pass = $b['password'] ?? null;

        if (
            !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            !is_string($pass) ||
            strlen($pass) < 12 ||
            strlen($pass) > 256
        ) {
            send([
                'error' => 'E-mail inválido ou senha com menos de 12 caracteres'
            ], 422);
        }

        db()->prepare(
            'INSERT INTO login_attempts(email_digest,ip_digest)
             VALUES(?,?)'
        )->execute([
            hash('sha256', 'registration:' . $email),
            $ip
        ]);

        try {
            $s = db()->prepare(
                'INSERT INTO users(name,email,phone,password_hash)
                 VALUES(?,?,?,?)'
            );

            $s->execute([
                $name,
                $email,
                $phone,
                password_hash($pass, PASSWORD_DEFAULT)
            ]);

        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                send(['error' => 'E-mail já cadastrado'], 409);
            }

            throw $e;
        }

        session_regenerate_id(true);

        $_SESSION['uid'] = (int)db()->lastInsertId();
        $_SESSION['role'] = 'customer';

        send([
            'user' => safeUser(),
            'csrf' => resetCsrf()
        ], 201);
    }

    if ($path === '/api/login' && $method === 'POST') {
        csrf();

        $b = payload();

        $email = strtolower(trim((string)($b['email'] ?? '')));
        $pass = (string)($b['password'] ?? '');

        if (strlen($email) > 190 || strlen($pass) > 256) {
            send(['error' => 'Credenciais inválidas'], 401);
        }

        $digest = hash('sha256', $email);
        $ip = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');

        $s = db()->prepare(
            'SELECT COUNT(*)
             FROM login_attempts
             WHERE (email_digest=? OR ip_digest=?)
             AND created_at>DATE_SUB(NOW(), INTERVAL 15 MINUTE)'
        );

        $s->execute([$digest, $ip]);

        if ((int)$s->fetchColumn() >= 12) {
            send([
                'error' => 'Muitas tentativas. Tente novamente em 15 minutos.'
            ], 429);
        }

        $s = db()->prepare(
            'SELECT id,role,password_hash FROM users WHERE email=?'
        );

        $s->execute([$email]);
        $u = $s->fetch();

        if (!$u || !password_verify($pass, $u['password_hash'])) {
            db()->prepare(
                'INSERT INTO login_attempts(email_digest,ip_digest)
                 VALUES(?,?)'
            )->execute([$digest, $ip]);

            send(['error' => 'E-mail ou senha incorretos'], 401);
        }

        db()->prepare(
            'DELETE FROM login_attempts WHERE email_digest=?'
        )->execute([$digest]);

        session_regenerate_id(true);

        $_SESSION['uid'] = (int)$u['id'];
        $_SESSION['role'] = $u['role'];

        send([
            'user' => safeUser(),
            'csrf' => resetCsrf()
        ]);
    }

    if ($path === '/api/logout' && $method === 'POST') {
        csrf();

        $_SESSION = [];
        session_destroy();

        send(['ok' => true]);
    }
if ($path === '/api/orders' && $method === 'POST') {
        $uid = requireUser();
        csrf();

        $b = payload();

        $mode = $b['fulfillment'] ?? null;
        $payment = $b['payment'] ?? null;

        if (
            !in_array($mode, ['delivery', 'pickup'], true) ||
            !in_array($payment, ['pix', 'cash'], true) ||
            !is_array($b['items'] ?? null) ||
            count($b['items']) < 1 ||
            count($b['items']) > 60
        ) {
            send(['error' => 'Pedido inválido'], 422);
        }

        $name = strvalsafe($b['customer_name'] ?? null, 120);
        $phone = strvalsafe($b['customer_phone'] ?? null, 30);
        $notes = strvalsafe($b['notes'] ?? '', 1000, false);

        $area = null;
        $address = null;
        $fee = 0;

        // verifica o bairro e a taxa de entrega
        if ($mode === 'delivery') {
            $area = strvalsafe($b['area_id'] ?? null, 60);
            $address = strvalsafe($b['address'] ?? null, 400);

            $s = db()->prepare(
                'SELECT fee_cents
                 FROM delivery_areas
                 WHERE id=? AND active=1'
            );

            $s->execute([$area]);
            $v = $s->fetchColumn();

            if ($v === false) {
                send(['error' => 'Bairro indisponível'], 422);
            }

            $fee = (int)$v;
        }

        // confere as quantidades dos produtos
        $quantities = [];

        foreach ($b['items'] as $i) {
            if (
                !is_array($i) ||
                !is_int($i['product_id'] ?? null) ||
                !is_int($i['quantity'] ?? null) ||
                $i['quantity'] < 1 ||
                $i['quantity'] > 30
            ) {
                send(['error' => 'Quantidade inválida'], 422);
            }

            $id = $i['product_id'];

            $quantities[$id] =
                ($quantities[$id] ?? 0) + $i['quantity'];

            if ($quantities[$id] > 30) {
                send(['error' => 'Quantidade excedida'], 422);
            }
        }

        $pdo = db();
        $pdo->beginTransaction();

        try {
            $lines = [];
            $subtotal = 0;

            $s = $pdo->prepare(
                'SELECT id,name,price_cents,category
                 FROM products
                 WHERE id=? AND active=1'
            );

            // busca os produtos e calcula o subtotal
            foreach ($quantities as $id => $qty) {
                $s->execute([$id]);
                $p = $s->fetch();

                if (!$p) {
                    $pdo->rollBack();

                    send([
                        'error' => 'Produto indisponível'
                    ], 422);
                }

                if (in_array(
                    $p['category'],
                    [
                        'Cervejas',
                        'Vinhos Finos',
                        'Vinhos Regionais',
                        'Espumantes',
                        'Espumantes Regionais'
                    ],
                    true
                )) {
                    $pdo->rollBack();

                    send([
                        'error' => 'Venda online de bebidas alcoólicas indisponível até implementação da verificação de idade'
                    ], 422);
                }

                $subtotal +=
                    (int)$p['price_cents'] * $qty;

                $lines[] = [
                    $p['id'],
                    $p['name'],
                    $p['price_cents'],
                    $qty
                ];
            }

            // calcula o total incluindo a entrega
            $total = $subtotal + $fee;

            if ($total > 100000000) {
                $pdo->rollBack();

                send(['error' => 'Total excedido'], 422);
            }

            // verifica o valor informado para troco
            $change = null;

            if (
                $payment === 'cash' &&
                isset($b['change_for_cents'])
            ) {
                $change = $b['change_for_cents'];

                if (
                    !is_int($change) ||
                    $change < $total ||
                    $change > 100000000
                ) {
                    $pdo->rollBack();

                    send(['error' => 'Troco inválido'], 422);
                }
            }

            // registra o pedido no banco de dados
            $s = $pdo->prepare(
                'INSERT INTO orders
                 (user_id,customer_name,customer_phone,
                  fulfillment,area_id,address,notes,
                  payment,change_for_cents,subtotal_cents,
                  fee_cents,total_cents)
                 VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
            );

            $s->execute([
                $uid,
                $name,
                $phone,
                $mode,
                $area,
                $address,
                $notes,
                $payment,
                $change,
                $subtotal,
                $fee,
                $total
            ]);

            $oid = (int)$pdo->lastInsertId();

            // registra os itens pertencentes ao pedido
            $s = $pdo->prepare(
                'INSERT INTO order_items
                 (order_id,product_id,product_name,
                  unit_price_cents,quantity)
                 VALUES(?,?,?,?,?)'
            );

            foreach ($lines as $line) {
                $s->execute([$oid, ...$line]);
            }

            logEvent($oid, $uid, 'received');

            // confirma a gravação de todos os dados
            $pdo->commit();

            send([
                'id' => $oid,
                'total_cents' => $total
            ], 201);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    // consulta os pedidos cadastrados
    if ($path === '/api/orders' && $method === 'GET') {
        $uid = requireUser();

        $isAdmin = ($_SESSION['role'] ?? '') === 'admin';

        $s = db()->prepare(
            'SELECT o.*
             FROM orders o ' .
            ($isAdmin ? '' : 'WHERE o.user_id=? ') .
            'ORDER BY o.id DESC LIMIT 300'
        );

        $s->execute($isAdmin ? [] : [$uid]);

        $orders = $s->fetchAll();

        $items = db()->prepare(
            'SELECT product_name,unit_price_cents,quantity
             FROM order_items
             WHERE order_id=?'
        );

        foreach ($orders as &$o) {
            $items->execute([$o['id']]);
            $o['items'] = $items->fetchAll();
        }

        unset($o);

        send(['orders' => $orders]);
    }
    // relatório geral de vendas
    if ($path === '/api/admin/reports' && $method === 'GET') {
        requireAdmin();

        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        if (
            !is_string($from) ||
            !is_string($to) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ||
            !checkdate((int)substr($from, 5, 2), (int)substr($from, 8, 2), (int)substr($from, 0, 4)) ||
            !checkdate((int)substr($to, 5, 2), (int)substr($to, 8, 2), (int)substr($to, 0, 4)) ||
            $from > $to ||
            strtotime($to) - strtotime($from) > 366 * 86400
        ) {
            send(['error' => 'Período inválido (máximo 366 dias)'], 422);
        }

        $pdo = db();

        // calcula quantidade de pedidos e faturamento
        $q = $pdo->prepare(
            "SELECT
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_cents), 0) AS revenue_cents,
                COALESCE(AVG(total_cents), 0) AS average_cents
             FROM orders
             WHERE created_at >= ?
               AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
               AND status = 'completed'"
        );

        $q->execute([$from, $to]);
        $summary = $q->fetch();

        // agrupa os pedidos por status
        $q = $pdo->prepare(
            'SELECT status, COUNT(*) AS total
             FROM orders
             WHERE created_at >= ?
               AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
             GROUP BY status'
        );

        $q->execute([$from, $to]);
        $byStatus = $q->fetchAll();

        // consulta os produtos mais vendidos
        $q = $pdo->prepare(
            "SELECT
                oi.product_name,
                SUM(oi.quantity) AS quantity,
                SUM(oi.unit_price_cents * oi.quantity) AS revenue_cents
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= ?
               AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
               AND o.status = 'completed'
             GROUP BY oi.product_name
             ORDER BY quantity DESC
             LIMIT 10"
        );

        $q->execute([$from, $to]);
        $topProducts = $q->fetchAll();

        send([
            'summary' => $summary,
            'by_status' => $byStatus,
            'top_products' => $topProducts
        ]);
    }

    // pesquisa de pedidos com filtros
    if ($path === '/api/admin/orders/search' && $method === 'GET') {
        requireAdmin();

        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        if (
            !is_string($from) ||
            !is_string($to) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ||
            !checkdate((int)substr($from, 5, 2), (int)substr($from, 8, 2), (int)substr($from, 0, 4)) ||
            !checkdate((int)substr($to, 5, 2), (int)substr($to, 8, 2), (int)substr($to, 0, 4)) ||
            $from > $to ||
            strtotime($to) - strtotime($from) > 366 * 86400
        ) {
            send(['error' => 'Período inválido (máximo 366 dias)'], 422);
        }

        $fulfillment = $_GET['fulfillment'] ?? '';
        $status = $_GET['status'] ?? '';
        $customer = trim((string)($_GET['customer'] ?? ''));

        $page = filter_var(
            $_GET['page'] ?? 1,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 1000000]]
        );

        if (
            $page === false ||
            !in_array($fulfillment, ['', 'delivery', 'pickup'], true) ||
            !in_array($status, ['', 'received', 'preparing', 'ready', 'completed', 'cancelled'], true) ||
            mb_strlen($customer) > 100
        ) {
            send(['error' => 'Filtro inválido'], 422);
        }

        $where = 'o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
        $args = [$from, $to];

        if ($fulfillment !== '') {
            $where .= ' AND o.fulfillment=?';
            $args[] = $fulfillment;
        }

        if ($status !== '') {
            $where .= ' AND o.status=?';
            $args[] = $status;
        }

        if ($customer !== '') {
            $where .= ' AND (o.customer_name LIKE ? OR u.email LIKE ?)';
            $term = '%' . addcslashes($customer, '%_\\') . '%';
            $args[] = $term;
            $args[] = $term;
        }

        $pdo = db();

        $q = $pdo->prepare(
            "SELECT COUNT(*)
             FROM orders o
             JOIN users u ON u.id=o.user_id
             WHERE $where"
        );

        $q->execute($args);
        $count = (int)$q->fetchColumn();

        $offset = ($page - 1) * 50;

        $q = $pdo->prepare(
            "SELECT
                o.id,
                o.created_at,
                o.customer_name,
                o.fulfillment,
                o.status,
                o.payment,
                o.payment_status,
                o.subtotal_cents,
                o.fee_cents,
                o.total_cents
             FROM orders o
             JOIN users u ON u.id=o.user_id
             WHERE $where
             ORDER BY o.created_at DESC, o.id DESC
             LIMIT 50 OFFSET $offset"
        );

        $q->execute($args);

        send([
            'page' => $page,
            'pages' => max(1, (int)ceil($count / 50)),
            'total' => $count,
            'orders' => $q->fetchAll()
        ]);
    }

    // exporta pedidos para uma planilha CSV
    if ($path === '/api/admin/reports/export' && $method === 'GET') {
        requireAdmin();

        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        if (
            !is_string($from) ||
            !is_string($to) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ||
            !checkdate((int)substr($from, 5, 2), (int)substr($from, 8, 2), (int)substr($from, 0, 4)) ||
            !checkdate((int)substr($to, 5, 2), (int)substr($to, 8, 2), (int)substr($to, 0, 4)) ||
            $from > $to ||
            strtotime($to) - strtotime($from) > 366 * 86400
        ) {
            send(['error' => 'Período inválido'], 422);
        }

        header('Content-Type: text/csv; charset=utf-8');
        header(
            'Content-Disposition: attachment; filename="pedidos_' .
            $from . '_a_' . $to . '.csv"'
        );
        header('Cache-Control: no-store');

        $out = fopen('php://output', 'w');

        // adiciona suporte a acentos no Excel
        fwrite($out, "\xEF\xBB\xBF");

        fputcsv($out, [
            'Pedido',
            'Data',
            'Cliente',
            'Tipo',
            'Status',
            'Pagamento',
            'Confirmado',
            'Subtotal (R$)',
            'Entrega (R$)',
            'Total (R$)'
        ], ';');

        $q = db()->prepare(
            'SELECT
                id,
                created_at,
                customer_name,
                fulfillment,
                status,
                payment,
                payment_status,
                subtotal_cents,
                fee_cents,
                total_cents
             FROM orders
             WHERE created_at >= ?
               AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
             ORDER BY id'
        );

        $q->execute([$from, $to]);

        while ($r = $q->fetch()) {
            // evita interpretação de nomes como fórmulas
            foreach (['customer_name'] as $key) {
                $r[$key] = preg_replace(
                    '/^[\s]*[=+@\-]/u',
                    "'",
                    $r[$key]
                );
            }

            // converte valores de centavos para reais
            foreach (
                ['subtotal_cents', 'fee_cents', 'total_cents'] as $key
            ) {
                $r[$key] = number_format(
                    ((int)$r[$key]) / 100,
                    2,
                    ',',
                    ''
                );
            }

            fputcsv($out, array_values($r), ';');
        }

        fclose($out);
        exit;
    }
    // cadastra um novo produto no cardápio
    if ($path === '/api/products' && $method === 'POST') {
        requireAdmin();
        csrf();

        $v = payload();

        $name = strvalsafe($v['name'] ?? null, 200);
        $category = strvalsafe($v['category'] ?? null, 100);
        $desc = strvalsafe($v['description'] ?? '', 2000, false);
        $price = $v['price_cents'] ?? null;

        if (
            !is_int($price) ||
            $price < 0 ||
            $price > 10000000
        ) {
            send(['error' => 'Preço inválido'], 422);
        }

        $id = (int)db()->query(
            'SELECT COALESCE(MAX(id),0)+1 FROM products'
        )->fetchColumn();

        db()->prepare(
            'INSERT INTO products
             (id,name,category,description,price_cents,active)
             VALUES(?,?,?,?,?,1)'
        )->execute([
            $id,
            $name,
            $category,
            $desc,
            $price
        ]);

        send(['id' => $id], 201);
    }

    // lista todos os produtos para o adm
    if ($path === '/api/products/manage' && $method === 'GET') {
        requireAdmin();

        send([
            'products' => db()->query(
                'SELECT * FROM products ORDER BY id'
            )->fetchAll()
        ]);
    }

    // atualiza as infos de um produto
    if (
        preg_match('~^/api/products/([0-9]+)$~', $path, $m) &&
        $method === 'PATCH'
    ) {
        requireAdmin();
        csrf();

        $b = payload();
        $id = (int)$m[1];

        $s = db()->prepare(
            'SELECT * FROM products WHERE id=?'
        );

        $s->execute([$id]);
        $old = $s->fetch();

        if (!$old) {
            send(['error' => 'Produto inexistente'], 404);
        }

        $name = strvalsafe($b['name'] ?? null, 200);
        $category = strvalsafe($b['category'] ?? null, 100);
        $desc = strvalsafe($b['description'] ?? '', 2000, false);
        $price = $b['price_cents'] ?? null;
        $active = $b['active'] ?? null;

        if (
            !is_int($price) ||
            $price < 0 ||
            $price > 10000000 ||
            !is_bool($active)
        ) {
            send([
                'error' => 'Preço ou disponibilidade inválidos'
            ], 422);
        }

        db()->prepare(
            'UPDATE products
             SET name=?,category=?,description=?,price_cents=?,active=?
             WHERE id=?'
        )->execute([
            $name,
            $category,
            $desc,
            $price,
            (int)$active,
            $id
        ]);

        send(['ok' => true]);
    }

    // atualiza o status de um pedido
    if (
        preg_match(
            '~^/api/orders/([0-9]+)/status$~',
            $path,
            $m
        ) &&
        $method === 'PATCH'
    ) {
        $uid = requireAdmin();
        csrf();

        $b = payload();

        // mudanças de status que são permitidas
        $allowed = [
            'received' => ['preparing', 'cancelled'],
            'preparing' => ['ready', 'cancelled'],
            'ready' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => []
        ];

        $pdo = db();
        $pdo->beginTransaction();

        try {
            $s = $pdo->prepare(
                'SELECT status FROM orders WHERE id=? FOR UPDATE'
            );

            $s->execute([(int)$m[1]]);
            $old = $s->fetchColumn();

            if ($old === false) {
                $pdo->rollBack();

                send([
                    'error' => 'Pedido não encontrado'
                ], 404);
            }

            if (
                !in_array(
                    $b['status'] ?? null,
                    $allowed[$old],
                    true
                )
            ) {
                $pdo->rollBack();

                send([
                    'error' => 'Mudança de status inválida'
                ], 422);
            }

            $pdo->prepare(
                'UPDATE orders SET status=? WHERE id=?'
            )->execute([
                $b['status'],
                (int)$m[1]
            ]);

            logEvent(
                (int)$m[1],
                $uid,
                $b['status']
            );

            $pdo->commit();

            send(['ok' => true]);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    // confirmação de pagamento
    if (
        preg_match(
            '~^/api/orders/([0-9]+)/payment$~',
            $path,
            $m
        ) &&
        $method === 'PATCH'
    ) {
        $uid = requireAdmin();
        csrf();

        $s = db()->prepare(
            "UPDATE orders
             SET payment_status='confirmed'
             WHERE id=?
               AND payment_status='pending'"
        );

        $s->execute([(int)$m[1]]);

        if (!$s->rowCount()) {
            send([
                'error' => 'Pedido inexistente ou já pago'
            ], 404);
        }

        logEvent(
            (int)$m[1],
            $uid,
            'payment_confirmed'
        );

        send(['ok' => true]);
    }

    // retorna erro quando a rota solicitada não existe
    send(['error' => 'Rota não encontrada'], 404);

// trata erros inesperados do servidor
} catch (Throwable $e) {
    error_log((string)$e);

    send([
        'error' => 'Erro interno. Consulte os logs do servidor.'
    ], 500);
}