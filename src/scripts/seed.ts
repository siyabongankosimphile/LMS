/**
 * Seed script - creates the first admin user.
 * Usage: npx tsx src/scripts/seed.ts
 * Or: node -r ts-node/register src/scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lms";

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  // Ensure model is registered
  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: String,
      role: { type: String, default: "STUDENT" },
      status: { type: String, default: "ACTIVE" },
      provider: { type: String, default: "credentials" },
    },
    { timestamps: true }
  );

  const User =
    mongoose.models.User || mongoose.model("User", UserSchema);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@kayiseit.co.za";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
  const adminName = process.env.ADMIN_NAME || "Kayise IT Admin";

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`Admin user already exists: ${adminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      provider: "credentials",
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
