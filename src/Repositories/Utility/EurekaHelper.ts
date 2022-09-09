import { Eureka } from 'eureka-js-client';
import uuid = require('uuid');

const eurekaHost = process.env.EUREKA_SERVER_HOST;
const eurekaPort = parseInt(process.env.EUREKA_SERVER_PORT);
const hostName = process.env.HOSTNAME
const ipAddr = process.env.IP;
const PORT = parseInt(process.env.EXTERNAL_PORT);
const appName = process.env.APP_NAME;

export class EurekaHelper {
  private static client = new Eureka({
    instance: {
      instanceId: hostName + ":" + uuid.v4(),
      app: appName,
      hostName: ipAddr,
      ipAddr: ipAddr,
      statusPageUrl: `http://${ipAddr}:${PORT}/health`,
      healthCheckUrl: `http://${ipAddr}:${PORT}/health`,
      port: {
        '$': PORT,
        '@enabled': <boolean><unknown>'true',
      },
      vipAddress: appName,
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: '/eureka/apps/',
      preferIpAddress: true,
      // maxRetries: 3,
      // requestRetryDelay: 2000,
    },
  })

  private static connectionStatus = false;

  public static Register() {
    // (<any>this.client).logger.level('debug');

    this.client.start(error => {
      console.log(error || (appName + " service registered"))
      this.connectionStatus = !error;
      process.env.MAIN_URL = this.client.getInstancesByAppId("APIGATEWAY")[0].homePageUrl;
    });

    (<any>this.client).on('started', () => {
      console.log("eureka host  " + eurekaHost);
    });

    (<any>this.client).on('deregistered', () => {
      process.exit();
      console.log('after deregistered');
    });

    process.on('SIGINT', this.exitHandler.bind(null, { exit: true, client: this.client }));
  }

  private static exitHandler(options, exitCode) {
    if (options.cleanup) {
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) {
      options.client.stop();
    }
  }

}







