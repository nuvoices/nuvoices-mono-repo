import type {
  AirtableRecord,
  AirtableListResponse,
  AirtableTableSchema,
  Env,
} from "../types";

/**
 * Airtable API base URL
 */
const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

/**
 * Airtable API client service
 */
export class AirtableService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(
    private env: Env,
    private tableName: string = env.TABLE_NAME
  ) {
    this.baseUrl = `${AIRTABLE_API_BASE}/${env.BASE_ID}`;
    this.headers = {
      Authorization: `Bearer ${env.ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Fetch all records from Airtable table with pagination
   */
  async getAllRecords(): Promise<AirtableRecord[]> {
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(`${this.baseUrl}/${encodeURIComponent(this.tableName)}`);
      if (offset) {
        url.searchParams.set("offset", offset);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Airtable API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: AirtableListResponse = await response.json();
      allRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    return allRecords;
  }

  /**
   * Fetch a single record by Airtable ID
   */
  async getRecordById(recordId: string): Promise<AirtableRecord> {
    const url = `${this.baseUrl}/${encodeURIComponent(this.tableName)}/${encodeURIComponent(recordId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Record not found: ${recordId}`);
      }
      const errorText = await response.text();
      throw new Error(
        `Airtable API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * Get table schema (field definitions)
   */
  async getTableSchema(): Promise<AirtableTableSchema> {
    // Note: Airtable Metadata API requires a different endpoint
    const url = `https://api.airtable.com/v0/meta/bases/${this.env.BASE_ID}/tables`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Airtable Metadata API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const table = data.tables.find(
      (t: AirtableTableSchema) => t.name === this.tableName
    );

    if (!table) {
      throw new Error(`Table not found: ${this.tableName}`);
    }

    return table;
  }

  /**
   * Infer table schema from existing records (fallback if Metadata API is unavailable)
   */
  async inferSchemaFromRecords(records: AirtableRecord[]): Promise<{
    fields: Array<{ name: string; type: string }>;
  }> {
    if (records.length === 0) {
      return { fields: [] };
    }

    // Collect all unique field names from all records
    const fieldMap = new Map<string, Set<string>>();

    for (const record of records) {
      for (const [fieldName, value] of Object.entries(record.fields)) {
        if (!fieldMap.has(fieldName)) {
          fieldMap.set(fieldName, new Set());
        }

        // Infer type from value
        const types = fieldMap.get(fieldName)!;
        if (typeof value === "number") {
          types.add("number");
        } else if (typeof value === "boolean") {
          types.add("checkbox");
        } else if (Array.isArray(value)) {
          types.add("multipleSelects");
        } else if (typeof value === "string") {
          // Check if it looks like a date
          if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            types.add("dateTime");
          } else {
            types.add("singleLineText");
          }
        } else if (typeof value === "object" && value !== null) {
          types.add("multipleAttachments");
        }
      }
    }

    // Convert to field definitions
    const fields = Array.from(fieldMap.entries()).map(([name, types]) => {
      // Pick the most specific type
      let type = "singleLineText"; // default
      if (types.has("number")) type = "number";
      if (types.has("checkbox")) type = "checkbox";
      if (types.has("dateTime")) type = "dateTime";
      if (types.has("multipleSelects")) type = "multipleSelects";
      if (types.has("multipleAttachments")) type = "multipleAttachments";

      return { name, type };
    });

    return { fields };
  }
}
