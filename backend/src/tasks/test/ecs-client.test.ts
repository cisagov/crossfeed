import ECSClient from '../ecs-client';

jest.mock('dockerode', () => {
  class Dockerode {
    listContainers = () => [
      {
        Id: '63eaa36a2c7647ddda10f0a69a77ec6fcf19aa34d7c81eb2d0db91054e692da6',
        Names: ['/crossfeed_backend_1'],
        Image: 'crossfeed_backend',
        ImageID:
          'sha256:2549cb8e477fc0999d8ee5f0e3c1a4a1d7300a7f84e550dd3baf5c40a70e089a',
        Command: 'docker-entrypoint.sh npx ts-node-dev src/api-dev.ts',
        Created: 1598133651,
        Ports: [{}],
        Labels: {
          'com.docker.compose.config-hash':
            'd91655ed853821d450e1a6be368a02216a73984da23bbd23d957ff5dfae26abd',
          'com.docker.compose.container-number': '1',
          'com.docker.compose.oneoff': 'False',
          'com.docker.compose.project': 'crossfeed',
          'com.docker.compose.project.config_files': 'docker-compose.yml',
          'com.docker.compose.project.working_dir': '/Users/.../crossfeed',
          'com.docker.compose.service': 'backend',
          'com.docker.compose.version': '1.26.2'
        },
        State: 'running',
        Status: 'Up 3 hours',
        HostConfig: { NetworkMode: 'crossfeed_default' },
        NetworkSettings: { Networks: {} },
        Mounts: []
      }
    ];
    getContainer = () => ({
      logs: () => `123456782020-08-24T20:43:02.017719500Z (DOCKER LOGS)commandOptions are {
123456782020-08-24T20:43:02.017758400Z   organizationId: '174e9a8c-5c09-4194-b04f-b0d50c171bd1',
123456782020-08-24T20:43:02.017832700Z   organizationName: 'cisa',
123456782020-08-24T20:43:02.017865500Z   scanId: '372164e6-8df8-48d3-90a5-1319487c3ad2',
123456782020-08-24T20:43:02.017877600Z   scanName: 'crawl',
123456782020-08-24T20:43:02.017885700Z   scanTaskId: '5382406b-fcb1-40e7-8dd7-bac09dbfdac2'
123456782020-08-24T20:43:02.017896900Z }
123456782020-08-24T20:43:02.019558000Z Running crawl on organization cisa`
    });
  }
  return Dockerode;
});

jest.mock('aws-sdk', () => ({
  ECS: jest.fn().mockImplementation(() => ({
    listTasks: (e) => ({
      promise: async () => ({
        taskArns: [
          'arn:aws:ecs:us-east-1:957221700844:task/crossfeed-staging-worker/dfd16a90-f944-4387-953f-694071ae95b6',
          'arn:aws:ecs:us-east-1:957221700844:task/crossfeed-staging-worker/dfd16a90-f944-4387-953f-694071ae95b7'
        ]
      })
    })
  })),
  CloudWatchLogs: jest.fn().mockImplementation(() => ({
    getLogEvents: (e) => ({
      promise: async () => {
        expect(e).toMatchSnapshot();
        return {
          $response: {
            data: {
              events: [
                {
                  timestamp: 1598447186714,
                  message: '(ECS LOGS)commandOptions are {',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message:
                    "  organizationId: 'f0143eda-0e95-4748-ba49-a53069b1c738',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message: "  organizationName: 'CISA',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message: "  scanId: 'e7ff7e7a-7391-431e-9b9e-437e823be3c9',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message: "  scanName: 'amass',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message:
                    "  scanTaskId: 'fef01b7e-2da3-4508-b27a-3d8be8618488'",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186714,
                  message: '}',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186715,
                  message: 'Running amass on organization CISA',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447186917,
                  message: '=> DB Connected',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: 'Running amass with args [',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  'enum',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  '-ip',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  '-active',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  '-d',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  'cisa.gov',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  '-json',",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: "  '/out-0.6002422193137014.txt'",
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447187004,
                  message: ']',
                  ingestionTime: 1598447188176
                },
                {
                  timestamp: 1598447398914,
                  message: '=> DB Connected',
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: 'amass created/updated 2 new domains',
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: 'Running amass with args [',
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  'enum',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  '-ip',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  '-active',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  '-d',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  'cyber.dhs.gov',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  '-json',",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: "  '/out-0.6002422193137014.txt'",
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447399308,
                  message: ']',
                  ingestionTime: 1598447403181
                },
                {
                  timestamp: 1598447675114,
                  message: '=> DB Connected',
                  ingestionTime: 1598447678181
                },
                {
                  timestamp: 1598447675463,
                  message: 'amass created/updated 23 new domains',
                  ingestionTime: 1598447678181
                }
              ],
              nextForwardToken:
                'f/35646574323683933005741047986357239768293194069041086465',
              nextBackwardToken:
                'b/35646563424217017969097517591536750076621854781830201344'
            }
          }
        };
      }
    })
  }))
}));

describe('getNumTasks', () => {
  test('local', async () => {
    const client = new ECSClient(true);
    expect(await client.getNumTasks()).toEqual(1);
  });
  test('not local', async () => {
    const client = new ECSClient(false);
    expect(await client.getNumTasks()).toEqual(2);
  });
});

describe('getLogs', () => {
  test('local', async () => {
    const client = new ECSClient(true);
    const logs = await client.getLogs('testArn');
    expect(logs).toMatchSnapshot();
    expect(logs).toContain('DOCKER LOGS');
  });
  test('not local', async () => {
    const client = new ECSClient(false);
    const logs = await client.getLogs(
      'arn:aws:ecs:us-east-1:957221700844:task/crossfeed-staging-worker/f59d71c6-3d23-4ee9-ad68-c7b810bf458b'
    );
    expect(logs).toMatchSnapshot();
    expect(logs).toContain('ECS LOGS');
  });
});
