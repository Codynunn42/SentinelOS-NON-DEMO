/**
 * Operational Upgrade Faceplane
 * Purpose: Guide users through operational upgrade assessment with delightful UX
 * 
 * This faceplane implements the SENTINEL OPERATIONAL UPGRADE COMMAND ENVELOPE
 * for assessing existing relationships and generating modernization pathways.
 * 
 * Design principles:
 * - Progressive disclosure: reveal information step-by-step
 * - Delightful feedback: use avatars, widgets, and clear messaging
 * - Non-adversarial: frame as modernization, not recovery
 * - Guided flow: lead users through assessment systematically
 */

const ASSESSMENT_PHASES = {
    DISCOVER: 'discover',
    ANALYZE: 'analyze',
    RECOMMEND: 'recommend',
    PLAN: 'plan'
};

const AVATAR_STATES = {
    GREETING: 'greeting',
    LISTENING: 'listening',
    THINKING: 'thinking',
    EXPLAINING: 'explaining',
    CELEBRATING: 'celebrating'
};

const DRIFT_ICONS = {
    authority: '⚡',
    execution: '🔄',
    scope: '📈',
    expectation: '🎯',
    governance: '📋',
    communication: '💬',
    continuity: '🔗'
};

/**
 * Avatar: "Sentinel Guide"
 * Guides user through assessment with personality
 */
function createAvatarWidget(state = {}) {
    const avatarState = state.avatarState || AVATAR_STATES.GREETING;
    const message = state.message || 'Let\'s modernize your operational relationships.';

    return {
        type: 'avatar',
        state: avatarState,
        message,
        guidance: state.guidance || null,
        actions: state.suggestedActions || []
    };
}

/**
 * Phase 1: Discovery Widget
 * Help user identify and load operational relationships
 */
function createDiscoveryWidget(options = {}) {
    const relationships = options.relationships || [];
    const selectedId = options.selectedId || null;

    return {
        phase: ASSESSMENT_PHASES.DISCOVER,
        type: 'discovery',
        title: 'Select a Relationship to Modernize',
        subtitle: 'We\'ll assess how SentinelOS can upgrade operational execution',
        relationships: relationships.map(rel => ({
            id: rel.id,
            name: rel.name,
            type: rel.type,
            status: rel.status,
            lastActive: rel.lastActive,
            icon: rel.icon || '🤝'
        })),
        selectedId,
        widgets: [
            {
                type: 'info-card',
                title: 'What is an Operational Upgrade?',
                content: 'We don\'t replace your agreements. We upgrade how they execute in practice by adding governance, continuity, and auditability.'
            },
            {
                type: 'checklist',
                title: 'Ready to Assess?',
                items: [
                    'Historical operational data available',
                    'Stakeholder alignment on modernization intent',
                    'Governance constraints understood'
                ]
            }
        ]
    };
}

/**
 * Phase 2: Analysis Widget
 * Show drift classification with progressive detail
 */
function createDriftAnalysisWidget(analysis = {}) {
    const drifts = analysis.drifts || [];
    const expanded = analysis.expandedDriftId || null;

    return {
        phase: ASSESSMENT_PHASES.ANALYZE,
        type: 'drift-analysis',
        title: 'Operational Drift Analysis',
        subtitle: 'Where did execution diverge from original expectations?',
        drifts: drifts.map(drift => ({
            id: drift.id,
            type: drift.type,
            icon: DRIFT_ICONS[drift.type] || '❓',
            classification: drift.classification,
            severity: drift.severity,
            evidence: drift.evidence,
            isExpanded: drift.id === expanded,
            summary: drift.summary,
            details: drift.details || null,
            recommendation: drift.recommendation || null
        })),
        progressBar: {
            total: drifts.length,
            resolved: drifts.filter(d => d.classification === 'RESOLVED').length,
            critical: drifts.filter(d => d.severity === 'CRITICAL').length
        }
    };
}

/**
 * Phase 3: Recommendations Widget
 * Show upgrade opportunities with clear value proposition
 */
function createRecommendationsWidget(recommendations = {}) {
    const opportunities = recommendations.opportunities || [];
    const selectedOpportId = recommendations.selectedOpportId || null;

    return {
        phase: ASSESSMENT_PHASES.RECOMMEND,
        type: 'recommendations',
        title: 'Modernization Opportunities',
        subtitle: 'Here\'s how SentinelOS upgrades your operational execution',
        opportunities: opportunities.map((opp, idx) => ({
            id: opp.id || `opp_${idx}`,
            priority: opp.priority || 'medium',
            title: opp.title,
            benefit: opp.benefit,
            timeline: opp.timeline,
            effort: opp.effort,
            impactScore: opp.impactScore || 0.75,
            isSelected: opp.id === selectedOpportId,
            details: opp.details || null,
            nextStep: opp.nextStep || null
        })),
        summary: {
            totalOpportunities: opportunities.length,
            quickWins: opportunities.filter(o => o.effort === 'Low').length,
            highImpact: opportunities.filter(o => o.impactScore > 0.8).length,
            estimatedTimeToValue: recommendations.estimatedTimeToValue || '2-4 weeks'
        }
    };
}

/**
 * Phase 4: Action Plan Widget
 * Guide user to next controlled action
 */
function createActionPlanWidget(plan = {}) {
    const phases = plan.phases || [];
    const currentPhaseIndex = plan.currentPhaseIndex || 0;

    return {
        phase: ASSESSMENT_PHASES.PLAN,
        type: 'action-plan',
        title: 'Your Modernization Roadmap',
        subtitle: 'Progressive steps to operational upgrade',
        phases: phases.map((p, idx) => ({
            index: idx,
            name: p.name,
            duration: p.duration,
            effort: p.effort,
            status: idx < currentPhaseIndex ? 'completed' : idx === currentPhaseIndex ? 'active' : 'pending',
            actions: p.actions || [],
            deliverable: p.deliverable || null
        })),
        nextAction: plan.nextAction || {
            title: 'Create Governance Artifact',
            description: 'Extract and document governance rules as a versioned artifact',
            cta: 'Start Now'
        },
        progressRing: {
            current: currentPhaseIndex + 1,
            total: phases.length
        }
    };
}

/**
 * Explanation Widget
 * Context-sensitive guidance and explanations
 */
function createExplanationWidget(topic = {}) {
    return {
        type: 'explanation',
        title: topic.title || 'What is this?',
        content: topic.content || '',
        examples: topic.examples || [],
        relatedConcepts: topic.relatedConcepts || [],
        learnMore: topic.learnMore || null
    };
}

/**
 * Assessment Summary Widget
 * Show findings in clear, actionable format
 */
function createAssessmentSummaryWidget(assessment = {}) {
    return {
        type: 'assessment-summary',
        relationshipName: assessment.relationshipName,
        assessmentDate: assessment.assessmentDate || new Date().toISOString(),
        findings: {
            driftClassifications: assessment.driftClassifications || [],
            criticalGaps: assessment.criticalGaps || [],
            quickWins: assessment.quickWins || [],
            modernizationScore: assessment.modernizationScore || 0.65
        },
        recommendations: {
            immediate: assessment.immediateActions || [],
            shortTerm: assessment.shortTermActions || [],
            mediumTerm: assessment.mediumTermActions || []
        },
        nextControlledAction: assessment.nextControlledAction || {
            title: 'Schedule Alignment Meeting',
            description: 'Present findings and agree on modernization roadmap',
            stakeholders: [],
            timeline: 'This week'
        }
    };
}

/**
 * Progressive flow builder
 * Guides user through assessment systematically
 */
function buildProgressiveFlow(input = {}) {
    const step = input.step || 0;
    const data = input.data || {};

    const steps = [
        {
            phase: ASSESSMENT_PHASES.DISCOVER,
            widget: createDiscoveryWidget(data.discovery),
            avatar: createAvatarWidget({
                avatarState: AVATAR_STATES.GREETING,
                message: 'Which relationship would you like to modernize?',
                suggestedActions: ['Select a relationship', 'View assessment guide']
            })
        },
        {
            phase: ASSESSMENT_PHASES.ANALYZE,
            widget: createDriftAnalysisWidget(data.analysis),
            avatar: createAvatarWidget({
                avatarState: AVATAR_STATES.THINKING,
                message: 'I\'ve analyzed the operational lineage. Here\'s where drift occurred...',
                guidance: 'Click each to see evidence and recommendations'
            })
        },
        {
            phase: ASSESSMENT_PHASES.RECOMMEND,
            widget: createRecommendationsWidget(data.recommendations),
            avatar: createAvatarWidget({
                avatarState: AVATAR_STATES.EXPLAINING,
                message: 'These are the best opportunities for operational upgrade.',
                guidance: 'Each shows timeline, effort, and expected impact'
            })
        },
        {
            phase: ASSESSMENT_PHASES.PLAN,
            widget: createActionPlanWidget(data.actionPlan),
            avatar: createAvatarWidget({
                avatarState: AVATAR_STATES.CELEBRATING,
                message: 'Your modernization roadmap is ready!',
                guidance: 'Prepare the next controlled action'
            })
        }
    ];

    const currentStep = steps[Math.min(step, steps.length - 1)];

    return {
        currentStep: step,
        totalSteps: steps.length,
        phase: currentStep.phase,
        avatar: currentStep.avatar,
        mainWidget: currentStep.widget,
        navigation: {
            canPrevious: step > 0,
            canNext: step < steps.length - 1,
            canSkip: false,
            stepsDisplay: `${step + 1} of ${steps.length}`
        }
    };
}

/**
 * Delightful feedback messages
 * Context-aware, encouraging messaging
 */
const FEEDBACK_MESSAGES = {
    discoveringRelationship: (name) => ({
        icon: '🔍',
        message: `Scanning ${name} operational vault...`,
        subtext: 'Assembling execution lineage and governance events'
    }),
    driftDetected: (driftType) => ({
        icon: DRIFT_ICONS[driftType] || '🔄',
        message: `${driftType.charAt(0).toUpperCase() + driftType.slice(1)} drift detected`,
        subtext: 'But this is normal—operational expectations evolve.'
    }),
    opportunityFound: (title) => ({
        icon: '💡',
        message: `Opportunity: ${title}`,
        subtext: 'This would significantly improve operational continuity'
    }),
    readyToPlan: () => ({
        icon: '🚀',
        message: 'Your modernization roadmap is ready',
        subtext: 'Prepare the next controlled action this week'
    })
};

/**
 * Module exports
 */
module.exports = {
    // Phases
    ASSESSMENT_PHASES,
    AVATAR_STATES,
    DRIFT_ICONS,

    // Widget creators
    createAvatarWidget,
    createDiscoveryWidget,
    createDriftAnalysisWidget,
    createRecommendationsWidget,
    createActionPlanWidget,
    createExplanationWidget,
    createAssessmentSummaryWidget,

    // Flow builder
    buildProgressiveFlow,

    // Feedback
    FEEDBACK_MESSAGES
};
