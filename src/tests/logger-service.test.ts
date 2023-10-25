import { LoggerService } from "../../src/infra/logs/logger/logger-service";
import { Logger } from "../../src/infra/logs/logger/logger";
import { LogLevel } from "../../src/infra/logs/logger";

jest.mock("../../src/infra/logs/logger/logger");

describe("LoggerService", () => {
  let loggerService: LoggerService;
  const origin = "test-origin";
  const logLevel = LogLevel.DEBUG;

  beforeEach(() => {
    (Logger.getInstance as jest.Mock).mockClear();
    loggerService = new LoggerService(origin, logLevel);
  });

  it("should create a new LoggerService instance", () => {
    expect(loggerService).toBeInstanceOf(LoggerService);
    expect(Logger.getInstance).toHaveBeenCalledTimes(1);
  });

  it("should call the log method of Logger with the correct arguments", () => {
    const message = "test message";
    const level = LogLevel.INFO;

    loggerService.log(message, level);

    expect(Logger.getInstance().log).toHaveBeenCalledWith(message, level);
  });
});
