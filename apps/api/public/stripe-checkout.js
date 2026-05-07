let stripe;
let checkout;
let actions;

const form = document.querySelector('#payment-form');
const submitButton = document.querySelector('#submit');
const buttonText = document.querySelector('#button-text');
const spinner = document.querySelector('#spinner');
const message = document.querySelector('#payment-message');
const emailInput = document.querySelector('#email');
const emailErrors = document.querySelector('#email-errors');
const checkoutState = document.querySelector('#checkout-state');

initialize();

form.addEventListener('submit', handleSubmit);

async function initialize() {
  try {
    const configResponse = await fetch('/billing/checkout/config');
    const config = await configResponse.json();

    if (config.status !== 'ready' || !config.publishableKey) {
      const missing = Array.isArray(config.missing) && config.missing.length
        ? ` Missing: ${config.missing.join(', ')}.`
        : '';
      checkoutState.textContent = 'Approval pending';
      showMessage(`Checkout is not ready.${missing}`);
      return;
    }

    stripe = Stripe(config.publishableKey);
    const clientSecret = fetch('/billing/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value || undefined,
        tenant: 'ownerfi'
      })
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.clientSecret) {
          throw new Error(payload.error || 'Unable to initialize checkout session');
        }
        return payload.clientSecret;
      });

    checkout = stripe.initCheckoutElementsSdk({
      clientSecret,
      elementsOptions: {
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '6px',
            colorPrimary: '#1f6feb'
          }
        }
      }
    });

    checkout.on('change', (session) => {
      submitButton.disabled = !session.canConfirm;
      checkoutState.textContent = session.canConfirm ? 'Ready' : 'Waiting';
    });

    const loadActionsResult = await checkout.loadActions();
    if (loadActionsResult.type !== 'success') {
      throw new Error('Stripe checkout actions were not available');
    }

    actions = loadActionsResult.actions;
    const session = actions.getSession();
    if (session && session.total && session.total.total) {
      buttonText.textContent = `Pay ${session.total.total.amount} now`;
    }

    emailInput.addEventListener('input', () => {
      emailErrors.textContent = '';
      emailInput.classList.remove('error');
    });

    emailInput.addEventListener('blur', validateEmailInput);

    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount('#payment-element');
  } catch (error) {
    checkoutState.textContent = 'Blocked';
    showMessage(error instanceof Error ? error.message : 'Checkout initialization failed');
  }
}

async function validateEmailInput() {
  if (!actions || !emailInput.value) {
    return { isValid: true, message: null };
  }

  const updateResult = await actions.updateEmail(emailInput.value);
  const isValid = updateResult.type !== 'error';
  const validationMessage = isValid ? null : updateResult.error.message;

  emailInput.classList.toggle('error', !isValid);
  emailErrors.textContent = validationMessage || '';

  return { isValid, message: validationMessage };
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!actions) {
    showMessage('Checkout is not ready yet.');
    return;
  }

  setLoading(true);
  const validation = await validateEmailInput();

  if (!validation.isValid) {
    showMessage(validation.message);
    setLoading(false);
    return;
  }

  const result = await actions.confirm();
  if (result && result.error) {
    showMessage(result.error.message);
  }

  setLoading(false);
}

function showMessage(text) {
  message.classList.remove('hidden');
  message.textContent = text;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  spinner.classList.toggle('hidden', !isLoading);
  buttonText.classList.toggle('hidden', isLoading);
}
