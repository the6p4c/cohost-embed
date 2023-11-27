import winston from "winston";

import config from "@/common/config";
import { PostId } from "@/common/job";

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.metadata({}),
    winston.format.printf(({ level, metadata, message }) => {
      const prefixFromId = (id: PostId) =>
        id.flags.length === 0
          ? `[@${id.projectHandle}, ${id.slug}] `
          : `[@${id.projectHandle}, ${id.slug} {${id.flags.join(" ")}}] `;
      const prefix = metadata.id ? prefixFromId(metadata.id) : "";
      return `${level}: ${prefix}${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
