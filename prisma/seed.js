const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function daysAgo(n, offsetHours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - offsetHours);
  return d;
}

function between(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const AREAS = [
  { name: 'Chow Kit, Kuala Lumpur',      lat: 3.1621, lng: 101.6989, weight: 9 },
  { name: 'Bangsar, Kuala Lumpur',        lat: 3.1302, lng: 101.6740, weight: 8 },
  { name: 'Jalan Ampang, Kuala Lumpur',   lat: 3.1578, lng: 101.7123, weight: 7 },
  { name: 'Masjid India, Kuala Lumpur',   lat: 3.1488, lng: 101.6986, weight: 6 },
  { name: 'Petaling Jaya, Selangor',      lat: 3.1073, lng: 101.6067, weight: 6 },
  { name: 'Wangsa Maju, Kuala Lumpur',    lat: 3.2070, lng: 101.7373, weight: 5 },
  { name: 'Taman Desa, Kuala Lumpur',     lat: 3.1012, lng: 101.6789, weight: 4 },
  { name: 'Mont Kiara, Kuala Lumpur',     lat: 3.1729, lng: 101.6497, weight: 4 },
  { name: 'Kepong, Kuala Lumpur',         lat: 3.2100, lng: 101.6367, weight: 3 },
  { name: 'Puchong, Selangor',            lat: 3.0241, lng: 101.6189, weight: 2 },
];

const CATEGORIES = ['Road', 'Garbage', 'Water', 'Electricity', 'Other'];

const ISSUE_TEMPLATES = {
  Road: [
    { title: 'Large pothole causing vehicle damage',       desc: 'Deep pothole near traffic light causing tyre damage to vehicles passing through.' },
    { title: 'Road surface cracking and subsidence',       desc: 'Road surface has cracked and is sinking. Risk of serious damage during rain.' },
    { title: 'Damaged road divider after accident',        desc: 'Road divider was hit and broken. Debris on road is dangerous for drivers.' },
    { title: 'Uneven road surface after utility work',     desc: 'Road was not properly resurfaced after water pipe repair work last month.' },
    { title: 'Flooded road blocking traffic flow',         desc: 'Poor drainage causes road to flood after every heavy rain.' },
    { title: 'Faded road markings at busy junction',       desc: 'Lane markings and pedestrian crossing have faded completely. Dangerous.' },
  ],
  Garbage: [
    { title: 'Overflowing public bins not collected',      desc: 'Bins have not been emptied for 5 days. Strong odour and attracting pests.' },
    { title: 'Illegal dumping of construction waste',      desc: 'Large pile of construction rubble dumped on public land overnight.' },
    { title: 'Abandoned mattresses blocking walkway',      desc: 'Bulky waste left on the pedestrian path for over a week.' },
    { title: 'Littering at public park causing health risk', desc: 'Excessive litter around park benches. Area is unsanitary for families.' },
    { title: 'Bin lorry missed scheduled collection',      desc: 'Waste collection truck has skipped this road for 3 consecutive weeks.' },
    { title: 'Dead animal carcass near playground',        desc: 'Decomposing animal near playground is a serious health hazard for children.' },
  ],
  Water: [
    { title: 'Burst water main flooding street',           desc: 'Water gushing from underground pipe. Has been running since yesterday morning.' },
    { title: 'Leaking water pipe causing road slippage',   desc: 'Slow leak causing water pooling. Slippery surface for motorcyclists.' },
    { title: 'No water supply for 2 days',                 desc: 'Entire block has had no running water. Affecting households and businesses.' },
    { title: 'Sewage backflow into monsoon drain',         desc: 'Sewage overflowing due to blockage upstream. Foul smell throughout area.' },
    { title: 'Brown discoloured water from taps',          desc: 'Tap water has been brown and foul smelling for 3 days. Unfit for consumption.' },
    { title: 'Blocked drain causing flash flood',          desc: 'Clogged storm drain causing localised flooding every time it rains.' },
  ],
  Electricity: [
    { title: 'Street light out for 2 weeks',               desc: 'Street lamp has been off for 14 days. Area is dark and unsafe at night.' },
    { title: 'Exposed electrical wire near playground',    desc: 'Damaged cable exposed near children play area. Serious electrocution risk.' },
    { title: 'Faulty traffic light causing congestion',    desc: 'Traffic light stuck on red during peak hours causing major tailbacks.' },
    { title: 'Frequent power trips in residential block',  desc: 'Power disruptions affecting the whole residential block every few days.' },
    { title: 'Fallen electricity pole blocking road',      desc: 'Utility pole fell after storm. One lane blocked and wires may be live.' },
    { title: 'Buzzing and flickering street lights',       desc: 'Multiple street lamps flickering and buzzing. Possible fire hazard.' },
  ],
  Other: [
    { title: 'Vandalism and graffiti on public wall',      desc: 'Obscene graffiti sprayed on community centre wall overnight.' },
    { title: 'Stray dogs menacing pedestrians',            desc: 'Pack of stray dogs has been aggressive towards pedestrians and children.' },
    { title: 'Overgrown tree branches blocking road',      desc: 'Large branches hanging over road. Risk of falling on passing vehicles.' },
    { title: 'Broken park bench with sharp metal edges',   desc: 'Damaged bench with protruding metal has already injured one child.' },
    { title: 'Unauthorised hawker blocking walkway',       desc: 'Illegal food stall blocking the full width of the pedestrian path.' },
    { title: 'Abandoned vehicle obstructing parking',      desc: 'Car with no plates has been parked and abandoned for over a month.' },
  ],
};

const STATUS_POOL = [
  ...Array(12).fill('Pending'),
  ...Array(8).fill('In Progress'),
  ...Array(16).fill('Resolved'),
  ...Array(6).fill('Rejected'),
];

const AVG_RESOLUTION_DAYS = { Road: 5, Garbage: 2, Water: 3, Electricity: 4, Other: 6 };

const COMMENT_POOL = [
  'This has been a problem for months. Please fix urgently.',
  'My family was affected by this. Very frustrating situation.',
  'I reported this last week too. Still not resolved.',
  'This is causing traffic jams every morning.',
  'Children walk past here daily. Very dangerous.',
  'Thank you to the team for the quick response!',
  'This needs immediate attention from the authorities.',
  'Same issue happened last year. Seems like a recurring problem.',
  'I have photos if needed. Please contact me.',
  'The whole neighbourhood is affected by this issue.',
];

async function main() {
  console.log('Seeding rich dataset...\n');

  const userPw  = await bcrypt.hash('pass123',  10);
  const adminPw = await bcrypt.hash('admin123', 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const userDefs = [
    { email: 'ali@citizen.com',    phone: '0111111111', firstName: 'Ali',      lastName: 'Hassan'  },
    { email: 'siti@citizen.com',   phone: '0122222222', firstName: 'Siti',     lastName: 'Aminah'  },
    { email: 'ravi@citizen.com',   phone: '0133333333', firstName: 'Ravi',     lastName: 'Kumar'   },
    { email: 'mei@citizen.com',    phone: '0144444444', firstName: 'Mei',      lastName: 'Ling'    },
    { email: 'farid@citizen.com',  phone: '0155555555', firstName: 'Farid',    lastName: 'Ismail'  },
    { email: 'priya@citizen.com',  phone: '0166666666', firstName: 'Priya',    lastName: 'Nair'    },
    { email: 'zul@citizen.com',    phone: '0177777777', firstName: 'Zulkifli', lastName: 'Ahmad'   },
    { email: 'wei@citizen.com',    phone: '0188888888', firstName: 'Wei',      lastName: 'Chen'    },
  ];

  const users = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email }, update: {},
      create: { ...u, password: userPw },
    });
    users.push(user);
  }
  console.log(`Users: ${users.length}`);

  // ── Admins ─────────────────────────────────────────────────────────────────
  const adminDefs = [
    { email: 'admin@city.gov',    name: 'City Admin'        },
    { email: 'roads@city.gov',    name: 'Roads Department'  },
    { email: 'env@city.gov',      name: 'Environment Dept'  },
    { email: 'water@city.gov',    name: 'Water Authority'   },
    { email: 'electric@city.gov', name: 'Electricity Board' },
  ];

  const admins = [];
  for (const a of adminDefs) {
    const admin = await prisma.admin.upsert({
      where: { email: a.email }, update: {},
      create: { ...a, password: adminPw },
    });
    admins.push(admin);
  }
  console.log(`Admins: ${admins.length}`);

  // ── Issues ─────────────────────────────────────────────────────────────────
  const issueSpecs = [];
  for (const area of AREAS) {
    for (let w = 0; w < area.weight; w++) {
      const cat      = CATEGORIES[between(0, CATEGORIES.length - 1)];
      const tmpl     = ISSUE_TEMPLATES[cat][between(0, ISSUE_TEMPLATES[cat].length - 1)];
      const status   = STATUS_POOL[between(0, STATUS_POOL.length - 1)];
      const daysBack = w < 3 ? between(0, 14) : between(5, 60);
      const user     = users[between(0, users.length - 1)];
      const lat      = area.lat + (Math.random() - 0.5) * 0.008;
      const lng      = area.lng + (Math.random() - 0.5) * 0.008;
      issueSpecs.push({ area, cat, tmpl, status, daysBack, user, lat, lng });
    }
  }

  const issues = [];
  for (const s of issueSpecs) {
    const createdAt = daysAgo(s.daysBack, between(0, 18));
    const issue = await prisma.issue.create({
      data: {
        title:       s.tmpl.title,
        description: s.tmpl.desc,
        category:    s.cat,
        status:      s.status,
        latitude:    parseFloat(s.lat.toFixed(6)),
        longitude:   parseFloat(s.lng.toFixed(6)),
        address:     s.area.name,
        userId:      s.user.id,
        createdAt,
        updatedAt:   createdAt,
      },
    });
    issues.push({ ...issue, spec: s });
  }
  console.log(`Issues: ${issues.length} across ${AREAS.length} areas`);

  // ── Upvotes ────────────────────────────────────────────────────────────────
  let totalUpvotes = 0;
  for (const issue of issues) {
    const areaWeight = issue.spec.area.weight;
    const maxUp  = areaWeight >= 7 ? 14 : areaWeight >= 5 ? 9 : 5;
    const minUp  = areaWeight >= 7 ? 3  : areaWeight >= 5 ? 1 : 0;
    const count  = between(minUp, maxUp);
    if (count === 0) continue;

    const otherUsers = users.filter(u => u.id !== issue.userId)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, users.length - 1));

    if (!otherUsers.length) continue;

    await prisma.upvote.createMany({
      data: otherUsers.map(u => ({ userId: u.id, issueId: issue.id })),
      skipDuplicates: true,
    });
    await prisma.issue.update({
      where: { id: issue.id },
      data:  { upvoteCount: otherUsers.length },
    });
    totalUpvotes += otherUsers.length;
  }
  console.log(`Upvotes: ${totalUpvotes}`);

  // ── Status logs ────────────────────────────────────────────────────────────
  let logCount = 0;
  const REJECT_REASONS = [
    'Duplicate report — already tracked under separate case.',
    'Outside our jurisdiction. Referred to federal agency.',
    'Insufficient details provided. Cannot verify location.',
    'Issue already resolved by contractor before inspection.',
  ];

  for (const issue of issues) {
    const admin     = admins[between(0, admins.length - 1)];
    const createdAt = new Date(issue.createdAt);
    const avgDays   = AVG_RESOLUTION_DAYS[issue.spec.cat] || 4;

    if (issue.status === 'In Progress') {
      const changedAt = new Date(createdAt);
      changedAt.setDate(changedAt.getDate() + between(1, 3));
      await prisma.statusLog.create({
        data: { issueId: issue.id, adminId: admin.id, oldStatus: 'Pending', newStatus: 'In Progress', remarks: 'Team assigned. Work scheduled.', changedAt },
      });
      logCount++;
    }

    if (issue.status === 'Resolved') {
      const progressAt = new Date(createdAt);
      progressAt.setDate(progressAt.getDate() + between(1, 2));

      const jitter     = (Math.random() - 0.5) * 0.6;
      const daysToResolve = Math.max(0.5, avgDays * (1 + jitter));
      const resolvedAt = new Date(createdAt.getTime() + daysToResolve * 86400000);

      await prisma.statusLog.create({
        data: { issueId: issue.id, adminId: admin.id, oldStatus: 'Pending', newStatus: 'In Progress', remarks: 'Assigned to field team.', changedAt: progressAt },
      });
      await prisma.statusLog.create({
        data: { issueId: issue.id, adminId: admin.id, oldStatus: 'In Progress', newStatus: 'Resolved', remarks: 'Issue inspected and resolved. Area cleared.', changedAt: resolvedAt },
      });
      logCount += 2;
    }

    if (issue.status === 'Rejected') {
      const changedAt = new Date(createdAt);
      changedAt.setDate(changedAt.getDate() + between(1, 4));
      await prisma.statusLog.create({
        data: { issueId: issue.id, adminId: admin.id, oldStatus: 'Pending', newStatus: 'Rejected', remarks: REJECT_REASONS[between(0, REJECT_REASONS.length - 1)], changedAt },
      });
      logCount++;
    }
  }
  console.log(`Status logs: ${logCount}`);

  // ── Comments ───────────────────────────────────────────────────────────────
  let commentCount = 0;
  for (const issue of issues) {
    if (Math.random() < 0.55) {
      const count = between(1, 3);
      for (let i = 0; i < count; i++) {
        await prisma.comment.create({
          data: {
            text:    COMMENT_POOL[between(0, COMMENT_POOL.length - 1)],
            userId:  users[between(0, users.length - 1)].id,
            issueId: issue.id,
          },
        });
        commentCount++;
      }
    }
  }
  console.log(`Comments: ${commentCount}`);

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifData = [];

  for (const issue of issues) {
    if (issue.status === 'Resolved') {
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" has been resolved.`, isRead: Math.random() > 0.4 });
    }
    if (issue.status === 'Rejected') {
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" was rejected. See remarks for details.`, isRead: Math.random() > 0.5 });
    }
    if (issue.status === 'In Progress') {
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" is now being worked on.`, isRead: Math.random() > 0.6 });
    }
    // Admin notification for every issue
    notifData.push({
      userId:  String(admins[0].id),
      issueId: issue.id,
      message: `New issue reported: "${issue.title}" in ${issue.spec.area.name}.`,
      isRead:  issue.spec.daysBack > 7,
    });
  }

  for (let i = 0; i < notifData.length; i += 50) {
    await prisma.notification.createMany({ data: notifData.slice(i, i + 50), skipDuplicates: true });
  }
  console.log(`Notifications: ${notifData.length}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    pending:    issues.filter(i => i.status === 'Pending').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved:   issues.filter(i => i.status === 'Resolved').length,
    rejected:   issues.filter(i => i.status === 'Rejected').length,
  };

  console.log(`
Seed complete!
  Users    : ${users.length}           password: pass123
  Admins   : ${admins.length}           password: admin123
  Issues   : ${issues.length}  (Pending ${counts.pending} / In Progress ${counts.inProgress} / Resolved ${counts.resolved} / Rejected ${counts.rejected})
  Areas    : ${AREAS.length}  densities: ${AREAS.map(a => a.weight).join(', ')}
  Upvotes  : ${totalUpvotes}
  Logs     : ${logCount}
  Comments : ${commentCount}
  Notifs   : ${notifData.length}

  Admin logins:
  ${adminDefs.map(a => `  ${a.email}`).join('\n')}

  Citizen logins:
  ${userDefs.map(u => `  ${u.email}`).join('\n')}
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());