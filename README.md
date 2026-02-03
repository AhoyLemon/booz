# 🍸 The Headless Bar

A custom bar inventory and cocktail app built with Nuxt 3.

## Features

- **Inventory Management**: Track your bottles with size, state, and images
- **Recipe Discovery**: Find cocktails from TheCocktailDB API
- **Smart Matching**: See which drinks you can make with your current inventory
- **Non-Alcoholic Support**: Includes mocktails, beer, and wine recipes
- **Data Sync**: Import from Notion API, CSV, or local JSON files

## Made with

[![Vite](https://img.shields.io/badge/Nuxt-000?style=for-the-badge&labelColor=00DC82&logo=nuxt&logoColor=white&color=222)](https://nuxt.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-000?style=for-the-badge&labelColor=4FC08D&logo=vue.js&logoColor=white&color=222)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-000?style=for-the-badge&labelColor=3178C6&logo=typescript&logoColor=white&color=222)](https://www.typescriptlang.org/)
[![Sass](https://img.shields.io/badge/Sass-000?style=for-the-badge&labelColor=CC6699&logo=sass&logoColor=white&color=222)](https://sass-lang.com/)
[![Pug](https://img.shields.io/badge/Pug-000?style=for-the-badge&labelColor=A86454&logo=pug&logoColor=white&color=222)](https://pugjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-000?style=for-the-badge&labelColor=6E9F18&logo=vitest&logoColor=white&color=222)](https://vitest.dev)
[![Prettier](https://img.shields.io/badge/Prettier-000?style=for-the-badge&labelColor=F7B93E&logo=prettier&logoColor=111&color=222)](https://prettier.io)
[![Notion](https://img.shields.io/badge/Notion-000?style=for-the-badge&labelColor=000000&logo=notion&logoColor=white&color=222)](https://www.notion.so)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Sync Your Inventory Data

#### Option 1: With Notion Integration (Recommended)

If you want to use your Notion database as the source of truth:

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Follow the [Notion Integration Setup](#notion-integration-optional) instructions below to get your API key and database ID

3. Add your credentials to the `.env` file

4. Run the sync script:
   ```bash
   npm run sync-data
   ```

The script will fetch data from Notion and merge it with your local CSV. **Notion data takes priority** when the same bottle exists in both sources.

#### Option 2: Without Notion (CSV only)

```bash
npm run sync-data
```

This will read from `data/bottles.csv` and `data/drinks.json` and generate normalized JSON files in `public/data/`.

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

Your `data/bottles.csv` should have these columns:

- `id`, `name`, `category`, `tags`, `inStock`, `bottleSize`, `bottleState`, `image`

### Drinks JSON

Your `data/drinks.json` should follow this structure:

```json
{
  "drinks": [
    {
      "id": "custom-1",
      "name": "Drink Name",
      "ingredients": [{ "name": "Ingredient", "qty": "2 oz" }],
      "instructions": "Mix and serve",
      "category": "Category",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Notion Integration (Optional)

To use your Notion database as the primary source of truth for your inventory, follow these steps:

#### Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "**+ New integration**"
3. Give it a name (e.g., "Lemonbar Sync")
4. Select the workspace that contains your database
5. Click "**Submit**"
6. Copy the "**Internal Integration Token**" (starts with `secret_`) - this is your `NOTION_API_KEY`

#### Step 2: Share Your Database with the Integration

1. Open your Liquor Cabinet database in Notion (e.g., https://ahoylemon.notion.site/c52ff95a53774261a8301435ee2c9be6)
2. Click the "**•••**" menu in the top-right corner
3. Scroll to "**Connections**" at the bottom
4. Click "**+ Add connections**" and select your integration
5. Click "**Confirm**"

#### Step 3: Get Your Database ID

From your Notion database URL, extract the database ID:

- **URL format**: `https://notion.so/workspace/<database_id>?v=<view_id>`
- **Example**: For `https://ahoylemon.notion.site/c52ff95a53774261a8301435ee2c9be6?v=a9582664318d4f478b5922fa1b7bd2bd`
- **Database ID**: `c52ff95a53774261a8301435ee2c9be6` (the part between the last `/` and `?v=`)

#### Step 4: Configure Environment Variables

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```bash
   NOTION_API_KEY=secret_xxxxxxxxxxxxx
   NOTION_DATABASE_ID=c52ff95a53774261a8301435ee2c9be6
   ```

#### Step 5: Sync Your Data

Run the sync script to fetch from Notion:

```bash
npm run sync-data
```

You should see output like:

```
📡 Fetching inventory from Notion...
✅ Fetched X bottles from Notion
```

**Important Notes:**

- The sync script merges Notion data with your local CSV
- When both sources have the same bottle (matching ID), **Notion data takes priority**
- The web management UI updates the local CSV only - run `npm run sync-data` to sync with Notion
- Your Notion database must have these columns: `Name` (title), `Category` (select), `Tags` (multi-select), `InStock` (checkbox), `BottleSize` (text), `BottleState` (select), `Image` (files)

### Managing Inventory via Web Interface

You can add, edit, and delete bottles directly from the web interface:

1. Start the development server: `npm run dev`
2. Navigate to `/inventory`
3. Click "Manage Inventory" button
4. Use the form to add new bottles or click "Edit" on existing bottles to modify them

Changes made through the web interface will update `data/bottles.csv` immediately. Run `npm run sync-data` afterward to regenerate the public JSON files.

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
