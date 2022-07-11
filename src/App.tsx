import React from "react";

import SankeyComp from "./Sankey";
import ForceTree from "./ForceTree";
import ProbabilityPick from "./ProbabilityPick";

// import logo from "./logo.svg";
import "./App.css";

const getRandomNumberRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomNumberRangeApartFrom = (
  min: number,
  max: number,
  apartFrom: number
) => {
  let randomNumber = getRandomNumberRange(min, max);
  while (randomNumber === apartFrom) {
    randomNumber = getRandomNumberRange(min, max);
  }
  return randomNumber;
};

function pickRandomElement<T>(arr: any[]) {
  return arr[getRandomNumberRange(0, arr.length - 1)];
}

function arrayOfLength<V>(length: number, value: V) {
  return Array(length).fill(value);
}

const range = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
};
const rangeApartFrom = (start: number, end: number, apartFrom: number) =>
  range(start, end).filter((el) => el !== apartFrom);

type Transition = {
  origin: number;
  destination: number;
  step: number;
  id: string;
};

type Session = {
  sequence: number[];
  transitions: Transition[];
};

type TransitionProbabilityMap = Map<number, () => number>;

type RecursiveProbabilityPick = {
  [key: number]: {
    probabilityPick: ProbabilityPick;
    chainedProbabilityPicks?: RecursiveProbabilityPick;
  };
};

enum TransitionPatternType {
  Random,
  Sequential,
  RandomForward,
}

// const mergeTransitions = (transitions: Transitions[]) => {
//   const mergedTransitions: Transitions = {};
//   transitions.forEach((transition) => {
//     Object.keys(transition).forEach((key: any) => {
//       if (mergedTransitions[key]) {
//         const mergedTransitionsForKey = mergedTransitions[key];
//         const transitionsForKey = transition[key];
//         Object.keys(transitionsForKey).forEach((key2: any) => {
//           if (mergedTransitionsForKey[key2]) {
//             mergedTransitionsForKey[key2] += transitionsForKey[key2];
//           } else mergedTransitionsForKey[key2] = transitionsForKey[key2];
//         });
//       } else {
//         mergedTransitions[key] = { ...transition[key] };
//       }
//     });
//   });
//   return mergedTransitions;
// };

const getTransitionProbabilityMap = (
  screens: number,
  transitionPatternType: TransitionPatternType = TransitionPatternType.Random,
  recursiveProbabilityPick: RecursiveProbabilityPick
) => {
  const transitionProbabilityMap: TransitionProbabilityMap = new Map();
  for (let i = 0; i < screens; i++) {
    transitionProbabilityMap.set(i, () => {
      switch (transitionPatternType) {
        case TransitionPatternType.Random:
          const probabilityPick = recursiveProbabilityPick[i].probabilityPick;
          const res = probabilityPick.get().value;
          // console.log(probabilityPick, res);
          return +res;
        case TransitionPatternType.Sequential:
          return i + 1;
        case TransitionPatternType.RandomForward:
          return getRandomNumberRange(i + 1, screens - 1);
      }
    });
  }
  return transitionProbabilityMap;
};

// const getAllCombinationsOrdered = (arr: number[]) => {
//   const combinations = [];
//   for (let i = 0; i < arr.length; i++) {
//     for (let j = 0; j < arr.length; j++) {
//       if (i !== j) combinations.push([arr[i], arr[j]]);
//     }
//   }
//   return combinations;
// };

const generateSession = (
  screens: number,
  maxSteps: number,
  transitionProbabilityMap: TransitionProbabilityMap
): Session => {
  let steps = getRandomNumberRange(1, maxSteps);
  const session = arrayOfLength(steps, 0);
  const transitions: Transition[] = [
    { origin: -1, destination: 0, step: 0, id: "-1|0|1" },
  ];
  for (let i = 1; i < steps; i++) {
    const screen = transitionProbabilityMap.get(session[i - 1])?.() as number;
    if (!screen || screen >= screens) {
      steps = i;
      session.length = steps;
      break;
    }
    session[i] = screen;
    transitions.push({
      origin: session[i - 1],
      destination: screen,
      step: i,
      id: `${session[i - 1]}|${screen}|${i}`,
    });
  }
  transitions.push({
    origin: session[steps - 1],
    destination: screens,
    step: steps,
    id: "",
  });
  session.push(screens);
  return { sequence: session, transitions };
};

const generateSessions = (
  length: number,
  screens: number,
  maxSteps: number,
  transitionProbabilityMap: TransitionProbabilityMap
) => {
  const sessions = arrayOfLength(length, []);
  for (let i = 0; i < length; i++) {
    sessions[i] = generateSession(screens, maxSteps, transitionProbabilityMap);
  }
  // const transitions = mergeTransitions(sessions.map((el) => el.transitions));
  return sessions as Session[];
};

function App() {
  const [screens, setScreens] = React.useState(11);
  const [maxSteps, setMaxSteps] = React.useState(10);
  const [sessionCount, setSessionCount] = React.useState(10);
  const [focusedScreen, setFocusedScreen] = React.useState(5);
  const transitionProbabilityPickConfig = React.useMemo(
    () =>
      range(0, screens - 1).reduce((acc, el) => {
        acc[el] = rangeApartFrom(0, screens - 1, el).reduce((acc, el) => {
          acc[el] = "auto";
          return acc;
        }, {} as any);
        return acc;
      }, {} as any),
    [screens]
  );
  // console.log(transitionProbabilityPickConfig);
  const [transitionProbabilityPick, _] = React.useState(
    range(0, screens - 1).reduce((acc, el) => {
      // console.log(transitionProbabilityPickConfig[el]);
      const config = JSON.parse(
        JSON.stringify(transitionProbabilityPickConfig[el])
      );
      // console.log(config);
      acc[el] = {
        probabilityPick: new ProbabilityPick(config),
      };
      return acc;
    }, {} as RecursiveProbabilityPick)
  );
  // console.log(transitionProbabilityPick);
  const [transitionPatternType, setTransitionPatternType] =
    React.useState<TransitionPatternType>(TransitionPatternType.Random);
  const transitionProbabilityMap = React.useMemo(
    () =>
      getTransitionProbabilityMap(
        screens,
        transitionPatternType,
        transitionProbabilityPick
      ),
    [screens, transitionPatternType, transitionProbabilityPick]
  );

  const sessions = React.useMemo(
    () =>
      generateSessions(
        sessionCount,
        screens,
        [
          TransitionPatternType.Sequential,
          TransitionPatternType.RandomForward,
        ].includes(transitionPatternType)
          ? screens - 1
          : maxSteps,
        transitionProbabilityMap
      ),
    [
      sessionCount,
      maxSteps,
      screens,
      transitionPatternType,
      transitionProbabilityMap,
    ]
  );
  // const relativeTransitionWeights = sessions.reduce((acc, { transitions }) => {
  //   transitions.forEach((transition) => {
  //     if (acc[transition.id]) {
  //       acc[transition.id] += 1;
  //     } else {
  //       acc[transition.id] = 1;
  //     }
  //   });
  //   return acc;
  // }, {} as Record<string, number>);
  // const allPossibleScreenTransitions = getAllCombinationsOrdered(range(0, maxSteps - 1));
  const sankeyDataRelative = [["From", "To", "Weight"]].concat(
    Object.entries(
      sessions.reduce((acc, { transitions }) => {
        transitions.forEach((transition) => {
          const source =
            transition.origin === -1
              ? "START"
              : `${transition.origin}|${transition.step}`;
          const target =
            transition.destination === screens
              ? "END"
              : `${transition.destination}|${transition.step + 1}`;

          if (acc[source]) {
            if (acc[source][target]) {
              acc[source][target] += 1;
            } else {
              acc[source][target] = 1;
            }
          } else acc[source] = { [target]: 1 };
        });
        return acc;
      }, [] as any)
    ).flatMap(([source, targetToWeight]: any) => {
      return Object.entries(targetToWeight).map(([target, weight]) => {
        return [source, target, weight];
      });
    })
  );

  const DAGDataAbsolute = sessions.reduce((acc, { transitions }) => {
    transitions.forEach((transition) => {
      const source = `${transition.origin}`;
      const target = `${transition.destination}`;

      if (acc[source]) {
        if (acc[source][target]) {
          acc[source][target] += 1;
        } else {
          acc[source][target] = 1;
        }
      } else acc[source] = { [target]: 1 };
    });
    return acc;
  }, [] as any);

  const DAGLinksAbsolute = Object.entries(DAGDataAbsolute).flatMap(
    ([source, targetToWeight]: any) => {
      return Object.entries(targetToWeight).map(([target, weight]) => {
        return { source, target, value: weight as number };
      });
    }
  );

  const DAGNodesAbsolute = Object.keys(DAGDataAbsolute)
    .map((key) => ({
      id: key,
      group: 1,
    }))
    .concat([{ id: screens + "", group: pickRandomElement([1, 2]) }]);

  const DAGData = { nodes: DAGNodesAbsolute, links: DAGLinksAbsolute };

  const sankeyFocusedData = [["From", "To", "Weight"]].concat(
    Object.entries(
      sessions.reduce(
        (acc, { transitions }) => {
          const transitionsFrom = transitions.filter(
            (transition) => transition.origin === focusedScreen
          );
          transitionsFrom.forEach((transition) => {
            if (acc.from[transition.destination]) {
              acc.from[transition.destination] += 1;
            } else {
              acc.from[transition.destination] = 1;
            }
          });

          const transitionsTo = transitions.filter(
            (transition) => transition.destination === focusedScreen
          );
          transitionsTo.forEach((transition) => {
            if (acc.to[transition.origin]) {
              acc.to[transition.origin] += 1;
            } else {
              acc.to[transition.origin] = 1;
            }
          });

          return acc;
        },
        { to: {}, from: {} } as any
      )
    ).flatMap(([key, map]: any) => {
      switch (key) {
        case "from":
          return Object.entries(map).map(([target, weight]) => {
            return [
              focusedScreen + "",
              target === screens + "" ? "END" : target + "",
              weight,
            ];
          });
        case "to":
          return Object.entries(map).map(([source, weight]) => {
            return [source + "", focusedScreen + "", weight];
          });
      }
    }) as any
  );

  console.log(sankeyFocusedData);
  return (
    <div className="App">
      <div>
        <div
          style={{
            padding: 20,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <label htmlFor="screens">Screens</label>
          <input
            id="screens"
            type="number"
            value={screens}
            onChange={(e) => setScreens(Number(e.target.value))}
          />
          <label htmlFor="maxSteps">Max steps</label>
          <input
            id="maxSteps"
            type="number"
            value={maxSteps}
            onChange={(e) => setMaxSteps(Number(e.target.value))}
          />
          <label htmlFor="sessionCount">Sessions</label>
          <input
            id="sessionCount"
            type="number"
            value={sessionCount}
            onChange={(e) => setSessionCount(Number(e.target.value))}
          />
          <label htmlFor="focusedScreen">Focused screen</label>
          <input
            id="focusedScreen"
            type="number"
            value={focusedScreen}
            onChange={(e) => setFocusedScreen(Number(e.target.value))}
            min={0}
            max={screens - 2}
          />

          <label htmlFor="transitionPatternType">Transition pattern type</label>
          <select
            id="transitionPatternType"
            value={transitionPatternType}
            onChange={(e) =>
              setTransitionPatternType(
                +e.target.value as unknown as TransitionPatternType
              )
            }
          >
            <option value={TransitionPatternType.Random}>Random</option>
            <option value={TransitionPatternType.Sequential}>Sequential</option>
            <option value={TransitionPatternType.RandomForward}>
              Random-forward
            </option>
          </select>
        </div>
        {/* <div>
          {Object.keys(transitionProbabilityPickConfig).map((key) => (
            <div>
              {key}:{" "}
              {Object.keys(transitionProbabilityPickConfig[key]).map((key2) => {
                return `${key2}: ${transitionProbabilityPickConfig[key][key2]}`;
              })}
            </div>
          ))}
        </div> */}
      </div>
      {/* <div>{JSON.stringify(sessions, null, 5)}</div>
      <div>{JSON.stringify(relativeTransitionWeights, null, 5)}</div> */}
      <div>
        <h3>Global sankey view</h3>
        <SankeyComp data={sankeyDataRelative} />
      </div>
      <div>
        <h3>Focused sankey view</h3>
        <SankeyComp data={sankeyFocusedData} />
      </div>
      <div>
        <h3>DAG view</h3>
        <div style={{ display: "inline-block", width: "500px" }}>
          <ForceTree data={DAGData} />
        </div>
      </div>
    </div>
  );
}

export default App;
