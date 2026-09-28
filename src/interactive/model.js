import front from './windsor-front.json' with { type: 'json' };
import articles from './windsor-articles.json' with { type: 'json' };
import appendix from './windsor-appendix.json' with { type: 'json' };

export const initialAnswers = () => ({
  sampleData: false,
  testatorName: '', testatorAddress: '', testatorUnit: '', noFamily: false, family: [],
  funeralPrimaryName: '', funeralPrimaryAddress: '', funeralAlternateName: '', funeralAlternateAddress: '',
  executorPrimaryName: '', executorPrimaryAddress: '', executorAlternateName: '', executorAlternateAddress: '',
  hasMinorChildren: '', spouseGuardianName: '', guardianPrimaryName: '', guardianPrimaryAddress: '', guardianAlternateName: '', guardianAlternateAddress: '',
  healthPrimaryName: '', healthPrimaryAddress: '', healthAlternateName: '', healthAlternateAddress: '',
  bequests: [], additionalInstructions: '',
  loansReceived: [], obligations: { siyaam: '', zakah: '', mahr: '' }, loansOutstanding: [], withdrawals: [], additionalAssets: '',
  witnessOneName: '', witnessOneAddress: '', witnessTwoName: '', witnessTwoAddress: '', witnessConfirmation: false
});

export const repeatFields = {
  family: ['name', 'relationship', 'birthDate'],
  bequests: ['recipient', 'amount'],
  loansReceived: ['person', 'date', 'amount', 'owing', 'contact'],
  loansOutstanding: ['person', 'date', 'amount', 'owing', 'contact'],
  withdrawals: ['recipient', 'amount', 'periodicity', 'source']
};

const p = (text, highlight = []) => ({ kind: 'paragraph', text, highlight: Array.isArray(highlight) ? highlight.filter(Boolean) : [] });
const h = text => ({ kind: /^Article \d+:/.test(text) ? 'article' : /^Schedule \d+:/.test(text) ? 'schedule' : /^(Last Will and Testament|Signatures and attestation|Appendix A:|Addendum A:)/.test(text) ? 'section' : 'heading', text, breakBefore: /^(Introduction|Windsor Islamic Association disclaimer|Last Will and Testament|Signatures and attestation|Appendix A:|Addendum A:)/.test(text) });
const table = (headers, rows, source = false) => ({ kind: 'table', headers, rows, source });
const image = (asset, width, alt) => ({ kind: 'image', asset, width, alt });
const value = (answers, key) => String(answers[key] || '').trim();
const supplied = text => text || 'Not supplied in this draft';
const clean = text => text.replace(/\s+/g, ' ').trim();
const compact = rows => rows.filter(row => Object.values(row).some(x => String(x || '').trim()));
const humanDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '')
  ? new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
  : date;
const instructions = front.instructions.reduce((items, part) => {
  if (/^\d+\.\s/.test(part)) items.push(part);
  else if (items.length) items[items.length - 1] += ` ${part}`;
  return items;
}, []);

function appendixBlocks() {
  const result = [];
  for (const item of appendix) {
    if (item.type === 'p') {
      const text = item.text.replace('�If', '“If');
      if (text.startsWith('Appendix A:') || text.startsWith('Schedule ')) result.push(h(text));
      else result.push(p(text));
    } else if (item.type === 'table') {
      const rows = item.rows.map(row => row.map(clean));
      const hasHeader = /^surviving heirs$/i.test(rows[0]?.[0] || '');
      const dataRows = hasHeader ? rows.slice(1) : rows;
      const previous = result[result.length - 1];
      const current = previous?.kind === 'table' && previous.source ? previous : table(hasHeader ? rows[0] : ['Surviving heirs', 'Share of remainder'], [], true);
      if (current !== previous) result.push(current);
      for (const row of dataRows) {
        if (current.rows.length && !/^\d+\.?[a-z]{1,2}(?:\.|\b)/i.test(row[0])) {
          const last = current.rows[current.rows.length - 1];
          last[0] = clean(`${last[0]} ${row[0]}`);
          last[1] = clean(`${last[1]} ${row[1]}`);
        } else current.rows.push(row);
      }
    }
  }
  return result;
}

export function makeWillBlocks(a) {
  const blocks = [
    { kind: 'title', text: 'Last Will and Testament' },
    { kind: 'subtitle', text: 'Windsor Islamic Association template' },
    { kind: 'notice', text: `${a.sampleData ? 'SAMPLE DATA — FOR TESTING ONLY. All names, addresses and financial details in this draft are fictional. ' : ''}Completed draft for review. This document has not been signed or witnessed. Review the text, appointments, inheritance appendix and financial details with qualified Islamic and legal advisers before execution.` },
    { kind: 'contents', entries: ['Introduction', 'Windsor Islamic Association disclaimer', 'General instructions', 'Articles 1–11', 'Signatures and attestation', 'Appendix A: Islamic inheritance schedules', 'Addendum A: Details of finances'] },
    h('Introduction'),
    p(front.introduction[0]),
    p(front.introduction[1]),
    image('windsor-bismillah.png', 150, 'Arabic invocation from the Windsor template'),
    image('windsor-verse-1.png', 360, 'Arabic Quranic excerpt from the Windsor template'),
    image('windsor-verse-2.png', 270, 'Continuation of the Arabic excerpt'),
    { kind: 'quote', text: front.introduction[3] },
    p(front.introduction[4]),
    { kind: 'quote', text: front.introduction[5] },
    p(front.introduction[6]),
    p(front.introduction[7]),
    h('Windsor Islamic Association disclaimer'),
    p(front.disclaimer.join(' ')),
    h('General instructions'),
    ...instructions.map(p),
    h('Last Will and Testament'),
    h('Article 1: Identity of testator and heirs'),
    p(`I, ${value(a, 'testatorName')}, presently residing at ${value(a, 'testatorUnit') ? `Unit ${value(a, 'testatorUnit')}, ` : ''}${value(a, 'testatorAddress')}, being of sound mind and memory, do hereby revoke any and all former Wills and Codicils made by me, and do make, ordain, publish, and declare this my last Will and Testament. At the time of the execution of this Will, my immediate family consists of:`, [value(a, 'testatorName'), value(a, 'testatorUnit'), value(a, 'testatorAddress')]),
    table(['Name', 'Relationship', 'Date of birth'], compact(a.family).map(x => [x.name, x.relationship, humanDate(x.birthDate) || 'Not supplied']))
  ];

  blocks.push(h('Article 2: Preamble'));
  for (let i = 0; i < articles['2'].length; i++) {
    const original = articles['2'][i];
    blocks.push(p(i === 4 ? original.replace(/I,\s+bear witness/, `I, ${value(a, 'testatorName')}, bear witness`) : original));
  }

  blocks.push(h('Article 3: Funeral and burial rites'));
  blocks.push(p(articles['3'][0]));
  blocks.push(p(`A. I hereby nominate and appoint ${value(a, 'funeralPrimaryName')}, residing at ${value(a, 'funeralPrimaryAddress')}, to execute these and other necessary provisions for my Islamic funeral and burial. In the event that this person is unwilling or unable to act, I nominate and appoint ${value(a, 'funeralAlternateName')}, residing at ${value(a, 'funeralAlternateAddress')}.`, [value(a, 'funeralPrimaryName'), value(a, 'funeralPrimaryAddress'), value(a, 'funeralAlternateName'), value(a, 'funeralAlternateAddress')]));
  blocks.push(p(clean(`${articles['3'][4]} ${articles['3'][5]}`)));
  let clause = '';
  for (const part of articles['3'].slice(6)) {
    if (/^[B-H]\.\s/.test(part) && clause) { blocks.push(p(clean(clause))); clause = part; }
    else clause += ` ${part}`;
  }
  if (clause) blocks.push(p(clean(clause)));

  blocks.push(h('Article 4: Executor and administrator'));
  blocks.push(p(`I hereby nominate and appoint ${value(a, 'executorPrimaryName')}, residing at ${value(a, 'executorPrimaryAddress')}, to be the executor and administrator of this, my Last Will and Testament. If this person is unwilling or unable to act, I nominate and appoint ${value(a, 'executorAlternateName')}, residing at ${value(a, 'executorAlternateAddress')}, to be the executor of this Will.`, [value(a, 'executorPrimaryName'), value(a, 'executorPrimaryAddress'), value(a, 'executorAlternateName'), value(a, 'executorAlternateAddress')]));
  blocks.push(p(articles['4'][3].slice(articles['4'][3].indexOf('In the event that this person'))));

  blocks.push(h('Article 5: Custody of minor children and guardianship'));
  if (a.hasMinorChildren === 'yes') {
    const spouse = value(a, 'spouseGuardianName');
    if (spouse) blocks.push(p(`If at my death any of my children are minors, I nominate and appoint my husband or wife, ${spouse}, to be guardian of my minor children, provided he or she is a Muslim.`, [spouse]));
    blocks.push(p(`If ${spouse ? 'that person is unable or unwilling to serve' : 'a guardian is required'}, I nominate and appoint ${value(a, 'guardianPrimaryName')}, residing at ${value(a, 'guardianPrimaryAddress')}, to be guardian of my minor children. If this person is unable or unwilling to serve, I nominate and appoint ${value(a, 'guardianAlternateName')}, residing at ${value(a, 'guardianAlternateAddress')}.`, [value(a, 'guardianPrimaryName'), value(a, 'guardianPrimaryAddress'), value(a, 'guardianAlternateName'), value(a, 'guardianAlternateAddress')]));
  } else blocks.push(p('No minor children were identified when this draft was prepared. Review this article if circumstances change.'));
  blocks.push(p(clean(`In all cases I urge that all my minor children be raised to ${articles['5'][5]}`)));
  blocks.push(p(articles['5'][6]));

  blocks.push(h('Article 6: Power of attorney'));
  blocks.push(p(`In the event that I am deemed incompetent or incapable of making informed decisions regarding my medical care, I appoint ${value(a, 'healthPrimaryName')}, residing at ${value(a, 'healthPrimaryAddress')}, as my health care agent to make such decisions within the boundaries of Islamic teachings. If this person predeceases me or is unable to act, I appoint ${value(a, 'healthAlternateName')}, residing at ${value(a, 'healthAlternateAddress')}, as my alternate agent.`, [value(a, 'healthPrimaryName'), value(a, 'healthPrimaryAddress'), value(a, 'healthAlternateName'), value(a, 'healthAlternateAddress')]));
  blocks.push(p(articles['6'][3].slice(articles['6'][3].indexOf('Without limiting'))));

  blocks.push(h('Article 7: Allocation of estate in priority'));
  blocks.push(...articles['7'].slice(0, 2).map(p));
  blocks.push(p(clean(`${articles['7'][2]} ${articles['7'][3]}`)));

  blocks.push(h('Article 8: Charitable contributions and testamentary transfers'));
  blocks.push(p(articles['8'][0]));
  blocks.push(table(['Person or organization', 'Amount or percent of estate'], compact(a.bequests).map(x => [x.recipient, x.amount])));
  blocks.push(p(articles['8'][1]));

  blocks.push(h('Article 9: Distribution of residue to Muslim heirs'));
  blocks.push(p(articles['9'][0]));
  blocks.push(p(clean(`${articles['9'][1]} ${articles['9'][2]}`)));
  blocks.push(h('Article 10: Additional instructions and directives'));
  blocks.push(p(supplied(value(a, 'additionalInstructions')), [value(a, 'additionalInstructions')]));
  blocks.push(h('Article 11: Separability'));
  blocks.push(p(articles['11'][0]));

  blocks.push(h('Signatures and attestation'));
  blocks.push(p('Signed, Published and Declared by the Testator, as his last Will and Testament, in the presence of us, both present at the same time, who at his request, in his presence have subscribed our names as witnesses.'));
  blocks.push({ kind: 'signature', role: 'Testator', name: value(a, 'testatorName') });
  blocks.push({ kind: 'signature', role: 'Witness 1', name: value(a, 'witnessOneName'), address: value(a, 'witnessOneAddress') });
  blocks.push({ kind: 'signature', role: 'Witness 2', name: value(a, 'witnessTwoName'), address: value(a, 'witnessTwoAddress') });

  blocks.push(...appendixBlocks());
  blocks.push(h('Addendum A: Details of finances'));
  blocks.push(h('Loans received'));
  blocks.push(table(['Lender', 'Date received', 'Amount received', 'Amount owing', 'Contact'], compact(a.loansReceived).map(x => [x.person, humanDate(x.date), x.amount, x.owing, x.contact])));
  blocks.push(h('Unfulfilled religious obligations and compensation'));
  blocks.push(table(['Obligation', 'Compensation'], [['Siyaam (compulsory fasting)', a.obligations.siyaam], ['Zakah (compulsory alms)', a.obligations.zakah], ['Mahr (marriage gift)', a.obligations.mahr]]));
  blocks.push(h('Loans outstanding'));
  blocks.push(table(['Loan recipient', 'Date given', 'Amount given', 'Amount owing', 'Contact'], compact(a.loansOutstanding).map(x => [x.person, humanDate(x.date), x.amount, x.owing, x.contact])));
  blocks.push(h('Automatic withdrawals'));
  blocks.push(table(['Recipient', 'Amount', 'Periodicity', 'Source'], compact(a.withdrawals).map(x => [x.recipient, x.amount, x.periodicity, x.source])));
  blocks.push(h('Additional assets'));
  blocks.push(p(supplied(value(a, 'additionalAssets'))));
  return blocks;
}
