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
  }
  return Dockerode;
});

jest.mock('aws-sdk', () => ({
  ECS: jest.fn().mockImplementation(() => ({
    listTasks: (e) => ({
      promise: async () => ({
        taskArns: [
          'arn:aws:ecs:us-east-1:957221700844:task/dfd16a90-f944-4387-953f-694071ae95b6',
          'arn:aws:ecs:us-east-1:957221700844:task/dfd16a90-f944-4387-953f-694071ae95b7'
        ]
      })
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
