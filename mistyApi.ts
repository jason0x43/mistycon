export interface Skill {
  allowedCleanupTimeInMs: number;
  arduinoAssets: Record<string, unknown>;
  audioAssets: Record<string, unknown>;
  broadcastMode: string;
  capabilities: unknown[];
  cleanupOnCancel: boolean;
  description: string;
  displaySkill: boolean;
  forceCancelSkill: boolean;
  imageAssets: Record<string, unknown>;
  ipFilter: Record<string, unknown>;
  language: string;
  name: string;
  needs: unknown[];
  parameters: Record<string, unknown>;
  priority: number;
  readPermissions: unknown[];
  relevances: unknown[];
  skillStorageLifetime: string;
  startPermissions: unknown[];
  startupRules: string[];
  timeoutInSeconds: number;
  triggerPermissions: unknown[];
  uniqueId: string;
  version: string;
  writePermissions: unknown[];
  writeToLog: boolean;
}
