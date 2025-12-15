import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default roles
const roles = [
  { name: "super_admin", description: "Full system access with all permissions" },
  { name: "admin", description: "Administrative access with limited permissions" },
  { name: "therapist", description: "Therapist role for therapy-related operations" },
  { name: "patient", description: "Patient/User role for booking and sessions" },
];

// All permissions grouped by module
const permissionsByModule = {
  users: [
    { name: "users:read", description: "View users" },
    { name: "users:create", description: "Create users" },
    { name: "users:update", description: "Update users" },
    { name: "users:delete", description: "Delete users" },
  ],
  therapists: [
    { name: "therapists:read", description: "View therapists" },
    { name: "therapists:create", description: "Create therapists" },
    { name: "therapists:update", description: "Update therapists" },
    { name: "therapists:delete", description: "Delete therapists" },
    { name: "therapists:approve", description: "Approve/reject therapists" },
  ],
  bookings: [
    { name: "bookings:read", description: "View bookings" },
    { name: "bookings:create", description: "Create bookings" },
    { name: "bookings:update", description: "Update bookings" },
    { name: "bookings:delete", description: "Delete bookings" },
  ],
  sessions: [
    { name: "sessions:read", description: "View sessions" },
    { name: "sessions:create", description: "Create sessions" },
    { name: "sessions:update", description: "Update sessions" },
  ],
  payments: [
    { name: "payments:read", description: "View payments" },
    { name: "payments:create", description: "Create payments" },
    { name: "payments:refund", description: "Process refunds" },
  ],
  conversations: [
    { name: "conversations:read", description: "View conversations" },
    { name: "conversations:create", description: "Create conversations" },
    { name: "messages:read", description: "View messages" },
    { name: "messages:create", description: "Send messages" },
  ],
  questionnaires: [
    { name: "questionnaires:read", description: "View questionnaires" },
    { name: "questionnaires:create", description: "Create questionnaires" },
    { name: "questionnaires:update", description: "Update questionnaires" },
    { name: "questionnaires:delete", description: "Delete questionnaires" },
    { name: "answers:read", description: "View answers" },
    { name: "answers:create", description: "Submit answers" },
  ],
  specialties: [
    { name: "specialties:read", description: "View specialties" },
    { name: "specialties:create", description: "Create specialties" },
    { name: "specialties:update", description: "Update specialties" },
    { name: "specialties:delete", description: "Delete specialties" },
  ],
  subscriptions: [
    { name: "subscriptions:read", description: "View subscriptions" },
    { name: "subscriptions:create", description: "Create subscriptions" },
    { name: "subscriptions:update", description: "Update subscriptions" },
    { name: "subscriptions:cancel", description: "Cancel subscriptions" },
  ],
  admin: [
    { name: "admin:dashboard", description: "Access admin dashboard" },
    { name: "admin:reports", description: "View reports" },
    { name: "admin:settings", description: "Manage settings" },
    { name: "admin:audit_logs", description: "View audit logs" },
  ],
  uploads: [
    { name: "uploads:create", description: "Upload files" },
    { name: "uploads:delete", description: "Delete files" },
  ],
  notifications: [
    { name: "notifications:read", description: "View notifications" },
    { name: "notifications:create", description: "Create notifications" },
    { name: "notifications:templates", description: "Manage notification templates" },
  ],
  payouts: [
    { name: "payouts:read", description: "View payouts" },
    { name: "payouts:create", description: "Create payouts" },
    { name: "payouts:process", description: "Process payouts" },
  ],
};

// Role-permission mapping
const rolePermissions = {
  super_admin: "all", // Gets all permissions
  admin: [
    "users:read", "users:update",
    "therapists:read", "therapists:update", "therapists:approve",
    "bookings:read", "bookings:update",
    "sessions:read",
    "payments:read", "payments:refund",
    "conversations:read",
    "questionnaires:read", "questionnaires:create", "questionnaires:update",
    "specialties:read", "specialties:create", "specialties:update",
    "subscriptions:read",
    "admin:dashboard", "admin:reports",
    "notifications:read", "notifications:create", "notifications:templates",
    "payouts:read", "payouts:create", "payouts:process",
  ],
  therapist: [
    "bookings:read",
    "sessions:read", "sessions:update",
    "conversations:read", "conversations:create",
    "messages:read", "messages:create",
    "questionnaires:read",
    "answers:read",
    "specialties:read",
    "subscriptions:read",
    "uploads:create",
    "notifications:read",
    "payouts:read",
  ],
  patient: [
    "therapists:read",
    "bookings:read", "bookings:create", "bookings:update",
    "sessions:read",
    "payments:read", "payments:create",
    "conversations:read", "conversations:create",
    "messages:read", "messages:create",
    "questionnaires:read",
    "answers:read", "answers:create",
    "specialties:read",
    "subscriptions:read", "subscriptions:create", "subscriptions:cancel",
    "uploads:create",
    "notifications:read",
  ],
};

// Default super admin credentials
const superAdmin = {
  email: "admin@nurozh.com",
  password: "Admin@123456",
  first_name: "Super",
  last_name: "Admin",
  role: "super_admin",
};

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // 1. Create roles
    console.log("📋 Creating roles...");
    const createdRoles = {};
    for (const role of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (existingRole) {
        createdRoles[role.name] = existingRole;
        console.log(`  ✓ Role "${role.name}" already exists`);
      } else {
        const newRole = await prisma.role.create({
          data: {
            name: role.name,
            description: role.description,
            is_active: true,
          },
        });
        createdRoles[role.name] = newRole;
        console.log(`  ✓ Created role "${role.name}"`);
      }
    }

    // 2. Create permissions
    console.log("\n🔐 Creating permissions...");
    const createdPermissions = {};
    for (const [module, permissions] of Object.entries(permissionsByModule)) {
      for (const permission of permissions) {
        const existingPermission = await prisma.permission.findUnique({
          where: { name: permission.name },
        });

        if (existingPermission) {
          createdPermissions[permission.name] = existingPermission;
        } else {
          const newPermission = await prisma.permission.create({
            data: {
              name: permission.name,
              description: permission.description,
              module,
            },
          });
          createdPermissions[permission.name] = newPermission;
        }
      }
      console.log(`  ✓ Created ${permissions.length} permissions for module "${module}"`);
    }

    // 3. Assign permissions to roles
    console.log("\n🔗 Assigning permissions to roles...");
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      const role = createdRoles[roleName];
      if (!role) continue;

      // Clear existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { role_id: role.id },
      });

      // Get permissions to assign
      let permissionNames;
      if (permissions === "all") {
        permissionNames = Object.keys(createdPermissions);
      } else {
        permissionNames = permissions;
      }

      // Create role permissions
      for (const permName of permissionNames) {
        const permission = createdPermissions[permName];
        if (permission) {
          await prisma.rolePermission.create({
            data: {
              role_id: role.id,
              permission_id: permission.id,
            },
          });
        }
      }
      console.log(`  ✓ Assigned ${permissionNames.length} permissions to role "${roleName}"`);
    }

    // 4. Create super admin
    console.log("\n👤 Creating super admin...");
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: superAdmin.email },
    });

    if (existingAdmin) {
      console.log(`  ✓ Super admin "${superAdmin.email}" already exists`);
    } else {
      const passwordHash = await bcrypt.hash(superAdmin.password, 12);
      await prisma.admin.create({
        data: {
          email: superAdmin.email,
          password_hash: passwordHash,
          first_name: superAdmin.first_name,
          last_name: superAdmin.last_name,
          role: superAdmin.role,
          is_active: true,
        },
      });
      console.log(`  ✓ Created super admin "${superAdmin.email}"`);
      console.log(`  📧 Email: ${superAdmin.email}`);
      console.log(`  🔑 Password: ${superAdmin.password}`);
    }

    // 5. Create some default specialties
    console.log("\n🏥 Creating default specialties...");
    const specialties = [
      { name: { en: "Anxiety", ar: "القلق", ku: "نیگەرانی" }, description: { en: "Anxiety disorders and related conditions" } },
      { name: { en: "Depression", ar: "الاكتئاب", ku: "خەمۆکی" }, description: { en: "Depression and mood disorders" } },
      { name: { en: "Stress Management", ar: "إدارة الضغوط", ku: "بەڕێوەبردنی فشار" }, description: { en: "Stress management and coping strategies" } },
      { name: { en: "Relationship Issues", ar: "مشاكل العلاقات", ku: "کێشەکانی پەیوەندی" }, description: { en: "Relationship and family counseling" } },
      { name: { en: "Trauma & PTSD", ar: "الصدمة واضطراب ما بعد الصدمة", ku: "ترۆما و PTSD" }, description: { en: "Trauma recovery and PTSD treatment" } },
      { name: { en: "Self-esteem", ar: "تقدير الذات", ku: "خودباوەڕی" }, description: { en: "Self-esteem and confidence building" } },
      { name: { en: "Addiction", ar: "الإدمان", ku: "ئاڵوودەبوون" }, description: { en: "Addiction recovery and support" } },
      { name: { en: "Grief & Loss", ar: "الحزن والفقدان", ku: "خەمباری و لەدەستدان" }, description: { en: "Grief counseling and bereavement support" } },
    ];

    for (let i = 0; i < specialties.length; i++) {
      const specialty = specialties[i];
      const existing = await prisma.specialty.findFirst({
        where: {
          name: {
            path: ["en"],
            equals: specialty.name.en,
          },
        },
      });

      if (!existing) {
        await prisma.specialty.create({
          data: {
            name: specialty.name,
            description: specialty.description,
            is_active: true,
            display_order: i + 1,
          },
        });
      }
    }
    console.log(`  ✓ Created ${specialties.length} default specialties`);

    console.log("\n✅ Database seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
