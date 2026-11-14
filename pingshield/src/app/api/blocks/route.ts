import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureDbInitialized } from '@/lib/init';
import { getBlocksByUser, createBlock, deleteBlock } from '@/lib/db';

export async function GET() {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const blocks = getBlocksByUser(userId);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('List blocks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { sessionId, phoneHash, reason } = body;

    if (!sessionId && !phoneHash) {
      return NextResponse.json(
        { error: 'Either sessionId or phoneHash is required' },
        { status: 400 }
      );
    }

    createBlock(userId, { sessionId, phoneHash, reason });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Create block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    ensureDbInitialized();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Block ID is required' }, { status: 400 });
    }

    if (!getBlocksByUser((session.user as any).id).some(block => block.id === id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    deleteBlock(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
