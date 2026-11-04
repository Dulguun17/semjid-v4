# Booking and chat test guide

The legacy data-generation commands in this guide are retired. They bypassed current booking/bed validation and could attach a test reply to a real customer conversation. Their script entry points now fail closed and do not connect to Supabase.

Use the isolated-test-project instructions and synthetic end-to-end checklist in [ADMIN_WORKSPACE_ROLES_SETUP.md](./ADMIN_WORKSPACE_ROLES_SETUP.md). Do not use production, real customer data, or a service-role key as a signed-in test user.

Local checks use `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Customer and staff email notices can be tested with the in-memory capture transport; it sends no messages externally.
