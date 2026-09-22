import axios from "axios";

import { env } from "@/shared/config";

import { API_TIMEOUT_MS } from "./constants";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});
