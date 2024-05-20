import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class DuplicatePinError extends ApiError {
  constructor() {
    const message = "The message is already pinned";
    const statusCode = StatusCodes.CONFLICT;
    super({ message, statusCode });
  }
}
