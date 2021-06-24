import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";

export interface LambdaStackProps extends cdk.StackProps {
  readonly handler: string;
  readonly runtime: lambda.Runtime;
  readonly lambdaName: string;
  readonly environment: {};
  readonly timeout: cdk.Duration;
}

export class LambdaStack extends cdk.Stack {
  public default_props = {
    handler: "main.lambda_handler",
    runtime: lambda.Runtime.PYTHON_3_8,
    lambdaName: "Lambda",
    timeout: cdk.Duration.seconds(30),
    environment: {},
  };
  public readonly lambdaCode: lambda.CfnParametersCode;

  public env_values = {};

  constructor(app: cdk.App, id: string, props?: LambdaStackProps) {
    super(app, id, props);

    // Set default value for handlerName
    props = {
      ...this.default_props,
      ...props,
    };

    this.lambdaCode = lambda.Code.fromCfnParameters();
    const func = new lambda.Function(this, props.lambdaName!, {
      code: this.lambdaCode,
      handler: props!.handler,
      runtime: props!.runtime,
      description: `Function generated on: ${new Date().toISOString()}`,
      environment: props.environment!,
    });

    const alias = new lambda.Alias(this, "LambdaAlias", {
      aliasName: "Prod",
      version: func.currentVersion,
    });

    new codedeploy.LambdaDeploymentGroup(this, "DeploymentGroup", {
      alias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });
  }
}
