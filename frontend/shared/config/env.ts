import { DEFAULT_API_URL } from "./constants";

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
};
