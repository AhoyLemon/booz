import { Client } from '@notionhq/client'
import type { Bottle } from '../types'

interface NotionBottle {
  '': { title: Array<{ plain_text: string }> } // Empty string for title column
  Category: { select: { name: string } }
  'Type(s)': { multi_select: Array<{ name: string }> }
  Status: { select: { name: string } }
  Photo: { files: Array<{ file?: { url: string }; external?: { url: string } }> }
}

export async function fetchFromNotion(): Promise<Bottle[]> {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    console.log('⚠️  Notion API credentials not found, skipping Notion sync')
    return []
  }

  try {
    console.log('📡 Fetching inventory from Notion...')
    const notion = new Client({ auth: apiKey })

    const response = await notion.databases.query({
      database_id: databaseId,
    })

    const bottles: Bottle[] = response.results.map((page: any) => {
      const props = page.properties as NotionBottle
      const imageFile = props.Photo?.files?.[0]
      const imageUrl = imageFile?.file?.url || imageFile?.external?.url
      const status = props.Status?.select?.name?.toLowerCase()

      return {
        id: page.id,
        name: props[''].title[0]?.plain_text || '',
        category: props.Category.select?.name || 'Other',
        tags: props['Type(s)']?.multi_select?.map(tag => tag.name) || [],
        inStock: status !== 'empty',
        bottleSize: undefined,
        bottleState: (status as 'unopened' | 'opened' | 'empty') || undefined,
        image: imageUrl || undefined,
      }
    })

    console.log(`✅ Fetched ${bottles.length} bottles from Notion`)
    return bottles
  } catch (error) {
    console.error('❌ Error fetching from Notion:', error)
    return []
  }
}
