/**
 * MCP Reliability Stats API
 * Get circuit breaker and concurrency stats
 */

import { NextResponse } from 'next/server';
import { getCircuitBreakerStats, resetCircuitBreaker } from '@/lib/reliability/circuitBreaker';
import { concurrency } from '@/lib/reliability/concurrency';
import { caches } from '@/lib/reliability/cache';

export async function GET() {
  try {
    const stats = {
      circuitBreakers: getCircuitBreakerStats(),
      concurrency: concurrency.getStats(),
      caches: caches.getAllStats(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get reliability stats:', error);
    return NextResponse.json(
      { error: 'Failed to get reliability stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, target } = body;

    if (action === 'reset-circuit-breaker') {
      resetCircuitBreaker(target);
      return NextResponse.json({ success: true, message: `Circuit breaker ${target || 'all'} reset` });
    }

    if (action === 'clear-cache') {
      if (target) {
        caches.get(target).clear();
      } else {
        caches.clearAll();
      }
      return NextResponse.json({ success: true, message: `Cache ${target || 'all'} cleared` });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to execute reliability action:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
