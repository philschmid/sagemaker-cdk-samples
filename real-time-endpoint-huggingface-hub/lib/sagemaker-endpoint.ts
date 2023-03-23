import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sagemaker from '@aws-cdk/aws-sagemaker-alpha';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { regionMapping } from './utils';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface RealTimeProps extends cdk.StackProps {
  readonly HfModelId: string;
  readonly HfTask: string;
  readonly InstanceType: string;
}


export class RealTimeEndpointHuggingfaceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RealTimeProps) {
    super(scope, id, props);
    const currentRegion = cdk.Stack.of(this).region;
    // select correct Hugging Face DLC ECR image
    const repositoryName = 'huggingface-pytorch-inference'
    const repositoryArn = `arn:aws:ecr:${currentRegion}:${regionMapping[currentRegion]}:repository/{repositoryName}`
    const repository = Repository.fromRepositoryAttributes(this, 'HuggingFaceRepository', { repositoryArn, repositoryName });

    let tag: string = '1.13-cpu-py39';
    // validate if instance type strats with ml.g or ml.p to use GPU image
    if (props.InstanceType.startsWith('ml.g') || props.InstanceType.startsWith('ml.p')) {
      let tag = '1.13-gpu-py39';
    }
    // select image based on instance type
    const containerImage = sagemaker.ContainerImage.fromEcrRepository(repository, tag);

    // create SageMakerModel
    const model = new sagemaker.Model(this, 'HuggingFaceModel', {
      containers: [
        {
          image: containerImage,
          environment: {
            "HF_MODEL_ID": props.HfModelId, // HuggingFace model ID
            "HF_TASK": props.HfTask // HuggingFace task
          }
        }
      ]
    });
    // create SageMaker endpoint configuration
    const endpointConfig = new sagemaker.EndpointConfig(this, 'EndpointConfig', {
      instanceProductionVariants: [
        {
          model: model,
          variantName: 'primary',
          initialInstanceCount: 1,
          instanceType: new sagemaker.InstanceType(props.InstanceType),
        },
      ]
    });
    // delpoy SageMaker endpoint
    const endpoint = new sagemaker.Endpoint(this, 'Endpoint', { endpointConfig });
  }
}
