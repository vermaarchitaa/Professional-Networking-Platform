import axios from "axios";

export const clientServer = axios.create({
  baseURL: "https://professional-networking-platform-pdlm.onrender.com",
});