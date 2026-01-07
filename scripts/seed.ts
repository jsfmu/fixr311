import "dotenv/config";
import { getReportsCollection } from "../src/lib/db";
import { buildTemplateDraft } from "../src/lib/draft";
import { DEFAULT_PHOTO, type IssueType, type Severity } from "../src/lib/types";
import { applyApproxLocation, toGeoPoint } from "../src/lib/validation";

type SeedInput = {
  issueType: IssueType;
  severity: Severity;
  note: string;
  approxLocation?: boolean;
  coords: { lat: number; lng: number };
  hoursAgo: number;
};

const seeds: SeedInput[] = [
  {
    issueType: "pothole",
    severity: "high",
    note: "Broadway & Grand — deep pothole in right lane.",
    coords: { lat: 37.8082, lng: -122.2668 },
    hoursAgo: 6,
  },
  {
    issueType: "illegal_dumping",
    severity: "medium",
    note: "Bags of trash by curb near 14th Ave.",
    coords: { lat: 37.7846, lng: -122.2401 },
    hoursAgo: 12,
  },
  {
    issueType: "broken_streetlight",
    severity: "medium",
    note: "Dim / flickering light along Park St bridge.",
    coords: { lat: 37.7709, lng: -122.2445 },
    hoursAgo: 20,
  },
  {
    issueType: "flooding",
    severity: "high",
    note: "Standing water covering bike lane after rain.",
    coords: { lat: 37.7951, lng: -122.2552 },
    hoursAgo: 26,
  },
  {
    issueType: "blocked_sidewalk",
    severity: "medium",
    note: "Scooter blocking curb cut near Webster.",
    coords: { lat: 37.7932, lng: -122.2731 },
    hoursAgo: 30,
  },
  {
    issueType: "other",
    severity: "low",
    note: "Graffiti on utility box by Lake Merritt.",
    coords: { lat: 37.8063, lng: -122.2557 },
    hoursAgo: 36,
  },
  {
    issueType: "pothole",
    severity: "medium",
    note: "Series of small potholes near Broadway/20th.",
    coords: { lat: 37.8126, lng: -122.2659 },
    hoursAgo: 40,
  },
  {
    issueType: "illegal_dumping",
    severity: "low",
    note: "Broken chair and boxes by bus stop.",
    coords: { lat: 37.7784, lng: -122.2379 },
    hoursAgo: 48,
  },
  {
    issueType: "broken_streetlight",
    severity: "high",
    note: "Light fully out on quiet block; safety concern.",
    coords: { lat: 37.7663, lng: -122.2498 },
    hoursAgo: 54,
  },
  {
    issueType: "blocked_sidewalk",
    severity: "high",
    note: "Construction materials blocking sidewalk.",
    coords: { lat: 37.7895, lng: -122.2715 },
    hoursAgo: 60,
  },
  {
    issueType: "flooding",
    severity: "medium",
    note: "Drain appears clogged; water pooling.",
    coords: { lat: 37.7984, lng: -122.2488 },
    hoursAgo: 72,
  },
  {
    issueType: "pothole",
    severity: "low",
    note: "Shallow dip near bike lane marking.",
    coords: { lat: 37.8019, lng: -122.2782 },
    hoursAgo: 80,
  },
  {
    issueType: "other",
    severity: "medium",
    note: "Damaged signpost leaning over sidewalk.",
    coords: { lat: 37.7837, lng: -122.2589 },
    hoursAgo: 88,
  },
  {
    issueType: "illegal_dumping",
    severity: "medium",
    note: "Pile of cardboard left after move-out.",
    coords: { lat: 37.7751, lng: -122.2344 },
    hoursAgo: 96,
    approxLocation: true,
  },
  {
    issueType: "broken_streetlight",
    severity: "low",
    note: "Light cycles on/off every few minutes.",
    coords: { lat: 37.8088, lng: -122.2471 },
    hoursAgo: 108,
  },
  {
    issueType: "blocked_sidewalk",
    severity: "medium",
    note: "Overgrown bushes narrowing sidewalk.",
    coords: { lat: 37.7742, lng: -122.2595 },
    hoursAgo: 120,
  },
  {
    issueType: "flooding",
    severity: "medium",
    note: "Recurring puddle near crosswalk.",
    coords: { lat: 37.7991, lng: -122.2661 },
    hoursAgo: 130,
  },
  {
    issueType: "other",
    severity: "low",
    note: "Loose utility cover rattles when cars pass.",
    coords: { lat: 37.7878, lng: -122.2468 },
    hoursAgo: 144,
  },
];

async function run() {
  const collection = await getReportsCollection();
  await collection.deleteMany({ descriptionUser: { $regex: "\\[seed\\]" } });

  const now = Date.now();
  const docs = seeds.map((seed) => {
    const createdAt = new Date(now - seed.hoursAgo * 60 * 60 * 1000);
    const descriptionUser = `[seed] ${seed.note}`;
    const descriptionFinal = buildTemplateDraft({
      issueType: seed.issueType,
      severity: seed.severity,
      descriptionUser: seed.note,
      locationText: "seeded pin",
      approxLocation: seed.approxLocation,
    });

    return {
      issueType: seed.issueType,
      severity: seed.severity,
      descriptionUser,
      descriptionFinal,
      location: toGeoPoint(
        applyApproxLocation(seed.coords, Boolean(seed.approxLocation)),
      ),
      approxLocation: Boolean(seed.approxLocation),
      photo: DEFAULT_PHOTO,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const result = await collection.insertMany(docs, { ordered: false });
  console.log(`Inserted ${result.insertedCount} seed reports.`);
}

run()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(() => {
    setTimeout(() => process.exit(), 100);
  });

