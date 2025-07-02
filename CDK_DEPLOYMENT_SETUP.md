# CDK Deployment Setup

## Problem
The GitHub Actions workflow is failing because the AWS user `promoter-dev` doesn't have sufficient permissions for CDK deployment.

## Solution
Attach the IAM policy in `cdk-deployment-policy.json` to the `promoter-dev` user.

## Steps to Fix

### Option 1: Using AWS Console (Recommended)

1. **Go to AWS IAM Console**
   - Navigate to https://console.aws.amazon.com/iam/
   - Go to "Users" section
   - Find and click on the `promoter-dev` user

2. **Create the Policy**
   - Go to "Policies" section
   - Click "Create policy"
   - Choose "JSON" tab
   - Copy and paste the contents of `cdk-deployment-policy.json`
   - Name it `CDKDeploymentPolicy`
   - Create the policy

3. **Attach the Policy**
   - Go back to the `promoter-dev` user
   - Click "Add permissions"
   - Choose "Attach existing policies directly"
   - Search for and select `CDKDeploymentPolicy`
   - Click "Next" and "Add permissions"

### Option 2: Using AWS CLI

```bash
# Create the policy
aws iam create-policy \
  --policy-name CDKDeploymentPolicy \
  --policy-document file://cdk-deployment-policy.json \
  --description "Policy for CDK deployment permissions"

# Attach the policy to the user
aws iam attach-user-policy \
  --user-name promoter-dev \
  --policy-arn arn:aws:iam::588733981345:policy/CDKDeploymentPolicy
```

### Option 3: Quick Fix (Less Secure)

If you want a quick fix, you can attach the `AdministratorAccess` policy:

```bash
aws iam attach-user-policy \
  --user-name promoter-dev \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

## Key Permissions Included

The policy includes all necessary permissions for CDK deployment:

- **CloudFormation**: Full access for stack management
- **IAM**: Role creation, deletion, and tagging (including the missing `iam:TagRole`)
- **S3**: Full access for CDK assets
- **SSM**: Parameter management for bootstrap version
- **ECR**: Repository management for container assets
- **Lambda**: Function management
- **CloudWatch Logs**: Log group management
- **EventBridge**: Event rule management

## After Applying the Policy

Once you've attached the policy to the `promoter-dev` user:

1. **Push to main** to trigger the GitHub Actions workflow
2. **The workflow should now**:
   - Successfully bootstrap CDK
   - Deploy your Lambda function and S3 triggers
   - Complete the deployment

## Verification

You can verify the deployment worked by:

1. **Checking AWS Lambda Console** for your function
2. **Checking S3 Console** for the trigger setup
3. **Uploading an audio file** to the `promoter-2` bucket to test the functionality 