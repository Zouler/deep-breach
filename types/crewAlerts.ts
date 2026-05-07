/**
 * Optional contextual actions on crew alerts / cut-ins.
 * Execution is centralized in `game/crewAlertActions.ts`.
 */
export type CrewAlertActionType =
  | 'open_room'
  | 'open_repairs'
  | 'open_inventory'
  | 'open_cargo'
  | 'use_emergency_oxygen'
  | 'change_command_intent'
  | 'set_command_intent'
  | 'open_map'
  | 'open_sonar'
  | 'return_to_base'
  | 'open_repair_dock'
  | 'open_mission_report'
  | 'acknowledge';

export type CrewAlertActionStyle = 'primary' | 'secondary' | 'danger';

export type CrewAlertAction = {
  id: string;
  label: string;
  type: CrewAlertActionType;
  payload?: {
    roomId?: string;
    /** Must match `DiveRoute` at execution time */
    commandIntent?: string;
    targetRoute?: string;
  };
  style?: CrewAlertActionStyle;
};
