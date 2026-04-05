const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── 1. Users (citizens who report issues) ────────────────────────────────
  const password = await bcrypt.hash('pass123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'ali@citizen.com' },
    update: {},
    create: {
      email: 'ali@citizen.com',
      phone: '0111111111',
      password,
      firstName: 'Ali',
      lastName: 'Hassan',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'siti@citizen.com' },
    update: {},
    create: {
      email: 'siti@citizen.com',
      phone: '0122222222',
      password,
      firstName: 'Siti',
      lastName: 'Aminah',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'ravi@citizen.com' },
    update: {},
    create: {
      email: 'ravi@citizen.com',
      phone: '0133333333',
      password,
      firstName: 'Ravi',
      lastName: 'Kumar',
    },
  });

  console.log('✓ Users created');

  // ── 2. Admins ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin1 = await prisma.admin.upsert({
    where: { email: 'admin@city.gov' },
    update: {},
    create: {
      email: 'admin@city.gov',
      password: adminPassword,
      name: 'City Admin',
    },
  });

  const admin2 = await prisma.admin.upsert({
    where: { email: 'roads@city.gov' },
    update: {},
    create: {
      email: 'roads@city.gov',
      password: adminPassword,
      name: 'Roads Department',
    },
  });

  console.log('✓ Admins created');

  // ── 3. Issues ─────────────────────────────────────────────────────────────
  const issue1 = await prisma.issue.create({
    data: {
      title: 'Large pothole on Jalan Ampang',
      description: 'There is a large pothole near the traffic light causing damage to vehicles.',
      category: 'Roads',
      status: 'Pending',
      latitude: 3.1578,
      longitude: 101.7123,
      address: 'Jalan Ampang, Kuala Lumpur',
      userId: user1.id,
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      title: 'Broken street light at Taman Desa',
      description: 'Street light has been out for 2 weeks. Area is very dark at night.',
      category: 'Street Lighting',
      status: 'In Progress',
      latitude: 3.1012,
      longitude: 101.6789,
      address: 'Taman Desa, Kuala Lumpur',
      userId: user2.id,
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      title: 'Overflowing rubbish bins at Masjid India',
      description: 'Public bins have not been collected for 5 days. Strong odour and health hazard.',
      category: 'Waste Management',
      status: 'Resolved',
      latitude: 3.1488,
      longitude: 101.6986,
      address: 'Masjid India, Kuala Lumpur',
      userId: user3.id,
    },
  });

  const issue4 = await prisma.issue.create({
    data: {
      title: 'Illegal dumping behind Chow Kit market',
      description: 'Construction waste dumped illegally. Blocking pedestrian path.',
      category: 'Waste Management',
      status: 'Rejected',
      latitude: 3.1621,
      longitude: 101.6989,
      address: 'Chow Kit, Kuala Lumpur',
      userId: user1.id,
    },
  });

  const issue5 = await prisma.issue.create({
    data: {
      title: 'Burst water pipe at Bangsar',
      description: 'Water gushing from underground pipe since yesterday morning.',
      category: 'Water Supply',
      status: 'Pending',
      latitude: 3.1302,
      longitude: 101.6740,
      address: 'Bangsar, Kuala Lumpur',
      userId: user2.id,
    },
  });

  console.log('✓ Issues created');

  // ── 4. Upvotes ────────────────────────────────────────────────────────────
  await prisma.upvote.createMany({
    data: [
      { userId: user2.id, issueId: issue1.id },
      { userId: user3.id, issueId: issue1.id },
      { userId: user1.id, issueId: issue2.id },
      { userId: user1.id, issueId: issue5.id },
      { userId: user3.id, issueId: issue5.id },
    ],
    skipDuplicates: true,
  });

  // Update upvote counts
  await prisma.issue.update({ where: { id: issue1.id }, data: { upvoteCount: 2 } });
  await prisma.issue.update({ where: { id: issue2.id }, data: { upvoteCount: 1 } });
  await prisma.issue.update({ where: { id: issue5.id }, data: { upvoteCount: 2 } });

  console.log('✓ Upvotes created');

  // ── 5. Comments ───────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      { text: 'This pothole damaged my tyre last week!', userId: user2.id, issueId: issue1.id },
      { text: 'Please fix this urgently.', userId: user3.id, issueId: issue1.id },
      { text: 'My kids are scared to walk at night because of this.', userId: user1.id, issueId: issue2.id },
    ],
  });

  console.log('✓ Comments created');

  // ── 6. Status logs ────────────────────────────────────────────────────────
  const log1 = await prisma.statusLog.create({
    data: {
      issueId: issue2.id,
      adminId: admin2.id,
      oldStatus: 'Pending',
      newStatus: 'In Progress',
      remarks: 'Assigned to electrical team. Work scheduled for this week.',
    },
  });

  const log2 = await prisma.statusLog.create({
    data: {
      issueId: issue3.id,
      adminId: admin1.id,
      oldStatus: 'Pending',
      newStatus: 'In Progress',
      remarks: 'Waste collection team dispatched.',
    },
  });

  const log3 = await prisma.statusLog.create({
    data: {
      issueId: issue3.id,
      adminId: admin1.id,
      oldStatus: 'In Progress',
      newStatus: 'Resolved',
      remarks: 'Bins cleared and area cleaned. Issue resolved.',
    },
  });

  const log4 = await prisma.statusLog.create({
    data: {
      issueId: issue4.id,
      adminId: admin1.id,
      oldStatus: 'Pending',
      newStatus: 'Rejected',
      remarks: 'Duplicate report — already tracked under a separate enforcement case.',
    },
  });

  console.log('✓ Status logs created');

  // ── 7. Notifications ──────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: user2.id,
        issueId: issue2.id,
        message: 'Your issue "Broken street light at Taman Desa" status changed to In Progress.',
        isRead: false,
      },
      {
        userId: user1.id,
        issueId: issue2.id,
        message: 'An issue you upvoted changed status to In Progress.',
        isRead: true,
      },
      {
        userId: user3.id,
        issueId: issue3.id,
        message: 'Your issue "Overflowing rubbish bins at Masjid India" status changed to Resolved.',
        isRead: false,
      },
      {
        userId: user1.id,
        issueId: issue4.id,
        message: 'Your issue "Illegal dumping behind Chow Kit market" status changed to Rejected.',
        isRead: false,
      },
      {
        userId: String(admin1.id),
        issueId: issue5.id,
        message: 'New issue reported: Burst water pipe at Bangsar.',
        isRead: false,
      },
    ],
  });

  console.log('✓ Notifications created');

  console.log('\nSeed complete! Summary:');
  console.log('  Users    : 3  (password: pass123)');
  console.log('  Admins   : 2  (password: admin123)');
  console.log('             admin@city.gov | roads@city.gov');
  console.log('  Issues   : 5  (Pending×2, In Progress×1, Resolved×1, Rejected×1)');
  console.log('  Upvotes  : 5');
  console.log('  Comments : 3');
  console.log('  Logs     : 4');
  console.log('  Notifs   : 5');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
