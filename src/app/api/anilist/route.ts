import { NextResponse } from 'next/server';
import { fetchAniListCollection } from '@/lib/anilist';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || 'yuckitsyue';
    try {
        const collection = await fetchAniListCollection(user);
        return NextResponse.json({ ok: true, collection }, { status: 200 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}