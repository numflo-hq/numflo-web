/**
 * German gross-to-net salary for 2026 (Brutto-Netto). Pure functions. BRD F-41.
 *
 * Wage tax (Lohnsteuer), solidarity surcharge and the church-tax base follow the official
 * BMF "Programmablaufplan für die maschinelle Berechnung der vom Arbeitslohn einzubehaltenden
 * Lohnsteuer 2026" (monthly pay period, LZZ 2), for the common case: statutory health
 * insurance, no allowances entered on the tax card, no pensions, under 64, no one-off
 * payments. All amounts are handled in whole cents so the BMF rounding rules apply exactly.
 *
 * Employee social insurance uses the 2026 rates and ceilings, including the reduced
 * contributions in the Übergangsbereich (midijob, 603.01 to 2,000 € a month).
 */

export const TAX_CLASSES = [1, 2, 3, 4, 5, 6] as const;
export const CHILDREN = [0, 1, 2, 3, 4, 5, 6] as const;
/** Church tax rate in percent: none, 8 (Bavaria, Baden-Württemberg), 9 (all other states). */
export const CHURCH_RATES = [0, 8, 9] as const;

/** 2026 parameters. */
export const DE_2026 = {
  /** Contribution ceilings per year (health/care; pension/unemployment). */
  bbgKvPv: 69_750,
  bbgRvAlv: 101_400,
  /** Employee rates. Health: 7.3% + half the additional rate. */
  kvGeneralHalf: 0.073,
  pvEmployee: 0.018,
  pvEmployeeSaxony: 0.023,
  pvChildless: 0.006,
  pvPerChild: 0.0025,
  rv: 0.093,
  alv: 0.013,
  /** Minijob limit and the upper end of the Übergangsbereich, per month. */
  minijob: 603,
  midijobTop: 2000,
  /** Faktor F for the Übergangsbereich in 2026 (28% / 42.3%). */
  factorF: 0.6619,
  /** Employee pension contribution in a minijob (18.6% − 15% paid by the employer). */
  minijobRv: 0.036,
  rvTotal: 0.186,
  minijobRvEmployer: 0.15,
  /** Minimum pension base per month for a minijob. */
  minijobRvMinBase: 175,
  /** Average additional health contribution (durchschnittlicher Zusatzbeitrag). */
  averageZusatz: 2.9,
} as const;

export interface GrossNetInput {
  /** Gross pay per month in euros. */
  gross: number;
  taxClass: number;
  /** Children: counted as child allowances (1.0 each) and for the care-insurance rate. */
  children: number;
  /** Church tax in percent: 0, 8 or 9. */
  church: number;
  /** 1 when working in Saxony (higher employee share of care insurance). */
  saxony: number;
  /** Health insurer's additional contribution, in percent. */
  zusatz: number;
}

export interface GrossNetResult {
  gross: number;
  net: number;
  incomeTax: number;
  soli: number;
  churchTax: number;
  health: number;
  care: number;
  pension: number;
  unemployment: number;
  taxes: number;
  social: number;
  deductions: number;
}

// ---------- Wage tax: BMF PAP 2026, LZZ 2 ----------

interface PapInput {
  /** Monthly wage in cents (RE4). */
  re4: number;
  stkl: number;
  /** Child allowance counter (ZKF). */
  zkf: number;
  /** Additional health contribution in hundredths of a percent (KVZ × 100). */
  kvzHundredths: number;
  /** PVS: Saxony. */
  pvs: number;
  /** PVZ: childless surcharge. */
  pvz: number;
  /** PVA: number of child reductions (children 2 to 5). */
  pva: number;
  /** R: church member. */
  church: boolean;
}

export interface PapOutput {
  /** Monthly wage tax, solidarity surcharge and church-tax base, in cents. */
  lstlzz: number;
  solzlzz: number;
  bk: number;
}

const GFB = 12_348;
const SOLZFREI = 20_350;
const W1STKL5 = 14_071;
const W2STKL5 = 34_939;
const W3STKL5 = 222_260;

/** Income tax tariff 2026 on a whole-euro amount (UPTAB26 before × KZTAB). */
function tariff(x: number): number {
  if (x < GFB + 1) return 0;
  if (x < 17_800) {
    const a = x - GFB; // Y = a / 10,000 exactly
    return Math.floor(((91_451 * a + 1_400_000_000) * a) / 1e10);
  }
  if (x < 69_879) {
    const a = x - 17_799;
    return Math.floor(((1731 * a + 239_700_000) * a + 1_034_870_000_000) / 1e9);
  }
  if (x < 277_826) return Math.floor((42 * x - 1_113_563) / 100);
  return Math.floor((45 * x - 1_947_038) / 100);
}

/** Tax classes V and VI (MST5_6 with UP5_6). */
function tariff56(zzx: number): number {
  const up56 = (zx: number) => {
    const st1 = tariff(Math.floor((zx * 5) / 4));
    const st2 = tariff(Math.floor((zx * 3) / 4));
    const diff = (st1 - st2) * 2;
    const mist = Math.floor((zx * 14) / 100);
    return mist > diff ? mist : diff;
  };
  if (zzx > W2STKL5) {
    let st = up56(W2STKL5);
    if (zzx > W3STKL5) {
      st += Math.floor(((W3STKL5 - W2STKL5) * 42) / 100);
      st += Math.floor(((zzx - W3STKL5) * 45) / 100);
    } else {
      st += Math.floor(((zzx - W2STKL5) * 42) / 100);
    }
    return st;
  }
  let st = up56(zzx);
  if (zzx > W1STKL5) {
    const vergl = st;
    const hoch = up56(W1STKL5) + Math.floor(((zzx - W1STKL5) * 42) / 100);
    st = hoch < vergl ? hoch : vergl;
  }
  return st;
}

export function lohnsteuer2026(p: PapInput): PapOutput {
  const zre4C = p.re4 * 12; // yearly wage in cents (ZRE4J = ZRE4 = ZRE4VP)
  const kztab = p.stkl === 3 ? 2 : 1;

  // Vorsorgepauschale (UPEVP, MVSPKVPV, MVSPHB), in cents.
  const rvBase = Math.min(zre4C, DE_2026.bbgRvAlv * 100);
  const vspr = Math.floor((rvBase * 93) / 1000);
  const kvBase = Math.min(zre4C, DE_2026.bbgKvPv * 100);
  // KVSATZAN + PVSATZAN in millionths.
  const pv = (p.pvs === 1 ? 23_000 : 18_000) + (p.pvz === 1 ? 6000 : -2500 * p.pva);
  const rate = 70_000 + p.kvzHundredths * 50 + pv;
  const vspkvpv = Math.floor((kvBase * rate) / 1e6);
  let vsp = Math.ceil((vspkvpv + vspr) / 100); // whole euros
  if (p.stkl !== 6) {
    const vspalv = Math.floor((rvBase * 13) / 1000);
    const vsphb = Math.min(vspalv + vspkvpv, 190_000);
    const vspn = Math.ceil((vspr + vsphb) / 100);
    if (vspn > vsp) vsp = vspn;
  }

  // Allowances in the table (MZTABFB), whole euros.
  let anp = 0;
  let sap = 0;
  let efa = 0;
  let kfb = 0;
  if (p.stkl < 6) {
    if (zre4C > 0) anp = zre4C < 123_000 ? Math.ceil(zre4C / 100) : 1230;
    sap = 36;
  }
  if (p.stkl === 2) efa = 4260;
  if (p.stkl <= 3) kfb = Math.floor(p.zkf * 9756);
  else if (p.stkl === 4) kfb = Math.floor(p.zkf * 4878);

  const yearTax = (ztabfb: number) => {
    const zveC = zre4C - ztabfb * 100 - vsp * 100;
    const x = zveC < 100 ? 0 : Math.floor(zveC / 100 / kztab);
    return p.stkl < 5 ? tariff(x) * kztab : tariff56(x);
  };

  const ztabfb = efa + anp + sap;
  const lstjahr = yearTax(ztabfb);
  const lstlzz = Math.floor((lstjahr * 100) / 12);
  const jbmg = p.zkf > 0 ? yearTax(ztabfb + kfb) : lstjahr;

  // Solidarity surcharge (MSOLZ).
  let solzlzz = 0;
  const frei = SOLZFREI * kztab;
  if (jbmg > frei) {
    const solzj = Math.floor((jbmg * 11) / 2); // 5.5%, in cents
    const solzmin = Math.floor(((jbmg - frei) * 119) / 10); // 11.9% of the excess, in cents
    solzlzz = Math.floor(Math.min(solzj, solzmin) / 12);
  }
  const bk = p.church ? Math.floor((jbmg * 100) / 12) : 0;
  return { lstlzz, solzlzz, bk };
}

// ---------- Social insurance (employee share) ----------

/** Round a euro amount to cents, half up. */
const cents = (v: number) => Math.round(v * 100 + 1e-7) / 100;

export function calculateGrossNet(i: GrossNetInput): GrossNetResult {
  const zero: GrossNetResult = {
    gross: 0,
    net: 0,
    incomeTax: 0,
    soli: 0,
    churchTax: 0,
    health: 0,
    care: 0,
    pension: 0,
    unemployment: 0,
    taxes: 0,
    social: 0,
    deductions: 0,
  };
  const valid =
    i.gross > 0 &&
    TAX_CLASSES.includes(i.taxClass as 1) &&
    i.children >= 0 &&
    Number.isInteger(i.children) &&
    CHURCH_RATES.includes(i.church as 0) &&
    (i.saxony === 0 || i.saxony === 1) &&
    i.zusatz >= 0 &&
    i.zusatz <= 10;
  if (!valid) return zero;

  const gross = cents(i.gross);
  const D = DE_2026;
  const childless = i.children === 0;
  const pvReductions = Math.max(0, Math.min(i.children, 5) - 1);
  const pvRate =
    (i.saxony === 1 ? D.pvEmployeeSaxony : D.pvEmployee) - (childless ? 0 : pvReductions * D.pvPerChild);
  const kvRate = D.kvGeneralHalf + i.zusatz / 200;

  let health = 0;
  let care = 0;
  let pension: number;
  let unemployment = 0;
  let incomeTax = 0;
  let soli = 0;
  let churchTax = 0;

  if (gross <= D.minijob) {
    // Minijob: the employer usually pays a 2% flat tax; the employee pays only the difference
    // between the full pension rate and the employer's 15%, on at least 175 € a month.
    pension =
      gross >= D.minijobRvMinBase
        ? cents(gross * D.minijobRv)
        : cents(D.minijobRvMinBase * D.rvTotal - gross * D.minijobRvEmployer);
  } else {
    let baseAn: number; // employee's contribution base
    let baseTotal: number; // total base (for the childless surcharge)
    // The Übergangsbereich looks at the pay from all jobs: a second job (class VI) sits on
    // top of a main job, so it pays the full rates.
    if (gross <= D.midijobTop && i.taxClass !== 6) {
      const G = D.minijob;
      const O = D.midijobTop;
      baseAn = (O / (O - G)) * (gross - G);
      baseTotal = D.factorF * G + (O / (O - G) - (G / (O - G)) * D.factorF) * (gross - G);
    } else {
      baseAn = gross;
      baseTotal = gross;
    }
    const kvCap = D.bbgKvPv / 12;
    const rvCap = D.bbgRvAlv / 12;
    health = cents(Math.min(baseAn, kvCap) * kvRate);
    care = cents(
      Math.min(baseAn, kvCap) * pvRate + (childless ? Math.min(baseTotal, kvCap) * D.pvChildless : 0),
    );
    pension = cents(Math.min(baseAn, rvCap) * D.rv);
    unemployment = cents(Math.min(baseAn, rvCap) * D.alv);

    const pap = lohnsteuer2026({
      re4: Math.round(gross * 100),
      stkl: i.taxClass,
      zkf: i.taxClass <= 4 ? i.children : 0,
      kvzHundredths: Math.round(i.zusatz * 100),
      pvs: i.saxony,
      pvz: childless ? 1 : 0,
      pva: childless ? 0 : pvReductions,
      church: i.church > 0,
    });
    incomeTax = pap.lstlzz / 100;
    soli = pap.solzlzz / 100;
    churchTax = Math.floor((pap.bk * i.church) / 100) / 100;
  }

  const taxes = cents(incomeTax + soli + churchTax);
  const social = cents(health + care + pension + unemployment);
  const deductions = cents(taxes + social);
  return {
    gross,
    net: cents(gross - deductions),
    incomeTax,
    soli,
    churchTax,
    health,
    care,
    pension,
    unemployment,
    taxes,
    social,
    deductions,
  };
}
