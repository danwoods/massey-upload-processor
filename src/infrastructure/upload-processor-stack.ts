import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class UploadProcessorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference to existing S3 bucket
    const bucket = s3.Bucket.fromBucketName(this, 'PromoterBucket', 'promoter-2');

    // Lambda function for processing uploads
    const processorFunction = new lambda.Function(this, 'UploadProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
    });

    // Grant Lambda permissions to read from and write to S3
    bucket.grantReadWrite(processorFunction);

    // Grant Lambda permission to get object metadata
    processorFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectMetadata',
        's3:PutObject',
        's3:ListBucket',
      ],
      resources: [
        bucket.bucketArn,
        `${bucket.bucketArn}/*`,
      ],
    }));

    // Add S3 trigger for object creation
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      {
        suffix: '.mp3',
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      {
        suffix: '.flac',
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorFunction),
      {
        suffix: '.wav',
      }
    );

    // Output the function name
    new cdk.CfnOutput(this, 'ProcessorFunctionName', {
      value: processorFunction.functionName,
      description: 'Name of the upload processor Lambda function',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket being monitored',
    });
  }
}