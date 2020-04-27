#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { EcsAppStack } from '../lib/ecs-app-stack';

const app = new cdk.App();

new EcsAppStack(app, 'App1', { 
    appName: 'app1',
    env: { region: 'us-east-2' } 
});

/*new EcsAppStack(app, 'App2', { 
    appName: 'app2',
    env: { region: 'us-west-2' } 
});*/

app.synth();