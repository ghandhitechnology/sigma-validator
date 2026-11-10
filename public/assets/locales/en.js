window.SIGMA_I18N = {
  locale: 'en',
  dateLocale: 'en-GB',
  examples: [
    'An assignment operations assistant for selective high-school students. It automatically collects assignments and notices from the school portal, then organizes deadlines, submission formats, and teachers in one view. Students currently rely on group chats and memory. The proposed price is $3 per month per student or a school contract. Initial distribution would run through student councils and class representatives.',
    'A script validation workbench for short-form video creators. A creator enters a video idea and receives checks on claims, evidence, shot structure, and likely objections. Today they plan by instinct and discard ideas after weak view counts. The target price is $9 per month, with initial distribution through X and Discord communities.',
    'A queue-transparency service for neighborhood clinics. Patients see expected wait times before deciding whether to book or visit. Clinics display the current care flow at reception. Revenue is $100 per clinic per month. Key risks are practice-management integrations, patient privacy, and resistance from reception staff.'
  ],
  commands: {
    validate: ['Score my idea', 'Run the idea you wrote'],
    demo: ['Example', 'Load an example idea'],
    clear: ['Clear', 'Clear the text'],
    link: ['Copy link', 'Copy a shareable report link'],
    copy: ['Copy report', 'Copy the latest report'],
    raw: ['Raw data', 'Show or hide the raw JSON'],
    memo: ['Copy report', 'Copy the report as text'],
    print: ['Print', 'Open the print dialog']
  },
  stats: {
    characters: count => `${count} ${count === 1 ? 'character' : 'characters'}`,
    readiness: { draft: 'draft', usable: 'usable', filed: 'filed' }
  },
  toast: {
    caseLoaded: 'Example loaded',
    reportCopied: 'Founder memo copied',
    linkCopied: 'Shareable report link copied',
    noReport: 'No report yet',
    noShareLink: 'No shareable link yet. Run an evaluation first.',
    draftSaved: 'Draft saved',
    draftRestored: 'Draft restored from your last session',
    archiveRestored: 'Archive restored',
    urlCopied: 'Page URL copied',
    copyFailed: 'Copy failed. Check browser permissions.'
  },
  validation: {
    tooShort: "That's a bit short. Add the customer, the problem, the product, and the price.",
    connection: 'Check your connection and try again.',
    serverError: status => `Server error (${status})`,
    apiErrors: {
      RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
      UPSTREAM_TIMEOUT: 'The AI response timed out. Try again—it usually works on the second attempt.',
      INVALID_JSON: 'The request could not be read. Please try again.',
      INPUT_TOO_SHORT: 'The idea is too short. Enter at least 10 characters.',
      API_KEY_MISSING: 'The evaluation service is not configured. Contact the administrator.',
      UPSTREAM_ERROR: 'The evaluation service is temporarily unavailable.',
      EMPTY_RESPONSE: 'The evaluation service returned an empty response. Please try again.',
      PARSE_ERROR: 'The evaluation response could not be interpreted.',
      INVALID_STRUCTURE: 'The evaluation response has an invalid structure.'
    }
  },
  result: {
    analyzing: 'analyzing…',
    error: 'error',
    runButton: 'Score my idea',
    loadingButton: 'Scoring…',
    awaiting: 'Awaiting your idea',
    verdictLabels: { scale: 'Good to push', test: 'Needs more proof', kill: 'Better to stop' },
    shareAvailable: 'Copy shareable report link',
    shareUnavailable: 'Share link unavailable (report storage may not be configured)'
  },
  decision: {
    reasons: {
      scale: 'Scale only after one paid proof. The case has enough shape to deserve a larger bet.',
      kill: 'Current evidence says this is more likely a feature, copy, or convenience than a company. Change the customer, wedge, or distribution.',
      test: 'Do not build more yet. Prove the weakest claim with one cheap external test.'
    },
    qualifier: 'What would change this verdict: observed demand, paid intent, or a distribution edge that competitors cannot copy.'
  },
  evidence: {
    headers: ['Claim', 'Evidence', 'Strength', 'Next proof step'],
    statuses: { observed: 'observed', inferred: 'inferred', guessed: 'guessed' },
    rows: [
      ['Customer pain', 'Interview 5 exact users who used an ugly workaround this week.'],
      ['Willingness to pay', 'Ask for money or a letter of intent before building the full product.'],
      ['Competitor gap', 'List 10 alternatives and name the one thing they structurally cannot do.'],
      ['Distribution channel', 'Run one outbound or community post and measure the reply rate.'],
      ['Build risk', 'Prototype the riskiest integration manually.']
    ]
  },
  experiments: weak => [
    ['01', 'Concierge proof', `Manually deliver the promised outcome for 3 users. Pass if 2 ask to use it again. Weak axis: ${weak}.`],
    ['02', 'Pricing smoke test', 'Put the exact price in front of 20 target users. Pass if 3 agree to pay or introduce a buyer.'],
    ['03', 'Objection interview', 'Ask 7 users why they would not use this. Record the objection before defending the idea.'],
    ['04', 'Channel wedge', 'Post or message one narrow audience. Pass if reply rate clears 10% without discounts.']
  ],
  nextActions: {
    day: number => `day ${number}`,
    kill: ['Rewrite the customer to one desperate niche.', 'Delete every claim without proof.', 'Find one ugly workaround or abandon the case.'],
    scale: ['Collect one paid commitment.', 'Build the smallest repeatable delivery loop.', 'Measure activation and repeat use before adding features.'],
    test: ['Run the cheapest experiment from the list.', 'Interview 5 target users and log their exact phrases.', 'Return with evidence, not a better pitch.']
  },
  history: { empty: 'No local records yet.' },
  slopFallback: 'risk',
  axisImprove: 'Improve:',
  glance: {
    label: 'At a glance',
    strongest: 'Strongest',
    weakest: 'Weakest',
    weakSpots: 'Weak spots',
    band: 'Band',
    bands: { weak: 'Weak', mid: 'Mixed', strong: 'Strong' }
  },
  memo: {
    title: 'SIGMA FOUNDER MEMO',
    verdict: 'Verdict',
    verdictModes: { kill: 'KILL', test: 'TEST', scale: 'SCALE' },
    severities: { fatal: 'fatal', warn: 'warning', minor: 'minor' },
    reason: 'Reason',
    score: 'Score',
    summary: 'Summary',
    glance: 'At a glance',
    axes: 'Seven-axis breakdown',
    evidence: 'Evidence to prove first',
    experiments: 'Tests you can run now',
    slops: 'Contradictions / Slop',
    none: 'None',
    next: 'Next 7 days',
    actions: ['Run one cheap external experiment.', 'Interview five exact users.', 'Return with evidence, not a cleaner pitch.']
  },
  exportFilename: 'sigma-case-file.txt'
};
