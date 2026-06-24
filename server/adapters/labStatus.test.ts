import { computeLabStatus, toVisit } from "./index";

describe("computeLabStatus", () => {
  const ref = { lowNormal: 11, hiNormal: 15, lowCritical: 7, hiCritical: 20 };

  it("flags ranges in the right order", () => {
    expect(computeLabStatus(13, ref)).toBe("normal");
    expect(computeLabStatus(10, ref)).toBe("low");
    expect(computeLabStatus(17, ref)).toBe("high");
    expect(computeLabStatus(5, ref)).toBe("critical-low");
    expect(computeLabStatus(25, ref)).toBe("critical-high");
  });

  it("is unknown without numbers or ranges", () => {
    expect(computeLabStatus(undefined, ref)).toBe("unknown");
    expect(computeLabStatus(13, {})).toBe("unknown");
  });
});

describe("toVisit", () => {
  it("parses display_name and maps type/status", () => {
    const v = toVisit({
      external_uuid: "u1",
      display_name: "John — 2026-06-01 — Insurance — NHIS",
      visit_type: "OPD",
      department: "General Medicine",
      manual_close_visit: true,
    });
    expect(v.id).toBe("u1");
    expect(v.type).toBe("OPD");
    expect(v.typeLabel).toBe("Outpatient");
    expect(v.date).toBe("2026-06-01");
    expect(v.status).toBe("closed");
  });
});
