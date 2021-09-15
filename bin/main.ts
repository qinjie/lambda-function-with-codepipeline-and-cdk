#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { PipelineStack } from "../lib/pipeline-stack";
import { LambdaStack } from "../lib/lambda-statck";
import { PermissionsBoundary } from "../cdk-common/permission-boundary";

/* Load .env file */
require("dotenv").config();

const tags = {
  "Agency-Code": process.env.AGENCY_CODE! || "",
  "Project-Code": process.env.PROJECT_CODE! || "",
  Environment: process.env.ENVIRONMENT! || "",
  Zone: process.env.ZONE! || "",
  Tier: process.env.TIER! || "",
  "Project-Owner": process.env.PROJECT_OWNER! || "",
};

const PROJECT_CODE = process.env.PROJECT_CODE!;
const CODE_REPO_NAME = process.env.CODE_REPO_NAME!;
const CODE_REPO_BRANCH = process.env.CODE_REPO_BRANCH!;
const CODE_REPO_OWNER = process.env.CODE_REPO_OWNER!;
const CODE_REPO_SECRET_VAR = process.env.CODE_REPO_SECRET_VAR!;
const SRC_FOLDER = process.env.SRC_FOLDER!;
const AWS_POLICY_PERM_BOUNDARY = process.env.AWS_POLICY_PERM_BOUNDARY!;
const AWS_CODEPIPELINE_ROLE_ARN = process.env.AWS_CODEPIPELINE_ROLE_ARN!;
const AWS_ARTIFACT_BUCKET_NAME = process.env.AWS_ARTIFACT_BUCKET_NAME!;

const app = new cdk.App();

/* Lambda Stack */
const lambdaName = `${PROJECT_CODE}-lambda`;
const lambdaStack = new LambdaStack(app, lambdaName, {
  project_code: PROJECT_CODE,
  handler: "main.lambda_handler",
  runtime: lambda.Runtime.PYTHON_3_8,
  lambda_name: lambdaName,
  timeout: cdk.Duration.seconds(30),
  src_folder: SRC_FOLDER,
  tags,
});

if (AWS_POLICY_PERM_BOUNDARY) {
  cdk.Aspects.of(lambdaStack).add(
    new PermissionsBoundary(AWS_POLICY_PERM_BOUNDARY)
  );
}

/* Pipeline Stack */
const pipelineStack = new PipelineStack(app, `${PROJECT_CODE}-pipeline`, {
  project_code: PROJECT_CODE,
  code_repo_name: CODE_REPO_NAME,
  lambda_code: lambdaStack.lambdaCode,
  lambda_folder: SRC_FOLDER,
  artifacts_bucket_name: AWS_ARTIFACT_BUCKET_NAME,
  code_repo_branch: CODE_REPO_BRANCH,
  code_repo_owner: CODE_REPO_OWNER,
  code_repo_secret_var: CODE_REPO_SECRET_VAR,
  codepipeline_role_arn: AWS_CODEPIPELINE_ROLE_ARN,
  tags,
});

if (AWS_POLICY_PERM_BOUNDARY) {
  cdk.Aspects.of(pipelineStack).add(
    new PermissionsBoundary(AWS_POLICY_PERM_BOUNDARY)
  );
}

app.synth();
