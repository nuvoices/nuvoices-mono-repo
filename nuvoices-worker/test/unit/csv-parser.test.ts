import { describe, it, expect } from "vitest";
import {
  parseCSV,
  inferSchemaFromCSV,
  csvToRecords,
} from "../../src/utils/csv-parser";

describe("CSV Parser Utils", () => {
  describe("parseCSV", () => {
    it("should parse simple CSV data", () => {
      const csvData = `Name,Email,Age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25`;

      const result = parseCSV(csvData);

      expect(result.headers).toEqual(["Name", "Email", "Age"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["John Doe", "john@example.com", "30"]);
      expect(result.rows[1]).toEqual(["Jane Smith", "jane@example.com", "25"]);
    });

    it("should handle quoted fields with commas", () => {
      const csvData = `Name,Languages,Country
Sarah Chen,"English, Mandarin, Cantonese",China
Raj Patel,"English, Hindi, Marathi",India`;

      const result = parseCSV(csvData);

      expect(result.headers).toEqual(["Name", "Languages", "Country"]);
      expect(result.rows[0]).toEqual([
        "Sarah Chen",
        "English, Mandarin, Cantonese",
        "China",
      ]);
      expect(result.rows[1]).toEqual([
        "Raj Patel",
        "English, Hindi, Marathi",
        "India",
      ]);
    });

    it("should handle empty lines and trim whitespace", () => {
      const csvData = `Name,Email

John Doe,john@example.com

Jane Smith,jane@example.com
`;

      const result = parseCSV(csvData);

      expect(result.headers).toEqual(["Name", "Email"]);
      expect(result.rows).toHaveLength(2);
    });

    it("should handle fields with spaces", () => {
      const csvData = `First Name,Last Name,Email
  John  ,  Doe  ,john@example.com`;

      const result = parseCSV(csvData);

      expect(result.rows[0]).toEqual(["John", "Doe", "john@example.com"]);
    });

    it("should throw error for empty CSV", () => {
      expect(() => parseCSV("")).toThrow("CSV is empty");
      expect(() => parseCSV("   \n   \n  ")).toThrow("CSV is empty");
    });

    it("should handle single row (headers only)", () => {
      const csvData = `Name,Email,Age`;

      const result = parseCSV(csvData);

      expect(result.headers).toEqual(["Name", "Email", "Age"]);
      expect(result.rows).toHaveLength(0);
    });

    it("should handle complex real-world CSV with many columns", () => {
      const csvData = `Name,Email,Phone,Languages,Years_Experience
Sarah Chen,s.chen@email.com,+86-138-1234-5678,"English, Mandarin",12
Raj Patel,raj.patel@email.com,+91-98765-43210,"English, Hindi",8`;

      const result = parseCSV(csvData);

      expect(result.headers).toEqual([
        "Name",
        "Email",
        "Phone",
        "Languages",
        "Years_Experience",
      ]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0][3]).toBe("English, Mandarin");
    });
  });

  describe("inferSchemaFromCSV", () => {
    it("should infer TEXT type for string values", () => {
      const headers = ["Name", "Email", "Country"];
      const rows = [
        ["John Doe", "john@example.com", "USA"],
        ["Jane Smith", "jane@example.com", "Canada"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema).toEqual([
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Country", type: "TEXT" },
      ]);
    });

    it("should infer INTEGER type for integer values", () => {
      const headers = ["Name", "Age", "Years_Experience"];
      const rows = [
        ["John", "30", "5"],
        ["Jane", "25", "3"],
        ["Bob", "45", "20"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[1]).toEqual({ name: "Age", type: "INTEGER" });
      expect(schema[2]).toEqual({ name: "Years_Experience", type: "INTEGER" });
    });

    it("should infer REAL type for decimal values", () => {
      const headers = ["Name", "Rating", "Daily_Rate"];
      const rows = [
        ["John", "4.5", "450.00"],
        ["Jane", "4.8", "525.50"],
        ["Bob", "3.9", "375.25"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[1]).toEqual({ name: "Rating", type: "REAL" });
      expect(schema[2]).toEqual({ name: "Daily_Rate", type: "REAL" });
    });

    it("should infer TEXT when mixed types present", () => {
      const headers = ["Name", "Value"];
      const rows = [
        ["Item1", "100"],
        ["Item2", "text value"],
        ["Item3", "200"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[1]).toEqual({ name: "Value", type: "TEXT" });
    });

    it("should infer REAL over INTEGER when both present", () => {
      const headers = ["Name", "Value"];
      const rows = [
        ["Item1", "100"],
        ["Item2", "200.5"],
        ["Item3", "300"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[1]).toEqual({ name: "Value", type: "REAL" });
    });

    it("should handle negative numbers", () => {
      const headers = ["Temperature", "Balance"];
      const rows = [
        ["-5", "-100.50"],
        ["10", "50.25"],
        ["-15", "-200.75"],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[0]).toEqual({ name: "Temperature", type: "INTEGER" });
      expect(schema[1]).toEqual({ name: "Balance", type: "REAL" });
    });

    it("should default to TEXT for empty columns", () => {
      const headers = ["Name", "Empty"];
      const rows = [
        ["John", ""],
        ["Jane", ""],
      ];

      const schema = inferSchemaFromCSV(headers, rows);

      expect(schema[1]).toEqual({ name: "Empty", type: "TEXT" });
    });

    it("should sample only first 10 rows for large datasets", () => {
      const headers = ["Value"];
      const rows = Array.from({ length: 20 }, (_, i) => [
        i < 10 ? String(i) : "text",
      ]);

      const schema = inferSchemaFromCSV(headers, rows);

      // First 10 rows are integers, so should infer INTEGER
      expect(schema[0]).toEqual({ name: "Value", type: "INTEGER" });
    });
  });

  describe("csvToRecords", () => {
    it("should convert CSV rows to record objects", () => {
      const headers = ["Name", "Email", "Age"];
      const rows = [
        ["John Doe", "john@example.com", "30"],
        ["Jane Smith", "jane@example.com", "25"],
      ];

      const records = csvToRecords(headers, rows);

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual({
        id: "row_2",
        Name: "John Doe",
        Email: "john@example.com",
        Age: "30",
      });
      expect(records[1]).toEqual({
        id: "row_3",
        Name: "Jane Smith",
        Email: "jane@example.com",
        Age: "25",
      });
    });

    it("should generate sequential row IDs starting from row_2", () => {
      const headers = ["Name"];
      const rows = [["First"], ["Second"], ["Third"]];

      const records = csvToRecords(headers, rows);

      expect(records[0].id).toBe("row_2");
      expect(records[1].id).toBe("row_3");
      expect(records[2].id).toBe("row_4");
    });

    it("should skip empty or whitespace-only values", () => {
      const headers = ["Name", "Email", "Phone"];
      const rows = [
        ["John Doe", "john@example.com", ""],
        ["Jane Smith", "  ", "+1-555-1234"],
      ];

      const records = csvToRecords(headers, rows);

      expect(records[0]).toEqual({
        id: "row_2",
        Name: "John Doe",
        Email: "john@example.com",
      });
      expect(records[0]).not.toHaveProperty("Phone");

      expect(records[1]).toEqual({
        id: "row_3",
        Name: "Jane Smith",
        Phone: "+1-555-1234",
      });
      expect(records[1]).not.toHaveProperty("Email");
    });

    it("should handle records with all fields empty", () => {
      const headers = ["Name", "Email"];
      const rows = [["", ""]];

      const records = csvToRecords(headers, rows);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual({ id: "row_2" });
    });

    it("should preserve field names as-is from headers", () => {
      const headers = ["First Name", "Email Address", "Phone Number"];
      const rows = [["John", "john@example.com", "555-1234"]];

      const records = csvToRecords(headers, rows);

      expect(records[0]).toHaveProperty("First Name");
      expect(records[0]).toHaveProperty("Email Address");
      expect(records[0]).toHaveProperty("Phone Number");
    });

    it("should handle empty row array", () => {
      const headers = ["Name", "Email"];
      const rows: string[][] = [];

      const records = csvToRecords(headers, rows);

      expect(records).toEqual([]);
    });

    it("should handle complex real-world data", () => {
      const headers = ["Name", "Languages", "Years_Experience"];
      const rows = [
        ["Sarah Chen", "English, Mandarin, Cantonese", "12"],
        ["Raj Patel", "English, Hindi, Marathi", "8"],
      ];

      const records = csvToRecords(headers, rows);

      expect(records).toHaveLength(2);
      expect(records[0].id).toBe("row_2");
      expect(records[0].Languages).toBe("English, Mandarin, Cantonese");
      expect(records[1].Years_Experience).toBe("8");
    });
  });

  describe("Full CSV parsing workflow", () => {
    it("should parse, infer schema, and convert to records", () => {
      const csvData = `Name,Email,Age,Rating
John Doe,john@example.com,30,4.5
Jane Smith,jane@example.com,25,4.8
Bob Wilson,bob@example.com,35,4.2`;

      const { headers, rows } = parseCSV(csvData);
      const schema = inferSchemaFromCSV(headers, rows);
      const records = csvToRecords(headers, rows);

      expect(headers).toEqual(["Name", "Email", "Age", "Rating"]);
      expect(schema).toEqual([
        { name: "Name", type: "TEXT" },
        { name: "Email", type: "TEXT" },
        { name: "Age", type: "INTEGER" },
        { name: "Rating", type: "REAL" },
      ]);
      expect(records).toHaveLength(3);
      expect(records[0].id).toBe("row_2");
      expect(records[2].id).toBe("row_4");
    });
  });
});
