
import fetch from "node-fetch";

const API_URL = "https://hirelemon.com/bar/api/content/items/bottles";
const API_KEY = "API-319b8ffd3422b8c4e491e9e46356f39bd831dc56";

async function fetchBottles() {
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
