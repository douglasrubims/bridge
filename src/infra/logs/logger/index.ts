export enum LogLevel {
  INFO = 0,
  DEBUG = 1
}

class Logger {
  constructor(private readonly origin: string, private logLevel?: LogLevel) {
    this.origin = origin[0].toUpperCase() + origin.slice(1).toLowerCase();
  }

  setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  log(message: string, logLevel: LogLevel = LogLevel.INFO): void {
    if (this.logLevel ?? 0 >= logLevel)
      console.log(`[${this.origin}] ${message}`);
  }
}

const logger = new Logger("logger");

export { logger };
