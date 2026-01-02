import { describe, it, expect } from "vitest";
import { parseCSV } from "../../src/utils/csv-parser";

describe("Real CSV Data - Newline Bug Fix", () => {
  it("should correctly parse Titilayo Ogundele row with newline in Specialisations", async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS0mtuYo44HxBnYcnbUnB1COAZUajWSis70g10TomELXI2RIAKs5GqyMGgRsNYkNCF_o_m4fYQwRv96/pub?output=csv&gid=1920512850';
    const response = await fetch(csvUrl);
    const csvData = await response.text();

    const { headers, rows } = parseCSV(csvData);

    // Find Titilayo's row
    const titiRow = rows.find(row => row[0]?.includes('Titilayo'));

    // Verify the row was found
    expect(titiRow).toBeDefined();
    expect(titiRow![0]).toContain("Titilayo 'Titi' Ogundele");

    // Verify the Specialisations field contains both parts
    // (should be in column 2 based on typical CSV structure)
    const specialisations = titiRow![2];
    expect(specialisations).toContain('South China Sea');
    expect(specialisations).toContain('foreign media signaling');
    expect(specialisations).toContain('security cooperation');

    // Verify it's a single field with newline, not split across rows
    expect(specialisations).toMatch(/security cooperation,\s*\n\s*foreign media signaling/);

    console.log('✅ Titilayo row parsed correctly!');
    console.log('Name:', titiRow![0]);
    console.log('Specialisations:', specialisations);
  });
});
