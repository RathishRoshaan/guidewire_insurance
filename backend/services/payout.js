const Razorpay = require('razorpay');
const Transaction = require('../models/Transaction');
require('dotenv').config();

// Create mock Razorpay instance
let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder') {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (e) {
  console.log("Razorpay initialized failed (missing real keys), using strict mock mode.");
}

/**
 * processInstantPayout 
 * Simulates connecting to a payment gateway (UPI or Razorpay Fund Account) 
 * to disburse wages to worker on auto-approved claim.
 */
async function processInstantPayout(claim, worker) {
  // If we had valid keys and RazorpayX account, we would do:
  // const payout = await razorpay.payouts.create({ account_number, amount: claim.claimAmount * 100, currency: "INR", mode: "UPI" ...})
  
  console.log(`[PAYOUT] Processing mock instant UPI payout of ₹${claim.claimAmount} for Worker ID: ${worker.workerId}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Determine success (98% success rate for simulation)
  const isSuccess = Math.random() < 0.98;

  let extTxnId;
  let statusStr;

  if (isSuccess) {
    extTxnId = 'txn_mock_' + Math.random().toString(36).substr(2, 9);
    statusStr = 'processed';
    console.log(`[PAYOUT SUCCESS] TransId: ${extTxnId}`);
  } else {
    extTxnId = null;
    statusStr = 'failed';
    console.log(`[PAYOUT FAILED] Gateway rejected mock transaction`);
  }

  // Record Transaction
  const transaction = new Transaction({
    transactionId: extTxnId || ('failed_' + Date.now()),
    claimId: claim.claimId,
    workerId: worker.workerId,
    amount: claim.claimAmount,
    status: statusStr,
    method: 'UPI'
  });

  await transaction.save();

  return transaction;
}

module.exports = {
  processInstantPayout
};
