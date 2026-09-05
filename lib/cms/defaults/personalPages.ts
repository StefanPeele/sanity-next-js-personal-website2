// lib/cms/defaults/personalPages.ts — copy for projects, resume, contact, now, uses, photography.

const header = (title: string, lede: string, metaDescription = lede) => ({ title, lede, metaTitle: title, metaDescription })

export const DEFAULT_PERSONAL_PAGES = {
  projects: {
    header: header('Projects', 'Infrastructure, storage, identity and automation work, written up as problem, constraints, approach and outcome.', 'Network, storage, Active Directory and automation case studies: the problem, the constraints, the approach and the measured outcome.'),
    emptyState: 'No projects published yet.',
    card: { featuredBadge: 'Featured', outcomeLabel: 'Outcome', presentLabel: 'Present', noCoverLabel: 'No cover', techLabel: 'Tech stack' },
    detail: {
      eyebrow: 'Case study',
      metaLabels: { timeline: 'Timeline', client: 'Client / organization', role: 'My role', tags: 'Tags' },
      sectionLabels: { problem: 'Problem', constraints: 'Constraints', approach: 'Approach', outcome: 'Outcome', metrics: 'Metrics', retrospective: 'What I would do differently', stack: 'Stack', architecture: 'Architecture and topologies', relatedWriting: 'Related writing', relatedNotes: 'Garden notes' },
      linkLabels: { code: 'Repository', docs: 'Documentation', board: 'Project board', live: 'Live' },
      backLabel: 'All projects',
    },
  },
  resume: {
    header: header('Resume', 'Experience, skills, certifications and education.', 'B.S. Information Technology (Security) at NJIT, network engineer associate intern. Experience, skills, certifications and education.'),
    fallbackTagline: 'Network engineer associate intern and B.S. IT (Security) student at NJIT.',
    lastUpdatedLabel: 'Last updated',
    sectionLabels: { experience: 'Experience', skills: 'Skills', certifications: 'Certifications', education: 'Education', currently: 'Currently learning', hardCopy: 'Hard copy' },
    emptyExperience: 'No roles published yet.',
    emptySkills: 'No skills published yet.',
    levelsLegend: 'Dots: learning · working · proficient · deep',
    certStatusLabels: { earned: 'Earned', inProgress: 'In progress', planned: 'Planned', target: 'Target' },
    presentLabel: 'Present',
    expectedLabel: 'Expected',
    downloadLabel: 'Download PDF',
    draftHint: 'Draft mode: upload a PDF to the "resume" page document to enable Download.',
    contactPrompt: { label: 'Want to talk?', ctaLabel: 'Contact' },
    skillCategoryOrder: ['Infrastructure', 'Systems', 'Programming', 'Tools', 'Other'],
    fallbackEducation: { school: 'New Jersey Institute of Technology', degree: 'B.S.', field: 'Information Technology — Security Specialization', endDate: '2028-05-01', expected: true },
    showEmail: true,
    showGithub: true,
  },
  contact: {
    header: header("Let's talk.", 'Network and infrastructure roles, security work, and collaborations on anything with a switch, a SAN or a PowerShell prompt in it.', 'Get in touch about network engineering and infrastructure internships, collaborations, and photography inquiries.'),
    formHeading: 'Send a message',
    channelsHeading: 'Direct channels',
    recruiterNote: 'Recruiters: my resume is up to date and printable, and every project on the site is written as a case study with the outcome first.',
    photoCta: { enabled: true, heading: 'Booking a photo session?', lede: 'Portraits, graduation, events and headshot days have their own inquiry form with packages and pricing.', ctaLabel: 'Photography inquiry', ctaHref: '/services#inquiry', emptyState: '' },
    basedInLine: 'Based in {city}, {region} · {school}',
    channelLabels: { email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', instagram: 'Instagram', bluesky: 'Bluesky' },
    instagramHandle: '@stefs.lens',
  },
  now: {
    header: header("What I'm doing now", 'Studying IT security at NJIT, interning in network engineering, and shooting on weekends.', 'Current work, reading, notes in progress, active projects and certifications in flight.'),
    blockLabels: { projects: 'Active projects', certs: 'Certifications in progress', reading: 'Reading', notes: 'Tending', posts: 'Latest writing' },
    updatedLabel: 'Updated',
    targetLabel: 'Target',
    nowLinkLabel: 'now page',
    emptyState: 'Nothing published yet. Check back soon.',
  },
  uses: {
    header: header('What I use', 'The tools behind the work, the study and the photographs. Kept short and honest: if it is on this list, I use it.', 'The hardware, software and camera kit used for network engineering, study and photography.'),
    sections: [
      { title: 'Work: network engineering', items: [
        { name: 'Windows Server / Active Directory', note: 'Users, groups, GPOs and the occasional replication mystery.' },
        { name: 'PowerShell', note: 'AD automation, reporting, and backup verification scripts.' },
        { name: 'SAN storage', note: '[Add: vendor and model of the SAN you administer]' },
        { name: 'Backup platform', note: '[Add: backup software and the target]' },
        { name: 'Switching and routing', note: '[Add: switch/firewall vendor and models at work]' },
      ] },
      { title: 'Home lab and study', items: [
        { name: 'Laptop', note: '[Add: model, CPU, RAM]' },
        { name: 'Lab switch', note: '[Add: home lab switch model]' },
        { name: 'Hypervisor', note: '[Add: Proxmox / Hyper-V / VMware]' },
        { name: 'Wireshark', note: 'Packet captures for the blog and for figuring out what a device is actually doing.' },
        { name: 'Packet Tracer / GNS3', note: '[Add: which one you use for CCNA study]' },
      ] },
      { title: 'Photography', items: [
        { name: 'Sony A7 III', note: 'Primary body.' },
        { name: 'Second body', note: '[Add: backup body model]' },
        { name: 'Lenses', note: '[Add: the two or three lenses you shoot most]' },
        { name: 'Lighting', note: '[Add: flash / strobe and modifiers]' },
        { name: 'Editing', note: '[Add: Lightroom / Capture One and export presets]' },
        { name: 'Delivery', note: 'Pixieset galleries, password-protected and downloadable, with a separate print-ready TIFF folder.' },
      ] },
      { title: 'This site', items: [
        { name: 'Next.js + React', note: 'App Router, React Compiler, Turbopack.' },
        { name: 'Sanity', note: 'Content, live preview, and the Studio at /studio.' },
        { name: 'Tailwind CSS', note: 'Dark palette, Lora + Inter + IBM Plex Mono.' },
        { name: 'Vercel', note: 'Hosting and Speed Insights.' },
        { name: 'Airtable + Resend', note: 'Booking CRM and transactional email for photography clients.' },
      ] },
    ] as { title: string; items: { name: string; note?: string; url?: string }[] }[],
    emptyState: 'Nothing listed yet.',
  },
  photography: {
    index: {
      header: header('Photography', 'Sports, portraits, graduations and live events, shot in and around Newark, NJ.', 'Sports, portraits, graduation and event photography: recent frames, albums and booking.'),
      countLine: '{albums} albums · {frames} photos',
      albumsCta: 'See all albums',
      bookCta: 'Book a session',
      recentHeading: 'Recent',
      recentWithCategory: 'Recent · {category}',
      browseAllLabel: 'Browse every album',
      filterAllLabel: 'All',
    },
    albums: { title: 'Albums', subtitle: 'Every album, newest first.', metaDescription: 'Every photography album: sports, portraits, graduations and events.', framesLabel: '{n} photos', uncategorized: 'Album' },
    gallery: { backLabel: 'All albums', readoutLabels: { location: 'Location', frames: 'Photos', camera: 'Camera', lens: 'Lens', iso: 'ISO' }, framesLabel: '{n} photos', notesLabel: 'Notes' },
    loader: { label: 'Loading', skipLabel: 'Skip' },
  },
}

export type PersonalPagesCopy = typeof DEFAULT_PERSONAL_PAGES
