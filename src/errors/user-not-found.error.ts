import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class UserNotFoundError extends ApiError {
  constructor(userId: string) {
    const message = `User with id ${userId} not found`;
    const statusCode = StatusCodes.NOT_FOUND;
    super({ message, statusCode });
  }
}
