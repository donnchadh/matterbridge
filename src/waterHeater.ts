/**
 * This file contains the WaterHeater class.
 *
 * @file waterHeater.ts
 * @author Luca Liguori
 * @contributor Ludovic BOUÉ
 * @date 2025-05-18
 * @version 1.0.0
 *
 * Copyright 2025, 2026, 2027 Luca Liguori.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. *
 */

// Matterbridge
import { MatterbridgeEndpoint } from './matterbridgeEndpoint.js';
import { waterHeater } from './matterbridgeDeviceTypes.js';
import { MatterbridgeServer } from './matterbridgeBehaviors.js';

// Matter.js
import { MaybePromise } from '@matter/main';
import { ModeBase } from '@matter/main/clusters/mode-base';
import { WaterHeaterManagement } from '@matter/main/clusters/water-heater-management';
import { WaterHeaterMode } from '@matter/main/clusters/water-heater-mode';
import { WaterHeaterManagementServer } from '@matter/main/behaviors/water-heater-management';
import { WaterHeaterModeServer } from '@matter/main/behaviors/water-heater-mode';

export class WaterHeater extends MatterbridgeEndpoint {
  /**
   * Creates an instance of the WaterHeater class.
   *
   * @param {string} name - The name of the water heater.
   * @param {string} serial - The serial number of the water heater.
   * @param {number} [waterTemperature=50] - The current water temperature. Defaults to 50.
   * @param {number} [targetWaterTemperature=55] - The target water temperature. Defaults to 55.
   * @param {number} [minHeatSetpointLimit=20] - The minimum heat setpoint limit. Defaults to 20.
   * @param {number} [maxHeatSetpointLimit=80] - The maximum heat setpoint limit. Defaults to 80.
   * @param {{ immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean }} [heaterTypes] - Indicates the heat sources that the water heater can call on for heating. Defaults to { immersionElement1: true }.
   * @param {number} [tankPercentage] - The current tank percentage of the WaterHeaterManagement cluster. Defaults to 90.
   */
  constructor(
    name: string,
    serial: string,
    waterTemperature = 50,
    targetWaterTemperature = 55,
    minHeatSetpointLimit = 20,
    maxHeatSetpointLimit = 80,
    heaterTypes: { immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean } = { immersionElement1: true },
    tankPercentage = 90,
  ) {
    super(waterHeater, { uniqueStorageKey: `${name.replaceAll(' ', '')}-${serial.replaceAll(' ', '')}` }, true);
    this.createDefaultIdentifyClusterServer()
      .createDefaultBasicInformationClusterServer(name, serial, 0xfff1, 'Matterbridge', 0x8000, 'Matterbridge Water Heater')
      .createDefaultPowerSourceWiredClusterServer()
      .createDefaultHeatingThermostatClusterServer(waterTemperature, targetWaterTemperature, minHeatSetpointLimit, maxHeatSetpointLimit)
      .createDefaultWaterHeaterManagementClusterServer(heaterTypes, {}, tankPercentage)
      .createDefaultWaterHeaterModeClusterServer();
  }

  /**
   * Creates a default WaterHeaterManagement Cluster Server.
   *
   * @param {{ immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean }} [heaterTypes] - Indicates the heat sources that the water heater can call on for heating. Defaults to { immersionElement1: true }.
   * @param {{ immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean }} [heatDemand] - Indicates if the water heater is heating water. Defaults to all heat sources unset.
   * @param {number} [tankPercentage] - The current tank percentage of the WaterHeaterManagement cluster. Defaults to 100.
   * @param {WaterHeaterManagement.BoostState} [boostState] - The current boost state of the WaterHeaterManagement cluster. Defaults to Inactive.
   * @returns {this} The current MatterbridgeEndpoint instance for chaining.
   */
  createDefaultWaterHeaterManagementClusterServer(
    heaterTypes?: { immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean },
    heatDemand?: { immersionElement1?: boolean; immersionElement2?: boolean; heatPump?: boolean; boiler?: boolean; other?: boolean },
    tankPercentage?: number,
    boostState?: WaterHeaterManagement.BoostState,
  ): this {
    this.behaviors.require(MatterbridgeWaterHeaterManagementServer.with(WaterHeaterManagement.Feature.TankPercent), {
      heaterTypes: heaterTypes ?? { immersionElement1: true }, // Fixed attribute
      heatDemand: heatDemand ?? {},
      tankPercentage: tankPercentage ?? 100,
      boostState: boostState ?? WaterHeaterManagement.BoostState.Inactive,
    });
    return this;
  }

  /**
   * Creates a default WaterHeaterMode Cluster Server.
   *
   * @param {number} [currentMode] - The current mode of the WaterHeaterMode cluster. Defaults to mode 1 (WaterHeaterMode.ModeTag.Auto).
   * @param {WaterHeaterMode.ModeOption[]} [supportedModes] - The supported modes for the WaterHeaterMode cluster. Defaults all cluster modes.
   *
   * @returns {this} The current MatterbridgeEndpoint instance for chaining.
   */
  createDefaultWaterHeaterModeClusterServer(currentMode?: number, supportedModes?: WaterHeaterMode.ModeOption[]): this {
    this.behaviors.require(MatterbridgeWaterHeaterModeServer, {
      supportedModes: supportedModes ?? [
        { label: 'Auto', mode: 1, modeTags: [{ value: WaterHeaterMode.ModeTag.Auto }] },
        { label: 'Quick', mode: 2, modeTags: [{ value: WaterHeaterMode.ModeTag.Quick }] },
        { label: 'Quiet', mode: 3, modeTags: [{ value: WaterHeaterMode.ModeTag.Quiet }] },
        { label: 'LowNoise', mode: 4, modeTags: [{ value: WaterHeaterMode.ModeTag.LowNoise }] },
        { label: 'LowEnergy', mode: 5, modeTags: [{ value: WaterHeaterMode.ModeTag.LowEnergy }] },
        { label: 'Vacation', mode: 6, modeTags: [{ value: WaterHeaterMode.ModeTag.Vacation }] },
        { label: 'Min', mode: 7, modeTags: [{ value: WaterHeaterMode.ModeTag.Min }] },
        { label: 'Max', mode: 8, modeTags: [{ value: WaterHeaterMode.ModeTag.Max }] },
        { label: 'Night', mode: 9, modeTags: [{ value: WaterHeaterMode.ModeTag.Night }] },
        { label: 'Day', mode: 10, modeTags: [{ value: WaterHeaterMode.ModeTag.Day }] },
        { label: 'Off', mode: 11, modeTags: [{ value: WaterHeaterMode.ModeTag.Off }] },
        { label: 'Manual', mode: 12, modeTags: [{ value: WaterHeaterMode.ModeTag.Manual }] },
        { label: 'Timed', mode: 13, modeTags: [{ value: WaterHeaterMode.ModeTag.Timed }] },
      ], // Fixed attribute
      currentMode: currentMode ?? 1,
    });
    return this;
  }
}

export class MatterbridgeWaterHeaterManagementServer extends WaterHeaterManagementServer {
  override boost({ boostInfo }: WaterHeaterManagement.BoostRequest): MaybePromise {
    const device = this.endpoint.stateOf(MatterbridgeServer).deviceCommand;
    device.boost({ boostInfo });
    device.log.info(`MatterbridgeWaterHeaterManagementServer boost called with: ${JSON.stringify(boostInfo)}`);
    this.state.boostState = WaterHeaterManagement.BoostState.Active;
    // The plugin is responsible for setting the device accordingly with the boostInfo of the boost command
    // super.boost({ boostInfo });
    // boost is not implemented in matter.js
  }

  override cancelBoost(): MaybePromise {
    const device = this.endpoint.stateOf(MatterbridgeServer).deviceCommand;
    device.cancelBoost();
    device.log.info(`MatterbridgeWaterHeaterManagementServer cancelBoost called`);
    this.state.boostState = WaterHeaterManagement.BoostState.Inactive;
    // The plugin is responsible for setting the device accordingly with the cancelBoost command
    // super.cancelBoost();
    // cancelBoost is not implemented in matter.js
  }
}

export class MatterbridgeWaterHeaterModeServer extends WaterHeaterModeServer {
  override changeToMode({ newMode }: ModeBase.ChangeToModeRequest): MaybePromise<ModeBase.ChangeToModeResponse> {
    const device = this.endpoint.stateOf(MatterbridgeServer).deviceCommand;
    const supported = this.state.supportedModes.find((mode) => mode.mode === newMode);
    if (!supported) {
      device.log.error(`MatterbridgeWaterHeaterModeServer changeToMode called with unsupported newMode: ${newMode}`);
      return { status: ModeBase.ModeChangeStatus.UnsupportedMode, statusText: 'Unsupported mode' };
    }
    device.changeToMode({ newMode });
    this.state.currentMode = newMode;
    device.log.info(`MatterbridgeWaterHeaterModeServer changeToMode called with newMode ${newMode} => ${supported.label}`);
    return { status: ModeBase.ModeChangeStatus.Success, statusText: 'Success' };
  }
}
