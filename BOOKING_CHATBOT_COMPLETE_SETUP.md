# Booking and chatbot verification

The former generator instructions are obsolete. Those scripts bypassed the trusted bed-assignment workflow and could query real client chats. Their entry points now fail closed; they must not be used to seed any database.

Use the isolated synthetic test account and data checklist in [ADMIN_WORKSPACE_ROLES_SETUP.md](./ADMIN_WORKSPACE_ROLES_SETUP.md). Local automated checks are run with `npm test`. No migration is applied remotely by those commands.
