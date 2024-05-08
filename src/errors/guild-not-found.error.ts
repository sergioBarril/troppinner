import { StatusCodes } from "http-status-codes";
import ApiError from "./api-error.error";

export default class GuildNotFoundError extends ApiError {
  constructor(guildId: string) {
    const message = `Guild with id ${guildId} not found`;
    const statusCode = StatusCodes.NOT_FOUND;
    super({ message, statusCode });
  }
}
