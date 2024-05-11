import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class PinNotFoundError extends ApiError {
  constructor(pinMessageId: string) {
    const message = `Pinned message with id ${pinMessageId} not found`;
    const statusCode = StatusCodes.NOT_FOUND;
    super({ message, statusCode });
  }
}
