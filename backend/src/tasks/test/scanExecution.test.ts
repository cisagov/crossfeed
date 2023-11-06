import { handler } from '../scanExecution';

describe('Scan Execution', () => {
  it('should handle the "shodan" scriptType', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const event = {
      Records: [
        {
          body: JSON.stringify({ scriptType: 'shodan' }),
        },
      ],
    };

    const result = await handler(event, {} as any, () => void 0);

    expect(consoleLogSpy).toHaveBeenCalledWith({ scriptType: 'shodan' });
    expect(result).toEqual({ statusCode: 500, body: 'JSON.stringify(error)' });

    consoleLogSpy.mockRestore();
  });

  it('should handle an unsupported scriptType', async () => {

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const event = {
      Records: [
        {
          body: JSON.stringify({ scriptType: 'unsupported' }),
        },
      ],
    };

    const result = await handler(event, {} as any, () => void 0);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Shodan is the only script type available right now.'
    );
    expect(result).toEqual({ statusCode: 500, body: 'JSON.stringify(error)' });

    consoleLogSpy.mockRestore();
  });
});
