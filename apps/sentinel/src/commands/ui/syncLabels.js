const fs = require('fs');
const path = require('path');

const UI_LABELS_PATH = path.join(process.cwd(), 'config', 'uiLabels.json');

function normalizeLabelMap(labelMap = {}) {
  if (!labelMap || typeof labelMap !== 'object' || Array.isArray(labelMap)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(labelMap)
      .filter(([key, value]) => typeof key === 'string' && typeof value === 'string')
      .map(([key, value]) => [key.trim(), value.trim()])
      .filter(([key, value]) => key && value)
  );
}

async function handleUiSync(payload = {}) {
  const labels = normalizeLabelMap(payload.labelMap || payload.labels);

  fs.mkdirSync(path.dirname(UI_LABELS_PATH), { recursive: true });
  fs.writeFileSync(
    UI_LABELS_PATH,
    `${JSON.stringify({
      labels,
      updatedAt: new Date().toISOString()
    }, null, 2)}\n`,
    'utf8'
  );

  return {
    success: true,
    statusCode: 200,
    data: {
      result: {
        status: 'success',
        message: 'UI labels synced',
        labelCount: Object.keys(labels).length,
        configPath: path.relative(process.cwd(), UI_LABELS_PATH)
      },
      labels
    }
  };
}

module.exports = {
  handleUiSync
};
