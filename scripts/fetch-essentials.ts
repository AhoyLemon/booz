import fetch from "node-fetch";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_URL = process.env.COCKPIT_API_URL || "https://hirelemon.com/bar/api";
const API_KEY = process.env.COCKPIT_API_KEY;

if (!API_KEY) {
  console.error("Error: COCKPIT_API_KEY not found in environment variables");
  console.error("Please set COCKPIT_API_KEY in your .env file");
  process.exit(1);
}

async function fetchEssentials() {
  try {
    const response = await fetch(`${API_URL}/content/item/essentials`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cockpit-Token": API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    if (
      data &&
      data.ice === true &&
      data.salt === true &&
      data.water === true &&
      data.tonicWater === true
    ) {
      console.log("Success: ice, salt, water, and tonicWater are true.");
    } else {
      console.log("Returned data does not match expected values.");
    }
  } catch (error) {
    console.error("Error fetching essentials:", error);
  }
}

fetchEssentials();
