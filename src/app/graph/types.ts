export interface JsonNode {
  id: string;
  label: string;
  position?: { x: number; y: number };
  children?: JsonNode[];
}
