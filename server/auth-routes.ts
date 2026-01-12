import { Router } from 'express';
import { hashPassword, verifyPassword, generateToken, authenticateToken, AuthRequest } from './auth.js';
import { attachTenantDb } from './middleware/tenant.js';
import {
  provisionTenant,
  updateTenantSuperAdmin,
  registerTenantUser,
  getTenantByEmail,
  getTenantByUserEmail,
  getTenantById
} from './services/tenant-provisioning.js';
import { User } from './models/User.js';
import { Tenant } from './models/Tenant.js';
import { PasswordResetToken } from './models/PasswordResetToken.js';
import mongoose from 'mongoose';

export const authRouter = Router();

// Test endpoint
authRouter.get('/test', (req, res) => {
  res.json({ message: 'Server is working! Mongo-Native' });
});

authRouter.get('/debug/constraints', async (req, res) => {
  // No-op for Mongo
  res.json({ ok: true, constraints: [] });
});

// Developer-only helper to reset dev account
authRouter.post('/dev-reset', async (_req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Not allowed in production' });
    }

    const devEmail = 'dev@developer.local';
    const newPassword = 'dev123';
    const NEW_TENANT_ID = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c'; // Hardcoded dev tenant ID from before? Or generate new.
    // Let's check if dev tenant exists, if not create it.

    let devTenant = await Tenant.findOne({ superAdminEmail: devEmail });
    if (!devTenant) {
      // Create dev tenant
      devTenant = await Tenant.create({
        organizationName: 'Developer Tenant',
        superAdminEmail: devEmail,
        status: 'active'
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    let devUser = await User.findOne({ email: devEmail });
    if (!devUser) {
      devUser = await User.create({
        email: devEmail,
        username: 'dev',
        fullName: 'Developer',
        passwordHash: hashedPassword,
        tenantId: devTenant._id.toString(),
        role: 'super_admin',
        isActive: true
      });
    } else {
      devUser.passwordHash = hashedPassword;
      devUser.tenantId = devTenant._id.toString();
      devUser.role = 'super_admin';
      await devUser.save();
    }

    console.log('✅ Dev account reset to dev123');
    return res.json({ ok: true, email: devEmail, password: newPassword });
  } catch (error: any) {
    console.error('[DEV-RESET] Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to reset dev account' });
  }
});

// Helper to determine cookie domain
const getCookieDomain = () => {
  if (process.env.NODE_ENV !== 'production') return undefined;
  if (process.env.VERCEL_URL?.includes('vercel.app')) return '.vercel.app';
  return process.env.COOKIE_DOMAIN || undefined;
};

// Register new user (creates new tenant)
authRouter.post('/register', async (req, res) => {
  try {
    console.log('📥 Registration request received');
    const { email, username, password, fullName, organizationName } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({ error: 'Email, password, and organization name are required' });
    }

    const existingTenant = await getTenantByEmail(email.toLowerCase());
    if (existingTenant) {
      return res.status(400).json({ error: 'An organization already exists for this email' });
    }

    // Provision Tenant
    const provisionResult = await provisionTenant({
      organizationName,
      superAdminEmail: email.toLowerCase()
    });

    if (!provisionResult.success || !provisionResult.tenantId) {
      return res.status(500).json({ error: provisionResult.error || 'Failed to provision tenant' });
    }

    const tenantId = provisionResult.tenantId;
    const passwordHash = await hashPassword(password);

    // Create User
    const newUser = await User.create({
      email: email.toLowerCase(),
      username: username || null,
      passwordHash,
      fullName,
      tenantId,
      role: 'super_admin',
      isActive: true
    });

    // Update Tenant
    await updateTenantSuperAdmin(tenantId, newUser._id.toString());

    await registerTenantUser(tenantId, newUser.email, newUser._id.toString());

    // Generate Token
    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      tenantId: tenantId
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        organizationName,
        role: 'super_admin',
      },
      tenant: {
        id: tenantId,
        organizationName,
      },
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userInput = email.toLowerCase();

    // Find user (by email or username)
    // Note: In Mongo multitenancy, email might not be unique globally if we allowed it, 
    // but our User model enforces unique email for simplicity. 
    // If username is used, we search by username.
    const user = await User.findOne({
      $or: [
        { email: userInput },
        { username: userInput }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const match = await verifyPassword(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Determine Tenant
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return res.status(403).json({ error: 'Tenant not found or inactive' });
    }
    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Organization is not active' });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      tenantId: user.tenantId
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: [user.role], // UI expects array
      },
      tenant: {
        id: tenant._id,
        organizationName: tenant.organizationName,
      },
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: getCookieDomain(),
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

// Switch User (Super Admin only)
authRouter.post('/switch-user', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can switch users' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

    // Ensure same tenant? Or allow cross-tenant? 
    // Logic usually implies same tenant unless platform admin.
    // Let's assume same tenant for safety or if target user is in same tenant.
    // Actually, if super admin is switching, they might be switching to any user they can see.
    // But for FuelOne multitenant, usually it's within the same tenant.

    const tenant = await Tenant.findById(targetUser.tenantId);
    if (!tenant) return res.status(404).json({ error: 'Target tenant not found' });

    const token = generateToken({
      userId: targetUser._id.toString(),
      email: targetUser.email,
      tenantId: targetUser.tenantId
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: targetUser._id,
        email: targetUser.email,
        username: targetUser.username,
        fullName: targetUser.fullName,
        roles: [targetUser.role]
      },
      tenant: {
        id: tenant._id,
        organizationName: tenant.organizationName
      }
    });

  } catch (error: any) {
    console.error('Switch user error:', error);
    res.status(500).json({ error: 'Failed to switch user' });
  }
});

// Get Current User
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tenant = await Tenant.findById(user.tenantId);

    res.json({
      ...user.toObject(),
      id: user._id,
      roles: [user.role],
      tenant: tenant ? {
        id: tenant._id,
        organizationName: tenant.organizationName
      } : null
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Change Password
authRouter.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Passwords required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await verifyPassword(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect current password' });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request Password Reset
authRouter.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Fake success
      return res.json({ ok: true, message: 'If account exists, email sent.' });
    }

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id.toString(),
      token: resetToken,
      expiresAt,
      used: false
    });

    // Send Email (Mock or Real)
    try {
      const { getUncachableResendClient } = await import('./resend-client.js');
      const { client, fromEmail } = await getUncachableResendClient();
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      await client.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'Password Reset',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset.</p>`
      });
    } catch (e) {
      console.warn('Failed to send email:', e);
    }

    res.json({ ok: true, message: 'If account exists, email sent.' });
  } catch (error: any) {
    console.error('Reset request error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Reset Password
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Missing token or password' });

    const resetRecord = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});
