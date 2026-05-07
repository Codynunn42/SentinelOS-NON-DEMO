const fs = require('fs');
const path = require('path');

const PRODUCT_CONFIG_PATH = path.join(process.cwd(), 'config', 'product.json');

function normalizeLanguageMap(languageMap = {}) {
  if (!languageMap || typeof languageMap !== 'object' || Array.isArray(languageMap)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(languageMap)
      .filter(([key, value]) => typeof key === 'string' && typeof value === 'string')
      .map(([key, value]) => [key.trim(), value.trim()])
      .filter(([key, value]) => key && value)
  );
}

async function handleProductReframe(payload = {}, context = {}) {
  const productName =
    typeof payload.productName === 'string' && payload.productName.trim()
      ? payload.productName.trim()
      : 'SentinelOS Deal Execution Engine';
  const positioning =
    typeof payload.positioning === 'string' && payload.positioning.trim()
      ? payload.positioning.trim()
      : 'We ensure deals only execute when they are valid, approved, and safe.';

  const config = {
    productName,
    positioning,
    languageMap: normalizeLanguageMap(payload.languageMap),
    tenant: context.tenant || payload.tenant || 'nunncloud',
    updatedAt: new Date().toISOString()
  };

  fs.mkdirSync(path.dirname(PRODUCT_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(PRODUCT_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        status: 'success',
        message: 'Product framing updated',
        configPath: path.relative(process.cwd(), PRODUCT_CONFIG_PATH)
      },
      product: config
    }
  };
}

module.exports = {
  handleProductReframe
};
