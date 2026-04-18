declare module 'eureka-js-client' {
  export interface EurekaInstanceConfig {
    app: string;
    instanceId?: string;
    hostName: string;
    ipAddr: string;
    status?: string;
    port: { $: number; '@enabled': string };
    vipAddress: string;
    homePageUrl?: string;
    statusPageUrl?: string;
    healthCheckUrl?: string;
    dataCenterInfo: {
      '@class': string;
      name: string;
    };
  }

  export interface EurekaClientConfig {
    host: string;
    port: number;
    servicePath: string;
  }

  export class Eureka {
    constructor(config: { instance: EurekaInstanceConfig; eureka: EurekaClientConfig });
    start(callback?: (err?: Error) => void): void;
    stop(callback?: (err?: Error) => void): void;
  }
}
