import * as cdk from "@aws-cdk/core";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as s3 from "@aws-cdk/aws-s3";
import * as codecommit from "@aws-cdk/aws-codecommit";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as lambda from "@aws-cdk/aws-lambda";
import {
  createCdkBuildProject,
  createPythonLambdaBuildProject,
} from "../cdk-common/codebuild-projects";

export interface PipelineStackProps extends cdk.StackProps {
  readonly lambdaCode: lambda.CfnParametersCode;
  readonly repoName: string;
  readonly pipelineName?: string;
  readonly artifactBucketName?: string;
  readonly lambdaFolder: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const code = codecommit.Repository.fromRepositoryName(
      this,
      "CodeRepo",
      props.repoName
    );
    const sourceOutput = new codepipeline.Artifact();

    const cdkBuild = createCdkBuildProject(this);
    const cdkBuildOutput = new codepipeline.Artifact("CdkBuildOutput");

    const lambdaBuild = createPythonLambdaBuildProject(
      this,
      props.lambdaFolder
    );
    const lambdaBuildOuptut = new codepipeline.Artifact("LambdaBuildOutput");

    const artifactBucket = props.artifactBucketName
      ? s3.Bucket.fromBucketName(
          this,
          "ArtifactBucket",
          props.artifactBucketName
        )
      : undefined;

    new codepipeline.Pipeline(this, "Pipeline", {
      ...(props.artifactBucketName && { artifactBucket }),
      ...(props.pipelineName && { pipelineName: props.pipelineName }),
      stages: [
        // Source
        {
          stageName: "Source",
          actions: [
            // new codepipeline_actions.CodeCommitSourceAction({
            //   actionName: "CodeCommit_Source",
            //   repository: code,
            //   branch: "master",
            //   output: sourceOutput,
            // }),
            new codepipeline_actions.GitHubSourceAction({
              actionName: "GitHub",
              output: sourceOutput,
              oauthToken: cdk.SecretValue.secretsManager(
                process.env.SECRETS_MANAGER_VAR!
              ),
              owner: process.env.REPO_OWNER!,
              repo: process.env.REPO_NAME!,
              branch: process.env.REPO_BRANCH!,
            }),
          ],
        },
        // Build
        {
          stageName: "Build",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "CDK_Build",
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: "Lambda_Build",
              project: lambdaBuild,
              input: sourceOutput,
              outputs: [lambdaBuildOuptut],
            }),
          ],
        },
        // Deploy
        {
          stageName: "Deploy",
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "Lambda_CFN_DEPLOY",
              templatePath: cdkBuildOutput.atPath("LambdaStack.template.json"),
              stackName: "LambdaDeploymentStack",
              adminPermissions: true,
              parameterOverrides: {
                ...props.lambdaCode.assign(lambdaBuildOuptut.s3Location),
              },
              extraInputs: [lambdaBuildOuptut],
            }),
          ],
        },
      ],
    });
  }
}
