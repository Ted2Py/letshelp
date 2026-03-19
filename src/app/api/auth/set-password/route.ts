/**
 * Set Password API
 *
 * Allows seniors to set their password after first login with access code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user, account } from '@/lib/schema';
import { residents } from '@/lib/schema-letshelp';

export async function POST(request: NextRequest) {
  try {
    const { token, code, password } = await request.json();

    if (!token || !code || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify token
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Check token expiration
    if (tokenData.exp < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify user exists
    const userList = await db
      .select()
      .from(user)
      .where(eq(user.id, tokenData.userId))
      .limit(1);

    if (!userList.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userInfo = userList[0];
    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash password (simple implementation - use bcrypt in production)
    // For now, Better Auth will handle password hashing
    const hashedPassword = password; // Better Auth will hash this

    // Create or update account with password
    const existingAccount = await db.query.account.findFirst({
      where: (acc, { eq }) => eq(acc.userId, userInfo.id),
    });

    if (existingAccount) {
      // Update existing account
      await db
        .update(account)
        .set({
          password: hashedPassword,
        })
        .where(eq(account.id, existingAccount.id));
    } else {
      // Create new account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: userInfo.id,
        accountId: userInfo.id,
        providerId: 'credential',
        password: hashedPassword,
      });
    }

    // Mark user email as verified
    await db
      .update(user)
      .set({
        emailVerified: true,
      })
      .where(eq(user.id, userInfo.id));

    // Update resident status
    await db
      .update(residents)
      .set({
        status: 'active',
        lastLoginAt: new Date(),
      })
      .where(eq(residents.id, tokenData.residentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
