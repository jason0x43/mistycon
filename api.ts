import config from "./config.json" assert { type: "json" };

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

const api = `http://${config.address}/api`;

async function get<T>(path: string, options?: RequestInit) {
  const resp = await fetch(`${api}/${path}`, options);
  const result = await resp.json();
  return result.result as T;
}

async function send(
  path: string,
  data: Record<string, unknown> | FormData,
) {
  const fetchInit: RequestInit = { method: "POST" };
  if (data instanceof FormData) {
    fetchInit.body = data;
  } else {
    fetchInit.headers = { "Content-Type": "application/json" };
    fetchInit.body = JSON.stringify(data);
  }

  const resp = await fetch(`${api}/${path}`, fetchInit);
  return resp.json();
}

export async function getSkills(
  options?: { running?: boolean },
): Promise<Skill[]> {
  return options?.running
    ? await get<Skill[]>("skills/running")
    : await get<Skill[]>("skills");
}

export async function removeSkill(id: string) {
  const params = new URLSearchParams();
  params.set("Skill", id);
  return await get(`${api}/skills?${params}`, { method: "DELETE" });
}

export async function cancelSkill(skillId: string) {
  return await send("skills/cancel", { Skill: skillId });
}

export async function runSkill(skillId: string) {
  return await send("skills/start", { Skill: skillId });
}

export async function changeLed(
  color: { red: number; green: number; blue: number },
) {
  return await send("led", color);
}

export async function speak(params: {
  flush: boolean;
  text: string;
  speechRate: number;
  pitch: number;
}) {
  return await send("tts/speak", params);
}

export async function setVolume(value: number) {
  return await send("audio/volume", { Volume: Number(value) });
}

export async function uploadSkill(params: {
  file: File;
  immediatelyApply?: boolean;
  overwriteExisting?: boolean;
}) {
  const { file, immediatelyApply, overwriteExisting } = params;
  const body = new FormData();
  body.append("File", file);
  body.append("ImmediatelyApply", immediatelyApply ? "true" : "false");
  body.append("OverwriteExisting", overwriteExisting ? "true" : "false");
  return await send("skills", body);
}

export async function getDeviceInfo() {
  return await get("device");
}
