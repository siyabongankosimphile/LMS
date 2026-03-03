import mongoose from "mongoose";
import "@/models/Module";
import "@/models/Lesson";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lms";
const dryRun = process.argv.includes("--dry-run");

function normalizeToIdString(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested = record._id ?? record.$oid ?? record.id;
    if (nested !== undefined) {
      return normalizeToIdString(nested);
    }
  }

  return null;
}

function isObjectIdValue(value: unknown): value is mongoose.Types.ObjectId {
  return value instanceof mongoose.Types.ObjectId;
}

async function run() {
  console.log(`Connecting to MongoDB (${MONGODB_URI})...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const ModuleModel = mongoose.models.CourseModule;
  const LessonModel = mongoose.models.Lesson;

  if (!ModuleModel || !LessonModel) {
    throw new Error("CourseModule/Lesson models are not registered.");
  }

  const modules = await ModuleModel.find({}, { _id: 1 }).lean();
  const validModuleIds = new Set(modules.map((moduleDoc) => String(moduleDoc._id)));

  const lessons = await LessonModel.find({}, { _id: 1, module: 1, title: 1, course: 1 }).lean();

  let invalidModuleRefCount = 0;
  let normalizedRefCount = 0;
  let alreadyValidCount = 0;

  const operations: Array<{
    updateOne: {
      filter: { _id: unknown };
      update: { $set: { module: mongoose.Types.ObjectId } };
    };
  }> = [];

  for (const lesson of lessons) {
    const rawModule = (lesson as { module?: unknown }).module;
    const normalizedModuleId = normalizeToIdString(rawModule);

    if (!normalizedModuleId || !mongoose.Types.ObjectId.isValid(normalizedModuleId)) {
      invalidModuleRefCount += 1;
      console.log(
        `Invalid module reference: lesson=${String((lesson as { _id: unknown })._id)} title=\"${String((lesson as { title?: unknown }).title || "") }\" module=${JSON.stringify(rawModule)}`
      );
      continue;
    }

    if (!validModuleIds.has(normalizedModuleId)) {
      invalidModuleRefCount += 1;
      console.log(
        `Missing module target: lesson=${String((lesson as { _id: unknown })._id)} title=\"${String((lesson as { title?: unknown }).title || "") }\" module=${normalizedModuleId}`
      );
      continue;
    }

    const currentlyObjectId = isObjectIdValue(rawModule);
    const currentIdString = currentlyObjectId ? rawModule.toString() : normalizeToIdString(rawModule);

    if (currentlyObjectId && currentIdString === normalizedModuleId) {
      alreadyValidCount += 1;
      continue;
    }

    normalizedRefCount += 1;
    operations.push({
      updateOne: {
        filter: { _id: (lesson as { _id: unknown })._id },
        update: { $set: { module: new mongoose.Types.ObjectId(normalizedModuleId) } },
      },
    });
  }

  console.log("\nRepair summary:");
  console.log(`- Lessons scanned: ${lessons.length}`);
  console.log(`- Already valid refs: ${alreadyValidCount}`);
  console.log(`- Fixable refs found: ${normalizedRefCount}`);
  console.log(`- Invalid/missing refs: ${invalidModuleRefCount}`);

  if (operations.length === 0) {
    console.log("No updates needed.");
    return;
  }

  if (dryRun) {
    console.log(`Dry run enabled. ${operations.length} lesson(s) would be updated.`);
    return;
  }

  const result = await LessonModel.bulkWrite(operations);
  console.log(`Applied updates: ${result.modifiedCount}`);
}

run()
  .catch((error) => {
    console.error("Repair script failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("Disconnected.");
  });
