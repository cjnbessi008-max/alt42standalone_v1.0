# Code Examples

## Detected Inefficiency Patterns

### 1. Loop Invariant Calculation

**Inefficient:**
```php
<?php
for ($i = 0; $i < count($users); $i++) {
    $taxRate = 0.08;  // Doesn't change!
    $discount = calculateDiscount();  // Called every iteration!
    $total = $users[$i]['price'] * (1 + $taxRate) * (1 - $discount);
}
?>
```

**Optimized:**
```php
<?php
$taxRate = 0.08;  // Calculate once
$discount = calculateDiscount();  // Call once

for ($i = 0; $i < count($users); $i++) {
    $total = $users[$i]['price'] * (1 + $taxRate) * (1 - $discount);
}
?>
```

**Detection:**
- Type: `loop_invariant`
- Severity: `warning`
- Impact: O(n) → O(1) for invariant calculation

---

### 2. Database Query in Loop (N+1 Problem)

**Inefficient:**
```php
<?php
foreach ($orders as $order) {
    $query = "SELECT * FROM products WHERE id = " . $order['product_id'];
    $product = mysql_query($query);  // N queries!
}
?>
```

**Optimized:**
```php
<?php
// Collect all product IDs
$productIds = array_column($orders, 'product_id');

// Single query with IN clause
$ids = implode(',', $productIds);
$query = "SELECT * FROM products WHERE id IN ($ids)";
$products = mysql_query($query);

// Create lookup array
$productMap = [];
while ($row = mysql_fetch_assoc($products)) {
    $productMap[$row['id']] = $row;
}

// Use cached products
foreach ($orders as $order) {
    $product = $productMap[$order['product_id']];
}
?>
```

**Detection:**
- Type: `db_query_in_loop`
- Severity: `critical`
- Impact: O(n) queries → O(1) query

---

### 3. Nested Loops

**Inefficient:**
```php
<?php
foreach ($users as $user) {
    foreach ($orders as $order) {
        if ($order['user_id'] == $user['id']) {
            // Process order
        }
    }
}
?>
```

**Optimized:**
```php
<?php
// Group orders by user_id
$ordersByUser = [];
foreach ($orders as $order) {
    $ordersByUser[$order['user_id']][] = $order;
}

// Single loop
foreach ($users as $user) {
    $userOrders = $ordersByUser[$user['id']] ?? [];
    foreach ($userOrders as $order) {
        // Process order
    }
}
?>
```

**Detection:**
- Type: `nested_loop`
- Severity: `critical` (for 3+ levels)
- Impact: O(n²) → O(n)

---

### 4. String Concatenation in Loop

**Inefficient:**
```php
<?php
$result = "";
foreach ($items as $item) {
    $result .= $item['name'] . ",";  // String reallocation each time
}
?>
```

**Optimized:**
```php
<?php
$parts = [];
foreach ($items as $item) {
    $parts[] = $item['name'];
}
$result = implode(",", $parts);
?>
```

**Detection:**
- Type: `string_concat_in_loop`
- Severity: `warning`
- Impact: O(n²) → O(n)

---

### 5. Inefficient Array Search

**Inefficient:**
```php
<?php
$allowedIds = [1, 5, 10, 15, 20, 25];

foreach ($users as $user) {
    if (in_array($user['id'], $allowedIds)) {  // O(m) each iteration
        // Process user
    }
}
?>
```

**Optimized:**
```php
<?php
// Convert to hash map
$allowedIds = [1 => true, 5 => true, 10 => true, 15 => true, 20 => true, 25 => true];

foreach ($users as $user) {
    if (isset($allowedIds[$user['id']])) {  // O(1) lookup
        // Process user
    }
}
?>
```

**Detection:**
- Type: `inefficient_search`
- Severity: `warning`
- Impact: O(n*m) → O(n)

---

### 6. Array Push in Loop

**Inefficient:**
```php
<?php
$result = [];
foreach ($items as $item) {
    array_push($result, $item['value']);  // Function call overhead
}
?>
```

**Optimized:**
```php
<?php
$result = [];
foreach ($items as $item) {
    $result[] = $item['value'];  // Direct append
}
?>
```

**Detection:**
- Type: `array_push_in_loop`
- Severity: `info`
- Impact: Reduced function call overhead

---

## Complex Example

**Inefficient (Multiple Issues):**
```php
<?php
function processOrders($customers) {
    $report = "";

    // Issue 1: Nested loops (O(n*m))
    foreach ($customers as $customer) {
        // Issue 2: DB query in loop
        $orders = mysql_query("SELECT * FROM orders WHERE customer_id = " . $customer['id']);

        foreach ($orders as $order) {
            // Issue 3: Loop invariant
            $taxRate = 0.08;
            $serviceFee = calculateServiceFee();

            // Issue 4: Another DB query in nested loop
            $product = mysql_query("SELECT * FROM products WHERE id = " . $order['product_id']);

            // Issue 5: String concatenation
            $report .= $customer['name'] . " - " . $order['id'] . "\n";

            // Issue 6: in_array in nested loop
            if (in_array($product['category'], ['electronics', 'books', 'clothing'])) {
                $total = $order['amount'] * (1 + $taxRate) + $serviceFee;
            }
        }
    }

    return $report;
}
?>
```

**Optimized:**
```php
<?php
function processOrders($customers) {
    // Calculate constants once
    $taxRate = 0.08;
    $serviceFee = calculateServiceFee();

    // Convert array to hash map
    $taxableCategories = ['electronics' => true, 'books' => true, 'clothing' => true];

    // Fetch all data at once
    $customerIds = array_column($customers, 'id');
    $ordersResult = mysql_query("SELECT * FROM orders WHERE customer_id IN (" . implode(',', $customerIds) . ")");

    $orders = [];
    $productIds = [];
    while ($row = mysql_fetch_assoc($ordersResult)) {
        $orders[$row['customer_id']][] = $row;
        $productIds[] = $row['product_id'];
    }

    // Fetch all products at once
    $productsResult = mysql_query("SELECT * FROM products WHERE id IN (" . implode(',', array_unique($productIds)) . ")");

    $products = [];
    while ($row = mysql_fetch_assoc($productsResult)) {
        $products[$row['id']] = $row;
    }

    // Build report using array
    $reportLines = [];

    foreach ($customers as $customer) {
        $customerOrders = $orders[$customer['id']] ?? [];

        foreach ($customerOrders as $order) {
            $product = $products[$order['product_id']];

            $reportLines[] = $customer['name'] . " - " . $order['id'];

            if (isset($taxableCategories[$product['category']])) {
                $total = $order['amount'] * (1 + $taxRate) + $serviceFee;
            }
        }
    }

    return implode("\n", $reportLines);
}
?>
```

**Improvements:**
- 6 critical/warning issues → 0 issues
- Complexity: O(n*m*k) + multiple DB queries → O(n+m+k) + 3 DB queries
- Efficiency score: ~40 → ~95

---

## Testing Your Code

Use the web interface or API:

```bash
curl -X POST http://localhost:8000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "<?php\nfor ($i=0; $i<10; $i++) {\n  $x = 5;\n}\n?>"
  }'
```

Expected result will detect loop invariant ($x = 5) and suggest moving it outside the loop.
