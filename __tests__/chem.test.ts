import * as Parser from '../lib/chem/parser';

// your existing tests here...
describe("formula parsing", () => {
  test("H2O", () => {
    expect(Parser.countElementsInFormula("H2O")).toEqual({ H: 2, O: 1 });
  });
  // ... rest of your earlier tests
});

// then add the new block below
describe('countElementsInFormula – classic edge cases', () => {
  test('Mg(OH)2 (basic parentheses)', () => {
    expect(Parser.countElementsInFormula('Mg(OH)2'))
      .toEqual({ Mg: 1, O: 2, H: 2 });
  });

  // ... all the other new tests I gave you

describe('countElementsInFormula – classic edge cases', () => {
  test('Mg(OH)2 (basic parentheses)', () => {
    expect(Parser.countElementsInFormula('Mg(OH)2'))
      .toEqual({ Mg: 1, O: 2, H: 2 });
  });

  test('Al2(SO4)3 (nested multiplier)', () => {
    expect(Parser.countElementsInFormula('Al2(SO4)3'))
      .toEqual({ Al: 2, S: 3, O: 12 });
  });

  test('(NH4)2SO4 (ammonium sulfate)', () => {
    expect(Parser.countElementsInFormula('(NH4)2SO4'))
      .toEqual({ N: 2, H: 8, S: 1, O: 4 });
  });

  test('K4[Fe(CN)6] (square brackets + nesting)', () => {
    expect(Parser.countElementsInFormula('K4[Fe(CN)6]'))
      .toEqual({ K: 4, Fe: 1, C: 6, N: 6 });
  });

  test('Fe(NO3)3·9H2O (hydrate with dot + number)', () => {
    expect(Parser.countElementsInFormula('Fe(NO3)3·9H2O'))
      .toEqual({ Fe: 1, N: 3, O: 18, H: 18 }); // 3*NO3 = N3O9, + 9*H2O = H18O9 => total O18
  });

  test('CuSO4·5H2O (classic pentahydrate)', () => {
    expect(Parser.countElementsInFormula('CuSO4·5H2O'))
      .toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  test('Inline leading number inside species (2 is multiplier of next token)', () => {
    // 2(NH3) => N1*2, H3*2
    expect(Parser.countElementsInFormula('2(NH3)'))
      .toEqual({ N: 2, H: 6 });
  });

  test('Whitespace & case insensitivity of spaces only (not element symbols)', () => {
    expect(Parser.countElementsInFormula('  Ca3 ( PO4 )2   '))
      .toEqual({ Ca: 3, P: 2, O: 8 });
  });
});

describe('splitEquation – arrow normalization & parsing', () => {
  test('ASCII arrow ->', () => {
    expect(Parser.splitEquation('C3H8 + O2 -> CO2 + H2O'))
      .toEqual({ left: ['C3H8', 'O2'], right: ['CO2', 'H2O'] });
  });

  test('Unicode arrow →', () => {
    expect(Parser.splitEquation('C3H8 + O2 → CO2 + H2O'))
      .toEqual({ left: ['C3H8', 'O2'], right: ['CO2', 'H2O'] });
  });

  test('Other arrows and weird spacing', () => {
    expect(Parser.splitEquation(' Fe + O2   =>   Fe2O3 '))
      .toEqual({ left: ['Fe', 'O2'], right: ['Fe2O3'] });
  });

  test('Invalid (no arrow) returns null', () => {
    expect(Parser.splitEquation('H2 + O2 CO2 + H2O')).toBeNull();
  });
});

describe('parseSpecies & coefficient math', () => {
  test('parseSpecies with and without leading coefficient', () => {
    expect(Parser.parseSpecies('2H2O')).toEqual({ coeff: 2, formula: 'H2O' });
    expect(Parser.parseSpecies('  H2O')).toEqual({ coeff: 1, formula: 'H2O' });
  });

  test('multiplyCounts + sumCounts across multiple species', () => {
    const twoCO2 = Parser.multiplyCounts(Parser.countElementsInFormula('CO2'), 2); // C2 O4
    const threeH2O = Parser.multiplyCounts(Parser.countElementsInFormula('H2O'), 3); // H6 O3
    const totals = Parser.sumCounts([twoCO2, threeH2O]); // C2 H6 O7
    expect(totals).toEqual({ C: 2, H: 6, O: 7 });
  });

  test('full side sums reflect coefficient arrays', () => {
    // Left: 2 H2 + O2  => H:4, O:2
    const left = Parser.sumCounts([
      Parser.multiplyCounts(Parser.countElementsInFormula('H2'), 2),
      Parser.multiplyCounts(Parser.countElementsInFormula('O2'), 1),
    ]);

    // Right: 2 H2O => H:4, O:2
    const right = Parser.sumCounts([
      Parser.multiplyCounts(Parser.countElementsInFormula('H2O'), 2),
    ]);

    expect(left).toEqual({ H: 4, O: 2 });
    expect(right).toEqual({ H: 4, O: 2 });
  });
});


});
