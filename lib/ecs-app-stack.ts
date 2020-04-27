import * as cdk from '@aws-cdk/core';

import { GitConstruct } from './ecs-app/git-construct';
import { VpcClusterStack } from './ecs-app/vpc-cluster-stack';
import { EcsServiceStack } from './ecs-app/ecs-service-stack';

interface EcsAppStackProps extends cdk.StackProps{
  appName: string;
}

export class EcsAppStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: EcsAppStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    
    const gitRespository = new GitConstruct(this, 'GitRespository', { 
      repositoryName: props.appName,
      repositoryDescription: 'Git repository for '+props.appName, 
    });
    
    const networkProd = new VpcClusterStack(this, 'NetworkProd', { 
        name: props.appName, 
        cidr: '10.0.0.0/16',
        env: 'prod'
    });

    const service1Prod = new EcsServiceStack(this, 'Service1Prod', { 
        repository: gitRespository.repository, 
        serviceName: props.appName+'-api',
        vpc: networkProd .vpc, 
        cluster: networkProd .cluster, 
        lb: networkProd.lb, 
        path: '/api/', 
        min: 0,
        max: 6,
        env: 'prod',
        branch: 'master'
    });

  /*
  const networkDev = new VpcClusterStack(this, 'NetworkDev', { 
      name: props.appName, 
      cidr: '10.0.0.0/16',
      env: 'dev'
  });

  const service1Dev = new EcsServiceStack(this, 'Service1Dev', { 
      repository: gitRespository.repository, 
      serviceName: props.appName+'-api2',
      vpc: networkDev.vpc, 
      cluster: networkDev.cluster, 
      lb: networkDev.lb, 
      path: '/api2/', 
      min: 0,
      max: 6,
      env: 'dev',
      branch: 'dev'
  });*/

  }
}
