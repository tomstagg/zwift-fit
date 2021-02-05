var FitParser = require("../node_modules/fit-file-parser/dist/fit-parser.js").default;

import fs from "fs";

var fitParser = new FitParser({
  force: true,
  speedUnit: "km/h",
  lengthUnit: "km",
  temperatureUnit: "kelvin",
  elapsedRecordField: true,
  mode: "cascade",
});

const content = fs.readFileSync("resources/2020-12-29-19-53-15.fit");

let result: any = "";

fitParser.parse(content, (error: any, data: any) => {
  if (error) {
    console.log(error);
  } else {
    fs.writeFileSync("out/fit.json", JSON.stringify(data));
    result = data;
  }
});

// console.log(result);
// console.log(result.activity);
// console.log(result.activity.sessions[0]);
// console.log(result.activity.sessions[0].laps[0].records);

let maxTenSecPower = 0;

interface powerMetric {
  timeStamp: string;
  elapsedSeconds: number;
  power: number;
  // tenSecPower: number | null;
  // fiveSecPower: number | null;
  // thirtySecPower: number | null;
  avgPowers: (number | null )[];
}

interface record {
  timestamp: string;
  elapsed_time: number;
  power: number;
}

const avgPowerCalcs: number[][] = [];

const maxAvgPowers: number[] = [];

const calcPowerAverage = (duration: number, element: record): number | null => {
  if (!avgPowerCalcs[duration]) avgPowerCalcs[duration] = [];
  if (avgPowerCalcs[duration].length < duration) {
    avgPowerCalcs[duration].push(element.power);
  } else {
    avgPowerCalcs[duration].shift();
    avgPowerCalcs[duration].push(element.power);
  }

  let avgPower =
    avgPowerCalcs[duration].length < duration
      ? null
      : avgPowerCalcs[duration].reduce((a, b) => a + b) / avgPowerCalcs[duration].length;

  if (avgPower) {
    maxAvgPowers[duration] =
      avgPower > maxAvgPowers[duration] || !maxAvgPowers[duration] ? avgPower : maxAvgPowers[duration];
  }

  return avgPower;
};

let powerMetrics: powerMetric[] = result.activity.sessions[0].laps[0].records.map(
  (element: record): powerMetric => {
    // console.log([2, 5,10,30].map(item => {
    //   calcPowerAverage(item, element);
    // }));

    return {
      timeStamp: element.timestamp,
      elapsedSeconds: element.elapsed_time,
      power: element.power,
      // avgPowers: [1,5,10,15,20,30,45,60,120,(3*60),(5 * 60),(10*60),(20*60) ].map((item) => calcPowerAverage(item, element)),
      avgPowers: [...Array(20 * 60).keys()].map((item) => calcPowerAverage(item, element)),
      // tenSecPower: calcPowerAverage(10, element),
      // fiveSecPower: calcPowerAverage(5, element),
      // thirtySecPower: calcPowerAverage(30, element),
    };
  }
);

console.log(powerMetrics);
console.log(maxAvgPowers);
