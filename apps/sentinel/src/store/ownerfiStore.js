const applications = new Map();
const deals = new Map();
const { query } = require('../db/client');

const ownerfiStore = {
  async createApplication(app) {
    applications.set(app.applicationId, app);

    await query(
      `INSERT INTO applications (id, tenant_id, name, vehicle, amount, credit_score, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        app.applicationId,
        app.tenantId,
        app.name,
        app.vehicle,
        app.amount,
        app.creditScore,
        app.status,
        app.createdAt,
        app.updatedAt
      ]
    );

    return app;
  },

  getApplication(id, tenantId) {
    const application = applications.get(id);
    if (!application) {
      return null;
    }

    if (tenantId && application.tenantId !== tenantId) {
      return null;
    }

    return application;
  },

  async updateApplication(id, updates) {
    const existing = applications.get(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updates };
    applications.set(id, updated);

    await query(
      `UPDATE applications
       SET tenant_id = $2,
           name = $3,
           vehicle = $4,
           amount = $5,
           credit_score = $6,
           status = $7,
           updated_at = $8
       WHERE id = $1`,
      [
        updated.applicationId,
        updated.tenantId,
        updated.name,
        updated.vehicle,
        updated.amount,
        updated.creditScore,
        updated.status,
        updated.updatedAt
      ]
    );

    return updated;
  },

  async createDeal(deal) {
    deals.set(deal.dealId, deal);

    await query(
      `INSERT INTO deals (id, tenant_id, application_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [deal.dealId, deal.tenantId, deal.applicationId, deal.status, deal.createdAt, deal.updatedAt]
    );

    return deal;
  },

  getDeal(id, tenantId) {
    const deal = deals.get(id);
    if (!deal) {
      return null;
    }

    if (tenantId && deal.tenantId !== tenantId) {
      return null;
    }

    return deal;
  }
};

module.exports = {
  ownerfiStore
};
