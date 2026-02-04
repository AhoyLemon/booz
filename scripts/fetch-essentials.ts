import fetch from "node-fetch";

const API_URL = "https://hirelemon.com/bar/api/content/item/essentials";
const API_KEY = "API-319b8ffd3422b8c4e491e9e46356f39bd831dc56";

async function fetchEssentials() {
  try {
    const response = await fetch(API_URL, {
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
