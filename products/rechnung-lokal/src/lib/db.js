/**
 * Database initialization for Rechnung Lokal.
 * Uses finanz-shared for schema and models, app-shared/db for IPC.
 */
import { query, execute } from '@codefabrik/app-shared/db';
import { computeHmac } from '@codefabrik/shared/crypto';
import { createSchema } from '@codefabrik/finanz-shared/db';
import { createModels } from '@codefabrik/finanz-shared/models';
import { seedCategories } from '@codefabrik/finanz-shared/euer';
import productConfig from '../../product.config.js';

let models = null;

export async function initDb() {
  await createSchema(execute, productConfig.features, {
    product_id: productConfig.product,
    app_version: '0.1.0',
  });

  await seedCategories(execute, query);

  models = createModels({ query, execute, computeHmac }, productConfig.features);

  await models.eventLog.append('AppGestartet', {
    product: productConfig.product,
    version: '0.1.0',
  });
}

export function getModels() {
  if (!models) throw new Error('DB not initialized. Call initDb() first.');
  return models;
}
