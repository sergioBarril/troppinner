import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class PinChannelNotFoundError extends ApiError {
  constructor(channelId: string) {
    const message = `Pin channel with id ${channelId} not found.`;
    const statusCode = StatusCodes.NOT_FOUND;
    super({ message, statusCode });
  }
}
