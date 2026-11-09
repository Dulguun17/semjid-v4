console.error(
  "This legacy data generator is disabled. It bypassed current booking, bed-allocation, and payment rules. Use the synthetic-data checklist in ADMIN_WORKSPACE_ROLES_SETUP.md with an isolated test project."
);
process.exitCode = 1;
