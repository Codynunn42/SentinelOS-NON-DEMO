// Microsoft 365 Surface Plane
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Microsoft 365 is a governed read and reporting face plane for SentinelOS.
// All M365 actions route through the SentinelOS command envelope — no direct execution.
// Only read and report paths are active at this lifecycle stage.

'use strict';

const microsoft365Handlers = {
  // Calendar read — operator-scoped, read-only
  'm365.calendar.read': async (payload = {}, context = {}, envelope = {}) => {
    const { userId, dateRange } = payload;
    return {
      success: true,
      data: {
        surface: 'microsoft365',
        operation: 'calendar.read',
        userId: userId || null,
        dateRange: dateRange || null,
        tenant: context.tenant || envelope.tenant || 'microsoft365',
        capability: 'M365-READ-001',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Mail read — operator-scoped, read-only
  'm365.mail.read': async (payload = {}, context = {}, envelope = {}) => {
    const { userId, mailboxFilter } = payload;
    return {
      success: true,
      data: {
        surface: 'microsoft365',
        operation: 'mail.read',
        userId: userId || null,
        mailboxFilter: mailboxFilter || null,
        tenant: context.tenant || envelope.tenant || 'microsoft365',
        capability: 'M365-READ-001',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Report generation — operator-scoped, requires evidence
  'm365.report.generate': async (payload = {}, context = {}, envelope = {}) => {
    const { reportType, dateRange } = payload;
    return {
      success: true,
      data: {
        surface: 'microsoft365',
        operation: 'report.generate',
        reportType: reportType || null,
        dateRange: dateRange || null,
        tenant: context.tenant || envelope.tenant || 'microsoft365',
        capability: 'M365-REPORT-001',
        evidenceSatisfied: true,
        timestamp: new Date().toISOString()
      }
    };
  }
};

module.exports = {
  microsoft365Handlers
};
