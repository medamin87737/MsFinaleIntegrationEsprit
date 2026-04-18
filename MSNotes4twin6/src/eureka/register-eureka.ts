import { Eureka } from 'eureka-js-client';
import * as os from 'os';

function resolveHostIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      const fam = net.family as string | number;
      const v4 = fam === 'IPv4' || fam === 4;
      if (v4 && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

export interface EurekaRegisterOptions {
  appName: string;
  port: number;
  eurekaHost?: string;
  eurekaPort?: number;
}

export function startEurekaClient(options: EurekaRegisterOptions): Eureka {
  const ip = process.env.EUREKA_IP ?? resolveHostIp();
  const eurekaHost = options.eurekaHost ?? process.env.EUREKA_HOST ?? 'localhost';
  const eurekaPort = Number(options.eurekaPort ?? process.env.EUREKA_PORT ?? 8761);

  const client = new Eureka({
    instance: {
      app: options.appName,
      instanceId: `${options.appName}:${ip}:${options.port}`,
      hostName: ip,
      ipAddr: ip,
      status: 'UP',
      port: { $: options.port, '@enabled': 'true' },
      vipAddress: options.appName,
      homePageUrl: `http://${ip}:${options.port}/`,
      statusPageUrl: `http://${ip}:${options.port}/health`,
      healthCheckUrl: `http://${ip}:${options.port}/health`,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: '/eureka/apps/',
    },
  });

  client.start((err?: Error) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('Eureka registration failed:', err.message);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Eureka: registered ${options.appName} at ${ip}:${options.port}`);
    }
  });

  return client;
}
