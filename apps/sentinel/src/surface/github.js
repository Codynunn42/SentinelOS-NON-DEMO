// GitHub Surface Plane
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// GitHub is a governed read and Actions execution face plane for SentinelOS.
// All GitHub actions route through the SentinelOS command envelope — no direct execution.
// Repository and PR reads are auto-approved at policy level.
// GitHub Actions execution requires Executive Desk approval.

'use strict';

const githubHandlers = {
  // Repository read — auto-approved at policy level
  'github.repo.read': async (payload = {}, context = {}, envelope = {}) => {
    const { owner, repo } = payload;
    return {
      success: true,
      data: {
        surface: 'github',
        operation: 'repo.read',
        owner: owner || null,
        repo: repo || null,
        tenant: context.tenant || envelope.tenant || 'github',
        capability: 'GITHUB-READ-001',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Pull request read — auto-approved at policy level
  'github.pr.read': async (payload = {}, context = {}, envelope = {}) => {
    const { owner, repo, prNumber } = payload;
    return {
      success: true,
      data: {
        surface: 'github',
        operation: 'pr.read',
        owner: owner || null,
        repo: repo || null,
        prNumber: prNumber || null,
        tenant: context.tenant || envelope.tenant || 'github',
        capability: 'GITHUB-READ-001',
        timestamp: new Date().toISOString()
      }
    };
  },

  // Actions execute — high-risk, requires Executive Desk approval before this handler runs
  // The governance preflight and approval layer enforce the Executive Desk gate
  'github.action.execute': async (payload = {}, context = {}, envelope = {}) => {
    const { owner, repo, workflow, ref } = payload;
    return {
      success: true,
      data: {
        surface: 'github',
        operation: 'action.execute',
        owner: owner || null,
        repo: repo || null,
        workflow: workflow || null,
        ref: ref || null,
        executedWith: 'executive_approval',
        tenant: context.tenant || envelope.tenant || 'github',
        capability: 'GITHUB-EXECUTE-001',
        approvalSatisfied: true,
        timestamp: new Date().toISOString()
      }
    };
  }
};

module.exports = {
  githubHandlers
};
