/**
 * Infrastructure Health Client
 * Queries service health from various providers
 * Supports: Datadog, Azure Monitor, generic health endpoints, mock
 */

export interface HealthStatus {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastChecked: Date;
    responseTime?: number;  // ms
    uptime?: number;        // percentage (0-100)
    details?: Record<string, unknown>;
    issues?: string[];
}

export interface InfrastructureHealthClient {
    checkService(serviceName: string): Promise<HealthStatus>;
    checkAllServices(): Promise<HealthStatus[]>;
    queryMetric(name: string, options?: Record<string, unknown>): Promise<number | null>;
}

/**
 * Mock Infrastructure Health Client (for testing)
 * Simulates various infrastructure health scenarios
 */
class MockInfrastructureHealthClient implements InfrastructureHealthClient {
    private services: Map<string, HealthStatus> = new Map([
        [
            'api-server',
            {
                service: 'api-server',
                status: 'healthy',
                lastChecked: new Date(),
                responseTime: 45,
                uptime: 99.9,
            },
        ],
        [
            'database',
            {
                service: 'database',
                status: 'healthy',
                lastChecked: new Date(),
                responseTime: 12,
                uptime: 99.95,
            },
        ],
        [
            'cache',
            {
                service: 'cache',
                status: 'healthy',
                lastChecked: new Date(),
                responseTime: 3,
                uptime: 99.8,
            },
        ],
        [
            'worker-queue',
            {
                service: 'worker-queue',
                status: 'healthy',
                lastChecked: new Date(),
                responseTime: 8,
                uptime: 99.7,
            },
        ],
    ]);

    async checkService(serviceName: string): Promise<HealthStatus> {
        const health = this.services.get(serviceName);
        if (!health) {
            return {
                service: serviceName,
                status: 'unhealthy',
                lastChecked: new Date(),
                issues: [`Service '${serviceName}' not found in health registry`],
            };
        }
        return { ...health, lastChecked: new Date() };
    }

    async checkAllServices(): Promise<HealthStatus[]> {
        return Array.from(this.services.values()).map((h) => ({
            ...h,
            lastChecked: new Date(),
        }));
    }

    async queryMetric(name: string, _options?: Record<string, unknown>): Promise<number | null> {
        // Mock metrics
        const metrics: Record<string, number> = {
            'cpu_usage_percent': 42,
            'memory_usage_percent': 58,
            'disk_usage_percent': 65,
            'db_connections_active': 23,
            'db_connections_max': 100,
            'api_requests_per_sec': 450,
            'api_error_rate': 0.002,
            'recent_incidents_count': 0,
        };
        return metrics[name] || null;
    }

    // Test helper: set service status
    setServiceStatus(serviceName: string, status: HealthStatus): void {
        this.services.set(serviceName, status);
    }

    // Test helper: simulate incident
    simulateIncident(serviceName: string, issue: string): void {
        const health = this.services.get(serviceName);
        if (health) {
            health.status = 'degraded';
            health.issues = [...(health.issues || []), issue];
        }
    }
}

/**
 * Datadog Infrastructure Health Client (stub for future implementation)
 * Uses Datadog API to query monitors, metrics, and incidents
 */
class DatadogInfrastructureHealthClient implements InfrastructureHealthClient {
    private apiKey: string;
    private appKey: string;
    private site: string;

    constructor(
        apiKey = process.env.DATADOG_API_KEY,
        appKey = process.env.DATADOG_APP_KEY,
        site = process.env.DATADOG_SITE || 'datadoghq.com',
    ) {
        if (!apiKey || !appKey) {
            throw new Error('DatadogInfrastructureHealthClient requires DATADOG_API_KEY and DATADOG_APP_KEY');
        }
        this.apiKey = apiKey;
        this.appKey = appKey;
        this.site = site;
    }

    async checkService(serviceName: string): Promise<HealthStatus> {
        // TODO: implement Datadog API call to get monitor status
        throw new Error('DatadogInfrastructureHealthClient.checkService not yet implemented');
    }

    async checkAllServices(): Promise<HealthStatus[]> {
        // TODO: implement Datadog API call to get all monitors
        throw new Error('DatadogInfrastructureHealthClient.checkAllServices not yet implemented');
    }

    async queryMetric(name: string, options?: Record<string, unknown>): Promise<number | null> {
        // TODO: implement Datadog API call to query metrics
        throw new Error('DatadogInfrastructureHealthClient.queryMetric not yet implemented');
    }
}

/**
 * Azure Monitor Infrastructure Health Client (stub for future implementation)
 * Uses Azure Resource Health API and Application Insights
 */
class AzureMonitorInfrastructureHealthClient implements InfrastructureHealthClient {
    private subscriptionId: string;
    private resourceGroup: string;

    constructor(
        subscriptionId = process.env.AZURE_SUBSCRIPTION_ID,
        resourceGroup = process.env.AZURE_RESOURCE_GROUP,
    ) {
        if (!subscriptionId || !resourceGroup) {
            throw new Error('AzureMonitorInfrastructureHealthClient requires AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP');
        }
        this.subscriptionId = subscriptionId;
        this.resourceGroup = resourceGroup;
    }

    async checkService(serviceName: string): Promise<HealthStatus> {
        // TODO: implement Azure Resource Health API call
        throw new Error('AzureMonitorInfrastructureHealthClient.checkService not yet implemented');
    }

    async checkAllServices(): Promise<HealthStatus[]> {
        // TODO: implement Azure Resource Health API call for all resources
        throw new Error('AzureMonitorInfrastructureHealthClient.checkAllServices not yet implemented');
    }

    async queryMetric(name: string, options?: Record<string, unknown>): Promise<number | null> {
        // TODO: implement Azure Monitor metrics API call
        throw new Error('AzureMonitorInfrastructureHealthClient.queryMetric not yet implemented');
    }
}

/**
 * Generic Health Endpoint Client
 * Polls JSON health endpoints (e.g., /health, /ready, /live)
 */
class GenericHealthEndpointClient implements InfrastructureHealthClient {
    private endpoints: Map<string, string> = new Map();

    constructor(endpointUrls = process.env.HEALTH_ENDPOINT_URLS || '') {
        // Parse comma-separated list of endpoints
        if (endpointUrls) {
            endpointUrls.split(',').forEach((url) => {
                const trimmed = url.trim();
                if (trimmed) {
                    const serviceName = new URL(trimmed).hostname || 'unknown';
                    this.endpoints.set(serviceName, trimmed);
                }
            });
        }
    }

    async checkService(serviceName: string): Promise<HealthStatus> {
        const url = this.endpoints.get(serviceName);
        if (!url) {
            return {
                service: serviceName,
                status: 'unhealthy',
                lastChecked: new Date(),
                issues: [`No endpoint configured for service '${serviceName}'`],
            };
        }

        try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            try {
                const response = await fetch(url, { signal: controller.signal });
                const responseTime = Date.now() - startTime;

                if (!response.ok) {
                    return {
                        service: serviceName,
                        status: 'unhealthy',
                        lastChecked: new Date(),
                        responseTime,
                        issues: [`HTTP ${response.status} from ${url}`],
                    };
                }

                const data = (await response.json()) as Record<string, unknown>;
                const status = (data.status as string) || 'healthy';

                return {
                    service: serviceName,
                    status: (status as 'healthy' | 'degraded' | 'unhealthy') || 'healthy',
                    lastChecked: new Date(),
                    responseTime,
                    uptime: data.uptime as number | undefined,
                    details: data,
                };
            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            return {
                service: serviceName,
                status: 'unhealthy',
                lastChecked: new Date(),
                issues: [`Failed to check health: ${error instanceof Error ? error.message : String(error)}`],
            };
        }
    }

    async checkAllServices(): Promise<HealthStatus[]> {
        const results: HealthStatus[] = [];
        for (const serviceName of this.endpoints.keys()) {
            const status = await this.checkService(serviceName);
            results.push(status);
        }
        return results;
    }

    async queryMetric(_name: string, _options?: Record<string, unknown>): Promise<number | null> {
        // TODO: parse metrics from health endpoint responses
        throw new Error('GenericHealthEndpointClient.queryMetric not yet implemented');
    }

    // Helper: add endpoint
    addEndpoint(serviceName: string, url: string): void {
        this.endpoints.set(serviceName, url);
    }
}

/**
 * Factory function to create infrastructure health client
 */
export function createInfrastructureHealthClient(): InfrastructureHealthClient {
    const provider = process.env.RISK_GATE_PROVIDER || 'mock';

    switch (provider) {
        case 'datadog':
            return new DatadogInfrastructureHealthClient();
        case 'azure':
        case 'azure-monitor':
            return new AzureMonitorInfrastructureHealthClient();
        case 'generic':
        case 'health-endpoint':
            return new GenericHealthEndpointClient();
        case 'mock':
        default:
            return new MockInfrastructureHealthClient();
    }
}

/**
 * Singleton getter
 */
let instance: InfrastructureHealthClient | null = null;

export async function getInfrastructureHealthClient(): Promise<InfrastructureHealthClient> {
    if (!instance) {
        instance = createInfrastructureHealthClient();
    }
    return instance;
}

/**
 * Reset instance (for testing)
 */
export function resetInfrastructureHealthClient(): void {
    instance = null;
}

// Export implementations for testing/direct use
export { MockInfrastructureHealthClient, DatadogInfrastructureHealthClient, AzureMonitorInfrastructureHealthClient, GenericHealthEndpointClient };
