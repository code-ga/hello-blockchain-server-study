export default function hashConditions(hash: string) {
  return hash.startsWith("0".repeat(1)) && hash.endsWith("0".repeat(1));
}
