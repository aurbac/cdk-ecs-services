import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cloudformaton from '@aws-cdk/aws-cloudformation';

interface EcsServiceStackProps {
  serviceName: string;
  repository: codecommit.Repository;
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  lb: elbv2.ApplicationLoadBalancer;
  path: string;
  min: number;
  max: number;
  env: string;
  branch: string;
}

export class EcsServiceStack extends cloudformaton.NestedStack {

  constructor(scope: cdk.Construct, id: string, props: EcsServiceStackProps) {
    super(scope, id);

    // The code that defines your stack goes here

    const ecr_repository = new ecr.Repository(this, "ECR-"+props.serviceName+"-"+props.env, {
      repositoryName: props.serviceName+"-"+props.env,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });


    const executionRolePolicy =  new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ]
    });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, "TaskDefinition-"+props.serviceName+"-"+props.env, {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    fargateTaskDefinition.addToExecutionRolePolicy(executionRolePolicy);
    /*fargateTaskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [table.tableArn],
      actions: ['dynamodb:*']
    }));*/

    const container = fargateTaskDefinition.addContainer(props.serviceName, {
      // Use an image from Amazon ECR
      image: ecs.ContainerImage.fromRegistry(ecr_repository.repositoryUri),
      environment: { 
        //'DYNAMODB_MESSAGES_TABLE': table.tableName,
        'APP_ID' : props.serviceName,
        'ENV' : props.env
      }
      // ... other options here ...
    });

    container.addPortMappings({
      containerPort: 3000
    });

    const sg_service = new ec2.SecurityGroup(this, "SGService-"+props.serviceName+"-"+props.env, { vpc: props.vpc });
    sg_service.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(3000));

    const service = new ecs.FargateService(this, "Service-"+props.serviceName+"-"+props.env, {
      cluster: props.cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: props.min,
      assignPublicIp: false,
      securityGroup: sg_service
    });

    // Setup AutoScaling policy
    const scaling = service.autoScaleTaskCount({ maxCapacity: props.max, minCapacity: props.min });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60)
    });

  

    const listener = props.lb.addListener("Listener-"+props.serviceName+"-"+props.env, {
      port: 80,
    });

    listener.addTargets("Target-"+props.serviceName+"-"+props.env, {
      port: 80,
      targets: [service],
      healthCheck: { path: props.path }
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');


    const project = new codebuild.PipelineProject(this, "CodeBuildProject-"+props.serviceName+"-"+props.env,{
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true
      },
    });
    const buildRolePolicy =  new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ]
    });
    project.addToRolePolicy(buildRolePolicy);

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      repository: props.repository,
      branch: props.branch,
      output: sourceOutput,
    });
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project,
      input: sourceOutput,
      outputs: [buildOutput],
    });    


    new codepipeline.Pipeline(this, "CodePipeline-"+props.serviceName+"-"+props.env, {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: "ECS-Service",
              service: service, 
              input: buildOutput
            }
            )
          ]
        }
      ],
    });

  }
}
