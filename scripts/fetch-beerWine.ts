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

async function fetchBeerWine() {
  try {
    const response = await fetch(`${API_URL}/content/item/beerWine`, {
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
      Array.isArray(data.beer) && data.beer.length === 1 &&
      Array.isArray(data.wine) && data.wine.length === 1
    ) {
      console.log("Success: 1 beer and 1 wine in inventory.");
    } else {
      console.log("Returned data does not match expected inventory counts.");
    }
  } catch (error) {
    console.error("Error fetching beer/wine:", error);
  }
}

fetchBeerWine();
