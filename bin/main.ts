#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { PipelineStack } from "../lib/pipeline-stack";
import { LambdaStack } from "../lib/lambda-statck";
import * as path from "path";
import * as dotenv from "dotenv";
import { PermissionsBoundary } from "../cdk-common/permission-boundary";

const CODECOMMIT_REPO_NAME = "lambda-with-cdk-codepipeline";
const LAMBDA_FOLDER = "lambda";

const app = new cdk.App();

// Load .env file
require("dotenv").config();
const MODULE_NAME = process.env.MODULE_NAME || "MyProject";

// Load .env into dictionary
const env_lambda = dotenv.config({
  path: path.join(__dirname, "..", LAMBDA_FOLDER, ".env"),
});

const lambdaStack = new LambdaStack(app, "LambdaStack", {
  handler: "main.lambda_handler",
  runtime: lambda.Runtime.PYTHON_3_8,
  lambdaName: "lambda-with-cdk-pipeline",
  timeout: cdk.Duration.seconds(30),
  environment: {
    ...env_lambda.parsed,
  },
});

if (process.env.AWS_POLICY_PERM_BOUNDARY) {
  cdk.Aspects.of(lambdaStack).add(
    new PermissionsBoundary(process.env.AWS_POLICY_PERM_BOUNDARY)
  );
}

const pipelineStack = new PipelineStack(app, "PipelineStack", {
  lambdaCode: lambdaStack.lambdaCode,
  repoName: CODECOMMIT_REPO_NAME,
  lambdaFolder: LAMBDA_FOLDER,
  pipelineName: "lambda-with-cdk-pipeline",
  artifactBucketName: "codepipeline-artifacts-qinjie",
});

if (process.env.AWS_POLICY_PERM_BOUNDARY) {
  cdk.Aspects.of(pipelineStack).add(
    new PermissionsBoundary(process.env.AWS_POLICY_PERM_BOUNDARY)
  );
}

app.synth();
