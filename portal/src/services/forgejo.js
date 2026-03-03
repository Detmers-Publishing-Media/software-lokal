const FORGEJO_URL = process.env.FORGEJO_URL;
const FORGEJO_TOKEN = process.env.FORGEJO_API_TOKEN;
const REPO = process.env.PROD_FORGEJO_REPO || 'factory/process-repo';

async function pushYaml(targetDir, objectId, yamlContent) {
  const filePath = `${targetDir}/${objectId}.yml`;
  const response = await fetch(
    `${FORGEJO_URL}/api/v1/repos/${REPO}/contents/${filePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${FORGEJO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `[Portal] ${objectId}: Neues Objekt von Portal`,
        content: Buffer.from(yamlContent).toString('base64'),
        branch: 'main'
      })
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Forgejo push failed: ${response.status} ${err}`);
  }
  return response.json();
}

async function getLatestRelease(repo) {
  const response = await fetch(
    `${FORGEJO_URL}/api/v1/repos/${repo}/releases?limit=1`,
    { headers: { 'Authorization': `token ${FORGEJO_TOKEN}` } }
  );
  if (!response.ok) return null;
  const releases = await response.json();
  return releases[0] || null;
}

module.exports = { pushYaml, getLatestRelease };
