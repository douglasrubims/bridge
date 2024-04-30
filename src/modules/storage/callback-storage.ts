import type { Response } from "../../@types";

export interface CallbackProps {
  hash: string;
  resolve: (value: Response<any> | PromiseLike<Response<any>>) => void;
}

class CallbackStorage {
  private requests: CallbackProps[] = [];

  add<T>(
    hash: string,
    resolve: (value: Response<T> | PromiseLike<Response<T>>) => void
  ) {
    this.requests.push({ hash, resolve });
  }

  get(hash: string) {
    return this.requests.find(request => request.hash === hash);
  }

  remove(hash: string) {
    this.requests = this.requests.filter(request => request.hash !== hash);
  }
}

export { CallbackStorage };
