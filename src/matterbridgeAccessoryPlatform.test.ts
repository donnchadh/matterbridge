/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

process.argv = ['node', 'matterbridge.test.js', '-frontend', '0', '-profile', 'Jest'];

import { jest } from '@jest/globals';

import { AnsiLogger } from 'node-ansi-logger';
import { Matterbridge } from './matterbridge.js';
import { MatterbridgeAccessoryPlatform } from './matterbridgeAccessoryPlatform.js';

describe('Matterbridge accessory platform', () => {
  beforeAll(async () => {
    jest.spyOn(AnsiLogger.prototype, 'log').mockImplementation((level: string, message: string, ...parameters: any[]) => {
      // console.log(`Mocked log: ${level} - ${message}`, ...parameters);
    });
    jest.spyOn(AnsiLogger.prototype, 'debug').mockImplementation((message: string, ...parameters: any[]) => {
      // console.log(`Mocked debug: ${message}`, ...parameters);
    });
    jest.spyOn(AnsiLogger.prototype, 'info').mockImplementation((message: string, ...parameters: any[]) => {
      // console.log(`Mocked info: ${message}`, ...parameters);
    });
    jest.spyOn(AnsiLogger.prototype, 'warn').mockImplementation((message: string, ...parameters: any[]) => {
      // console.log(`Mocked warn: ${message}`, ...parameters);
    });
    jest.spyOn(AnsiLogger.prototype, 'error').mockImplementation((message: string, ...parameters: any[]) => {
      // console.log(`Mocked error: ${message}`, ...parameters);
    });
  });

  afterAll(async () => {
    (AnsiLogger.prototype.log as jest.Mock).mockRestore();
  }, 60000);

  test('create a MatterbridgeAccessoryPlatform', async () => {
    const matterbridge = await Matterbridge.loadInstance(true);
    expect((Matterbridge as any).instance).toBeDefined();

    const platform = new MatterbridgeAccessoryPlatform(matterbridge, new AnsiLogger({ logName: 'Matterbridge platform' }), { name: 'test', type: 'type', debug: false, unregisterOnShutdown: false });
    expect(platform.type).toBe('AccessoryPlatform');

    // Close the Matterbridge instance
    await matterbridge.destroyInstance();
    expect((Matterbridge as any).instance).toBeUndefined();
  }, 60000);
});
