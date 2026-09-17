import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "intonix@intonixub.app";

/**
 * One-shot setup endpoint: creates (or re-syncs) the "Intonix" admin account
 * using the ADMIN_PASSWORD secret. Never returns the password.
 */
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const password = process.env["ADMIN_PASSWORD"];
        if (!password) {
          return Response.json({ ok: false, error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listError) return Response.json({ ok: false, error: listError.message }, { status: 500 });

        const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
        let userId = existing?.id;

        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
          });
        } else {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password,
            email_confirm: true,
            user_metadata: { display_name: "Intonix" },
          });
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          userId = created.user.id;
        }

        if (!userId) return Response.json({ ok: false, error: "no admin user id" }, { status: 500 });

        await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              email: ADMIN_EMAIL,
              display_name: "Intonix",
              tier: "lifetime" as const,
              status: "active" as const,
            },
            { onConflict: "id" },
          );

        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" as const }, { onConflict: "user_id,role" });

        return Response.json({ ok: true, username: "Intonix" });
      },
    },
  },
});
