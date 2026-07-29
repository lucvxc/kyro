export interface InstrumentAttributes {
  readonly [key: string]: string | number | boolean | bigint | undefined;
}

export interface InstrumentSpan {
  end(error?: unknown): void;
}

export interface Instrumentation {
  start(name: string, attributes?: InstrumentAttributes): InstrumentSpan;
}

export const noInstrumentation: Instrumentation = {
  start: () => ({ end() {} }),
};
