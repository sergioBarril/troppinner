import { Events, TextBasedChannel } from "discord.js";
import { Event } from "../interfaces/event";
import logger from "../config/logger";

async function execute(channel: TextBasedChannel, timestamp: any) {
  logger.info(
    { channel, timestamp },
    `Received an interaction of type ${Events.ChannelPinsUpdate}`,
  );
}

const onPinsUpdate: Event = {
  name: Events.ChannelPinsUpdate,
  once: false,
  execute,
};

export default onPinsUpdate;
