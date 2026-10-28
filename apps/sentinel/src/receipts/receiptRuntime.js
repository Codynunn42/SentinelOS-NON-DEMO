const { createAzureKeyVaultReceiptSigner } = require('./azureKeyVaultSigner');

let receiptSigner;

function getReceiptSigner() {
  if (!receiptSigner) {
    receiptSigner = createAzureKeyVaultReceiptSigner();
  }
  return receiptSigner;
}

function resetReceiptSignerForTests() {
  receiptSigner = undefined;
}

module.exports = {
  getReceiptSigner,
  resetReceiptSignerForTests
};
