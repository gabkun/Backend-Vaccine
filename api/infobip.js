import "dotenv/config";
import { Infobip, AuthType } from "@infobip-api/sdk";

const infobip = new Infobip({
  baseUrl: process.env.INFOBIP_BASE_URL,
  apiKey: process.env.INFOBIP_API_KEY,
  authType: AuthType.ApiKey,
});

export default infobip;
