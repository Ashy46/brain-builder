export interface JsonNode {
  id: string;
  label: string;
  children?: JsonNode[];
}
