const UPCLOUD_TOKEN = process.env.UPCLOUD_API_TOKEN;
const PROD_UUID = process.env.PROD_SERVER_UUID;

async function getProdStatus() {
  const response = await fetch(
    `https://api.upcloud.com/1.3/server/${PROD_UUID}`,
    { headers: { 'Authorization': `Bearer ${UPCLOUD_TOKEN}` } }
  );
  if (!response.ok) return 'unknown';
  const data = await response.json();
  return data.server.state;
}

async function startProd() {
  const response = await fetch(
    `https://api.upcloud.com/1.3/server/${PROD_UUID}/start`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPCLOUD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ start_server: { avoid_host: 0 } })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`UpCloud start failed: ${response.status} ${err}`);
  }
  return true;
}

async function stopProd() {
  const response = await fetch(
    `https://api.upcloud.com/1.3/server/${PROD_UUID}/stop`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPCLOUD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stop_server: { stop_type: 'soft', timeout: 120 } })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`UpCloud stop failed: ${response.status} ${err}`);
  }
  return true;
}

module.exports = { getProdStatus, startProd, stopProd };
