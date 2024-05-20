type ApiErrorProps = {
  message: string;
  statusCode: number;
};

export default class ApiError extends Error {
  statusCode: number;

  constructor({ message, statusCode }: ApiErrorProps) {
    super(message);
    this.statusCode = statusCode;
  }
}
