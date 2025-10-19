/**
 * Test data helpers for journalist records
 * Provides complete records that match the strict JOURNALIST_SCHEMA
 */

/**
 * Create a complete journalist record with all required fields
 * Allows overriding specific fields for testing
 */
export function createJournalistRecord(overrides: Record<string, string> = {}) {
  return {
    id: overrides.id || "row_2",
    Name: overrides.Name || "Test Journalist",
    Email: overrides.Email || "test@example.com",
    Phone: overrides.Phone || "+1-555-0000",
    Country: overrides.Country || "USA",
    City: overrides.City || "New York",
    Languages: overrides.Languages || "English",
    Specializations: overrides.Specializations || "Technology",
    Years_Experience: overrides.Years_Experience || "5",
    Outlet: overrides.Outlet || "Test Outlet",
    Time_Zone: overrides.Time_Zone || "GMT-5",
    LinkedIn_Profile: overrides.LinkedIn_Profile || "linkedin.com/in/test",
    Avatar: overrides.Avatar || "https://example.com/avatar.jpg",
    Daily_Rate_USD: overrides.Daily_Rate_USD || "300",
    Available_For_Live: overrides.Available_For_Live || "Yes",
    Last_Updated: overrides.Last_Updated || "2025-01-15",
  };
}

/**
 * Create multiple journalist records with sequential IDs
 */
export function createJournalistRecords(count: number, baseOverrides: Record<string, string> = {}) {
  return Array.from({ length: count }, (_, i) => {
    return createJournalistRecord({
      ...baseOverrides,
      id: `row_${i + 2}`,
      Name: baseOverrides.Name || `Journalist ${i + 1}`,
      Email: baseOverrides.Email || `journalist${i + 1}@example.com`,
    });
  });
}
