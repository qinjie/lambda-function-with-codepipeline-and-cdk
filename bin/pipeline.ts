#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { PipelineStack } from "../lib/pipeline-stack";
import { LambdaStack } from "../lib/lambda-statck";
import * as path from "path";
import * as dotenv from "dotenv";

const CODECOMMIT_REPO_NAME = "pipeline2";
const LAMBDA_FOLDER = "lambda";

const app = new cdk.App();

// Load .env into dictionary
const env = dotenv.config({
  path: path.join(__dirname, "..", LAMBDA_FOLDER, ".env"),
});
console.log("ENV:", env.parsed);

const lambdaStack = new LambdaStack(app, "LambdaStack", {
  handler: "main.lambda_handler",
  runtime: lambda.Runtime.PYTHON_3_8,
  lambdaName: "LambdaPython",
  timeout: cdk.Duration.seconds(30),
  environment: {
    ...env.parsed,
  },
});

new PipelineStack(app, "PipelineDeployingLambdaStack", {
  lambdaCode: lambdaStack.lambdaCode,
  repoName: CODECOMMIT_REPO_NAME,
  lambdaFolder: LAMBDA_FOLDER,
  pipelineName: "PipelineDeployingLambda",
  artifactBucketName: "codepipeline-artifacts-qinjie",
});

app.synth();
