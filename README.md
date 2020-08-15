![Deploy Backend](https://github.com/cisagov/crossfeed/workflows/Backend%20Pipeline/badge.svg?branch=master)
![Deploy Frontend](https://github.com/cisagov/crossfeed/workflows/Frontend%20Pipeline/badge.svg?branch=master)
![Deploy Infrastructure](https://github.com/cisagov/crossfeed/workflows/Deploy%20Infrastructure/badge.svg?branch=master)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

# Crossfeed

Crossfeed is a tool that continuously enumerates and monitors an organization's public-facing attack surface in order to discover assets and flag potential security flaws. By operating in either passive or active scanning modes, Crossfeed collects data from a variety of open source tools and data feeds to provide actionable information about organization assets. Crossfeed is offered as a self-service portal and allows customers to view reports and customize scans performed.

Crossfeed is a collaboration between the [Cybersecurity and Infrastructure Security Agency](https://www.cisa.gov/) and the [Defense Digital Service](https://dds.mil/).

## Documentation

See [https://cisagov.github.io/crossfeed/](https://cisagov.github.io/crossfeed/) for documentation on both how to use Crossfeed and how to contribute to it.

## Public domain

This project is in the worldwide [public domain](LICENSE.md).

This project is in the public domain within the United States, and
copyright and related rights in the work worldwide are waived through
the [CC0 1.0 Universal public domain
dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0
dedication. By submitting a pull request, you are agreeing to comply
with this waiver of copyright interest.



# notes

[
  {
    attachments: [ [Object] ],
    availabilityZone: 'us-east-1b',
    clusterArn: 'arn:aws:ecs:us-east-1:563873274798:cluster/crossfeed-staging-worker',
    containers: [ [Object] ],
    cpu: '256',
    createdAt: 2020-08-14T17:45:34.226Z,
    desiredStatus: 'RUNNING',
    group: 'family:crossfeed-staging-worker',
    lastStatus: 'PROVISIONING',
    launchType: 'FARGATE',
    memory: '512',
    overrides: { containerOverrides: [Array], inferenceAcceleratorOverrides: [] },
    platformVersion: '1.4.0',
    tags: [],
    taskArn: 'arn:aws:ecs:us-east-1:563873274798:task/ab39e075-284d-431d-9e21-50b15f3854d2',
    taskDefinitionArn: 'arn:aws:ecs:us-east-1:563873274798:task-definition/crossfeed-staging-worker:2',
    version: 1
  }
]

{
    "version": "0",
    "id": "894b524e-14de-560e-a4ac-a644ba56d06b",
    "detail-type": "ECS Task State Change",
    "source": "aws.ecs",
    "account": "563873274798",
    "time": "2020-08-14T18:06:47Z",
    "region": "us-east-1",
    "resources": [
        "arn:aws:ecs:us-east-1:563873274798:task/eeccdb34-d8cf-49e7-b379-1cf4f123c0ee"
    ],
    "detail": {
        "attachments": [
            {
                "id": "5ff58204-1180-48ab-a62e-0a65a17cc4ef",
                "type": "eni",
                "status": "DELETED",
                "details": [
                    {
                        "name": "subnetId",
                        "value": "subnet-04ba0f3d6e8907049"
                    },
                    {
                        "name": "networkInterfaceId",
                        "value": "eni-062ba0e2fab1ce236"
                    },
                    {
                        "name": "macAddress",
                        "value": "0a:93:85:a9:79:97"
                    },
                    {
                        "name": "privateIPv4Address",
                        "value": "10.0.3.61"
                    }
                ]
            }
        ],
        "availabilityZone": "us-east-1b",
        "clusterArn": "arn:aws:ecs:us-east-1:563873274798:cluster/crossfeed-staging-worker",
        "containers": [
            {
                "containerArn": "arn:aws:ecs:us-east-1:563873274798:container/75d926f3-c850-4722-a143-639f02ff4756",
                "exitCode": 1,
                "lastStatus": "STOPPED",
                "name": "main",
                "image": "563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest",
                "imageDigest": "sha256:080467614c0d7d5a5b092023b762931095308ae1dec8e54481fbd951f9784391",
                "runtimeId": "eeccdb34-d8cf-49e7-b379-1cf4f123c0ee-3935363592",
                "taskArn": "arn:aws:ecs:us-east-1:563873274798:task/eeccdb34-d8cf-49e7-b379-1cf4f123c0ee",
                "networkInterfaces": [
                    {
                        "attachmentId": "5ff58204-1180-48ab-a62e-0a65a17cc4ef",
                        "privateIpv4Address": "10.0.3.61"
                    }
                ],
                "cpu": "0"
            }
        ],
        "createdAt": "2020-08-14T18:05:49.598Z",
        "launchType": "FARGATE",
        "cpu": "256",
        "memory": "512",
        "desiredStatus": "STOPPED",
        "group": "family:crossfeed-staging-worker",
        "lastStatus": "STOPPED",
        "overrides": {
            "containerOverrides": [
                {
                    "environment": [
                    ],
                    "name": "main"
                }
            ]
        },
        "connectivity": "CONNECTED",
        "connectivityAt": "2020-08-14T18:05:55.246Z",
        "pullStartedAt": "2020-08-14T18:06:09.694Z",
        "startedAt": "2020-08-14T18:06:20.694Z",
        "stoppingAt": "2020-08-14T18:06:23.679Z",
        "stoppedAt": "2020-08-14T18:06:47.229Z",
        "pullStoppedAt": "2020-08-14T18:06:16.694Z",
        "executionStoppedAt": "2020-08-14T18:06:23Z",
        "stoppedReason": "Essential container in task exited",
        "stopCode": "EssentialContainerExited",
        "updatedAt": "2020-08-14T18:06:47.229Z",
        "taskArn": "arn:aws:ecs:us-east-1:563873274798:task/eeccdb34-d8cf-49e7-b379-1cf4f123c0ee",
        "taskDefinitionArn": "arn:aws:ecs:us-east-1:563873274798:task-definition/crossfeed-staging-worker:2",
        "version": 5,
        "platformVersion": "1.4.0"
    }
}

lastStatus values:

PROVISIONING
PENDING
RUNNING
DEPROVISIONING
STOPPED

TODO: logs: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/crossfeed-staging-worker/log-events/worker$252Fmain$252F0b9c67e2-3a92-49bb-87b3-62adb7cf0451