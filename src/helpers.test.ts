// src\helpers.test.ts

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { jest } from '@jest/globals';

// Mock the function getShellySysUpdate and getShellyMainUpdate
jest.unstable_mockModule('./shelly.js', () => ({
  getShelly: jest.fn(),
  postShelly: jest.fn(),
}));
// Load the mocked module
const { getShelly, postShelly } = await import('./shelly.js');
// Set the return value for the mocked functions
(getShelly as jest.MockedFunction<(api: string, timeout?: number) => Promise<void>>).mockResolvedValue();
(postShelly as jest.MockedFunction<(api: string, data: any, timeout?: number) => Promise<void>>).mockResolvedValue();

import { DeviceTypeId, VendorId, ServerNode, Endpoint, LogFormat as MatterLogFormat, LogLevel as MatterLogLevel, Environment, EndpointServer } from '@matter/main';
import { AggregatorEndpoint, RootEndpoint } from '@matter/main/endpoints';
import { BridgedDeviceBasicInformationServer, OnOffServer } from '@matter/main/behaviors';
import { logEndpoint, MdnsService } from '@matter/main/protocol';
import { AnsiLogger, LogLevel, TimestampFormat } from 'node-ansi-logger';
import { rmSync } from 'node:fs';

import { invokeBehaviorCommand } from './matterbridgeEndpointHelpers.js';
import { addVirtualDevice, addVirtualDevices } from './helpers.js';
import { MatterbridgeEndpoint } from './matterbridgeEndpoint.js';
import { Matterbridge } from './matterbridge.js';

let loggerLogSpy: jest.SpiedFunction<typeof AnsiLogger.prototype.log>;
let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
let consoleDebugSpy: jest.SpiedFunction<typeof console.log>;
let consoleInfoSpy: jest.SpiedFunction<typeof console.log>;
let consoleWarnSpy: jest.SpiedFunction<typeof console.log>;
let consoleErrorSpy: jest.SpiedFunction<typeof console.log>;
const debug = false;

if (!debug) {
  loggerLogSpy = jest.spyOn(AnsiLogger.prototype, 'log').mockImplementation((level: string, message: string, ...parameters: any[]) => {});
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((...args: any[]) => {});
  consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation((...args: any[]) => {});
  consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation((...args: any[]) => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((...args: any[]) => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {});
} else {
  loggerLogSpy = jest.spyOn(AnsiLogger.prototype, 'log');
  consoleLogSpy = jest.spyOn(console, 'log');
  consoleDebugSpy = jest.spyOn(console, 'debug');
  consoleInfoSpy = jest.spyOn(console, 'info');
  consoleWarnSpy = jest.spyOn(console, 'warn');
  consoleErrorSpy = jest.spyOn(console, 'error');
}

describe('Matterbridge Helpers', () => {
  const log = new AnsiLogger({ logName: 'Helpers', logTimestampFormat: TimestampFormat.TIME_MILLIS, logLevel: LogLevel.DEBUG });

  const environment = Environment.default;
  let server: ServerNode<ServerNode.RootEndpoint>;
  let aggregator: Endpoint<AggregatorEndpoint>;
  let device: Endpoint;

  const mockMatterbridge = {
    matterbridgeVersion: '1.0.0',
    matterbridgeInformation: {},
    bridgeMode: 'bridge',
    restartMode: '',
    restartProcess: jest.fn(),
    shutdownProcess: jest.fn(),
    updateProcess: jest.fn(),
    log,
    frontend: {
      wssSendRefreshRequired: jest.fn(),
      wssSendUpdateRequired: jest.fn(),
    },
    nodeContext: {
      set: jest.fn(),
    },
  } as unknown as Matterbridge;

  beforeAll(async () => {
    // Cleanup the matter environment
    rmSync('matterstorage/Helpers', { recursive: true, force: true });
    // Setup the matter environment
    environment.vars.set('log.level', MatterLogLevel.DEBUG);
    environment.vars.set('log.format', MatterLogFormat.ANSI);
    environment.vars.set('path.root', 'matterstorage/Helpers');
    environment.vars.set('runtime.signals', false);
    environment.vars.set('runtime.exitcode', false);
  }, 30000);

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {});

  afterAll(async () => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  test('create the server node', async () => {
    // Create the server node
    server = await ServerNode.create({
      id: 'HelpersServerNode',

      productDescription: {
        name: 'HelpersServerNode',
        deviceType: DeviceTypeId(RootEndpoint.deviceType),
        vendorId: VendorId(0xfff1),
        productId: 0x8001,
      },

      // Provide defaults for the BasicInformation cluster on the Root endpoint
      basicInformation: {
        vendorId: VendorId(0xfff1),
        vendorName: 'Matter test',
        productId: 0x8001,
        productName: 'Matterbridge',
        productLabel: 'HelpersServerNode',
        nodeLabel: 'HelpersServerNode',
        hardwareVersion: 1,
        softwareVersion: 1,
        reachable: true,
      },
    });
    expect(server).toBeDefined();
  });

  test('create the aggregator', async () => {
    // Create the aggregator
    aggregator = new Endpoint(AggregatorEndpoint, { id: 'HelpersAggregator' });
    expect(aggregator).toBeDefined();
    expect(aggregator.lifecycle.isReady).toBeFalsy();
  });

  test('add the aggregator', async () => {
    // Add the aggregator to the server
    expect(aggregator).toBeDefined();
    expect(aggregator.lifecycle.isReady).toBeFalsy();
    await server.add(aggregator);
    expect(aggregator.lifecycle.isReady).toBeTruthy();
  });

  test('start the server node', async () => {
    // Run the server
    await server.start();
    expect(server.lifecycle.isReady).toBeTruthy();
    expect(server.lifecycle.isOnline).toBeTruthy();
  });

  test('log the server node', async () => {
    expect(server).toBeDefined();
    // logEndpoint(EndpointServer.forEndpoint(server));
  });

  test('add a virtual device', async () => {
    expect(aggregator).toBeDefined();
    device = await addVirtualDevice(aggregator, 'Test Device', async () => {
      // Callback function when the device is turned on
      console.log('Device turned on');
    });
    expect(device).toBeDefined();
    expect(device.lifecycle.isReady).toBeTruthy();
    expect(device.id).toBe('TestDevice');
    expect(device.stateOf(BridgedDeviceBasicInformationServer).nodeLabel).toBe('Test Device');
    expect(device.stateOf(OnOffServer).onOff).toBe(false);
    expect(aggregator.parts.has('TestDevice')).toBeTruthy();
    // logEndpoint(EndpointServer.forEndpoint(device));
  });

  test('send command to the virtual device', async () => {
    expect(device).toBeDefined();
    expect(device.lifecycle.isReady).toBeTruthy();
    expect(device.stateOf(OnOffServer).onOff).toBe(false);
    expect(await invokeBehaviorCommand(device as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith('Device turned on');
    expect(device.stateOf(OnOffServer).onOff).toBe(false);
  });

  test('add all the virtual devices', async () => {
    expect(aggregator).toBeDefined();
    await addVirtualDevices(mockMatterbridge, aggregator);
    expect(aggregator.parts.has('TestDevice')).toBeTruthy();
    expect(aggregator.parts.has('UpdateMatterbridge')).toBeTruthy();
    expect(aggregator.parts.has('RestartMatterbridge')).toBeTruthy();
    expect(aggregator.parts.has('RebootMatterbridge')).toBeFalsy();
  });

  test('send command restart to the virtual device', async () => {
    const restartDevice = aggregator.parts.get('RestartMatterbridge');
    expect(restartDevice).toBeDefined();
    if (!restartDevice) return;
    expect(restartDevice.stateOf(OnOffServer).onOff).toBe(false);
    expect(await invokeBehaviorCommand(restartDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    expect(mockMatterbridge.restartProcess).toHaveBeenCalled();
    expect(restartDevice.stateOf(OnOffServer).onOff).toBe(false);

    mockMatterbridge.restartMode = 'service';
    expect(await invokeBehaviorCommand(restartDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    expect(mockMatterbridge.shutdownProcess).toHaveBeenCalled();
    expect(restartDevice.stateOf(OnOffServer).onOff).toBe(false);
  });

  test('send command update to the virtual device', async () => {
    const updateDevice = aggregator.parts.get('UpdateMatterbridge');
    expect(updateDevice).toBeDefined();
    if (!updateDevice) return;
    expect(updateDevice.stateOf(OnOffServer).onOff).toBe(false);
    expect(await invokeBehaviorCommand(updateDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    expect(mockMatterbridge.updateProcess).toHaveBeenCalled();
    expect(updateDevice.stateOf(OnOffServer).onOff).toBe(false);
  });

  test('add all the virtual devices with shelly parameter', async () => {
    const restartDevice = aggregator.parts.get('RestartMatterbridge');
    await restartDevice?.delete();
    const updateDevice = aggregator.parts.get('UpdateMatterbridge');
    await updateDevice?.delete();

    process.argv.push('-shelly');
    expect(aggregator).toBeDefined();
    await addVirtualDevices(mockMatterbridge, aggregator);
    expect(aggregator.parts.has('TestDevice')).toBeTruthy();
    expect(aggregator.parts.has('UpdateMatterbridge')).toBeTruthy();
    expect(aggregator.parts.has('RestartMatterbridge')).toBeTruthy();
    expect(aggregator.parts.has('RebootMatterbridge')).toBeTruthy();
  });

  test('send command update to the shelly device', async () => {
    const updateDevice = aggregator.parts.get('UpdateMatterbridge');
    expect(updateDevice).toBeDefined();
    if (!updateDevice) return;
    expect(updateDevice.stateOf(OnOffServer).onOff).toBe(false);
    expect(await invokeBehaviorCommand(updateDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(getShelly).toHaveBeenCalledWith('/api/updates/sys/perform', 10 * 1000);
    expect(getShelly).toHaveBeenCalledWith('/api/updates/main/perform', 10 * 1000);
    expect(updateDevice.stateOf(OnOffServer).onOff).toBe(false);

    jest.clearAllMocks();
    (getShelly as jest.MockedFunction<(api: string, timeout?: number) => Promise<void>>).mockRejectedValue(Error('Jest error'));
    expect(await invokeBehaviorCommand(updateDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(getShelly).toHaveBeenCalledWith('/api/updates/sys/perform', 10 * 1000);
    expect(getShelly).toHaveBeenCalledWith('/api/updates/main/perform', 10 * 1000);
  });

  test('send command reboot to the shelly device', async () => {
    const rebootDevice = aggregator.parts.get('RebootMatterbridge');
    expect(rebootDevice).toBeDefined();
    if (!rebootDevice) return;
    expect(rebootDevice.stateOf(OnOffServer).onOff).toBe(false);
    expect(await invokeBehaviorCommand(rebootDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(postShelly).toHaveBeenCalledWith('/api/system/reboot', {}, 60 * 1000);
    expect(rebootDevice.stateOf(OnOffServer).onOff).toBe(false);

    jest.clearAllMocks();
    (postShelly as jest.MockedFunction<(api: string, data: any, timeout?: number) => Promise<void>>).mockRejectedValue(Error('Jest error'));
    expect(await invokeBehaviorCommand(rebootDevice as unknown as MatterbridgeEndpoint, OnOffServer, 'on')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(postShelly).toHaveBeenCalledWith('/api/system/reboot', {}, 60 * 1000);
  });

  test('close server node', async () => {
    // Close the server
    expect(server).toBeDefined();
    await server.close();
    expect(server.lifecycle.isReady).toBeTruthy();
    expect(server.lifecycle.isOnline).toBeFalsy();
    // Stop the mDNS service
    await server.env.get(MdnsService)[Symbol.asyncDispose]();
  });
});
