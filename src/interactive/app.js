import { initialAnswers, repeatFields } from './model.js';
import { makeSampleAnswers } from './sample.js';
import { createSavedAnswers, maxSavedFileBytes, parseSavedAnswers } from './saved-answers.js';
import { matchingAddresses } from './address-search.js';

const root = document.getElementById('interactive-root');
const answers = initialAnswers();
try {
  const pendingName = sessionStorage.getItem('iwc-pending-testator-name');
  sessionStorage.removeItem('iwc-pending-testator-name');
  if (pendingName) answers.testatorName = pendingName;
} catch {}
let current = 0;
let furthest = 0;
let addressTimer;
let addressController;
let addressResults = [];
let activeAddress = -1;
let activeAddressInput;
let saveStatus = '';

const steps = [
  { label: 'You and family', title: 'Start with you and your family', kicker: 'Article 1 · Required for this draft', status: 'Required', intro: 'The Windsor template begins with your identity and a list of immediate family members who may be potential heirs.', tips: ['Use your full name and current residential address.', 'List a spouse, children, parents and other immediate family members who may be relevant.', 'Family members who inherit must not act as witnesses.'] },
  { label: 'Funeral', title: 'Who should arrange your funeral?', kicker: 'Article 3 · Required for this draft', status: 'Required', intro: 'Name a primary person and an alternate to carry out the funeral and burial directions in the template.', tips: ['Speak with both people before naming them.', 'The template also names Windsor Islamic Association as a further fallback for funeral arrangements.', 'Review the full funeral directions in your downloaded draft.'] },
  { label: 'Executors', title: 'Choose your executors', kicker: 'Article 4 · Required for this draft', status: 'Required', intro: 'An executor carries out the will’s instructions. The template asks for a primary executor and an alternate.', tips: ['The guide says executors may be heirs.', 'Choose reliable people who can act when needed, ideally in the same city or country.', 'Confirm each person is willing to take on the role.'] },
  { label: 'Guardians', title: 'Plan for minor children', kicker: 'Article 5 · Conditional', status: 'If applicable', intro: 'The template provides for a spouse, if Muslim, and alternate guardians for minor children.', tips: ['Answer whether you currently have minor children.', 'If yes, name a guardian and an alternate. You can also identify a Muslim spouse in the template’s first position.', 'Review these appointments if your family circumstances change.'] },
  { label: 'Health care', title: 'Name health care agents', kicker: 'Article 6 · Required for this draft', status: 'Required', intro: 'The Windsor document includes an appointment for medical decisions if you cannot make informed decisions yourself.', tips: ['Choose a primary person and an alternate, with current addresses.', 'Speak with them about your wishes.', 'This article should receive legal review for your province and circumstances.'] },
  { label: 'Gifts and notes', title: 'Add gifts and instructions', kicker: 'Articles 8 and 10 · Optional', status: 'Optional', intro: 'Record any charitable contributions or testamentary transfers, then add other instructions if needed.', tips: ['The template limits these transfers to one-third of the remainder after obligations.', 'An amount or percentage can be entered; the tool does not calculate the estate or check that limit.', 'Leave this section blank if you have no additional gifts or directions to record.'] },
  { label: 'Finances', title: 'Record financial details', kicker: 'Addendum A · Optional', status: 'Optional', intro: 'Add details that only you may know so your executor can identify assets, debts and ongoing payments.', tips: ['List money you owe and money owed to you separately.', 'The Windsor addendum also asks about Siyaam, Zakah and Mahr obligations.', 'Avoid entering account passwords. Keep credentials in a separate secure place.'] },
  { label: 'Witnesses', title: 'Identify two witnesses', kicker: 'Signatures · Required for this draft', status: 'Required', intro: 'The Windsor instructions call for two adult witnesses who are not heirs.', tips: ['Both witnesses must be adults and must not inherit under the will.', 'The template instructs the testator and both witnesses to sign each page and addendum in one another’s presence.', 'Leave signatures and dates blank until the document is reviewed and signed together.'] },
  { label: 'Review and download', title: 'Review your draft', kicker: 'Final check', status: 'Review', intro: 'Check the names and appointments before downloading. The DOCX and PDF contain the same answers and the Windsor inheritance appendix.', tips: ['Downloading does not sign or finalize the will.', 'Review the full text, especially the source template’s article references and inheritance appendix, with qualified advisers.', 'Print and sign in line with the template’s instructions. Keep the signed document ready.'] }
];

function esc(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function field(key, label, { required = false, type = 'text', help = '', placeholder = '' } = {}) {
  const isAddress = key.endsWith('Address');
  const addressAttrs = isAddress ? ` data-address role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="iw-${key}-options" aria-describedby="iw-${key}-status"` : '';
  const input = `<input id="iw-${key}" data-key="${key}" type="${type}" value="${esc(answers[key])}" placeholder="${esc(placeholder)}" autocomplete="off" ${required ? 'required' : ''}${addressAttrs}>`;
  const control = isAddress ? `<div class="iw-address-control">${input}<ul id="iw-${key}-options" class="iw-address-options" role="listbox" aria-label="Suggested Canadian addresses" hidden></ul></div><p id="iw-${key}-status" class="iw-address-status" role="status" aria-live="polite"></p>` : input;
  return `<div class="iw-field${isAddress ? ' iw-address-field' : ''}"><label for="iw-${key}">${label}${required ? '<span class="iw-required">Required</span>' : ''}</label>${help ? `<details class="iw-help"><summary>Why we ask</summary><p>${help}</p></details>` : ''}${control}</div>`;
}
function textarea(key, label, help = '') { return `<div class="iw-field"><label for="iw-${key}">${label}</label>${help ? `<details class="iw-help"><summary>Why we ask</summary><p>${help}</p></details>` : ''}<textarea id="iw-${key}" data-key="${key}" rows="5">${esc(answers[key])}</textarea></div>`; }
function repeater(key, title, labels, { note = '', requiredFields = [] } = {}) {
  const rows = answers[key];
  return `<section class="iw-repeat" aria-label="${title}"><div class="iw-repeat-head"><div><h3>${title}</h3>${note ? `<p>${note}</p>` : ''}</div><button type="button" class="iw-add" data-add="${key}">+ Add</button></div>${rows.length ? rows.map((row, index) => `<div class="iw-repeat-row"><div class="iw-repeat-title"><strong>${title.replace(/s$/, '')} ${index + 1}</strong><button type="button" data-remove="${key}" data-index="${index}" aria-label="Remove ${title.replace(/s$/, '')} ${index + 1}">Remove</button></div><div class="iw-fields">${labels.map(([prop, label, type = 'text']) => `<div class="iw-field"><label for="iw-${key}-${index}-${prop}">${label}${requiredFields.includes(prop) ? '<span class="iw-required">Required</span>' : ''}</label><input id="iw-${key}-${index}-${prop}" data-list="${key}" data-index="${index}" data-prop="${prop}" type="${type}" value="${esc(row[prop])}" autocomplete="off"></div>`).join('')}</div></div>`).join('') : '<p class="iw-empty">Nothing added yet.</p>'}</section>`;
}
function option(name, value, label) { return `<label class="iw-choice"><input type="radio" name="${name}" data-key="${name}" value="${value}" ${answers[name] === value ? 'checked' : ''}><span>${label}</span></label>`; }
function stepFields(index) {
  switch (index) {
    case 0: return `<div class="iw-fields">${field('testatorName', 'Your full name', { required: true, help: 'The testator is the person making this will.' })}${field('testatorAddress', 'Your residential address', { required: true, help: 'This appears in Article 1 of the document.' })}${field('testatorUnit', 'Unit or apartment number', { placeholder: 'Optional, e.g. 2B' })}</div><div class="iw-divider"></div><label class="iw-check"><input type="checkbox" data-key="noFamily" ${answers.noFamily ? 'checked' : ''}>I have no immediate family members to list</label>${answers.noFamily ? '' : repeater('family', 'Family members', [['name', 'Full name'], ['relationship', 'Relationship'], ['birthDate', 'Date of birth', 'date']], { note: 'Spouse, children, parents, siblings or other immediate family as relevant.', requiredFields: ['name', 'relationship'] })}`;
    case 1: return `<div class="iw-fields">${field('funeralPrimaryName', 'Primary funeral contact · full name', { required: true })}${field('funeralPrimaryAddress', 'Primary contact · address', { required: true })}${field('funeralAlternateName', 'Alternate funeral contact · full name', { required: true })}${field('funeralAlternateAddress', 'Alternate contact · address', { required: true })}</div>`;
    case 2: return `<div class="iw-fields">${field('executorPrimaryName', 'Primary executor · full name', { required: true })}${field('executorPrimaryAddress', 'Primary executor · address', { required: true })}${field('executorAlternateName', 'Alternate executor · full name', { required: true })}${field('executorAlternateAddress', 'Alternate executor · address', { required: true })}</div>`;
    case 3: return `<fieldset class="iw-question"><legend>Do you currently have minor children? <span class="iw-required">Required</span></legend><div class="iw-choice-row">${option('hasMinorChildren', 'yes', 'Yes')}${option('hasMinorChildren', 'no', 'No')}</div></fieldset>${answers.hasMinorChildren === 'yes' ? `<div class="iw-fields">${field('spouseGuardianName', 'Muslim spouse’s name, if applicable', { help: 'The Windsor template names a Muslim spouse first, then alternates.' })}${field('guardianPrimaryName', 'Guardian · full name', { required: true })}${field('guardianPrimaryAddress', 'Guardian · address', { required: true })}${field('guardianAlternateName', 'Alternate guardian · full name', { required: true })}${field('guardianAlternateAddress', 'Alternate guardian · address', { required: true })}</div>` : ''}`;
    case 4: return `<div class="iw-fields">${field('healthPrimaryName', 'Primary health care agent · full name', { required: true })}${field('healthPrimaryAddress', 'Primary agent · address', { required: true })}${field('healthAlternateName', 'Alternate health care agent · full name', { required: true })}${field('healthAlternateAddress', 'Alternate agent · address', { required: true })}</div>`;
    case 5: return `${repeater('bequests', 'Gifts and transfers', [['recipient', 'Person or organization'], ['amount', 'Amount or percent']], { note: 'Do not rely on this form to calculate the one-third limit.', requiredFields: ['recipient', 'amount'] })}${textarea('additionalInstructions', 'Additional instructions or directives', 'These appear in Article 10. Keep wording clear and seek advice for anything complex.')}`;
    case 6: return `${repeater('loansReceived', 'Loans received', [['person', 'Lender'], ['date', 'Date received', 'date'], ['amount', 'Amount received'], ['owing', 'Amount owing'], ['contact', 'Contact information']], { requiredFields: ['person'] })}<div class="iw-divider"></div><h3>Unfulfilled religious obligations</h3><div class="iw-fields">${['siyaam', 'zakah', 'mahr'].map((key, i) => `<div class="iw-field"><label for="iw-ob-${key}">${['Siyaam (compulsory fasting)', 'Zakah (compulsory alms)', 'Mahr (marriage gift)'][i]} · compensation or details</label><input id="iw-ob-${key}" data-obligation="${key}" value="${esc(answers.obligations[key])}" autocomplete="off"></div>`).join('')}</div><div class="iw-divider"></div>${repeater('loansOutstanding', 'Loans outstanding', [['person', 'Loan recipient'], ['date', 'Date given', 'date'], ['amount', 'Amount given'], ['owing', 'Amount owing'], ['contact', 'Contact information']], { requiredFields: ['person'] })}<div class="iw-divider"></div>${repeater('withdrawals', 'Automatic withdrawals', [['recipient', 'Recipient'], ['amount', 'Amount'], ['periodicity', 'Frequency'], ['source', 'Payment source']], { requiredFields: ['recipient'] })}${textarea('additionalAssets', 'Additional assets and details', 'Include property or belongings of which only you may have knowledge.')}`;
    case 7: return `<div class="iw-fields">${field('witnessOneName', 'Witness 1 · full name', { required: true })}${field('witnessOneAddress', 'Witness 1 · address', { required: true })}${field('witnessTwoName', 'Witness 2 · full name', { required: true })}${field('witnessTwoAddress', 'Witness 2 · address', { required: true })}</div><label class="iw-check iw-confirm"><input type="checkbox" data-key="witnessConfirmation" ${answers.witnessConfirmation ? 'checked' : ''}>I have checked that both proposed witnesses are adults and are not heirs under this will. <span class="iw-required">Required</span></label>`;
    default: return review();
  }
}

function review() {
  const items = [
    ['Testator', answers.testatorName], ['Address', `${answers.testatorUnit ? `Unit ${answers.testatorUnit}, ` : ''}${answers.testatorAddress}`], ['Family members', answers.noFamily ? 'None listed' : `${answers.family.length} listed`],
    ['Funeral contacts', `${answers.funeralPrimaryName} · ${answers.funeralAlternateName}`], ['Executors', `${answers.executorPrimaryName} · ${answers.executorAlternateName}`],
    ['Minor children', answers.hasMinorChildren === 'yes' ? `Yes · ${answers.guardianPrimaryName} and ${answers.guardianAlternateName}` : 'No'],
    ['Health care agents', `${answers.healthPrimaryName} · ${answers.healthAlternateName}`], ['Gifts or transfers', `${answers.bequests.length} listed`],
    ['Witnesses', `${answers.witnessOneName} · ${answers.witnessTwoName}`]
  ];
  return `<div class="iw-review"><dl>${items.map(([label, val]) => `<div><dt>${label}</dt><dd>${esc(val || 'Not supplied')}</dd></div>`).join('')}</dl><div class="iw-final-note"><h3>Before this becomes a signed will</h3><p>The downloads are drafts. The Windsor instructions call for the testator and two non-heir adult witnesses to sign every page and addendum in each other’s presence. Consultation with a qualified Islamic scholar and legal counsel is advised. This form does not calculate inheritance shares or establish legal validity.</p><p>The original template contains apparent article-reference and appendix inconsistencies. Those have not been silently corrected here.</p></div><div class="iw-downloads"><button type="button" class="button" data-export="docx">Download DOCX draft</button><button type="button" class="button button-secondary" data-export="pdf">Download PDF draft</button></div><p id="iw-export-status" role="status" aria-live="polite"></p></div>`;
}

function stopAddressLookup() {
  clearTimeout(addressTimer);
  addressController?.abort();
  addressController = undefined;
  addressResults = [];
  activeAddress = -1;
  if (activeAddressInput?.isConnected) showAddressOptions();
  activeAddressInput = undefined;
}

function showAddressOptions() {
  const input = activeAddressInput;
  const list = input?.parentElement.querySelector('.iw-address-options');
  if (!input || !list) return;
  list.innerHTML = addressResults.map((address, index) => `<li id="${input.id}-option-${index}" role="option" aria-selected="${index === activeAddress}" data-address-index="${index}">${esc(address.label)}</li>`).join('');
  list.hidden = !addressResults.length;
  input.setAttribute('aria-expanded', String(Boolean(addressResults.length)));
  if (activeAddress < 0) input.removeAttribute('aria-activedescendant');
  else input.setAttribute('aria-activedescendant', `${input.id}-option-${activeAddress}`);
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}

function selectAddress(index) {
  const address = addressResults[index];
  const input = activeAddressInput;
  if (!address || !input) return;
  stopAddressLookup();
  input.value = address.value;
  answers[input.dataset.key] = address.value;
  input.closest('.iw-address-field').querySelector('.iw-address-status').textContent = address.kind === 'street'
    ? 'Street selected. The house number was not verified; check the full address before continuing.'
    : 'Address selected. Check it before continuing.';
  input.focus();
}

async function lookupAddress(query, input) {
  addressController?.abort();
  const controller = new AbortController();
  addressController = controller;
  const status = input.closest('.iw-address-field').querySelector('.iw-address-status');
  if (status) status.textContent = 'Searching Canadian addresses…';
  try {
    const search = async text => {
      const url = new URL('https://photon.komoot.io/api/');
      url.search = new URLSearchParams({ q: text, countrycode: 'CA', lang: 'en', limit: '20' });
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Address lookup returned ${response.status}`);
      return (await response.json()).features || [];
    };
    let features = await search(query);
    if (controller.signal.aborted || !root.contains(input) || input !== activeAddressInput || input.value.trim() !== query) return;
    let matches = matchingAddresses(features, query);
    const streetOnlyQuery = query.replace(/^\s*\d+[a-z]?\s+/i, '');
    if (streetOnlyQuery !== query && /^\S+\s+\S+/.test(streetOnlyQuery) && !matches.some(match => match.exactStreet)) {
      features = features.concat(await search(streetOnlyQuery));
      if (controller.signal.aborted || !root.contains(input) || input !== activeAddressInput || input.value.trim() !== query) return;
      matches = matchingAddresses(features, query);
    }
    addressResults = matches;
    activeAddress = -1;
    showAddressOptions();
    status.textContent = addressResults.length ? `${addressResults.length} matching suggestions. Use the arrow keys to choose one. Street matches do not verify the house number.` : 'No close match found. You can enter the address manually.';
  } catch (error) {
    if (error.name === 'AbortError') return;
    addressResults = [];
    showAddressOptions();
    if (status) status.textContent = 'Suggestions are unavailable. Please enter your address manually.';
  }
}

function scheduleAddressLookup(input) {
  stopAddressLookup();
  activeAddressInput = input;
  const query = input.value.trim();
  const status = input.closest('.iw-address-field').querySelector('.iw-address-status');
  if (query.length < 5) { if (status) status.textContent = ''; return; }
  addressTimer = setTimeout(() => lookupAddress(query, input), 400);
}

function render() {
  stopAddressLookup();
  const step = steps[current];
  const progress = Math.round((current / (steps.length - 1)) * 100);
  root.innerHTML = `<section class="iw-save-tools" aria-label="Save or restore answers"><div><h2>Save your answers on your device</h2><p>Download an answers file now, then load it here to continue later. The file contains your answers in readable text, so keep it private. Loading a file replaces the answers in this tab.</p></div><div class="iw-save-actions"><button type="button" class="iw-save-button" data-save>Download answers file</button><button type="button" class="iw-load-button" data-load>Load answers file</button><input id="iw-load-file" type="file" accept=".json,application/json" hidden></div><p id="iw-save-status" class="iw-save-status" role="status" aria-live="polite">${esc(saveStatus)}</p></section><div class="iw-sample-tools"><div><strong>Test the full form</strong><p>Fill every section with fictional information. This replaces any answers in this tab.</p></div><button type="button" class="iw-seed-button" data-seed>${answers.sampleData ? 'Generate new sample data' : 'Fill with sample data'}</button></div>${answers.sampleData ? '<p class="iw-sample-warning" role="status"><strong>Sample data · testing only.</strong> The names, addresses and financial details below are fictional. Downloads will be marked as samples.</p>' : ''}<div class="iw-layout"><nav class="iw-progress" aria-label="Form sections"><p class="iw-progress-title">Your draft</p><div class="iw-progress-track" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><ol>${steps.map((s, i) => `<li><button type="button" data-go="${i}" ${i > furthest ? 'disabled' : ''} ${i === current ? 'aria-current="step"' : ''}><span class="iw-step-index">${i + 1}</span><span>${s.label}<small>${s.status}</small></span></button></li>`).join('')}</ol></nav><div class="iw-main"><div class="iw-mobile-progress">Section ${current + 1} of ${steps.length}<span>${progress}%</span></div><p class="iw-kicker">${step.kicker}</p><h2 id="iw-step-title" tabindex="-1">${step.title}</h2><p class="iw-step-intro">${step.intro}</p><form id="iw-form" novalidate><div id="iw-errors" role="alert" aria-live="assertive" tabindex="-1"></div>${stepFields(current)}</form>${current < steps.length - 1 ? `<div class="iw-actions"><button type="button" class="button" data-next>Continue <span aria-hidden="true">→</span></button>${current ? '<button type="button" class="iw-back" data-back>Back</button>' : ''}</div>` : `<div class="iw-actions"><button type="button" class="iw-back" data-back>Back to witnesses</button></div>`}</div><aside class="iw-guidance"><p class="iw-guidance-label">Things to keep in mind</p><ul>${step.tips.map(t => `<li>${t}</li>`).join('')}</ul><div class="iw-guidance-foot">Based on the <a href="https://drive.google.com/open?id=1dda59Ce2HcNm8Cp1ZHMrlQ_wZZnChfPO" target="_blank" rel="noopener noreferrer">Windsor Islamic Association template<span class="sr-only"> (opens in a new tab)</span></a>.</div></aside></div>`;
}

function setSaveStatus(message) {
  saveStatus = message;
  const status = root.querySelector('#iw-save-status');
  if (status) status.textContent = message;
}

function saveAnswers() {
  const blob = new Blob([createSavedAnswers(answers, current, furthest)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Islamic-Will-Answers-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  setSaveStatus('Answers file downloaded to your device. Keep this unencrypted file private.');
}

async function loadAnswers(file) {
  if (!file) return;
  if (file.size > maxSavedFileBytes) { setSaveStatus('That file is too large. Choose an answers file downloaded from this tool.'); return; }
  try {
    const restored = parseSavedAnswers(await file.text());
    Object.assign(answers, restored.answers);
    current = restored.current;
    furthest = restored.furthest;
    saveStatus = 'Answers restored from your device. Review them before downloading a will draft.';
    render();
    document.getElementById('iw-step-title').focus();
  } catch (error) {
    setSaveStatus(error.message || 'The answers file could not be read.');
  }
}

function capture(event) {
  const el = event.target;
  if (el.dataset.key) answers[el.dataset.key] = el.type === 'checkbox' ? el.checked : el.value;
  if (el.hasAttribute('data-address') && event.type === 'input') scheduleAddressLookup(el);
  if (el.dataset.list) answers[el.dataset.list][Number(el.dataset.index)][el.dataset.prop] = el.value;
  if (el.dataset.obligation) answers.obligations[el.dataset.obligation] = el.value;
  if ((el.dataset.key === 'hasMinorChildren' || el.dataset.key === 'noFamily') && event.type === 'change') render();
}

function problem(message, selector) {
  const box = document.getElementById('iw-errors');
  box.innerHTML = `<p>${esc(message)}</p>`;
  box.classList.add('is-visible');
  const el = selector ? root.querySelector(selector) : null;
  if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  else box.focus();
  return false;
}

function validate(index) {
  for (const el of root.querySelectorAll('#iw-form input[required]')) {
    if (!el.value.trim()) return problem(`Complete “${el.closest('.iw-field').querySelector('label').textContent.replace('Required', '').trim()}” to continue.`, `#${CSS.escape(el.id)}`);
  }
  if (index === 0 && !answers.noFamily && !answers.family.length) return problem('Add at least one family member, or select “I have no immediate family members to list”.', '[data-add="family"]');
  if (index === 3 && !answers.hasMinorChildren) return problem('Choose Yes or No for minor children.', '[name="hasMinorChildren"]');
  const lists = index === 0 ? ['family'] : index === 5 ? ['bequests'] : index === 6 ? ['loansReceived', 'loansOutstanding', 'withdrawals'] : [];
  for (const key of lists) for (let i = 0; i < answers[key].length; i++) {
    const row = answers[key][i];
    const required = key === 'family' ? ['name', 'relationship'] : key === 'bequests' ? ['recipient', 'amount'] : key === 'withdrawals' ? ['recipient'] : ['person'];
    for (const prop of required) if (!String(row[prop] || '').trim()) return problem('Complete the required fields in each item you added, or remove the unfinished item.', `[data-list="${key}"][data-index="${i}"][data-prop="${prop}"]`);
  }
  if (index === 7 && !answers.witnessConfirmation) return problem('Confirm that both proposed witnesses are adults and are not heirs.', '[data-key="witnessConfirmation"]');
  return true;
}

function allRequiredComplete() {
  const keys = ['testatorName', 'testatorAddress', 'funeralPrimaryName', 'funeralPrimaryAddress', 'funeralAlternateName', 'funeralAlternateAddress', 'executorPrimaryName', 'executorPrimaryAddress', 'executorAlternateName', 'executorAlternateAddress', 'healthPrimaryName', 'healthPrimaryAddress', 'healthAlternateName', 'healthAlternateAddress', 'witnessOneName', 'witnessOneAddress', 'witnessTwoName', 'witnessTwoAddress'];
  if (keys.some(key => !String(answers[key] || '').trim()) || !answers.witnessConfirmation || !answers.hasMinorChildren) return false;
  if (!answers.noFamily && (!answers.family.length || answers.family.some(row => !row.name?.trim() || !row.relationship?.trim()))) return false;
  if (answers.hasMinorChildren === 'yes' && ['guardianPrimaryName', 'guardianPrimaryAddress', 'guardianAlternateName', 'guardianAlternateAddress'].some(key => !String(answers[key] || '').trim())) return false;
  for (const [key, required] of [['bequests', ['recipient', 'amount']], ['loansReceived', ['person']], ['loansOutstanding', ['person']], ['withdrawals', ['recipient']]]) {
    if (answers[key].some(row => required.some(prop => !String(row[prop] || '').trim()))) return false;
  }
  return true;
}

async function download(format) {
  const status = document.getElementById('iw-export-status');
  if (!allRequiredComplete()) { status.textContent = 'Some required answers are missing. Go back through the form to complete them.'; return; }
  const buttons = root.querySelectorAll('[data-export]');
  buttons.forEach(button => button.disabled = true);
  status.textContent = `Preparing your ${format.toUpperCase()} draft…`;
  try {
    const { makeDocx, makePdf } = await import('./export.js');
    const imageNames = ['windsor-bismillah.png', 'windsor-verse-1.png', 'windsor-verse-2.png'];
    const fetchBytes = async name => {
      const response = await fetch(`/assets/${name}`);
      if (!response.ok) throw new Error(`Document asset could not be loaded: ${name}`);
      return new Uint8Array(await response.arrayBuffer());
    };
    const images = Object.fromEntries(await Promise.all(imageNames.map(async name => [name, await fetchBytes(name)])));
    let blob;
    if (format === 'docx') blob = await makeDocx(answers, images);
    else {
      const [regular, bold] = await Promise.all([fetchBytes('NotoSans.ttf'), fetchBytes('NotoSans-Bold.ttf')]);
      blob = await makePdf(answers, regular, bold, images);
    }
    const file = `${answers.sampleData ? 'SAMPLE-' : ''}Islamic-Will-Draft-${answers.testatorName.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'Will'}.${format}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = file; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = `${format.toUpperCase()} draft downloaded. Review and sign it before use.`;
  } catch (error) {
    console.error('Document export failed', error);
    status.textContent = 'The document could not be prepared. Please try again, or use the original template.';
  } finally { buttons.forEach(button => button.disabled = false); }
}

root.addEventListener('input', capture);
root.addEventListener('change', capture);
root.addEventListener('change', event => {
  if (event.target.id !== 'iw-load-file') return;
  const file = event.target.files?.[0];
  event.target.value = '';
  loadAnswers(file);
});
root.addEventListener('submit', event => event.preventDefault());
root.addEventListener('keydown', event => {
  if (!event.target.hasAttribute('data-address') || event.target !== activeAddressInput || !addressResults.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    activeAddress = event.key === 'ArrowDown' ? Math.min(activeAddress + 1, addressResults.length - 1) : Math.max(activeAddress - 1, 0);
    showAddressOptions();
  } else if (event.key === 'Enter' && activeAddress >= 0) {
    event.preventDefault();
    selectAddress(activeAddress);
  } else if (event.key === 'Escape') {
    stopAddressLookup();
  }
});
root.addEventListener('focusout', event => {
  if (event.target === activeAddressInput) {
    stopAddressLookup();
  }
});
root.addEventListener('pointerdown', event => {
  const option = event.target.closest('[data-address-index]');
  if (!option) return;
  event.preventDefault();
  selectAddress(Number(option.dataset.addressIndex));
});
root.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.hasAttribute('data-save')) saveAnswers();
  else if (button.hasAttribute('data-load')) root.querySelector('#iw-load-file').click();
  else if (button.hasAttribute('data-seed')) {
    Object.assign(answers, initialAnswers(), makeSampleAnswers());
    current = steps.length - 1;
    furthest = current;
    render();
    document.getElementById('iw-step-title').focus();
  } else if (button.dataset.add) {
    answers[button.dataset.add].push(Object.fromEntries(repeatFields[button.dataset.add].map(key => [key, ''])));
    render(); root.querySelector(`[data-list="${button.dataset.add}"][data-index="${answers[button.dataset.add].length - 1}"]`)?.focus();
  } else if (button.dataset.remove) {
    answers[button.dataset.remove].splice(Number(button.dataset.index), 1); render();
  } else if (button.hasAttribute('data-next')) {
    if (!validate(current)) return;
    current++; furthest = Math.max(current, furthest); render(); document.getElementById('iw-step-title').focus();
  } else if (button.hasAttribute('data-back')) {
    current--; render(); document.getElementById('iw-step-title').focus();
  } else if (button.dataset.go !== undefined) {
    current = Number(button.dataset.go); render(); document.getElementById('iw-step-title').focus();
  } else if (button.dataset.export) download(button.dataset.export);
});

render();
