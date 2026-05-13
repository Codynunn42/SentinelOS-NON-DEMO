#!/usr/bin/env node

/**
 * Mock Governance Analytics Tool
 *
 * Analyzes historical governance telemetry artifacts from mock FacePlane runs
 * to detect trends, drift, and governance evolution patterns.
 *
 * Usage: node scripts/mockGovernanceAnalytics.js [options]
 *
 * Options:
 *   --compare <runId1> <runId2>  Compare two specific runs
 *   --trend <days>               Analyze trends over last N days
 *   --drift                      Focus on governance drift detection
 *   --report                     Generate comprehensive report
 *   --help                       Show this help
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'runtime', 'mock-results');

class MockGovernanceAnalytics {
    constructor() {
        this.artifacts = [];
        this.loadArtifacts();
    }

    loadArtifacts() {
        if (!fs.existsSync(RESULTS_DIR)) {
            console.error('No runtime/mock-results directory found');
            return;
        }

        const files = fs.readdirSync(RESULTS_DIR)
            .filter(f => f.endsWith('.json'))
            .sort();

        this.artifacts = files.map(file => {
            const filePath = path.join(RESULTS_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const artifact = {
                file,
                ...data
            };
            return this.normalizeArtifact(artifact);
        });

        console.log(`Loaded ${this.artifacts.length} governance artifacts`);
    }

    normalizeArtifact(artifact) {
        if (!artifact.aggregateSummary && Array.isArray(artifact.results)) {
            const totals = artifact.results.reduce(
                (acc, item) => {
                    const summary = item.iterationSummary || item.summary || {};
                    acc.totalCommands += Number.isFinite(Number(summary.commandCount)) ? Number(summary.commandCount) : 0;
                    acc.totalApprovals += Number.isFinite(Number(summary.approvalCount)) ? Number(summary.approvalCount) : 0;
                    acc.totalBlocks += Number.isFinite(Number(summary.blockedCount)) ? Number(summary.blockedCount) : 0;
                    acc.sumApprovalRatio += Number.isFinite(Number(summary.approvalRatio)) ? Number(summary.approvalRatio) : 0;
                    acc.sumBlockRatio += Number.isFinite(Number(summary.blockRatio)) ? Number(summary.blockRatio) : 0;
                    acc.sumTraceCompleteness += Number.isFinite(Number(summary.traceCompleteness)) ? Number(summary.traceCompleteness) : 0;
                    acc.totalDriftRecommendations += Number.isFinite(Number(summary.driftRecommendationsGenerated)) ? Number(summary.driftRecommendationsGenerated) : 0;
                    acc.count += 1;
                    return acc;
                },
                {
                    totalCommands: 0,
                    totalApprovals: 0,
                    totalBlocks: 0,
                    sumApprovalRatio: 0,
                    sumBlockRatio: 0,
                    sumTraceCompleteness: 0,
                    totalDriftRecommendations: 0,
                    count: 0
                }
            );

            artifact.aggregateSummary = {
                totalCommands: totals.totalCommands,
                totalApprovals: totals.totalApprovals,
                totalBlocks: totals.totalBlocks,
                avgApprovalRatio: totals.count ? Number((totals.sumApprovalRatio / totals.count).toFixed(3)) : 0,
                avgBlockRatio: totals.count ? Number((totals.sumBlockRatio / totals.count).toFixed(3)) : 0,
                avgTraceCompleteness: totals.count ? Number((totals.sumTraceCompleteness / totals.count).toFixed(3)) : 0,
                totalDriftRecommendations: totals.totalDriftRecommendations
            };
        }

        if (!artifact.runId) {
            artifact.runId = artifact.runId || artifact.timestamp || artifact.file;
        }

        return artifact;
    }

    compareRuns(runId1, runId2) {
        const run1 = this.artifacts.find(a => a.runId === runId1);
        const run2 = this.artifacts.find(a => a.runId === runId2);

        if (!run1 || !run2) {
            console.error('Run not found:', !run1 ? runId1 : runId2);
            return;
        }

        console.log(`\n=== Run Comparison: ${runId1} vs ${runId2} ===`);

        const summary1 = run1.aggregateSummary;
        const summary2 = run2.aggregateSummary;

        const metrics = [
            'totalCommands',
            'totalApprovals',
            'totalBlocks',
            'avgApprovalRatio',
            'avgBlockRatio',
            'avgTraceCompleteness',
            'totalDriftRecommendations'
        ];

        metrics.forEach(metric => {
            const val1 = summary1[metric];
            const val2 = summary2[metric];
            const diff = val2 - val1;
            const pctChange = val1 !== 0 ? ((diff / val1) * 100).toFixed(1) : 'N/A';
            console.log(`${metric}: ${val1} → ${val2} (${diff > 0 ? '+' : ''}${diff}, ${pctChange}%)`);
        });
    }

    analyzeTrends(days = 7) {
        if (this.artifacts.length < 2) {
            console.log('Need at least 2 artifacts for trend analysis');
            return;
        }

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const recent = this.artifacts.filter(a => new Date(a.timestamp) >= cutoff);

        if (recent.length < 2) {
            console.log(`Only ${recent.length} artifacts in last ${days} days`);
            return;
        }

        console.log(`\n=== Governance Trends (Last ${days} days) ===`);
        console.log(`Analyzing ${recent.length} runs from ${recent[0].runId} to ${recent[recent.length - 1].runId}`);

        const first = recent[0].aggregateSummary;
        const last = recent[recent.length - 1].aggregateSummary;

        const trends = {
            approvalRatio: {
                start: first.avgApprovalRatio,
                end: last.avgApprovalRatio,
                direction: last.avgApprovalRatio > first.avgApprovalRatio ? 'increasing' : 'decreasing'
            },
            blockRatio: {
                start: first.avgBlockRatio,
                end: last.avgBlockRatio,
                direction: last.avgBlockRatio > first.avgBlockRatio ? 'increasing' : 'decreasing'
            },
            driftRecommendations: {
                start: first.totalDriftRecommendations,
                end: last.totalDriftRecommendations,
                direction: last.totalDriftRecommendations > first.totalDriftRecommendations ? 'increasing' : 'decreasing'
            }
        };

        Object.entries(trends).forEach(([metric, data]) => {
            const change = ((data.end - data.start) / data.start * 100).toFixed(1);
            console.log(`${metric}: ${data.start} → ${data.end} (${data.direction} by ${change}%)`);
        });

        // Drift detection
        const approvalVolatility = this.calculateVolatility(recent.map(r => r.aggregateSummary.avgApprovalRatio));
        const blockVolatility = this.calculateVolatility(recent.map(r => r.aggregateSummary.avgBlockRatio));

        console.log(`\nGovernance Stability:`);
        console.log(`Approval Ratio Volatility: ${approvalVolatility.toFixed(3)}`);
        console.log(`Block Ratio Volatility: ${blockVolatility.toFixed(3)}`);

        if (approvalVolatility > 0.1 || blockVolatility > 0.1) {
            console.log('⚠️  High governance volatility detected - potential drift');
        } else {
            console.log('✅ Governance appears stable');
        }
    }

    calculateVolatility(values) {
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    detectDrift() {
        console.log('\n=== Governance Drift Analysis ===');

        if (this.artifacts.length < 3) {
            console.log('Need at least 3 artifacts for meaningful drift analysis');
            return;
        }

        const recent = this.artifacts.slice(-5); // Last 5 runs

        const baselineApproval = recent.slice(0, 3).reduce((sum, r) => sum + r.aggregateSummary.avgApprovalRatio, 0) / 3;
        const latestApproval = recent[recent.length - 1].aggregateSummary.avgApprovalRatio;

        const baselineBlock = recent.slice(0, 3).reduce((sum, r) => sum + r.aggregateSummary.avgBlockRatio, 0) / 3;
        const latestBlock = recent[recent.length - 1].aggregateSummary.avgBlockRatio;

        const approvalDrift = Math.abs(latestApproval - baselineApproval);
        const blockDrift = Math.abs(latestBlock - baselineBlock);

        console.log(`Baseline Approval Ratio: ${baselineApproval.toFixed(3)}`);
        console.log(`Latest Approval Ratio: ${latestApproval.toFixed(3)}`);
        console.log(`Approval Drift: ${approvalDrift.toFixed(3)}`);

        console.log(`Baseline Block Ratio: ${baselineBlock.toFixed(3)}`);
        console.log(`Latest Block Ratio: ${latestBlock.toFixed(3)}`);
        console.log(`Block Drift: ${blockDrift.toFixed(3)}`);

        if (approvalDrift > 0.05 || blockDrift > 0.05) {
            console.log('🚨 Significant governance drift detected!');
            console.log('Recommendations:');
            console.log('- Review recent policy changes');
            console.log('- Check for anomalous command patterns');
            console.log('- Validate approval workflows');
        } else {
            console.log('✅ No significant governance drift detected');
        }
    }

    generateReport() {
        console.log('\n=== Comprehensive Governance Analytics Report ===');
        console.log(`Report Generated: ${new Date().toISOString()}`);
        console.log(`Total Artifacts Analyzed: ${this.artifacts.length}`);

        if (this.artifacts.length === 0) return;

        const latest = this.artifacts[this.artifacts.length - 1];
        console.log(`Latest Run: ${latest.runId}`);
        console.log(`Latest Timestamp: ${latest.timestamp}`);

        console.log('\nAggregate Metrics Across All Runs:');
        const totals = this.artifacts.reduce((acc, artifact) => {
            const s = artifact.aggregateSummary;
            return {
                totalCommands: acc.totalCommands + s.totalCommands,
                totalApprovals: acc.totalApprovals + s.totalApprovals,
                totalBlocks: acc.totalBlocks + s.totalBlocks,
                totalDriftRecs: acc.totalDriftRecs + s.totalDriftRecommendations,
                runCount: acc.runCount + 1
            };
        }, { totalCommands: 0, totalApprovals: 0, totalBlocks: 0, totalDriftRecs: 0, runCount: 0 });

        console.log(`Total Runs: ${totals.runCount}`);
        console.log(`Total Commands Processed: ${totals.totalCommands}`);
        console.log(`Total Approvals: ${totals.totalApprovals}`);
        console.log(`Total Blocks: ${totals.totalBlocks}`);
        console.log(`Total Drift Recommendations: ${totals.totalDriftRecs}`);
        console.log(`Overall Approval Rate: ${((totals.totalApprovals / totals.totalCommands) * 100).toFixed(1)}%`);
        console.log(`Overall Block Rate: ${((totals.totalBlocks / totals.totalCommands) * 100).toFixed(1)}%`);

        // Run frequency analysis
        const timestamps = this.artifacts.map(a => new Date(a.timestamp));
        if (timestamps.length > 1) {
            const intervals = [];
            for (let i = 1; i < timestamps.length; i++) {
                intervals.push(timestamps[i] - timestamps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const avgIntervalHours = (avgInterval / (1000 * 60 * 60)).toFixed(1);
            console.log(`Average Time Between Runs: ${avgIntervalHours} hours`);
        }

        console.log('\n=== End Report ===');
    }
}

// CLI handling
const args = process.argv.slice(2);
const analytics = new MockGovernanceAnalytics();

if (args.includes('--help')) {
    console.log(`
Mock Governance Analytics Tool

Usage: node scripts/mockGovernanceAnalytics.js [options]

Options:
  --compare <runId1> <runId2>  Compare two specific runs
  --trend <days>               Analyze trends over last N days (default: 7)
  --drift                      Focus on governance drift detection
  --report                     Generate comprehensive report
  --help                       Show this help

Examples:
  node scripts/mockGovernanceAnalytics.js --report
  node scripts/mockGovernanceAnalytics.js --trend 3
  node scripts/mockGovernanceAnalytics.js --compare run1 run2
  node scripts/mockGovernanceAnalytics.js --drift
`);
} else if (args.includes('--compare')) {
    const idx = args.indexOf('--compare');
    if (args.length > idx + 2) {
        analytics.compareRuns(args[idx + 1], args[idx + 2]);
    } else {
        console.error('Usage: --compare <runId1> <runId2>');
    }
} else if (args.includes('--trend')) {
    const idx = args.indexOf('--trend');
    const days = args.length > idx + 1 ? parseInt(args[idx + 1]) : 7;
    analytics.analyzeTrends(days);
} else if (args.includes('--drift')) {
    analytics.detectDrift();
} else if (args.includes('--report')) {
    analytics.generateReport();
} else {
    // Default: show summary and recent trends
    analytics.generateReport();
    analytics.analyzeTrends(7);
    analytics.detectDrift();
}
