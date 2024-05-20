import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class GuildChannelError extends ApiError {
  constructor() {
    const message = `The guild doesn't have the channel assigned`;
    const statusCode = StatusCodes.BAD_REQUEST;
    super({ message, statusCode });
  }
}
