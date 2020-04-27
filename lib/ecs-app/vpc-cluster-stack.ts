import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cloudformation from '@aws-cdk/aws-cloudformation';

interface VpcClusterStackProps {
  name: string;
  cidr: string;
  env: string;
}

export class VpcClusterStack extends cloudformation.NestedStack {

  vpc : ec2.Vpc;
  cluster: ecs.Cluster;
  lb: elbv2.ApplicationLoadBalancer;

  constructor(scope: cdk.Construct, id: string, props: VpcClusterStackProps) {
    super(scope, id )

    // The code that defines your stack goes here

    this.vpc = new ec2.Vpc(this, "Vpc-"+props.env, {
      cidr: props.cidr,
      natGateways: 1,
      subnetConfiguration: [
        {  cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC, name: "Public" },
        {  cidrMask: 24, subnetType: ec2.SubnetType.PRIVATE, name: "Private" }
        ],
      maxAzs: 2 // Default is all AZs in region
    });

    this.cluster = new ecs.Cluster(this, "Cluster-"+props.env, {
      vpc: this.vpc
    });

    this.lb = new elbv2.ApplicationLoadBalancer(this, "ALB-"+props.env, {
      vpc: this.vpc,
      internetFacing: true
    });
    
  }
}
