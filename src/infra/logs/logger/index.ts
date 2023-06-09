enum LogLevel {
  INFO = 0,
  DEBUG = 1
}

class Logger {
  private static instance: Logger;
  private origin?: string;
  private logLevel?: LogLevel;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  public setOrigin(origin?: string): void {
    if (origin)
      this.origin = origin[0].toUpperCase() + origin.slice(1).toLowerCase();
  }

  public setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  public log(message: string, logLevel: LogLevel = LogLevel.INFO): void {
    if ((this.logLevel ?? 0) >= logLevel)
      console.log(`[${this.origin}] ${message}`);
  }
}

export { Logger, LogLevel };
