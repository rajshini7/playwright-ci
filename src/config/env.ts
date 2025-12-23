import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  baseUrl: process.env.BASE_URL!,
  username: process.env.LOGIN_USER!,
  password: process.env.LOGIN_PASS!,
  loginSuccessSelector: process.env.LOGIN_SUCCESS_SELECTOR!,
  headless: process.env.HEADLESS === "true",
};
