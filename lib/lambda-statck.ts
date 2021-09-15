import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import * as path from "path";
import { loadEnv } from "../cdk-common/stack-utils";

export interface LambdaStackProps extends cdk.StackProps {
  project_code: string;
  lambda_name: string;
  handler?: string;
  runtime?: lambda.Runtime;
  timeout?: cdk.Duration;
  environment?: {
    [key: string]: string;
  };
}

export class LambdaStack extends cdk.Stack {
  public default_props: LambdaStackProps = {
    project_code: "",
    lambda_name: "noname",
    handler: "main.lambda_handler",
    runtime: lambda.Runtime.PYTHON_3_8,
    timeout: cdk.Duration.seconds(30),
    environment: {},
  };

  public lambdaCode: lambda.CfnParametersCode;

  constructor(app: cdk.App, id: string, props: LambdaStackProps) {
    super(app, id, props);

    props = {
      ...this.default_props,
      ...props,
    };

    this.lambdaCode = lambda.Code.fromCfnParameters();

    const func = new lambda.Function(this, props.lambda_name!, {
      code: this.lambdaCode,
      handler: props!.handler!,
      runtime: props!.runtime!,
      description: `Function for project ${props.project_code}`,
      environment: props.environment,
    });

    const alias = new lambda.Alias(this, "LambdaAlias", {
      aliasName: "uat",
      version: func.currentVersion,
    });

    const application = new codedeploy.LambdaApplication(
      this,
      "CodeDeployApplication",
      {
        applicationName: `${props.project_code}`,
      }
    );

    new codedeploy.LambdaDeploymentGroup(this, "DeploymentGroup", {
      application,
      alias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });
  }
}
