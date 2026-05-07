const statusIcon = document.querySelector('#status-icon');
const statusText = document.querySelector('#status-text');
const detailsTable = document.querySelector('#details-table');
const intentStatus = document.querySelector('#intent-status');
const sessionStatus = document.querySelector('#session-status');
const intentId = document.querySelector('#intent-id');
const paymentIntentStatus = document.querySelector('#payment-intent-status');

initialize();

async function initialize() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  if (!sessionId) {
    setErrorState('No checkout session was provided.');
    return;
  }

  try {
    const response = await fetch(`/billing/session-status?session_id=${encodeURIComponent(sessionId)}`);
    const session = await response.json();

    if (!response.ok) {
      setErrorState(session.error || 'Unable to load checkout status.');
      return;
    }

    setSessionDetails(session);
  } catch (error) {
    setErrorState(error instanceof Error ? error.message : 'Unable to load checkout status.');
  }
}

function setSessionDetails(session) {
  const paid = session && session.status === 'complete' && session.payment_status === 'paid';
  statusIcon.textContent = paid ? 'OK' : '!';
  statusIcon.className = paid ? 'success' : 'attention';
  statusText.textContent = paid ? 'Payment recorded' : 'Payment needs review';
  intentStatus.textContent = session.status || 'unknown';
  sessionStatus.textContent = session.payment_status || 'unknown';
  intentId.textContent = session.payment_intent_id || session.subscription_id || 'not available';
  paymentIntentStatus.textContent = session.payment_intent_status || session.subscription_status || 'not available';
}

function setErrorState(text) {
  statusIcon.textContent = '!';
  statusIcon.className = 'error';
  statusText.textContent = text;
  detailsTable.classList.add('hidden');
}
