/// <reference types="../mistySdk.d.ts" />

function _bumped(data) {
  const sensor = data.AdditionalResults[0];
  const isPressed = data.AdditionalResults[1];
  isPressed
    ? misty.Debug(`${sensor} is pressed`)
    : misty.Debug(`${sensor} is released`);
}

misty.AddReturnProperty("bumped", "sensorName");
misty.AddReturnProperty("bumped", "IsContacted");
misty.RegisterEvent("bumped", "BumpSensor", 100, true);

setTimeout(function () {
  misty.Debug("loaded");
}, 2000);
