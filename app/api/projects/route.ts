import { NextResponse } from 'next/server';
import { projectPositions } from '@/lib/projects';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(projectPositions());
}
