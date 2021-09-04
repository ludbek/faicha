export type Generator = (value: unknown) => string;
export interface PlaceholderGenerator {
  gen: Generator;
  getValues(): unknown[];
}

export function objectToQueryUnit(objectQuery: ObjectQuery): QueryUnit[] {
  return Object.keys(objectQuery).map((key) => [`${key} =`, objectQuery[key]]);
}

export function placeholderGenerator(symbol = ''): PlaceholderGenerator {
  const queryValues: unknown[] = [];

  return {
    gen(value) {
      queryValues.push(value);
      if (symbol === '$') {
        return `$${queryValues.length}`;
      }
      return `?`;
    },
    getValues() {
      return queryValues;
    },
  };
}

export type Filler = ($: Generator) => string;
export type TemplateLiterals = [TemplateStringsArray, ...Filler[]];
export type RenderedQuery = [string, unknown[]];

// for tagged template see
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
export function render(
  args: TemplateLiterals,
  generator: PlaceholderGenerator,
): RenderedQuery {
  const fillers = args.splice(1, args.length) as Filler[];
  const result = [args[0][0]];
  fillers.forEach((filler: Filler, index) => {
    result.push(filler(generator.gen), args[0][index + 1]);
  });

  return [result.join(''), generator.getValues()];
}

export function sql(...args: TemplateLiterals): RenderedQuery {
  const generator = placeholderGenerator('?');
  return render(args, generator);
}

export function psql(...args: TemplateLiterals): RenderedQuery {
  const generator = placeholderGenerator('$');
  return render(args, generator);
}

export type Value = unknown | unknown[];
export interface ObjectQuery {
  [index: string]: unknown;
}
export type QueryUnit = string | [string, Value] | Filler | ObjectQuery;
export function q($: Generator, unit: QueryUnit) {
  if (typeof unit === 'string') {
    return unit;
  } else if (Array.isArray(unit)) {
    const value = unit[1];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        return [
          unit[0],
          `( ${value.map((avalue) => $(avalue)).join(', ')} )`,
        ].join(' ');
      } else {
        return [unit[0], $(value)].join(' ');
      }
    }
    return undefined;
  } else if (typeof unit === 'function') {
    return unit($);
  }
  throw new Error(`Invalid query unit ${unit}.`);
}

export function and(...args: QueryUnit[]): Filler {
  let queryUnits = args;
  const firstArg = args[0];
  if (typeof firstArg === 'object' && !Array.isArray(firstArg)) {
    queryUnits = objectToQueryUnit(firstArg);
  }

  return ($) => {
    const query = queryUnits
      .map((unit) => {
        return q($, unit);
      })
      .filter((item) => !!item)
      .join(' AND ');

    if (query) {
      return `( ${query} )`;
    }
    return '';
  };
}

export function or(...args: QueryUnit[]): Filler {
  return ($) => {
    const query = args
      .map((item) => {
        return q($, item);
      })
      .filter((item) => !!item)
      .join(' OR ');

    if (query) {
      return `( ${query} )`;
    }
    return '';
  };
}

export function where(...args: QueryUnit[]): Filler {
  if (args.length === 0) throw new Error('Where clause cannot be empty.');
  const firstArg = args[0];
  return ($: Generator) => {
    let orAnd;
    // where(['city =', 'kathmandu'])
    if (Array.isArray(firstArg)) {
      orAnd = and(...args);
    }
    // where(and(['city =', 'kathmandu']))
    else if (typeof firstArg === 'function') {
      orAnd = firstArg;
    }
    // where({city: 'kathmandu'})
    else if (typeof firstArg === 'object') {
      orAnd = and(firstArg);
    } else {
      throw new Error('Unsupported query');
    }

    if (typeof orAnd === 'function') {
      const partialQuery = orAnd($);
      if (partialQuery) {
        return `WHERE ${partialQuery}`;
      }
    }
    return '';
  };
}

export function limit(value: number): Filler {
  return ($: Generator) => {
    if (value) {
      return `LIMIT ${$(value)}`;
    }
    return '';
  };
}

export function offset(value: number): Filler {
  return ($: Generator) => {
    if (value) {
      return `OFFSET ${$(value)}`;
    }
    return '';
  };
}

type Object = Record<string, unknown>;
export function values(v: Object): Filler {
  return ($: Generator) => {
    const keys = Object.keys(v);
    if (keys.length === 0)
      throw new Error(`Data cannot be empty. Got ${JSON.stringify(v)}`);
    const columns = `(${keys.join(', ')})`;
    const values = `(${keys.map((key) => $(v[key])).join(', ')})`;
    return `${columns} VALUES ${values}`;
  };
}

export function select(columns: string[]): Filler {
  return ($: Generator) => {
    return `SELECT ${columns.map($).join(', ')}`;
  };
}

export function set(values: Object) {
  return ($: Generator) => {
    const keyValPairs = Object.keys(values).map(
      (key) => `${key} = ${$(values[key])}`,
    );
    return `SET ${keyValPairs.join(', ')}`;
  };
}
