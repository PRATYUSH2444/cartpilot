import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { UserModel } from '../modules/users/user.model.js';
import { logger } from '../common/logging/logger.js';
import { auditService } from '../modules/audit/audit.service.js';

async function provisionAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@cartpilot.com';
  const name = process.env.ADMIN_NAME || process.argv[3] || 'System Administrator';
  const rawPassword = process.env.ADMIN_PASSWORD || process.argv[4] || 'AdminInitial1234!';

  logger.info({ email, name }, 'Provisioning administrator via CLI...');

  await connectDatabase();

  const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    logger.warn({ email }, 'Administrator with this email already exists. Skipping provisioning.');
    await disconnectDatabase();
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const admin = await UserModel.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'ADMIN',
    isActive: true,
    tokenVersion: 0,
    mustChangePassword: true, // Mandated by ROLE_CONTRACT.md: forced password change at first login
    failedLoginAttempts: 0,
    isSuspended: false,
    isEmailVerified: true,
  });

  await auditService.recordEvent({
    eventType: 'ADMIN_PROVISIONED',
    actorId: 'CLI_PROVISIONER',
    actorRole: 'SYSTEM',
    resourceId: admin._id.toString(),
    resourceType: 'USER',
    payload: {
      action: 'CLI_ADMIN_PROVISION',
      email: admin.email,
      mustChangePassword: true,
    },
  });

  logger.info(
    { email: admin.email, id: admin._id.toString(), mustChangePassword: true },
    '🎉 Administrator successfully provisioned via CLI with forced first-login password change'
  );

  await disconnectDatabase();
  process.exit(0);
}

provisionAdmin().catch((err) => {
  logger.error({ err }, 'Failed to provision administrator');
  process.exit(1);
});
