#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UploadProcessorStack } from './upload-processor-stack';

const app = new cdk.App();

new UploadProcessorStack(app, 'MasseyUploadProcessorStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
});

app.synth();