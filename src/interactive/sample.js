// Clearly fictional values for exercising every section of the experimental form.
export function makeSampleAnswers() {
  const pick = values => values[Math.floor(Math.random() * values.length)];
  const number = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const id = number(100, 999);
  const city = pick(['Ottawa', 'Windsor', 'Toronto', 'Hamilton']);
  const address = (n, place = city) => `${n} Example Street, ${place}, ON A0A 0A0, Canada`;
  const person = role => `Sample ${role} ${id}`;
  return {
    sampleData: true,
    testatorName: person('Testator'), testatorAddress: address(number(10, 90)), testatorUnit: String(number(1, 12)),
    noFamily: false,
    family: [
      { name: person('Spouse'), relationship: 'Spouse', birthDate: '1985-04-12' },
      { name: person('Child'), relationship: 'Child', birthDate: '2017-08-24' },
      { name: person('Parent'), relationship: 'Parent', birthDate: '1955-02-09' }
    ],
    funeralPrimaryName: person('Funeral Contact'), funeralPrimaryAddress: address(number(100, 190)),
    funeralAlternateName: person('Alternate Funeral Contact'), funeralAlternateAddress: address(number(200, 290)),
    executorPrimaryName: person('Executor'), executorPrimaryAddress: address(number(300, 390)),
    executorAlternateName: person('Alternate Executor'), executorAlternateAddress: address(number(400, 490)),
    hasMinorChildren: 'yes', spouseGuardianName: person('Spouse'),
    guardianPrimaryName: person('Guardian'), guardianPrimaryAddress: address(number(500, 590)),
    guardianAlternateName: person('Alternate Guardian'), guardianAlternateAddress: address(number(600, 690)),
    healthPrimaryName: person('Health Agent'), healthPrimaryAddress: address(number(700, 790)),
    healthAlternateName: person('Alternate Health Agent'), healthAlternateAddress: address(number(800, 890)),
    bequests: [
      { recipient: `Sample Community Fund ${id}`, amount: `${number(2, 8)}%` },
      { recipient: person('Gift Recipient'), amount: `$${number(2, 9)}00` }
    ],
    additionalInstructions: 'Sample instruction for layout testing only. Replace or remove before preparing a real draft.',
    loansReceived: [{ person: person('Lender'), date: '2025-03-14', amount: '$2,000', owing: '$1,200', contact: address(number(110, 190)) }],
    obligations: { siyaam: 'Sample fasting obligation detail', zakah: 'Sample zakah obligation detail', mahr: 'Sample mahr obligation detail' },
    loansOutstanding: [{ person: person('Borrower'), date: '2024-11-06', amount: '$1,500', owing: '$750', contact: address(number(210, 290)) }],
    withdrawals: [{ recipient: `Sample Utility ${id}`, amount: '$80', periodicity: 'Monthly', source: 'Sample chequing account' }],
    additionalAssets: 'Sample personal property and account details for layout testing only. No real account numbers or passwords.',
    witnessOneName: person('Witness One'), witnessOneAddress: address(number(310, 390)),
    witnessTwoName: person('Witness Two'), witnessTwoAddress: address(number(410, 490)),
    witnessConfirmation: true
  };
}
