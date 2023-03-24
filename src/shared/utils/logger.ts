export enum LogLevel {
  INFO,
  DEBUG
}

class Logger {
  constructor(
    private readonly origin: string,
    private readonly logLevel: LogLevel
  ) {
    this.origin = origin[0].toUpperCase() + origin.slice(1).toLowerCase();
  }

  log(message: string, logLevel: LogLevel = LogLevel.INFO): void {
    if (this.logLevel >= logLevel) console.log(`[${this.origin}] ${message}`);
  }
}

export { Logger };
