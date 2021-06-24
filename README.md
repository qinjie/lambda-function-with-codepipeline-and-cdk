# Deploy Lambda Function (Python) through Codepipeline and CDK

## Folder Structure

```
├── README.md
├── bin
├── cdk.json
├── cdk.out
├── lambda
├── lib
├── node_modules
├── package.json
```

- The `lambda` folder contains source code of a lambda function. This folder is referenced in CDK project to create lambda function stack.
- Other folders & files are usual CDK prjoect files/folders.

### Lambda Folder

```
├── .env
├── .gitignore
├── main.py
└── requirements.txt
```

- The `main.py` file contains a function `lambda_handler()` which is used as lambda function.
- The `requirements.txt` contains dependencies.
- The `.env` contains environment variables for the labmda function.
- If there is any other dependency library files, keep them within lambda folder too.

### Stacks

This proejct contains 2 stacks, one for pipeline and another one for lambda function.

## Deployment

### By CDK Function

1. Update constants defined in `bin/pipeline.ts` file, e.g. `CODECOMMIT_REPO_NAME`, `LAMBDA_FOLDER`.
2. Make sure codecommit project is ready.
3. Push all source code intot he project.
4. Deploy the stack for the pipeline.

```
cdk deploy PipelineDeployingLambdaStack
```

The stack for lambda function will be deployed automatically when pipeline is created.

### By AWS Console

For any reason if you cannot run CDK function in your AWS account, you can generate CloudFormation files using CDK, and deploy the stack using the CloudFormation file in `cdk.out` folder.

```bash
cdk synth
```
