import * as cdk from '@aws-cdk/core';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as cloudformation from '@aws-cdk/aws-cloudformation';

interface GitStackProps{
  repositoryName: string;
  repositoryDescription: string;
}

export class GitConstruct extends cdk.Construct {

  repository : codecommit.Repository;

  constructor(scope: cdk.Construct, id: string, props: GitStackProps) {
    super(scope, id);

    // The code that defines your stack goes here

    this.repository = new codecommit.Repository(this, 'Repository' ,{
      repositoryName: props.repositoryName,
      description: props.repositoryDescription,
    });

  }
}
