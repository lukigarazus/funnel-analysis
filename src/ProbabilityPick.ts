
/**
 * This works in the following way:
 * all number frequencies get added up and all "auto" frequencies get the same value, which is: (100 - sumNumber) / autoFrequenciesNumber
 */
type RecursiveProbability<Probability> = {
    config: ProbabilityConfigGen<Probability>;
    probability: Probability;
};
type Probability = "auto" | number;

type ProbabilityConfigGenKey = string | number;
type ProbabilityConfigGenValue<Probability> =
    | Probability
    | RecursiveProbability<Probability>;

type ProbabilityConfigGen<Probability> = {
    [key in ProbabilityConfigGenKey]: ProbabilityConfigGenValue<Probability>;
};

export type ProbabilityConfig = ProbabilityConfigGen<Probability>;

const refineConfig = (config: ProbabilityConfigGen<Probability>) => {
    const nums: string[] = [];
    const autos: string[] = [];
    const objects: string[] = [];

    Object.keys(config).forEach((key: string) => {
        const value = config[key];
        switch (typeof value) {
            case "string":
                autos.push(key);
                break;
            case "number":
                nums.push(key);
                break;
            case "object":
                objects.push(key);
                switch (
                typeof (value as RecursiveProbability<Probability>).probability
                ) {
                    case "string":
                        autos.push(key);
                        break
                    case "number":
                        nums.push(key);
                        break
                    default:
                        break;
                }
        }
    });

    const sum = nums
        .map(
            // @ts-ignore
            (key: string) => config[key].probability || (config[key] as number) || 0
        )
        .reduce((acc: number, el: number) => acc + el, 0);

    const autoValue = (100 - sum) / autos.length;

    if (sum > 100)
        throw new Error("Invalid ad configuration");

    autos.forEach((key: string) => {
        const value = config[key];
        switch (typeof value) {
            case "object":
                value.probability = autoValue;
                break;
            case "string":
                config[key] = autoValue;
                break;
        }
    });

    objects.forEach((key: string) => {
        refineConfig((config[key] as RecursiveProbability<Probability>).config);
    });
};

interface ProbabilityArrayElement {
    start: number;
    end: number;
    value: (string | number) | ProbabilityArrayElement[];
}

type ProbabilityArray = ProbabilityArrayElement[];

const createProbabilityArray = (
    obj: ProbabilityConfigGen<number>
): ProbabilityArray => {
    const entries = Object.entries(obj);
    return entries.reduce(
        (
            acc: ProbabilityArray,
            ent: [ProbabilityConfigGenKey, ProbabilityConfigGenValue<number>],
            i: number
        ) => {
            const prev = i ? acc[i - 1].end : 0;
            return [
                ...acc,
                {
                    start: prev,
                    end:
                        prev + (typeof ent[1] === "object" ? ent[1].probability : ent[1]),
                    value:
                        typeof ent[1] === "object"
                            ? createProbabilityArray(ent[1].config)
                            : ent[0],
                },
            ];
        },
        [] as ProbabilityArray
    );
};

const getRandomElementWithProbability = (
    arr: ProbabilityArray
): ProbabilityArrayElement => {
    const num = Math.random() * 100;
    const el = arr.find(
        (el: ProbabilityArrayElement) => el.start <= num && el.end > num
    );
    // retry
    if (!el) return getRandomElementWithProbability(arr);
    if (Array.isArray(el.value)) return getRandomElementWithProbability(el.value);
    return el;
};

class ProbabilityPick {
    private probabilityArray: ProbabilityArray;

    constructor(private config: ProbabilityConfigGen<Probability>) {
        refineConfig(config);

        this.probabilityArray = createProbabilityArray(
            config as ProbabilityConfigGen<number>
        );
    }

    get = () => {
        return getRandomElementWithProbability(this.probabilityArray);
    };
}

export default ProbabilityPick;
