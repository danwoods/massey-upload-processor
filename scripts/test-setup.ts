#!/usr/bin/env node

/**
 * Test script to validate environment setup
 */

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';

async function testSetup() {
  console.log('🧪 Testing Massey Upload Processor Setup...\n');

  // Test AWS credentials
  try {
    console.log('1. Testing AWS credentials...');
    const s3Client = new S3Client({ region: 'us-east-2' });
    const response = await s3Client.send(new ListBucketsCommand({}));
    
    const promoterBucket = response.Buckets?.find(bucket => bucket.Name === 'promoter-2');
    if (promoterBucket) {
      console.log('   ✅ AWS credentials valid, promoter-2 bucket found');
    } else {
      console.log('   ⚠️  AWS credentials valid, but promoter-2 bucket not found');
      console.log('   Available buckets:', response.Buckets?.map(b => b.Name).join(', '));
    }
  } catch (error) {
    console.log('   ❌ AWS credentials invalid or insufficient permissions');
    console.log('   Error:', error);
  }

  // Test OpenAI API key
  try {
    console.log('\n2. Testing OpenAI API key...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Test with a simple models list call (cheaper than generating an image)
    const models = await openai.models.list();
    const dalleModels = models.data.filter(model => model.id.includes('dall-e'));
    
    if (dalleModels.length > 0) {
      console.log('   ✅ OpenAI API key valid, DALL-E models available');
      console.log('   Available DALL-E models:', dalleModels.map(m => m.id).join(', '));
    } else {
      console.log('   ⚠️  OpenAI API key valid, but no DALL-E models found');
    }
  } catch (error) {
    console.log('   ❌ OpenAI API key invalid or missing');
    console.log('   Error:', error);
  }

  // Test environment variables
  console.log('\n3. Checking environment variables...');
  const requiredEnvVars = ['OPENAI_API_KEY'];
  let allEnvVarsPresent = true;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`);
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      allEnvVarsPresent = false;
    }
  }

  // Summary
  console.log('\n📋 Setup Summary:');
  console.log('   - Ensure AWS credentials are configured (AWS CLI or environment variables)');
  console.log('   - Ensure OPENAI_API_KEY environment variable is set');
  console.log('   - Run "npm run deploy" to deploy the Lambda function');
  console.log('   - Upload an audio file to promoter-2 bucket to test');

  if (allEnvVarsPresent) {
    console.log('\n🎉 Setup looks good! Ready to deploy.');
  } else {
    console.log('\n⚠️  Please fix the issues above before deploying.');
  }
}

// Run the test
testSetup().catch(console.error);