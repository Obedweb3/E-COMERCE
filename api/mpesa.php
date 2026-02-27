<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// M-Pesa Daraja API Configuration
define('CONSUMER_KEY', 'YOUR_CONSUMER_KEY_HERE');        // Replace with your Daraja Consumer Key
define('CONSUMER_SECRET', 'YOUR_CONSUMER_SECRET_HERE');  // Replace with your Daraja Consumer Secret
define('PASSKEY', 'YOUR_PASSKEY_HERE');                  // Replace with your Passkey
define('SHORTCODE', 'YOUR_SHORTCODE_HERE');              // Replace with your Shortcode (e.g., 174379 for sandbox)
define('CALLBACK_URL', 'https://yourdomain.com/api/callback.php'); // Your callback URL

// Sandbox vs Production
define('ENVIRONMENT', 'sandbox'); // Change to 'production' when going live

$baseUrl = ENVIRONMENT === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

// Get access token
function getAccessToken() {
    $credentials = base64_encode(CONSUMER_KEY . ':' . CONSUMER_SECRET);
    
    $ch = curl_init($GLOBALS['baseUrl'] . '/oauth/v1/generate?grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . $credentials]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response);
    return $result->access_token ?? null;
}

// Initiate STK Push
function initiateSTKPush($phone, $amount, $accountReference, $transactionDesc) {
    $accessToken = getAccessToken();
    
    if (!$accessToken) {
        return ['error' => 'Failed to get access token'];
    }
    
    $timestamp = date('YmdHis');
    $password = base64_encode(SHORTCODE . PASSKEY . $timestamp);
    
    $curl_post_data = [
        'BusinessShortCode' => SHORTCODE,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'TransactionType' => 'CustomerPayBillOnline',
        'Amount' => $amount,
        'PartyA' => $phone,
        'PartyB' => SHORTCODE,
        'PhoneNumber' => $phone,
        'CallBackURL' => CALLBACK_URL,
        'AccountReference' => $accountReference,
        'TransactionDesc' => $transactionDesc
    ];
    
    $data_string = json_encode($curl_post_data);
    
    $ch = curl_init($GLOBALS['baseUrl'] . '/mpesa/stkpush/v1/processrequest');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Check transaction status
function checkTransactionStatus($checkoutRequestID) {
    $accessToken = getAccessToken();
    
    if (!$accessToken) {
        return ['error' => 'Failed to get access token'];
    }
    
    $timestamp = date('YmdHis');
    $password = base64_encode(SHORTCODE . PASSKEY . $timestamp);
    
    $curl_post_data = [
        'BusinessShortCode' => SHORTCODE,
        'Password' => $password,
        'Timestamp' => $timestamp,
        'CheckoutRequestID' => $checkoutRequestID
    ];
    
    $ch = curl_init($GLOBALS['baseUrl'] . '/mpesa/stkpushquery/v1/query');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($curl_post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $phone = $input['phone'] ?? '';
    $amount = $input['amount'] ?? 0;
    $accountReference = $input['accountReference'] ?? 'OBEDTECH';
    $transactionDesc = $input['transactionDesc'] ?? 'Service Payment';
    
    // Validate phone number (format: 2547XXXXXXXX)
    if (!preg_match('/^2547\d{8}$/', $phone)) {
        echo json_encode(['error' => 'Invalid phone number format']);
        exit;
    }
    
    // Validate amount
    if ($amount < 1) {
        echo json_encode(['error' => 'Invalid amount']);
        exit;
    }
    
    $result = initiateSTKPush($phone, $amount, $accountReference, $transactionDesc);
    
    // Log transaction (optional)
    logTransaction($input, $result);
    
    echo json_encode($result);
    
} elseif ($method === 'GET' && isset($_GET['checkoutRequestID'])) {
    $checkoutRequestID = $_GET['checkoutRequestID'];
    $result = checkTransactionStatus($checkoutRequestID);
    echo json_encode($result);
}

// Simple logging function
function logTransaction($request, $response) {
    $logFile = 'transactions.log';
    $logEntry = date('Y-m-d H:i:s') . " | Request: " . json_encode($request) . " | Response: " . json_encode($response) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}
?>
