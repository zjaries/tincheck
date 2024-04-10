import TinCheck from "../src/tincheck.js";
import fs from "fs/promises";
import transformResponse from "../src/transformResponse/transformResponse.js";
import keyOverrides from "../src/transformResponse/keyOverrides.js";
import valueMappers from "../src/transformResponse/valueMappers.js";

(async () => {
  const tincheck = new TinCheck({
    username: process.env.USERNAME!,
    password: process.env.PASSWORD!,
  });

  try {
    const id = "83-33334454430";
    const name = "wreno";
    const check = await tincheck.validate(id, name);
    console.log(check);
  } catch (err) {
    console.log(err.message);
  }
})();
