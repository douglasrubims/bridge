import { ILogger, LogLevel } from "./index";
import { Logger } from "./logger";

class LoggerService implements ILogger {
  private logger: Logger;

  constructor(origin: string, logLevel: LogLevel) {
    this.logger = Logger.getInstance();
    this.logger.setOrigin(origin);
    this.logger.setLogLevel(logLevel);
  }

  public log(message: string, logLevel: LogLevel = LogLevel.INFO): void {
    this.logger.log(message, logLevel);
  }
}

export { LoggerService };
