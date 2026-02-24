import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type ParsedCsv = string[][];

function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field.trim());
      const hasValue = row.some((item) => item.length > 0);
      if (hasValue) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    const hasValue = row.some((item) => item.length > 0);
    if (hasValue) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toOptionalString(value: string | undefined) {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV imports are currently supported" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsedRows = parseCsv(text);

    if (parsedRows.length < 2) {
      return NextResponse.json(
        { error: "CSV must include a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = parsedRows[0].map(normalizeHeader);
    const dataRows = parsedRows.slice(1);

    const headerIndex = (name: string) => headers.indexOf(normalizeHeader(name));

    const idxStudentName = headerIndex("Student Name");
    const idxSurname = headerIndex("Surname");
    const idxEmail = headerIndex("Email");
    const idxCityTown = headerIndex("City/Town");
    const idxCountry = headerIndex("Country");
    const idxGender = headerIndex("Gender");
    const idxRace = headerIndex("Race");
    const idxEmploymentStatus = headerIndex("Employment Status");
    const idxHighestQualification = headerIndex("Highest Qualification");
    const idxProvince = headerIndex("Province");
    const idxAge = headerIndex("Age");
    const idxPhone = headerIndex("Phone");
    const idxSaId = headerIndex("SA ID");

    if (idxStudentName < 0 || idxEmail < 0) {
      return NextResponse.json(
        { error: "CSV must contain at least Student Name and Email columns" },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const tempPasswordHash = await bcrypt.hash(`import-${Date.now()}-${Math.random()}`, 10);

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const row = dataRows[rowIndex];

      const studentName = toOptionalString(row[idxStudentName]);
      const surname = idxSurname >= 0 ? toOptionalString(row[idxSurname]) : undefined;
      const email = toOptionalString(row[idxEmail])?.toLowerCase();
      const cityTown = idxCityTown >= 0 ? toOptionalString(row[idxCityTown]) : undefined;
      const country = idxCountry >= 0 ? toOptionalString(row[idxCountry]) : undefined;
      const gender = idxGender >= 0 ? toOptionalString(row[idxGender]) : undefined;
      const race = idxRace >= 0 ? toOptionalString(row[idxRace]) : undefined;
      const employmentStatus =
        idxEmploymentStatus >= 0 ? toOptionalString(row[idxEmploymentStatus]) : undefined;
      const highestQualification =
        idxHighestQualification >= 0 ? toOptionalString(row[idxHighestQualification]) : undefined;
      const province = idxProvince >= 0 ? toOptionalString(row[idxProvince]) : undefined;
      const age = idxAge >= 0 ? toOptionalNumber(row[idxAge]) : undefined;
      const phone = idxPhone >= 0 ? toOptionalString(row[idxPhone]) : undefined;
      const saId = idxSaId >= 0 ? toOptionalString(row[idxSaId]) : undefined;

      if (!email || !studentName) {
        skipped += 1;
        errors.push(`Row ${rowIndex + 2}: missing Student Name or Email`);
        continue;
      }

      const existing = await User.findOne({
        $or: saId ? [{ email }, { saId }] : [{ email }],
      });

      if (existing) {
        if (existing.role !== "STUDENT") {
          skipped += 1;
          errors.push(`Row ${rowIndex + 2}: matched a non-student account (${email})`);
          continue;
        }

        existing.name = studentName;
        existing.surname = surname;
        existing.cityTown = cityTown;
        existing.country = country;
        existing.gender = gender;
        existing.race = race;
        existing.employmentStatus = employmentStatus;
        existing.highestQualification = highestQualification;
        existing.province = province;
        existing.age = age;
        existing.phone = phone;
        existing.saId = saId;
        existing.status = existing.status || "ACTIVE";

        await existing.save();
        updated += 1;
        continue;
      }

      await User.create({
        name: studentName,
        surname,
        email,
        cityTown,
        country,
        gender,
        race,
        employmentStatus,
        highestQualification,
        province,
        age,
        phone,
        saId,
        role: "STUDENT",
        status: "ACTIVE",
        provider: "credentials",
        password: tempPasswordHash,
      });

      created += 1;
    }

    return NextResponse.json({
      message: "Import completed",
      created,
      updated,
      skipped,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Admin users import error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Import failed due to duplicate unique fields (email or ID number)" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
