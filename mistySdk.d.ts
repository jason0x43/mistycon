export {};

declare global {
  interface Misty {
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

    SetFlashlight(on: boolean, prePauseMs?: number, postPauseMs?: number): void;

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
  }

  const misty: Misty;
}
