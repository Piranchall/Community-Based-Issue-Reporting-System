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
  { name: 'Clifton, Karachi',           lat: 24.8138, lng: 67.0300, weight: 9 },
  { name: 'Defence (DHA), Karachi',     lat: 24.7965, lng: 67.0681, weight: 8 },
  { name: 'Gulshan-e-Iqbal, Karachi',   lat: 24.9215, lng: 67.0912, weight: 7 },
  { name: 'North Nazimabad, Karachi',   lat: 24.9480, lng: 67.0350, weight: 6 },
  { name: 'Saddar, Karachi',            lat: 24.8607, lng: 67.0099, weight: 6 },
  { name: 'Korangi, Karachi',           lat: 24.8300, lng: 67.1200, weight: 5 },
  { name: 'Malir, Karachi',             lat: 24.8950, lng: 67.1900, weight: 4 },
  { name: 'Orangi Town, Karachi',       lat: 24.9500, lng: 66.9950, weight: 4 },
  { name: 'Lyari, Karachi',             lat: 24.8700, lng: 66.9900, weight: 3 },
  { name: 'Surjani Town, Karachi',      lat: 25.0300, lng: 67.0200, weight: 2 },
];

const CATEGORIES = ['Road', 'Garbage', 'Water', 'Electricity', 'Other'];

const ISSUE_TEMPLATES = {
  Road: [
    { title: 'Large pothole causing vehicle damage',        desc: 'Deep pothole near traffic signal causing tyre damage to vehicles passing through.' },
    { title: 'Road surface cracking after monsoon',         desc: 'Road surface cracked and subsiding after heavy rains. Risk of serious damage.' },
    { title: 'Damaged road divider after accident',         desc: 'Road divider was hit and broken. Debris scattered on road is dangerous.' },
    { title: 'Uneven road surface after utility work',      desc: 'Road was not properly resurfaced after gas pipe repair work last month.' },
    { title: 'Flooded road blocking traffic near nullah',   desc: 'Poor drainage causes road to flood after every rain. Vehicles have stalled here.' },
    { title: 'Faded road markings at busy junction',        desc: 'Lane markings and pedestrian crossing faded completely. Dangerous for drivers.' },
  ],
  Garbage: [
    { title: 'Overflowing bins on main commercial street',  desc: 'Bins have not been emptied for 5 days. Strong odour and attracting pests.' },
    { title: 'Illegal dumping of construction waste',       desc: 'Large pile of construction rubble dumped on public land overnight.' },
    { title: 'Garbage heap blocking residential lane',      desc: 'Waste pile left on lane entrance for over a week blocking vehicles.' },
    { title: 'KMC lorry skipped weekly collection',         desc: 'Waste collection truck has skipped this street for 3 consecutive weeks.' },
    { title: 'Burning garbage causing air pollution',       desc: 'Residents burning waste near park. Toxic smoke affecting whole area.' },
    { title: 'Dead animal carcass near children park',      desc: 'Decomposing animal near park entrance is a serious health hazard.' },
  ],
  Water: [
    { title: 'Burst water main flooding street',            desc: 'Water gushing from underground KWSB pipe since yesterday morning.' },
    { title: 'Leaking water pipe causing road damage',      desc: 'Slow leak causing water pooling. Road eroding and slippery for bikes.' },
    { title: 'No water supply for 3 days',                  desc: 'Entire block has had no running water. Affecting households and businesses.' },
    { title: 'Sewage overflowing into street drain',        desc: 'Sewage overflowing into drain due to blockage upstream. Foul smell.' },
    { title: 'Contaminated water from taps',                desc: 'Tap water has been brown and foul smelling. Unfit for consumption.' },
    { title: 'Blocked nullah causing flash flood',          desc: 'Clogged drainage nullah causing localised flooding every time it rains.' },
  ],
  Electricity: [
    { title: 'Street light out for 2 weeks',                desc: 'Street lamp has been off for 14 days. Area is unsafe at night.' },
    { title: 'Exposed electrical wire near school',         desc: 'Damaged KESC cable exposed near school gate. Serious electrocution risk.' },
    { title: 'Faulty traffic signal causing congestion',    desc: 'Traffic light stuck on red during peak hours causing major tailbacks.' },
    { title: 'Frequent load shedding beyond schedule',      desc: 'Power outages exceeding the published schedule affecting entire block.' },
    { title: 'Fallen electricity pole blocking road',       desc: 'Utility pole fell after storm. One lane blocked and wires may be live.' },
    { title: 'Transformer humming and leaking oil',         desc: 'Neighbourhood transformer making loud noise and leaking. Fire hazard.' },
  ],
  Other: [
    { title: 'Encroachment on footpath by vendor',          desc: 'Illegal stall blocking full width of pavement near market area.' },
    { title: 'Stray dogs menacing pedestrians',             desc: 'Pack of stray dogs aggressive towards pedestrians and schoolchildren.' },
    { title: 'Overgrown tree branches blocking road',       desc: 'Large branches hanging over road. Risk of falling on passing vehicles.' },
    { title: 'Broken park bench with sharp edges',          desc: 'Damaged bench with protruding metal has already injured a child.' },
    { title: 'Abandoned vehicle blocking parking',          desc: 'Car with no plates parked and abandoned for over a month.' },
    { title: 'Graffiti and vandalism on boundary wall',     desc: 'Obscene graffiti sprayed on residential boundary wall overnight.' },
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
  'My family is affected by this daily. Very frustrating.',
  'I reported this last week too. Still not resolved.',
  'This is causing traffic jams every morning on the way to work.',
  'Children walk past here daily. Very dangerous situation.',
  'Thank you to the team for the quick response!',
  'This needs immediate attention from KMC / KWSB.',
  'Same issue happened last year. Seems like a recurring problem.',
  'I have photos and video if needed. Please contact me.',
  'The whole mohalla is affected by this. Please help.',
];

async function main() {
  console.log('Seeding Karachi dataset...\n');

  const userPw  = await bcrypt.hash('pass123',  10);
  const adminPw = await bcrypt.hash('admin123', 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const userDefs = [
    { email: 'ahmed@citizen.com',   phone: '0311111111', firstName: 'Ahmed',    lastName: 'Khan'      },
    { email: 'fatima@citizen.com',  phone: '0322222222', firstName: 'Fatima',   lastName: 'Siddiqui'  },
    { email: 'bilal@citizen.com',   phone: '0333333333', firstName: 'Bilal',    lastName: 'Malik'     },
    { email: 'zara@citizen.com',    phone: '0344444444', firstName: 'Zara',     lastName: 'Sheikh'    },
    { email: 'usman@citizen.com',   phone: '0355555555', firstName: 'Usman',    lastName: 'Raza'      },
    { email: 'hina@citizen.com',    phone: '0366666666', firstName: 'Hina',     lastName: 'Baig'      },
    { email: 'tariq@citizen.com',   phone: '0377777777', firstName: 'Tariq',    lastName: 'Hussain'   },
    { email: 'sana@citizen.com',    phone: '0388888888', firstName: 'Sana',     lastName: 'Mirza'     },
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
    { email: 'admin@kmc.gov.pk',      name: 'KMC Admin'              },
    { email: 'roads@kmc.gov.pk',      name: 'Roads Department'       },
    { email: 'sanitation@kmc.gov.pk', name: 'Sanitation Department'  },
    { email: 'kwsb@kmc.gov.pk',       name: 'KWSB Water Authority'   },
    { email: 'electric@kmc.gov.pk',   name: 'KESC Electricity Board' },
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
      const cat    = CATEGORIES[between(0, CATEGORIES.length - 1)];
      const tmpl   = ISSUE_TEMPLATES[cat][between(0, ISSUE_TEMPLATES[cat].length - 1)];
      const status = STATUS_POOL[between(0, STATUS_POOL.length - 1)];
      const daysBack = w < 3 ? between(0, 14) : between(5, 60);
      const user   = users[between(0, users.length - 1)];
      const lat    = area.lat + (Math.random() - 0.5) * 0.008;
      const lng    = area.lng + (Math.random() - 0.5) * 0.008;
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
    const w = issue.spec.area.weight;
    const count = between(w >= 7 ? 3 : w >= 5 ? 1 : 0, w >= 7 ? 14 : w >= 5 ? 9 : 5);
    if (count === 0) continue;
    const others = users.filter(u => u.id !== issue.userId)
      .sort(() => Math.random() - 0.5).slice(0, Math.min(count, users.length - 1));
    if (!others.length) continue;
    await prisma.upvote.createMany({
      data: others.map(u => ({ userId: u.id, issueId: issue.id })),
      skipDuplicates: true,
    });
    await prisma.issue.update({ where: { id: issue.id }, data: { upvoteCount: others.length } });
    totalUpvotes += others.length;
  }
  console.log(`Upvotes: ${totalUpvotes}`);

  // ── Status logs ────────────────────────────────────────────────────────────
  let logCount = 0;
  const REJECT_REASONS = [
    'Duplicate report — already tracked under a separate case.',
    'Outside KMC jurisdiction. Referred to relevant authority.',
    'Insufficient details. Cannot verify exact location.',
    'Issue resolved by contractor before our inspection.',
  ];

  for (const issue of issues) {
    const admin    = admins[between(0, admins.length - 1)];
    const createdAt = new Date(issue.createdAt);
    const avgDays  = AVG_RESOLUTION_DAYS[issue.spec.cat] || 4;

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
      const jitter = (Math.random() - 0.5) * 0.6;
      const resolvedAt = new Date(createdAt.getTime() + Math.max(0.5, avgDays * (1 + jitter)) * 86400000);
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
    if (issue.status === 'Resolved')
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" has been resolved.`, isRead: Math.random() > 0.4 });
    if (issue.status === 'Rejected')
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" was rejected. See remarks for details.`, isRead: Math.random() > 0.5 });
    if (issue.status === 'In Progress')
      notifData.push({ userId: issue.userId, issueId: issue.id, message: `Your issue "${issue.title}" is now being worked on.`, isRead: Math.random() > 0.6 });
    notifData.push({
      userId: String(admins[0].id), issueId: issue.id,
      message: `New issue reported: "${issue.title}" in ${issue.spec.area.name}.`,
      isRead: issue.spec.daysBack > 7,
    });
  }
  for (let i = 0; i < notifData.length; i += 50)
    await prisma.notification.createMany({ data: notifData.slice(i, i + 50), skipDuplicates: true });
  console.log(`Notifications: ${notifData.length}`);

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
  Areas    : ${AREAS.length} Karachi neighbourhoods
  Upvotes  : ${totalUpvotes}
  Logs     : ${logCount}
  Comments : ${commentCount}
  Notifs   : ${notifData.length}

  Admin logins:
    admin@kmc.gov.pk / admin123
    roads@kmc.gov.pk / admin123
    kwsb@kmc.gov.pk  / admin123

  Citizen logins:
    ahmed@citizen.com / pass123
    fatima@citizen.com / pass123
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
