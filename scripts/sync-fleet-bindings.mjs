import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.env.APPDATA, 'xdg.config', '.wrangler', 'config', 'default.toml');
const content = fs.readFileSync(configPath, 'utf8');
const tokenMatch = content.match(/oauth_token\s*=\s*"([^"]+)"/);
if (!tokenMatch) {
  console.error('No oauth token found in wrangler config.');
  process.exit(1);
}
const token = tokenMatch[1];
const accountId = 'd0fec8d3e1503b86483a27e08c848ab0';

const isExecute = process.argv.includes('--execute');

export async function patchProjectBindings(projectName, databaseId, bucketName, dryRun = true) {
  const getUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  const getData = await getRes.json();
  if (!getData.success) {
    throw new Error(`Failed to fetch project ${projectName}: ${JSON.stringify(getData.errors)}`);
  }

  const currentProd = getData.result.deployment_configs?.production || {};
  const currentPreview = getData.result.deployment_configs?.preview || {};
  const currentD1 = currentProd.d1_databases?.DB?.id;
  const currentR2 = currentProd.r2_buckets?.STORAGE?.name;

  console.log(`\n[${projectName}]`);
  console.log(`  Current D1 DB ID: ${currentD1}`);
  console.log(`  Desired D1 DB ID: ${databaseId}`);
  console.log(`  Current R2 Bucket: ${currentR2}`);
  console.log(`  Desired R2 Bucket: ${bucketName}`);

  if (dryRun) {
    console.log(`  [DRY RUN] Would patch ${projectName} with databaseId: ${databaseId}, bucketName: ${bucketName}`);
    return;
  }

  const patchUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const patchPayload = {
    deployment_configs: {
      preview: currentPreview,
      production: {
        ...currentProd,
        d1_databases: {
          DB: {
            id: databaseId
          }
        },
        r2_buckets: {
          STORAGE: {
            name: bucketName
          }
        }
      }
    }
  };

  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patchPayload)
  });
  const patchData = await patchRes.json();
  if (!patchData.success) {
    throw new Error(`Failed to patch project ${projectName}: ${JSON.stringify(patchData.errors)}`);
  }
  console.log(`  🚀 Successfully patched bindings for ${projectName}!`);
}

const installationsDir = path.resolve('./installations');
const files = fs.readdirSync(installationsDir);

console.log(`Mode: ${isExecute ? '🔴 LIVE EXECUTE' : '🟡 DRY RUN'}`);

for (const file of files) {
  if (file.endsWith('.json') && !file.includes('example')) {
    const raw = JSON.parse(fs.readFileSync(path.join(installationsDir, file), 'utf8'));
    await patchProjectBindings(raw.projectName, raw.databaseId, raw.bucketName, !isExecute);
  }
}
