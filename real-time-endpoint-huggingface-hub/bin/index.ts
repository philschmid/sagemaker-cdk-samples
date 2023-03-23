#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RealTimeEndpointHuggingfaceStack } from '../lib/sagemaker-endpoint';

const app = new cdk.App();
new RealTimeEndpointHuggingfaceStack(app, 'RealTimeEndpointHuggingfaceStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  HfModelId: 'distilbert-base-uncased-finetuned-sst-2-english',
  HfTask: 'text-classification',
  InstanceType: 'ml.m5.large'
});