import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/require-owner';
import { generateEnrichedCatalog } from '@/lib/utils/export';

export async function GET(request: Request) {
  await requireOwner();
  try {
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';

    const enrichedCatalog = await generateEnrichedCatalog();
    
    // Convert to JSON with 2-space formatting
    const jsonString = JSON.stringify(enrichedCatalog, null, 2);

    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    
    if (isDownload) {
      headers.set('Content-Disposition', 'attachment; filename="catalog-taxonomy-enriched.json"');
    }

    return new NextResponse(jsonString, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
