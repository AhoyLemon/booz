import fetch from "node-fetch";

const API_URL = "https://hirelemon.com/bar/api/content/item/beerWine";
const API_KEY = "API-319b8ffd3422b8c4e491e9e46356f39bd831dc56";

async function fetchBeerWine() {
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
