import { EventType } from "./api.ts";

declare global {
  type CallbackRule =
    | "synchronous"
    | "override"
    | "abort";

  type Inequality =
    | "=>"
    | "=="
    | "!=="
    | ">"
    | "<"
    | ">="
    | "<="
    | "exists"
    | "empty"
    | "delta";

  type ValueType =
    | "double"
    | "float"
    | "integer"
    | "string"
    | "datetime"
    | "boolean";

  interface Misty {
    /**
     * Adds an additional return property field for a registered event.
     */
    AddReturnProperty(
      eventName: string,
      eventProperty: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Cancel execution of a skill.
     */
    CancelSkill(
      skillId: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Changes the color of the LED light behind the logo on Misty's torso.
     */
    ChangeLED(
      red: number,
      green: number,
      blue: number,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Publishes a debug message to SkillData event listeners
     */
    Debug(
      data: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Drives Misty forward or backward at a specific speed until cancelled.
     */
    Drive(
      linearVelocity: number,
      angularVelocity: number,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Drives Misty forward or backward at a set speed, with a given rotation,
     * for a specified amount of time.
     */
    DriveTime(
      /** -100 (backward) to 100 (forward) */
      linearVelocity: number,
      /** -100 (rotate clockwise) to 100 (rotate counterclockwise) */
      angularVelocity: number,
      timeMs: number,
      degree?: number,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Pause skill execution for a specified number of milliseconds
     */
    Pause(prePauseMs: number): void;

    /**
     * Creates a listener that receives live data from one of Misty's event
     * types.
     */
    RegisterEvent(
      /**
       * The name of the callback function is implicitly set to the
       * `_<eventName>`
       */
      eventName: string,
      messageType: EventType,
      debounce: number,
      keepAlive?: boolean,
      callbackRule?: CallbackRule,
      skillToCall?: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Registers for an event and applies a filter to event messages.
     */
    RegisterSimpleEvent(
      /**
       * The name of the callback function is implicitly set to the
       * `_<eventName>`
       */
      eventName: string,
      messageType: EventType,
      debounce: number,
      property?: string,
      inequality?: Inequality,
      valueAsString?: string,
      valueType?: ValueType,
      callbackRule?: CallbackRule,
      skillToCall?: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Turns Misty's eye blinking behavior on or off.
     */
    SetBlinking(
      blink: boolean,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Sets the duration that Misty's eyes stay open or closed while blinking.
     */
    SetBlinkSettings(
      revertToDefault: boolean,
      closedEyeMinMs?: number,
      closedEyeMaxMs?: number,
      openEyeMinMs?: number,
      openEyeMaxMs?: number,
      blinkImages?: string,
      prePauseMs?: number,
      postPauseMs?: number,
    ): void;

    /**
     * Turns the LED flashlight on Misty's head on or off.
     */
    SetFlashlight(on: boolean, prePauseMs?: number, postPauseMs?: number): void;

    /**
     * Stops Misty's movement
     */
    Stop(prePauseMs?: number, postPauseMs?: number): void;
  }

  const misty: Misty;
}
