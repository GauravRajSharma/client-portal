import {
  paymentStateLabel,
  toBill,
  toBillLine,
  toInsuranceCoverage,
} from "./index";

describe("toBillLine", () => {
  it("maps an Odoo invoice line, preferring tax-inclusive total", () => {
    const line = toBillLine({
      name: "Consultation",
      quantity: 2,
      price_unit: 500,
      price_subtotal: 1000,
      price_total: 1130,
      product_id: [7, "Consultation"],
    });
    expect(line.description).toBe("Consultation");
    expect(line.quantity).toBe(2);
    expect(line.unitPrice).toBe(500);
    expect(line.amount).toBe(1130);
    expect(line.category).toBe("Consultation");
  });

  it("falls back to product label and clamps negatives", () => {
    const line = toBillLine({
      name: false,
      price_total: -5,
      product_id: [1, "X-Ray"],
    });
    expect(line.description).toBe("X-Ray");
    expect(line.amount).toBe(0);
  });
});

describe("toInsuranceCoverage", () => {
  it("is undefined for a plain cash bill", () => {
    expect(
      toInsuranceCoverage({ claim_code: false }, { total: 100, due: 100 }),
    ).toBeUndefined();
  });

  it("derives covered vs patient-payable from a claim-coded invoice", () => {
    const cov = toInsuranceCoverage(
      { claim_code: "CC-001", payment_state: "paid" },
      { nhisNumber: "N123", total: 1000, due: 200 },
    );
    expect(cov?.claimCode).toBe("CC-001");
    expect(cov?.number).toBe("N123");
    expect(cov?.covered).toBe(800);
    expect(cov?.patientPayable).toBe(200);
    expect(cov?.status).toBe("Settled");
  });

  it("shows coverage when only an NHIS number is present", () => {
    const cov = toInsuranceCoverage(
      {},
      { nhisNumber: "N9", total: 500, due: 500 },
    );
    expect(cov).toBeDefined();
    expect(cov?.covered).toBe(0);
  });
});

describe("toBill", () => {
  it("computes paid as total - residual and carries lines + coverage", () => {
    const bill = toBill(
      {
        id: 42,
        name: "INV/2026/0001",
        invoice_date: "2026-06-01",
        amount_total: 1200,
        amount_residual: 300,
        payment_state: "partial",
        claim_code: "CC-9",
      },
      [{ name: "Bed charge", quantity: 3, price_unit: 300, price_total: 900 }],
      { nhisNumber: "N1", visitId: "v1" },
    );
    expect(bill.total).toBe(1200);
    expect(bill.due).toBe(300);
    expect(bill.paid).toBe(900);
    expect(bill.currency).toBe("NPR");
    expect(bill.number).toBe("INV/2026/0001");
    expect(bill.visitId).toBe("v1");
    expect(bill.lines).toHaveLength(1);
    expect(bill.insurance?.patientPayable).toBe(300);
  });

  it("tolerates false-empties and missing lines", () => {
    const bill = toBill(
      { id: 1, name: false, amount_total: false, amount_residual: false },
      undefined,
    );
    expect(bill.total).toBe(0);
    expect(bill.due).toBe(0);
    expect(bill.paid).toBe(0);
    expect(bill.lines).toEqual([]);
    expect(bill.insurance).toBeUndefined();
  });
});

describe("paymentStateLabel", () => {
  it("speaks plain language", () => {
    expect(paymentStateLabel("paid")).toBe("Settled");
    expect(paymentStateLabel("not_paid")).toBe("Awaiting settlement");
    expect(paymentStateLabel(false)).toBe("—");
  });
});
