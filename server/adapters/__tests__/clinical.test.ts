import { toConditions, toVitals } from "../index";

/** Minimal FHIR R4 Observation/Condition fixtures, newest-first as the procedures feed them. */

describe("toVitals", () => {
  it("reads blood pressure from a single observation with systolic/diastolic components", () => {
    const obs = [
      {
        code: { text: "Blood pressure" },
        effectiveDateTime: "2026-06-20T09:00:00Z",
        component: [
          { code: { text: "Systolic blood pressure" }, valueQuantity: { value: 118, unit: "mmHg" } },
          { code: { text: "Diastolic blood pressure" }, valueQuantity: { value: 78, unit: "mmHg" } },
        ],
      },
      { code: { text: "Pulse" }, effectiveDateTime: "2026-06-20T09:00:00Z", valueQuantity: { value: 72, unit: "/min" } },
      { code: { text: "Temperature" }, effectiveDateTime: "2026-06-20T09:00:00Z", valueQuantity: { value: 36.8, unit: "Cel" } },
      // older BP must be ignored (newest kept)
      {
        code: { text: "Blood pressure" },
        effectiveDateTime: "2026-01-01T09:00:00Z",
        component: [
          { code: { text: "Systolic blood pressure" }, valueQuantity: { value: 200, unit: "mmHg" } },
          { code: { text: "Diastolic blood pressure" }, valueQuantity: { value: 120, unit: "mmHg" } },
        ],
      },
    ];
    const v = toVitals(obs);
    const bp = v.find((x) => x.key === "bp");
    expect(bp?.value).toBe("118/78");
    expect(bp?.unit).toBe("mmHg");
    expect(v.find((x) => x.key === "pulse")?.value).toBe("72");
    expect(v.find((x) => x.key === "temp")?.value).toBe("36.8");
    // canonical display order: bp before pulse before temp
    expect(v.map((x) => x.key)).toEqual(["bp", "pulse", "temp"]);
  });

  it("reads blood pressure from two separate systolic/diastolic observations", () => {
    const obs = [
      { code: { text: "Systolic blood pressure" }, effectiveDateTime: "2026-06-20T09:00:00Z", valueQuantity: { value: 120, unit: "mmHg" } },
      { code: { text: "Diastolic blood pressure" }, effectiveDateTime: "2026-06-20T09:00:00Z", valueQuantity: { value: 80, unit: "mmHg" } },
      { code: { coding: [{ display: "Weight (kg)" }] }, valueQuantity: { value: 70.4, unit: "kg" } },
    ];
    const v = toVitals(obs);
    expect(v.find((x) => x.key === "bp")?.value).toBe("120/80");
    expect(v.find((x) => x.key === "weight")?.value).toBe("70.4");
  });

  it("returns empty for no observations", () => {
    expect(toVitals([])).toEqual([]);
  });
});

describe("toConditions", () => {
  it("maps and sorts active problems before inactive/resolved", () => {
    const c = toConditions([
      {
        id: "r1",
        code: { text: "Hypertension" },
        clinicalStatus: { coding: [{ code: "resolved" }] },
        recordedDate: "2025-01-01",
      },
      {
        id: "r2",
        code: { coding: [{ display: "Type 2 diabetes mellitus" }] },
        clinicalStatus: { coding: [{ code: "active" }] },
        onsetDateTime: "2024-06-01",
      },
    ]);
    expect(c[0].name).toBe("Type 2 diabetes mellitus");
    expect(c[0].clinicalStatus).toBe("active");
    expect(c[1].name).toBe("Hypertension");
    expect(c[1].clinicalStatus).toBe("resolved");
  });
});
