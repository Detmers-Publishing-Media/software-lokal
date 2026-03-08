import { createEventLog } from './events.js';
import { createProfileModel } from './profile.js';
import { createPersonModel } from './person.js';
import { createInvoiceModel } from './invoice.js';
import { createTransactionModel } from './transaction.js';
import { createCategoryModel } from './category.js';

export { createEventLog, createProfileModel, createPersonModel, createInvoiceModel, createTransactionModel, createCategoryModel };

/**
 * Create all models with shared dependencies.
 * @param {Object} deps — { query, execute, computeHmac }
 * @param {Object} features — feature flags from product.config.js
 * @returns {Object} — all active models
 */
export function createModels(deps, features = {}) {
  const eventLog = createEventLog(deps);
  const modelDeps = { ...deps, eventLog };

  const models = {
    eventLog,
    profile: createProfileModel(modelDeps),
    person: createPersonModel(modelDeps),
    transaction: createTransactionModel(modelDeps),
    category: createCategoryModel(modelDeps),
  };

  if (features.invoices) {
    models.invoice = createInvoiceModel(modelDeps);
  }

  return models;
}
