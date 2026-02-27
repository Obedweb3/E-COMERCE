<?php
header('Content-Type: application/json');

// Receive M-Pesa callback
$callbackData = file_get_contents('php://input');
$data = json_decode($callbackData, true);

// Log the callback
$logFile = 'callback.log';
$logEntry = date('Y-m-d H:i:s') . " | Callback: " . $callbackData . "\n";
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

// Process the callback
if (isset($data['Body']['stkCallback'])) {
    $callback = $data['Body']['stkCallback'];
    $resultCode = $callback['ResultCode'];
    $resultDesc = $callback['ResultDesc'];
    $checkoutRequestID = $callback['CheckoutRequestID'];
    $merchantRequestID = $callback['MerchantRequestID'];
    
    if ($resultCode == 0) {
        // Payment successful
        $amount = $callback['CallbackMetadata']['Item'][0]['Value'];
        $mpesaReceiptNumber = $callback['CallbackMetadata']['Item'][1]['Value'];
        $transactionDate = $callback['CallbackMetadata']['Item'][3]['Value'];
        $phoneNumber = $callback['CallbackMetadata']['Item'][4]['Value'];
        
        // TODO: Update your database, send confirmation email, etc.
        // You can save this to a database or file for status checking
        
        $successLog = "SUCCESS: Receipt: $mpesaReceiptNumber, Amount: $amount, Phone: $phoneNumber\n";
        file_put_contents('successful_payments.log', $successLog, FILE_APPEND | LOCK_EX);
    } else {
        // Payment failed
        $failLog = "FAILED: Code: $resultCode, Desc: $resultDesc\n";
        file_put_contents('failed_payments.log', $failLog, FILE_APPEND | LOCK_EX);
    }
}

// Return success response to Safaricom
$response = [
    'ResultCode' => 0,
    'ResultDesc' => 'Success'
];

echo json_encode($response);
?>
