import { NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/init';
import { getTagByToken } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();

    const { token } = await params;
    const tag = getTagByToken(token);

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const findUrl = `${appUrl}/find/${token}`;

    const pngBuffer = await QRCode.toBuffer(findUrl, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
