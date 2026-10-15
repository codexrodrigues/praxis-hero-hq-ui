interface JasmineSpyStrategy {
  returnValue(val: any): any;
  callFake(fn: (...args: any[]) => any): any;
  callThrough(): any;
}

interface JasmineSpy {
  (...args: any[]): any;
  and: JasmineSpyStrategy;
  calls: {
    count(): number;
    mostRecent(): { args: any[] };
    allArgs(): any[][];
  };
}

interface JasmineMatchers {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toContain(expected: any): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeTrue(): void;
  toBeFalse(): void;
  toBeNull(): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledWith(...args: any[]): void;
  not: JasmineMatchers;
}

declare function describe(description: string, specDefinitions: () => void): void;
declare function it(expectation: string, assertion?: () => void | Promise<void>): void;
declare function beforeEach(action: () => void | Promise<void>): void;
declare function afterEach(action: () => void | Promise<void>): void;
declare function expect(actual: any): JasmineMatchers;
declare function spyOn<T, K extends keyof T>(object: T, method: K): JasmineSpy;
