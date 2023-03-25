export interface CallbackProps {
  hash: string;
  resolve: (value: unknown) => void;
}

class CallbackStorage {
  private requests: CallbackProps[] = [];

  add(hash: string, resolve: (value: unknown) => void) {
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
