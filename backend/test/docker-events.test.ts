import { listenForDockerEvents } from '../src/api/docker-events';
import { handler as updateScanTaskStatus } from '../src/tasks/updateScanTaskStatus';
import { Readable } from 'stream';
import waitForExpect from 'wait-for-expect';

jest.mock('../src/tasks/updateScanTaskStatus', () => ({
  handler: jest.fn()
}));

let event;
let stream: Readable;
jest.mock('dockerode', () => {
  class MockDockerode {
    async getEvents() {
      stream = Readable.from([JSON.stringify(event)]);
      return stream;
    }
  }
  return MockDockerode;
});

afterEach(() => {
  if (stream) {
    stream.destroy();
  }
});

test('should listen to a start event', async () => {
  event = {
    status: 'start',
    id: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
    from: 'crossfeed-worker',
    Type: 'container',
    Action: 'start',
    Actor: {
      ID: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
      Attributes: {
        image: 'crossfeed-worker',
        name: 'crossfeed_worker_cisa_censys_2681225'
      }
    },
    scope: 'local',
    time: 1597458556,
    timeNano: 1597458556898095000
  };
  listenForDockerEvents();
  await waitForExpect(() => {
    expect(updateScanTaskStatus).toHaveBeenCalledWith(
      {
        detail: {
          containers: [{}],
          lastStatus: 'RUNNING',
          stopCode: '',
          stoppedReason: '',
          taskArn: 'crossfeed_worker_cisa_censys_2681225'
        }
      },
      expect.anything(),
      expect.anything()
    );
  });
});

test('should listen to a stop event', async () => {
  event = {
    status: 'die',
    id: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
    from: 'crossfeed-worker',
    Type: 'container',
    Action: 'die',
    Actor: {
      ID: '9385a49c58efef1983ba56f5711b16b176f27b973252110e756e408894b3d0e9',
      Attributes: {
        exitCode: '0',
        image: 'crossfeed-worker',
        name: 'crossfeed_worker_cisa_censys_2681225'
      }
    },
    scope: 'local',
    time: 1597458571,
    timeNano: 1597458571266194000
  };
  listenForDockerEvents();
  await waitForExpect(() => {
    expect(updateScanTaskStatus).toHaveBeenCalledWith(
      {
        detail: {
          containers: [{ exitCode: 0 }],
          lastStatus: 'STOPPED',
          stopCode: 'EssentialContainerExited',
          stoppedReason: 'Essential container in task exited',
          taskArn: 'crossfeed_worker_cisa_censys_2681225'
        }
      },
      expect.anything(),
      expect.anything()
    );
  });
});
