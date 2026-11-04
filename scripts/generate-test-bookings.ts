console.error(
  "This legacy data generator is disabled because it bypassed trusted bed assignment and booking validation. Use the synthetic-data checklist in ADMIN_WORKSPACE_ROLES_SETUP.md with an isolated test project."
);
process.exitCode = 1;
