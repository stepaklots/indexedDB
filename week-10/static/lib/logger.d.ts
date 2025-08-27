export interface ILogger {
  log(...args: any): void;
}

export class Logger implements ILogger {
  constructor(outputId: string);

  log(...args: any): void;
}
