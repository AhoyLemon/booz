# 🍸 The Headless Bar

A custom bar inventory and cocktail app built with Nuxt 3.

## Features

- **Inventory Management**: Track your bottles with size, state, and images
- **Recipe Discovery**: Find cocktails from TheCocktailDB API
- **Smart Matching**: See which drinks you can make with your current inventory
- **Non-Alcoholic Support**: Includes mocktails, beer, and wine recipes
- **Data Sync**: Import from Notion API, CSV, or local JSON files

## Getting Started

### Install Dependencies

```bash
npm install
```

### Sync Your Inventory Data

```bash
npm run sync-data
```

This will read from `data/inventory.csv` and `data/recipes.json` and generate normalized JSON files in `public/data/`.

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Generate Static Site

```bash
npm run generate
```

## Data Structure

### Inventory CSV

Your `data/inventory.csv` should have these columns:

- `id`, `name`, `category`, `tags`, `inStock`, `bottleSize`, `bottleState`, `image`

### Recipes JSON

Your `data/recipes.json` should follow this structure:

```json
{
  "recipes": [
    {
      "id": "custom-1",
      "name": "Recipe Name",
      "ingredients": [{ "name": "Ingredient", "qty": "2 oz" }],
      "instructions": "Mix and serve",
      "category": "Category",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Notion Integration (Optional)

Set environment variables:

- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`

The sync script will automatically fetch from Notion if these are present.

## Testing

```bash
npm test
```

## Code Formatting

```bash
npm run format
```

## License

MIT
