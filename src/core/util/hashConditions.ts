export default function hashConditions(difficulty: number) {
  return (hash: string) => hash.startsWith("0".repeat(difficulty));
}
