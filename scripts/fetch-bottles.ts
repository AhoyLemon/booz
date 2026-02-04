
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

async function fetchBottles() {
  try {
    const response = await fetch(`${API_URL}/content/items/bottles`, {
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
    if (Array.isArray(data) && data.length === 7) {
      console.log("Success: 7 bottles returned.");
    } else if (Array.isArray(data)) {
      console.log(`Returned ${data.length} bottles.`);
    } else {
      console.log("Unexpected response format.");
    }
  } catch (error) {
    console.error("Error fetching bottles:", error);
  }
}

fetchBottles();
