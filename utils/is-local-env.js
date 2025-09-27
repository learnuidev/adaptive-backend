import { env } from "../constants/api-keys.js";

export const isLocalEnv = () => {
  return env === "local";
};
