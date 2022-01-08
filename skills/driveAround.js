/// <reference types="../mistySdk.d.ts" />

function _hazard(data) {
  const triggers = [];
  for (const sensorType of data.AdditionalResults) {
    for (const sensor of sensorType) {
      if (sensor.InHazard) {
        triggers.push(sensor.SensorName);
      }
    }
  }

  if (triggers.length > 0) {
    misty.Debug(`Saw hazards: ${JSON.stringify(triggers)}`);
    misty.Stop();
    misty.ChangeLED(255, 0, 0);
    misty.Pause(3000);
    misty.CancelSkill("0ddd028b-6594-41b6-8769-0eaa88402293");
  }
}

function _halt() {
  misty.Debug("Robot halted");
}

misty.AddReturnProperty("hazard", "BumpSensorsHazardState");
misty.AddReturnProperty("hazard", "TimeOfFlightSensorsHazardState");
misty.RegisterEvent("hazard", "HazardNotification", 0, true);
misty.RegisterEvent("halt", "HaltCommand", 0, true);

misty.ChangeLED(0, 255, 0);
misty.Drive(10, 0);
