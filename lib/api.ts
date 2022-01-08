import config from "../config.json" assert { type: "json" };

interface MistyEvent<MessageType = unknown> {
  eventName: string;
  message: MessageType;
}

export type MistySimpleEvent = MistyEvent<string>;

export type MistyMessageEvent = MistyEvent<{
  message: string;
  truncated: boolean;
  timestamp: string;
  data?: unknown;
}>;

export type MistyActionEvent = MistyEvent<{
  action: string;
  guid: string;
  name: string;
  timestamp: string;
}>;

export function isSimpleEvent(
  event: MistyEvent<unknown>,
): event is MistySimpleEvent {
  return typeof event.message === "string";
}

export function isMessageEvent(
  event: MistyEvent<unknown>,
): event is MistyMessageEvent {
  return (event as MistyMessageEvent).message.message !== undefined;
}

export function isActionEvent(
  event: MistyEvent<unknown>,
): event is MistyActionEvent {
  return (event as MistyActionEvent).message.action !== undefined;
}

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

export interface HazardSettings {
  bumpSensors: {
    enabled: boolean;
    sensorName: string;
  }[];
  tiltHazardThreshold: number | null;
  timeOfFlightSensors: {
    sensorName: string;
    threshold: number;
  }[];
}

export type EventType =
  | "ActuatorPosition"
  | "ArTagDetection"
  | "AudioPlayComplete"
  | "BatteryCharge"
  | "BumpSensor"
  | "ChargerPoseMessage"
  | "CriticalStatusMessage"
  | "DriveEncoders"
  | "FaceRecognition"
  | "FaceTraining"
  | "HaltCommand"
  | "HazardNotification"
  | "IMU"
  | "KeyPhraseRecognized"
  | "LocomotionCommand"
  | "ObjectDetection"
  | "PRUMessage"
  | "SelfState"
  | "SerialMessage"
  | "SkillData"
  | "SkillSystemStateChange"
  | "SlamStatus"
  | "SourceTrackDataMessage"
  | "SourceFocusConfigMessage"
  | "TextToSpeechComplete"
  | "TimeOfFlight"
  | "TouchSensor"
  | "VoiceRecord"
  | "WorldState";

const api = `http://${config.address}/api`;

/**
 * GET something from the robot
 */
async function get(path: string, options?: RequestInit) {
  const resp = await fetch(`${api}/${path}`, options);
  return await resp.json();
}

/**
 * POST a message to the robot
 */
async function post(
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

/**
 * Return a promise that resolves when the given event has occured
 */
function socketPromise(
  socket: WebSocket,
  event: keyof WebSocketEventMap,
): Promise<MessageEvent> {
  return new Promise((resolve, reject) => {
    const handler = (evt: MessageEvent | Event) => {
      socket.removeEventListener(event, handler);
      socket.removeEventListener("error", handler);
      if (evt instanceof ErrorEvent) {
        reject(evt);
      } else {
        resolve(evt as MessageEvent);
      }
    };
    socket.addEventListener(event, handler);
    socket.addEventListener("error", handler);
  });
}

/**
 * Cancel a running skill
 */
export async function cancelSkill(skillId: string) {
  return await post("skills/cancel", { Skill: skillId });
}

/**
 * Change the main LED's color and brightness
 */
export async function changeLed(
  color: { red: number; green: number; blue: number },
) {
  return await post("led", color);
}

/**
 * Connect to the robot's streaming data websocket
 */
export async function connect(): Promise<WebSocket> {
  const socket = new WebSocket(`ws://${config.address}/pubsub`);
  await socketPromise(socket, "open");
  return socket;
}

/**
 * Return information about the robot
 */
export async function getDeviceInfo() {
  const response = await get("device");
  return response.result;
}

/**
 * Return the current hazard system settings
 */
export async function getHazardSettings(): Promise<HazardSettings> {
  const response = await get("hazards/settings");
  return response.result as HazardSettings;
}

/**
 * Return the list of skills currently on the robot
 */
export async function getSkills(
  options?: { running?: boolean },
): Promise<Skill[]> {
  const response = options?.running
    ? await get("skills/running")
    : await get("skills");
  return response.result as Skill[];
}

/**
 * Subscribe to the given events and return any received messages
 */
export async function* getStreamingEvents(
  socket: WebSocket,
  ...eventTypes: EventType[]
) {
  for (const type of eventTypes) {
    socket.send(JSON.stringify({
      Operation: "subscribe",
      Type: type,
      EventName: type,
      ReturnProperty: null,
    }));
  }

  while (socket.readyState === 1) {
    const message = await socketPromise(socket, "message");
    yield JSON.parse(message.data);
  }
}

/**
 * Remove a skill
 */
export async function removeSkill(id: string) {
  const params = new URLSearchParams();
  params.set("Skill", id);
  return await get(`skills?${params}`, { method: "DELETE" });
}

/**
 * Restart the robot
 */
export async function restart() {
  return await post("reboot", {
    Core: true,
    SensoryServices: true,
  });
}

/**
 * Run a previously uploaded skill
 */
export async function runSkill(skillId: string) {
  return await post("skills/start", { Skill: skillId });
}

/**
 * Set the default volume for sounds and TTS
 */
export async function setVolume(value: number) {
  return await post("audio/volume", { Volume: Number(value) });
}

/**
 * Speak a message using the onboard TTS engine
 */
export async function speak(params: {
  flush: boolean;
  text: string;
  speechRate: number;
  pitch: number;
}) {
  return await post("tts/speak", params);
}

/**
 * Unsubscribe from the given events
 */
export function stopStreamingEvents(
  socket: WebSocket,
  ...eventTypes: EventType[]
) {
  for (const type of eventTypes) {
    socket.send(JSON.stringify({
      Operation: "unsubscribe",
      EventName: type,
    }));
  }
}

/**
 * Upload a skill to the robot
 */
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
  return await post("skills", body);
}
