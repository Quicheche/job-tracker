export type Recommendation = "proceed" | "maybe" | "skip";

export interface EvalResult {
  recommendation: Recommendation;
  reason: string;
  score: number;
}

const STRONG_KEYWORDS = [
  "backend", "back-end", "back end",
  "distributed systems", "distributed system",
  "database", "databases",
  "infrastructure", "platform",
  "storage", "cloud",
  "microservices", "microservice",
  "api", "apis",
  "data pipeline", "data pipelines",
  "server", "scalability", "reliability",
  "kafka", "redis", "postgres", "mysql", "cassandra",
  "kubernetes", "docker", "aws", "gcp", "azure",
];

const NEGATIVE_KEYWORDS = [
  "frontend", "front-end", "front end",
  "ui engineer", "ui developer",
  "mobile", "ios", "android",
  "embedded", "firmware", "hardware",
  "ml research", "machine learning research",
  "data scientist", "data science",
  "computer vision", "nlp research",
];

export function evaluateJob(title: string, description: string): EvalResult {
  const text = `${title} ${description}`.toLowerCase();

  const strongHits = STRONG_KEYWORDS.filter((k) => text.includes(k));
  const negativeHits = NEGATIVE_KEYWORDS.filter((k) => text.includes(k));

  const score = strongHits.length - negativeHits.length * 2;

  let recommendation: Recommendation;
  if (negativeHits.length > 0 && strongHits.length <= negativeHits.length) {
    recommendation = "skip";
  } else if (strongHits.length >= 2 && negativeHits.length === 0) {
    recommendation = "proceed";
  } else {
    recommendation = "maybe";
  }

  const parts: string[] = [];
  if (strongHits.length > 0) parts.push(`matched: ${strongHits.slice(0, 4).join(", ")}`);
  if (negativeHits.length > 0) parts.push(`negative: ${negativeHits.slice(0, 3).join(", ")}`);
  const reason = parts.length > 0 ? parts.join(" · ") : "no strong signals found";

  return { recommendation, reason, score };
}
