export interface Response<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
