const DIGISTORE_API_KEY = process.env.DIGISTORE_API_KEY;
const BASE_URL = 'https://www.digistore24.com/api/call';

async function apiCall(fn, params = {}) {
  if (!DIGISTORE_API_KEY) {
    throw new Error('DIGISTORE_API_KEY nicht konfiguriert');
  }
  const url = `${BASE_URL}/${DIGISTORE_API_KEY}/json/${fn}`;
  const body = new URLSearchParams(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!data.result || data.result === 'error') {
    const msg = data.message || data.error || 'Digistore24 API-Fehler';
    throw new Error(`Digistore24: ${msg}`);
  }
  return data.data || data;
}

async function createProduct({ name, description, thankyouUrl }) {
  const params = {
    name_de: name,
    product_type_id: '1',
  };
  if (description) params.description_de = description;
  if (thankyouUrl) params.thankyou_url = thankyouUrl;
  const data = await apiCall('createProduct', params);
  return data.product_id;
}

async function getGlobalSettings() {
  return apiCall('getGlobalSettings');
}

module.exports = { createProduct, getGlobalSettings };
