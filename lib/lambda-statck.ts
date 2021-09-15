import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import * as path from "path";
import { loadEnv } from "../cdk-common/stack-utils";

export interface LambdaStackProps extends cdk.StackProps {
  project_code: string;
  src_folder: string;
  handler: string;
  runtime: lambda.Runtime;
  lambda_name: string;
  timeout: cdk.Duration;
}

export class LambdaStack extends cdk.Stack {
  public default_props = {
    handler: "main.lambda_handler",
    runtime: lambda.Runtime.PYTHON_3_8,
    lambdaName: "Lambda",
    timeout: cdk.Duration.seconds(30),
  };
  public lambdaCode: lambda.CfnParametersCode;

  constructor(app: cdk.App, id: string, props: LambdaStackProps) {
    super(app, id, props);

    const env = loadEnv(path.join(__dirname, "..", props.src_folder, ".env"));

    this.lambdaCode = lambda.Code.fromCfnParameters();
    const func = new lambda.Function(this, props.lambda_name!, {
      code: this.lambdaCode,
      handler: props!.handler,
      runtime: props!.runtime,
      description: `Function for project ${props.project_code}`,
      environment: env,
    });

    const alias = new lambda.Alias(this, "LambdaAlias", {
      aliasName: "uat",
      version: func.currentVersion,
    });

    const dg = new codedeploy.LambdaDeploymentGroup(this, "DeploymentGroup", {
      alias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });
  }
}
