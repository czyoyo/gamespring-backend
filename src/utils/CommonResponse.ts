export class CommonResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(message: string, data?: T): CommonResponse<T> {
    return new CommonResponse(true, message, data);
  }

  static error(message: string): CommonResponse<null> {
    return new CommonResponse(false, message);
  }
}
