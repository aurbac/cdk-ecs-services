#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkEcsServicesStack } from '../lib/cdk-ecs-services-stack';

const app = new cdk.App();
new CdkEcsServicesStack(app, 'CdkEcsServicesStack');
