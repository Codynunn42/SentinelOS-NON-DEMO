function buildOpenAIRequest(runtime, prompt) {
  return {
    url: `${runtime.openaiBaseUrl}/v1/chat/completions`,
    headers: {
      Authorization: `Bearer ${runtime.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      model: runtime.modelVersion,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: runtime.maxCompletionTokens,
      temperature: 0
    }
  };
}

function buildAzureOpenAIRequest(runtime, prompt) {
  return {
    url: `${runtime.azureEndpoint}/openai/deployments/${encodeURIComponent(runtime.azureDeployment)}/chat/completions?api-version=${encodeURIComponent(runtime.azureApiVersion)}`,
    headers: {
      'api-key': runtime.apiKey,
      'Content-Type': 'application/json'
    },
    body: {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: runtime.maxCompletionTokens,
      temperature: 0
    }
  };
}

function normalizeChatResult(payload = {}) {
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const content = choice && choice.message && typeof choice.message.content === 'string'
    ? choice.message.content
    : '';

  return {
    content,
    finishReason: choice && choice.finish_reason ? choice.finish_reason : null,
    usage: {
      promptTokens: payload.usage && Number.isFinite(payload.usage.prompt_tokens)
        ? payload.usage.prompt_tokens
        : null,
      completionTokens: payload.usage && Number.isFinite(payload.usage.completion_tokens)
        ? payload.usage.completion_tokens
        : null,
      totalTokens: payload.usage && Number.isFinite(payload.usage.total_tokens)
        ? payload.usage.total_tokens
        : null
    }
  };
}

async function runLiveOpenAIRequest({ runtime, prompt }) {
  const request = runtime.provider === 'azure_openai'
    ? buildAzureOpenAIRequest(runtime, prompt)
    : buildOpenAIRequest(runtime, prompt);

  const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(runtime.requestTimeoutMs)
    : (() => {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), runtime.requestTimeoutMs);
      if (typeof timeoutHandle.unref === 'function') {
        timeoutHandle.unref();
      }
      return controller.signal;
    })();

  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal
    });

    const responseText = await response.text();
    const payload = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        error: 'OPENAI_PROVIDER_ERROR',
        provider: runtime.provider,
        detail: payload && payload.error && payload.error.message
          ? payload.error.message
          : `Provider request failed with status ${response.status}`
      };
    }

    const normalized = normalizeChatResult(payload);
    return {
      ok: true,
      response: {
        provider: runtime.provider,
        modelVersion: runtime.modelVersion,
        stubbed: false,
        content: normalized.content,
        finishReason: normalized.finishReason,
        usage: normalized.usage
      }
    };
  } catch (error) {
    const timeout = error && error.name === 'AbortError';
    return {
      ok: false,
      statusCode: timeout ? 504 : 502,
      error: timeout ? 'OPENAI_PROVIDER_TIMEOUT' : 'OPENAI_PROVIDER_ERROR',
      provider: runtime.provider,
      detail: error && error.message ? error.message : 'Unknown provider error'
    };
  }
}

module.exports = {
  runLiveOpenAIRequest
};
