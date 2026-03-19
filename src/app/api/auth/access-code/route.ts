/**
 * Access Code Login API
 *
 * Verifies a 6-character access code and returns user info.
 * If user hasn't set a password, returns a token for password setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { accessCodes, residents } from '@/lib/schema-letshelp';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleanCode.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // Find the access code
    const codeList = await db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.code, cleanCode))
      .limit(1);

    if (!codeList.length) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    const accessCode = codeList[0];
    if (!accessCode) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    // Check if code is active
    if (accessCode.status !== 'active') {
      const statusMessage = {
        used: 'This access code has already been used',
        revoked: 'This access code has been revoked',
        expired: 'This access code has expired',
      }[accessCode.status] || 'This access code is not valid';

      return NextResponse.json({ error: statusMessage }, { status: 401 });
    }

    // Check if code is expired
    if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
      return NextResponse.json({ error: 'This access code has expired' }, { status: 401 });
    }

    // Get resident info
    const residentList = await db
      .select()
      .from(residents)
      .where(eq(residents.id, accessCode.residentId))
      .limit(1);

    if (!residentList.length) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    const resident = residentList[0];
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    // Get user info
    const userList = await db
      .select()
      .from(user)
      .where(eq(user.id, resident.userId))
      .limit(1);

    if (!userList.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userInfo = userList[0];
    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a password set (via Better Auth account)
    const accountList = await db.query.account.findFirst({
      where: (account, { eq }) => eq(account.userId, userInfo.id),
    });

    const hasPassword = accountList && accountList.password;

    // Mark code as used if this is first login
    if (!hasPassword) {
      await db
        .update(accessCodes)
        .set({
          status: 'used',
          usedAt: new Date(),
        })
        .where(eq(accessCodes.id, accessCode.id));

      // Update resident status to active
      await db
        .update(residents)
        .set({
          status: 'active',
          lastLoginAt: new Date(),
        })
        .where(eq(residents.id, resident.id));

      // Generate a temporary token for password setup
      const token = Buffer.from(
        JSON.stringify({
          userId: userInfo.id,
          residentId: resident.id,
          code: cleanCode,
          exp: Date.now() + 30 * 60 * 1000, // 30 minutes
        })
      ).toString('base64');

      return NextResponse.json({
        needsPassword: true,
        token,
        redirect: null,
      });
    }

    // User has password, sign them in
    // For now, we'll create a session using Better Auth
    // In production, you might want to use a more secure method

    // Update last login
    await db
      .update(residents)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(residents.id, resident.id));

    // Create session by signing in with Better Auth
    // Note: This requires the user to already have a Better Auth session
    // For access code login, we'll create a session manually

    return NextResponse.json({
      needsPassword: false,
      redirect: '/senior',
    });
  } catch (error) {
    console.error('Access code login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
