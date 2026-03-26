import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SUPABASE_URL is auto-injected by Supabase runtime
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY");
  const ACCESS_TOKEN = Deno.env.get("SB_ACCESS_TOKEN");
  const PROJECT_ID = Deno.env.get("SB_PROJECT_ID");
  const ANON_KEY = Deno.env.get("SB_ANON_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ACCESS_TOKEN || !PROJECT_ID || !ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing required environment variables" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let schemaName = "";
  let prefix = "";
  let tables: any[] = [];
  const deployedFunctions: string[] = [];

  try {
    const body = await req.json();
    const { edge_functions, updated_html, sessionId, conversationId } = body;
    tables = body.tables || [];

    // Use public schema with prefixed table names for simplicity
    if (!sessionId || sessionId.length < 8) {
      throw new Error("Invalid sessionId");
    }
    prefix = `p${sessionId.replace(/-/g, "").slice(0, 8)}_`;
    schemaName = "public";

    // 1. Record the project
    const { data: project, error: projectErr } = await adminClient
      .from("generated_projects")
      .upsert(
        {
          session_id: sessionId,
          conversation_id: conversationId,
          schema_name: prefix,
          frontend_html: updated_html,
          backend_sql: tables.map((t: any) => t.sql).join("\n\n"),
          edge_functions: edge_functions,
          status: "deploying",
          supabase_url: SUPABASE_URL,
          supabase_anon_key: ANON_KEY,
        },
        { onConflict: "schema_name" }
      )
      .select("id")
      .single();

    if (projectErr) {
      console.error("Project record error:", projectErr);
      throw new Error("Failed to record project: " + projectErr.message);
    }

    const projectId = project.id;

    // 2. Execute table migrations in public schema with prefixed names
    for (const table of tables) {
      // Replace {{SCHEMA}}."tablename" with public."prefix_tablename"
      let sql = table.sql
        .replaceAll("{{SCHEMA}}.", "public.")
        .replace(/public\."([^"]+)"/g, (_: string, name: string) => `public."${prefix}${name}"`);
      const { error } = await adminClient.rpc("exec_sql", { query: sql });
      if (error) {
        console.error(`Table ${table.name} creation failed:`, error);
        throw new Error(`Failed to create table ${table.name}: ${error.message}`);
      }
    }

    // 2b. Grant access on new tables
    await adminClient.rpc("exec_sql", {
      query: `
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
      `,
    });

    // 4. Deploy edge functions via Management API
    for (const fn of edge_functions) {
      const fnName = `${schemaName}-${fn.name}`;
      const fnCode = fn.code
        .replaceAll("{{SCHEMA}}", schemaName)
        .replaceAll("{{SUPABASE_URL}}", SUPABASE_URL)
        .replaceAll("{{SUPABASE_ANON_KEY}}", ANON_KEY);

      // Encode function code as the body for the Management API
      const deployResp = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: fnName,
            name: fnName,
            body: btoa(fnCode),
            verify_jwt: false,
          }),
        }
      );

      if (!deployResp.ok) {
        const errText = await deployResp.text();
        // If function already exists, try updating it
        if (deployResp.status === 409) {
          const updateResp = await fetch(
            `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions/${fnName}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                body: btoa(fnCode),
                verify_jwt: false,
              }),
            }
          );
          if (!updateResp.ok) {
            console.error(`Function ${fnName} update failed:`, await updateResp.text());
            throw new Error(`Failed to update function ${fnName}`);
          }
        } else {
          console.error(`Function ${fnName} deploy failed:`, errText);
          throw new Error(`Failed to deploy function ${fnName}`);
        }
      }

      deployedFunctions.push(fnName);
    }

    // 5. Replace placeholders in updated_html
    // Replace table names in .from('tablename') calls with prefixed versions
    let finalHtml = updated_html
      .replaceAll("{{SUPABASE_URL}}", SUPABASE_URL)
      .replaceAll("{{SUPABASE_ANON_KEY}}", ANON_KEY);

    // Remove schema config since we're using public schema now
    finalHtml = finalHtml.replaceAll("{{SCHEMA}}", "public");

    // Prefix table names in sb.from('tablename') calls
    for (const table of tables) {
      const originalName = table.name;
      finalHtml = finalHtml.replaceAll(
        `.from('${originalName}')`,
        `.from('${prefix}${originalName}')`
      );
    }

    // Remove db.schema option since we use public schema
    finalHtml = finalHtml.replace(
      /db:\s*\{\s*schema:\s*'[^']*'\s*\}\s*,?/g,
      ""
    );

    // Ensure auth options for iframe compatibility
    finalHtml = finalHtml.replace(
      /supabase\.createClient\(([^)]+)\)/g,
      (match: string) => {
        if (match.includes("persistSession")) return match;
        return match.replace(/\)$/, `,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})`)
      }
    );

    // Replace function URLs: edge functions are at /functions/v1/{fnName}
    for (const fn of edge_functions) {
      const originalName = fn.name;
      const deployedName = `${schemaName}-${fn.name}`;
      finalHtml = finalHtml.replaceAll(
        `{{FUNCTION_URL_${originalName.toUpperCase().replace(/-/g, "_")}}}`,
        `${SUPABASE_URL}/functions/v1/${deployedName}`
      );
      // Also replace generic function URL pattern
      finalHtml = finalHtml.replaceAll(
        `/functions/v1/${originalName}`,
        `/functions/v1/${deployedName}`
      );
    }

    // 6. Update project status
    await adminClient
      .from("generated_projects")
      .update({
        status: "deployed",
        frontend_html: finalHtml,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({
        success: true,
        finalHtml,
        schemaName,
        functions: deployedFunctions,
        supabaseUrl: SUPABASE_URL,
        anonKey: ANON_KEY,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("deploy-backend error:", e);

    // Rollback: drop prefixed tables if created
    if (schemaName && tables) {
      try {
        for (const table of tables) {
          await adminClient.rpc("exec_sql", {
            query: `DROP TABLE IF EXISTS public."${prefix}${table.name}" CASCADE;`,
          });
        }
      } catch (rollbackErr) {
        console.error("Rollback table drop failed:", rollbackErr);
      }
    }

    // Rollback: delete deployed functions
    for (const fnName of deployedFunctions) {
      try {
        await fetch(
          `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions/${fnName}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
          }
        );
      } catch (delErr) {
        console.error(`Rollback function delete ${fnName} failed:`, delErr);
      }
    }

    // Update project status to failed
    if (schemaName) {
      try {
        await adminClient
          .from("generated_projects")
          .update({
            status: "failed",
            error_message: e instanceof Error ? e.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("schema_name", prefix);
      } catch (_) {
        /* ignore */
      }
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Ошибка деплоя бэкенда",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
