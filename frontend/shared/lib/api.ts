import axios from "axios";

import { env } from "@/shared/config";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});
