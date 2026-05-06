import type { DiveRoute, GameState, Mission, RepairItem, SubmarineModuleType } from '@/types';

import { repairTemplateById } from '@/data/repairItems';
import {
  addRepairChargesToExpedition,
  applyRewardIntent,
  attachLootToRandomRoom,
  consumeOneOxygenCanister,
  oxygenCanisterCount,
} from '@/game/cargo';
import {
  crewMessageForDiscoveryResolution,
  crewMessageForEmergencyOxygen,
  crewMessageForRepair,
  crewMessageForRouteChange,
  crewMessageForScan,
} from '@/game/crewMessages';
import { resolveExternalDiscovery, scanDiscovery } from '@/game/discoveries';
import { tickActiveDive } from '@/game/diveTick';
import { createId } from '@/game/ids';
import { createDiveSessionForMission, createInitialGameState } from '@/game/initialGame';
import {
  emergencyOxygenRestorePercent,
  oxygenCanisterRestorePercent,
} from '@/game/oxygen';
import { performAreaScan, SCAN_AREA_COOLDOWN_MS } from '@/game/scanArea';
import { syncRoomStatuses } from '@/game/roomSync';
import {
  upgradeModuleResearchCost,
  upgradeModuleScrapCost,
  type UpgradeCurrency,
} from '@/game/moduleUpgrade';
import { applyExpeditionCargoTransfer } from '@/game/cargoTransfer';
import {
  analyzeArtifactsFromBaseStorage,
  analyzeSamplesFromBaseStorage,
  salvageTreasuresFromBaseStorage,
  withSyncedLegacyEconomy,
} from '@/game/baseStorage';
import { buildMissionOutcome } from '@/game/missionOutcome';
import { calculateOfflineProgress, canEnableOfflineExploration } from '@/game/offlineProgress';
import {
  computeRepairSuccessChance,
  repairSuccessMessage,
  validateRepairPreconditions,
} from '@/game/repairOutcome';
import {
  calculatePartialRepairTarget,
  repairHullToTarget,
  restockBasicSupplies,
} from '@/game/repairDock';
import { missionCompletionBonusScrap } from '@/game/economy';
import {
  applyRepairToCrack,
  diveHullBumpAfterRepair,
  roomAfterRepair,
} from '@/game/repairLogic';

export type GameAction =
  | { type: 'HYDRATE'; state: GameState }
  | { type: 'NEW_GAME' }
  | { type: 'START_MISSION'; missionId: string }
  | { type: 'TICK_DIVE'; deltaMs: number; now: number }
  | { type: 'SET_OFFLINE_EXPLORATION'; value: boolean }
  | { type: 'MARK_DIVER_BACKGROUND'; now: number }
  | { type: 'APPLY_OFFLINE_RESOLUTION'; now: number }
  | { type: 'REPAIR_CRACK'; roomId: string; crackId: string; repairItemId: string }
  | { type: 'COLLECT_LOOT'; roomId: string; lootId: string }
  | { type: 'SCAN_PENDING_DISCOVERY' }
  | { type: 'RESOLVE_PENDING_DISCOVERY'; choice: 'ignore' | 'attempt' }
  | { type: 'SET_DIVE_ROUTE'; route: DiveRoute }
  | { type: 'USE_EMERGENCY_OXYGEN' }
  | { type: 'SCAN_AREA'; now: number }
  | { type: 'DISMISS_DISCOVERY_OUTCOME' }
  | { type: 'UPGRADE_MODULE'; moduleType: SubmarineModuleType; currency?: UpgradeCurrency }
  | { type: 'HIRE_CREW'; crewId: string }
  | { type: 'TOGGLE_CREW_ASSIGN'; crewId: string }
  | { type: 'CLEAR_OFFLINE_REPORT' }
  | { type: 'RETURN_TO_BASE' }
  | { type: 'REPAIR_DOCK_HULL'; mode: 'partial' | 'full' }
  | { type: 'REPAIR_DOCK_RESTOCK_BASIC' }
  | { type: 'SALVAGE_TREASURES'; rarity: 'common' | 'rare'; count?: number }
  | { type: 'ANALYZE_ARTIFACTS'; count?: number }
  | { type: 'ANALYZE_SAMPLES'; count?: number };

function touch(state: GameState): GameState {
  return {
    ...state,
    profile: { ...state.profile, lastSavedAt: Date.now() },
  };
}

function findMission(state: GameState, id: string): Mission | undefined {
  return state.missions.find((m) => m.id === id);
}

function recordTerminal(state: GameState, dive: NonNullable<GameState['dive']>): GameState {
  if (dive.status === 'active' || dive.outcomeRecorded) return state;
  const mission = findMission(state, dive.missionId);
  if (!mission) return state;
  const bonus =
    dive.status === 'success' ? missionCompletionBonusScrap(mission.risk) : 0;
  const diveWithBonus =
    bonus > 0 && !dive.missionCompletionBonusScrap
      ? { ...dive, missionCompletionBonusScrap: bonus }
      : dive;
  const lastMissionOutcome = buildMissionOutcome(
    { ...diveWithBonus, outcomeRecorded: true },
    mission,
    state.submarine,
    state.pendingOfflineReport,
  );
  return {
    ...state,
    dive: { ...diveWithBonus, outcomeRecorded: true },
    lastMissionOutcome,
  };
}

function flushDiveToBase(state: GameState): GameState {
  if (!state.dive) {
    return {
      ...state,
      pendingOfflineReport: null,
      lastMissionOutcome: null,
    };
  }
  let s = state;
  if (!state.dive.cargoTransferredToBase) {
    const applied = applyExpeditionCargoTransfer(state);
    s = applied.state;
  }
  const dive = s.dive!;
  const report = s.pendingOfflineReport;
  const emergency =
    report?.emergencyExtraction ?? dive.offlineEmergencyExtraction ?? false;
  let hull = Math.max(12, Math.min(100, dive.hullIntegrityPercent));
  const tugPenalty = dive.offlineSurfaceHullPenalty ?? report?.surfaceHullPenaltyPercent ?? 0;
  if (emergency && tugPenalty > 0) {
    hull = Math.max(8, hull - tugPenalty);
  }
  return touch(
    withSyncedLegacyEconomy({
      ...s,
      submarine: {
        ...s.submarine,
        hullIntegrityPercent: hull,
      },
      dive: null,
      pendingOfflineReport: null,
      lastMissionOutcome: null,
    }),
  );
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'NEW_GAME':
      return touch(createInitialGameState());
    case 'START_MISSION': {
      if (state.dive) return state;
      const mission = findMission(state, action.missionId);
      if (!mission) return state;
      const dive = createDiveSessionForMission(mission, state.submarine);
      return touch({
        ...state,
        dive,
        pendingOfflineReport: null,
        lastMissionOutcome: null,
      });
    }
    case 'TICK_DIVE': {
      if (!state.dive || state.dive.status !== 'active') return state;
      const mission = findMission(state, state.dive.missionId);
      if (!mission) return state;
      const nextDive = tickActiveDive({
        dive: state.dive,
        mission,
        submarine: state.submarine,
        crew: state.crew,
        deltaMs: action.deltaMs,
        now: action.now,
      });
      let next: GameState = { ...state, dive: nextDive };
      next = recordTerminal(next, nextDive);
      return touch(next);
    }
    case 'SET_OFFLINE_EXPLORATION': {
      if (!state.dive || state.dive.status !== 'active') return state;
      if (!action.value) {
        return touch({
          ...state,
          dive: { ...state.dive, continueExplorationWhileAway: false, backgroundedAt: null },
        });
      }
      if (!canEnableOfflineExploration(state.dive)) return state;
      return touch({
        ...state,
        dive: { ...state.dive, continueExplorationWhileAway: true },
      });
    }
    case 'MARK_DIVER_BACKGROUND': {
      if (!state.dive || state.dive.status !== 'active') return state;
      if (!state.dive.continueExplorationWhileAway) return state;
      return touch({
        ...state,
        dive: { ...state.dive, backgroundedAt: action.now },
      });
    }
    case 'APPLY_OFFLINE_RESOLUTION': {
      const dive = state.dive;
      if (!dive?.backgroundedAt || dive.status !== 'active') return state;
      const mission = findMission(state, dive.missionId);
      if (!mission) return state;
      const awayMs = Math.max(0, action.now - dive.backgroundedAt);
      if (awayMs < 400) {
        return touch({ ...state, dive: { ...dive, backgroundedAt: null } });
      }
      const { dive: resolvedDive, report } = calculateOfflineProgress({
        dive,
        mission,
        submarine: state.submarine,
        crew: state.crew,
        awayMs,
        now: action.now,
      });
      const nextDive: typeof resolvedDive = {
        ...resolvedDive,
        offlineEmergencyExtraction: report.emergencyExtraction,
        offlineSurfaceHullPenalty: report.emergencyExtraction
          ? report.surfaceHullPenaltyPercent
          : undefined,
      };
      let next: GameState = {
        ...state,
        dive: nextDive,
        pendingOfflineReport: report,
      };
      next = recordTerminal(next, nextDive);
      return touch(next);
    }
    case 'REPAIR_CRACK': {
      if (!state.dive || state.dive.status !== 'active') return state;
      const room = state.dive.rooms.find((r) => r.id === action.roomId);
      if (!room) return state;
      const crack = room.cracks.find((c) => c.id === action.crackId);
      if (!crack) return state;
      const exp = state.dive.expeditionRepairInventory ?? [];
      const itemIndex = exp.findIndex((i) => i.id === action.repairItemId);
      if (itemIndex < 0) return state;
      const item = exp[itemIndex];
      const pre = validateRepairPreconditions(crack, item);
      if (!pre.ok) return state;
      const ctx = { submarine: state.submarine, crew: state.crew };
      const chance = computeRepairSuccessChance(crack, item, ctx);
      if (Math.random() > chance) {
        let diveFail: typeof state.dive = {
          ...state.dive,
          eventLog: [
            ...state.dive.eventLog,
            {
              id: createId('evt'),
              type: 'repair_failed',
              message:
                'Field repair failed to hold — pressure or tooling won this cycle. Try a stronger kit or stabilize leaks.',
              timestamp: Date.now(),
              roomId: room.id,
            },
          ],
        };
        diveFail = crewMessageForRepair(diveFail, state.crew, false);
        return touch({
          ...state,
          dive: diveFail,
        });
      }
      const { crack: newCrack, consumed } = applyRepairToCrack(crack, item);
      if (!consumed) return state;
      const nextItem: RepairItem = { ...item, quantity: item.quantity - 1 };
      const nextExpedition = exp.map((r, idx) =>
        idx === itemIndex ? nextItem : r,
      );
      const nextRoom = roomAfterRepair(room, crack.id, newCrack);
      const rooms = state.dive.rooms.map((r) => (r.id === room.id ? nextRoom : r));
      let dive = diveHullBumpAfterRepair(
        {
          ...state.dive,
          rooms,
          expeditionRepairInventory: nextExpedition,
          repairSuppliesConsumedThisDive:
            (state.dive.repairSuppliesConsumedThisDive ?? 0) + 1,
        },
        4,
      );
      dive = { ...dive, waterLevelPercent: Math.max(0, dive.waterLevelPercent - 6) };
      dive = {
        ...dive,
        eventLog: [
          ...dive.eventLog,
          {
            id: createId('evt'),
            type: 'repair_complete',
            message: repairSuccessMessage(crack),
            timestamp: Date.now(),
            roomId: room.id,
          },
        ],
      };
      dive = crewMessageForRepair(dive, state.crew, true);
      return touch({
        ...state,
        dive,
      });
    }
    case 'SCAN_PENDING_DISCOVERY': {
      if (!state.dive?.pendingDiscovery || state.dive.status !== 'active') return state;
      const mission = findMission(state, state.dive.missionId);
      if (!mission) return state;
      const pendingDiscovery = scanDiscovery(
        state.dive.pendingDiscovery,
        mission,
        state.dive,
        state.submarine,
        state.crew,
      );
      return touch({
        ...state,
        dive: { ...state.dive, pendingDiscovery },
      });
    }
    case 'RESOLVE_PENDING_DISCOVERY': {
      if (!state.dive?.pendingDiscovery || state.dive.status !== 'active') return state;
      const mission = findMission(state, state.dive.missionId);
      if (!mission) return state;
      const patch = resolveExternalDiscovery({
        choice: action.choice === 'attempt' ? 'attempt' : 'ignore',
        discovery: state.dive.pendingDiscovery,
        mission,
        dive: state.dive,
        submarine: state.submarine,
        crew: state.crew,
        now: Date.now(),
      });
      let rooms = patch.rooms ?? state.dive.rooms;
      rooms = syncRoomStatuses(rooms);
      let dive = {
        ...state.dive,
        pendingDiscovery: null,
        discoveryJournal: [...state.dive.discoveryJournal, patch.journal],
        hullIntegrityPercent: Math.max(
          0,
          Math.min(100, state.dive.hullIntegrityPercent + patch.hullDelta),
        ),
        oxygenPercent: Math.max(0, Math.min(100, state.dive.oxygenPercent + patch.oxygenDelta)),
        waterLevelPercent: Math.max(
          0,
          Math.min(100, state.dive.waterLevelPercent + patch.waterDelta),
        ),
        rooms,
        eventLog: [...state.dive.eventLog, ...patch.events],
        supplyLog: [...state.dive.supplyLog, ...patch.supplyLog],
      };
      const applied = applyRewardIntent(dive, state.submarine, patch.rewardIntent, dive.rooms);
      dive = { ...applied.dive, rooms: applied.rooms, pendingDiscovery: null };
      dive = {
        ...dive,
        pendingDiscovery: null,
        supplyLog: [...dive.supplyLog, ...applied.result.lines],
        repairSuppliesRecoveredThisDive:
          (dive.repairSuppliesRecoveredThisDive ?? 0) + applied.result.recoveredRepairUnits,
      };
      const body = [...patch.outcomePreamble, ...applied.result.lines].join('\n');
      dive = {
        ...dive,
        pendingDiscovery: null,
        discoveryOutcomeBanner: {
          id: createId('dob'),
          title: patch.outcomeTitle,
          body,
          severity: patch.outcomeSeverity,
        },
      };
      dive = {
        ...crewMessageForDiscoveryResolution(dive, state.crew, patch),
        pendingDiscovery: null,
      };
      let next: GameState = { ...state, dive };
      next = recordTerminal(next, dive);
      return touch(next);
    }
    case 'SET_DIVE_ROUTE': {
      if (!state.dive || state.dive.status !== 'active') return state;
      if (state.dive.currentRoute === action.route) return state;
      let d = { ...state.dive, currentRoute: action.route };
      d = crewMessageForRouteChange(d, state.crew, action.route);
      return touch({ ...state, dive: d });
    }
    case 'USE_EMERGENCY_OXYGEN': {
      if (!state.dive || state.dive.status !== 'active') return state;
      const canisters = oxygenCanisterCount(state.dive);
      if (canisters > 0) {
        const add = oxygenCanisterRestorePercent();
        let d = consumeOneOxygenCanister(state.dive);
        d = {
          ...d,
          oxygenPercent: Math.min(100, d.oxygenPercent + add),
          oxygenCanisterUsesThisDive: (d.oxygenCanisterUsesThisDive ?? 0) + 1,
          eventLog: [
            ...d.eventLog,
            {
              id: createId('evt'),
              type: 'special_signal' as const,
              message: `Oxygen canister used (+${Math.round(add)}%).`,
              timestamp: Date.now(),
            },
          ],
        };
        d = crewMessageForEmergencyOxygen(d, state.crew);
        let next: GameState = { ...state, dive: d };
        next = recordTerminal(next, d);
        return touch(next);
      }
      if (state.dive.emergencyOxygenChargesRemaining <= 0) return state;
      const add = emergencyOxygenRestorePercent(state.submarine);
      let d = {
        ...state.dive,
        oxygenPercent: Math.min(100, state.dive.oxygenPercent + add),
        emergencyOxygenChargesRemaining: state.dive.emergencyOxygenChargesRemaining - 1,
        emergencyOxygenUsesThisDive: state.dive.emergencyOxygenUsesThisDive + 1,
        eventLog: [
          ...state.dive.eventLog,
          {
            id: createId('evt'),
            type: 'special_signal' as const,
            message: `Emergency oxygen reserve deployed (+${Math.round(add)}%).`,
            timestamp: Date.now(),
          },
        ],
      };
      d = crewMessageForEmergencyOxygen(d, state.crew);
      let next: GameState = { ...state, dive: d };
      next = recordTerminal(next, d);
      return touch(next);
    }
    case 'SCAN_AREA': {
      if (!state.dive || state.dive.status !== 'active') return state;
      const d0 = state.dive;
      if (d0.pendingDiscovery) return state;
      const now = action.now;
      if (now - d0.lastAreaScanAt < SCAN_AREA_COOLDOWN_MS) return state;
      const mission = findMission(state, d0.missionId);
      if (!mission) return state;
      const result = performAreaScan(mission, d0, state.submarine, state.crew, now);
      let nextDive: typeof d0 = {
        ...d0,
        lastAreaScanAt: now,
        scansPerformed: d0.scansPerformed + 1,
      };
      if (result.kind === 'found') {
        nextDive = {
          ...nextDive,
          pendingDiscovery: result.discovery,
          eventLog: [
            ...nextDive.eventLog,
            {
              id: createId('evt'),
              type: 'external_discovery',
              message: `${result.discovery.title} — decision required.`,
              timestamp: now,
            },
          ],
        };
        nextDive = crewMessageForScan(nextDive, state.crew, true);
      } else {
        nextDive = {
          ...nextDive,
          eventLog: [...nextDive.eventLog, result.event],
        };
        nextDive = crewMessageForScan(nextDive, state.crew, false);
      }
      let next: GameState = { ...state, dive: nextDive };
      next = recordTerminal(next, nextDive);
      return touch(next);
    }
    case 'COLLECT_LOOT': {
      if (!state.dive || state.dive.status !== 'active') return state;
      const targetRoom = state.dive.rooms.find((r) => r.id === action.roomId);
      const target = targetRoom?.loot.find((l) => l.id === action.lootId);
      if (!target || target.collected) return state;
      if (target.kind !== 'repair_supply' && target.kind !== 'emergency_supply') return state;

      const tplId = target.repairTemplateId;
      const qty = target.repairQuantity ?? 1;
      let dive = state.dive;
      let rooms = dive.rooms;
      const supplyLog = [...dive.supplyLog];
      if (tplId && repairTemplateById(tplId)) {
        const { dive: d2, applied, stagedLoot } = addRepairChargesToExpedition(
          dive,
          state.submarine,
          tplId,
          qty,
        );
        dive = d2;
        if (applied > 0) {
          supplyLog.push(
            `Secured ${applied}× ${repairTemplateById(tplId)!.name} into expedition cargo.`,
          );
          dive = {
            ...dive,
            repairSuppliesRecoveredThisDive:
              (dive.repairSuppliesRecoveredThisDive ?? 0) + applied,
          };
        }
        if (stagedLoot.length) {
          rooms = attachLootToRandomRoom(rooms, stagedLoot);
          supplyLog.push('Cargo tight — overflow kits remain staged in a compartment.');
        }
      } else {
        supplyLog.push('Salvaged unmarked supplies — could not tag for cargo.');
      }

      const patchedRooms = rooms.map((r) => {
        if (r.id !== action.roomId) return r;
        return {
          ...r,
          loot: r.loot.map((l) =>
            l.id === action.lootId ? { ...l, collected: true } : l,
          ),
        };
      });

      return touch({
        ...state,
        dive: {
          ...dive,
          rooms: patchedRooms,
          supplyLog,
          eventLog: [
            ...dive.eventLog,
            {
              id: createId('evt'),
              type: 'loot_secured',
              message: 'Supplies logged to expedition cargo.',
              timestamp: Date.now(),
              roomId: action.roomId,
            },
          ],
        },
      });
    }
    case 'DISMISS_DISCOVERY_OUTCOME': {
      if (!state.dive) return state;
      return touch({
        ...state,
        dive: { ...state.dive, discoveryOutcomeBanner: null },
      });
    }
    case 'UPGRADE_MODULE': {
      const currency: UpgradeCurrency = action.currency ?? 'scrap';
      const prev = state.submarine.modules.find((m) => m.type === action.moduleType);
      if (!prev || prev.level >= prev.maxLevel) return state;
      const scrapCost = upgradeModuleScrapCost(prev.level);
      const researchCost = upgradeModuleResearchCost(prev.level);
      if (currency === 'scrap' && state.baseStorage.scrap < scrapCost) return state;
      if (currency === 'research' && state.baseStorage.researchData < researchCost) return state;
      const modules = state.submarine.modules.map((m) =>
        m.type === action.moduleType ? { ...m, level: m.level + 1 } : m,
      );
      const baseStorage =
        currency === 'scrap'
          ? { ...state.baseStorage, scrap: state.baseStorage.scrap - scrapCost }
          : {
              ...state.baseStorage,
              researchData: state.baseStorage.researchData - researchCost,
            };
      return touch(
        withSyncedLegacyEconomy({
          ...state,
          baseStorage,
          submarine: { ...state.submarine, modules },
        }),
      );
    }
    case 'HIRE_CREW': {
      const crew = state.crew.map((c) => {
        if (c.id !== action.crewId) return c;
        if (c.hired) return c;
        if (state.baseStorage.scrap < c.hireCostScrap) return c;
        return { ...c, hired: true, assignedToDive: true };
      });
      const member = crew.find((c) => c.id === action.crewId);
      const prev = state.crew.find((c) => c.id === action.crewId);
      if (!member || !prev || member.hired === prev.hired) return state;
      return touch(
        withSyncedLegacyEconomy({
          ...state,
          baseStorage: {
            ...state.baseStorage,
            scrap: state.baseStorage.scrap - member.hireCostScrap,
          },
          crew,
        }),
      );
    }
    case 'TOGGLE_CREW_ASSIGN': {
      const crew = state.crew.map((c) =>
        c.id === action.crewId && c.hired
          ? { ...c, assignedToDive: !c.assignedToDive }
          : c,
      );
      return touch({ ...state, crew });
    }
    case 'CLEAR_OFFLINE_REPORT':
      return touch({ ...state, pendingOfflineReport: null });
    case 'RETURN_TO_BASE':
      return touch(flushDiveToBase(state));
    case 'REPAIR_DOCK_HULL': {
      const target =
        action.mode === 'full'
          ? 100
          : calculatePartialRepairTarget(state.submarine.hullIntegrityPercent);
      const { state: next, result } = repairHullToTarget(state, target);
      if (!result.ok) return state;
      return touch(next);
    }
    case 'REPAIR_DOCK_RESTOCK_BASIC': {
      const { state: next, result } = restockBasicSupplies(state);
      if (!result.ok) return state;
      return touch(next);
    }
    case 'SALVAGE_TREASURES': {
      const count = action.count ?? 1;
      const res = salvageTreasuresFromBaseStorage(state.baseStorage, action.rarity, count);
      if (res.salvaged <= 0) return state;
      return touch(withSyncedLegacyEconomy({ ...state, baseStorage: res.bs }));
    }
    case 'ANALYZE_ARTIFACTS': {
      const count = action.count ?? 1;
      const res = analyzeArtifactsFromBaseStorage(state.baseStorage, count);
      if (res.analyzed <= 0) return state;
      return touch(withSyncedLegacyEconomy({ ...state, baseStorage: res.bs }));
    }
    case 'ANALYZE_SAMPLES': {
      const count = action.count ?? 1;
      const res = analyzeSamplesFromBaseStorage(state.baseStorage, count);
      if (res.analyzed <= 0) return state;
      return touch(withSyncedLegacyEconomy({ ...state, baseStorage: res.bs }));
    }
    default:
      return state;
  }
}
