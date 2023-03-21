import { Logger } from "../../@types/contracts/logger";

export class ConsoleLogger implements Logger {
  constructor(private readonly origin: string) {
    this.origin = origin[0].toUpperCase() + origin.slice(1).toLowerCase();
  }

  log(message: string): void {
    console.log(`[${this.origin}] ${message}`);
  }
}
