console.error(
  "This legacy data generator is disabled because it could attach test replies to real customer chats. Use a synthetic, isolated test project for staff-message checks."
);
process.exitCode = 1;
