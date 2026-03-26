import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FormField {
  name: string;
  type: string;
}

interface ParsedForm {
  id: string;
  tableName: string;
  fields: FormField[];
}

/**
 * Parse HTML to find forms and their input fields.
 * Returns structured data used to generate SQL + JS deterministically.
 */
function parseForms(html: string): ParsedForm[] {
  const forms: ParsedForm[] = [];
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
  let formMatch;
  let formIndex = 0;

  while ((formMatch = formRegex.exec(html)) !== null) {
    const formTag = formMatch[0];
    const formContent = formMatch[1];

    // Try to get form id
    const idMatch = formTag.match(/id\s*=\s*["']([^"']+)["']/);
    const formId = idMatch?.[1] || `form_${formIndex}`;

    // Generate table name from form id
    const tableName = formId
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || `form_${formIndex}`;

    // Find all input, textarea, select elements
    const fields: FormField[] = [];
    const inputRegex = /<(?:input|textarea|select)[^>]*>/gi;
    let inputMatch;

    while ((inputMatch = inputRegex.exec(formContent)) !== null) {
      const tag = inputMatch[0];
      const typeMatch = tag.match(/type\s*=\s*["']([^"']+)["']/i);
      const type = typeMatch?.[1]?.toLowerCase() || "text";

      // Skip submit and button types
      if (type === "submit" || type === "button" || type === "hidden") continue;

      // Get name or id
      const nameMatch = tag.match(/name\s*=\s*["']([^"']+)["']/i);
      const inputIdMatch = tag.match(/id\s*=\s*["']([^"']+)["']/i);
      const placeholderMatch = tag.match(/placeholder\s*=\s*["']([^"']+)["']/i);

      let fieldName = nameMatch?.[1] || inputIdMatch?.[1] || "";

      // If no name/id, derive from placeholder
      if (!fieldName && placeholderMatch) {
        fieldName = placeholderMatch[1]
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "_")
          .toLowerCase()
          .slice(0, 30);
      }

      if (!fieldName) {
        fieldName = `field_${fields.length}`;
      }

      // Clean field name for SQL
      fieldName = fieldName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();

      fields.push({ name: fieldName, type });
    }

    if (fields.length > 0) {
      forms.push({ id: formId, tableName, fields });
      formIndex++;
    }
  }

  return forms;
}

/**
 * Generate SQL for a table based on form fields.
 */
function generateSQL(form: ParsedForm): string {
  const columns = form.fields.map((f) => {
    const sqlType = f.type === "number" ? "numeric" :
                    f.type === "email" ? "text" :
                    f.type === "date" ? "date" :
                    f.type === "checkbox" ? "boolean" :
                    "text";
    return `"${f.name}" ${sqlType}`;
  });

  return `CREATE TABLE IF NOT EXISTS {{SCHEMA}}."${form.tableName}" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ${columns.join(",\n  ")},
  created_at timestamptz DEFAULT now()
);
ALTER TABLE {{SCHEMA}}."${form.tableName}" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_access" ON {{SCHEMA}}."${form.tableName}";
CREATE POLICY "public_access" ON {{SCHEMA}}."${form.tableName}" FOR ALL USING (true) WITH CHECK (true);`;
}

/**
 * Generate the backend <script> block that connects forms to Supabase.
 */
function escapeHtmlHelper(): string {
  return `
  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }`;
}

function generateBackendScript(forms: ParsedForm[]): string {
  const formHandlers = forms.map((form) => {
    // Use index-based input selection since AI-generated forms often lack name/id attributes
    const fieldReads = form.fields.map((f, idx) => {
      const selector = `inputs[${idx}]`;
      if (f.type === "checkbox") {
        return `${f.name}: ${selector} ? ${selector}.checked : false`;
      }
      if (f.type === "number") {
        return `${f.name}: ${selector} && ${selector}.value ? Number(${selector}.value) : null`;
      }
      return `${f.name}: ${selector} ? ${selector}.value : ''`;
    });

    const displayFields = form.fields
      .filter((f) => f.type !== "checkbox")
      .slice(0, 3)
      .map((f) => f.name);

    return `
    // Handle form: ${form.id} -> table: ${form.tableName}
    (function(){
      var formEl = document.getElementById('${form.id}');
      if (!formEl) {
        var allForms = document.querySelectorAll('form');
        formEl = allForms[${forms.indexOf(form)}];
      }
      if (!formEl) return;

      // Replace form with a clone to remove ALL existing event listeners
      // (the AI-generated frontend may have its own local handlers that conflict)
      var newForm = formEl.cloneNode(true);
      formEl.parentNode.replaceChild(newForm, formEl);
      formEl = newForm;

      // Get all visible input/textarea/select elements (skip hidden/submit/button)
      var inputs = Array.from(formEl.querySelectorAll('input, textarea, select')).filter(function(el) {
        var t = (el.type || '').toLowerCase();
        return t !== 'submit' && t !== 'button' && t !== 'hidden';
      });

      // Find or create the display container for entries
      // Look for common list containers near the form
      var container = formEl.parentElement.querySelector('.reviews, .entries, .items, .list, [id*="list"], [id*="review"]');
      if (!container) {
        // Look more broadly
        container = document.querySelector('.reviews, .entries, .items, .list, [id*="review"], [id*="list"]');
      }
      if (!container) {
        container = document.createElement('div');
        container.id = '${form.tableName}-list';
        container.style.cssText = 'margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto;';
        formEl.parentElement.appendChild(container);
      }

      async function loadData() {
        var { data, error } = await sb.from('${form.tableName}').select('*').order('created_at', { ascending: false });
        if (error) { console.error('Load error:', error); return; }
        if (!data) return;
        container.innerHTML = data.length === 0
          ? '<p style="text-align:center;color:#999;padding:20px;">Пока пусто. Добавьте первую запись!</p>'
          : data.map(function(row) {
              var fields = [${displayFields.map((f) => `'<strong>' + _esc(row.${f}) + '</strong>'`).join(",")}].filter(Boolean).join(' — ');
              return '<div style="padding:12px;margin:8px 0;background:#f9f9f9;border-radius:8px;border:1px solid #eee;">' + fields + '<div style="font-size:11px;color:#999;margin-top:4px;">' + new Date(row.created_at).toLocaleString() + '</div></div>';
            }).join('');
      }

      formEl.addEventListener('submit', async function(e) {
        e.preventDefault();
        var record = { ${fieldReads.join(", ")} };
        var { error } = await sb.from('${form.tableName}').insert(record);
        if (error) { console.error('Insert error:', error); alert('Ошибка сохранения: ' + _esc(error.message)); return; }
        formEl.reset();
        loadData();
      });

      loadData();
    })();`;
  });

  return `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
(function waitForSupabase() {
  if (typeof supabase === 'undefined') { setTimeout(waitForSupabase, 50); return; }
  ${escapeHtmlHelper()}
  var sb = supabase.createClient('{{SUPABASE_URL}}', '{{SUPABASE_ANON_KEY}}', {
    db: { schema: '{{SCHEMA}}' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  ${formHandlers.join("\n")}
})();
</script>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, userPrompt, fullHtml } = await req.json();

    // Parse forms from the HTML
    const forms = parseForms(html || fullHtml);

    if (forms.length === 0) {
      // No forms found — return the HTML unchanged
      return new Response(
        JSON.stringify({
          tables: [],
          edge_functions: [],
          updated_html: fullHtml || html,
          features: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate SQL and backend script deterministically
    const tables = forms.map((form) => ({
      name: form.tableName,
      sql: generateSQL(form),
    }));

    const backendScript = generateBackendScript(forms);
    const features = ["forms", "database"];

    // Strip any existing Supabase scripts from the AI-generated HTML
    // to avoid duplicate declarations when we inject our own
    let originalHtml = fullHtml || html;
    // Remove Supabase CDN script tags
    originalHtml = originalHtml.replace(/<script[^>]*supabase[^>]*>[\s\S]*?<\/script>/gi, '');
    originalHtml = originalHtml.replace(/<script[^>]*cdn\.jsdelivr\.net[^>]*supabase[^>]*><\/script>/gi, '');
    // Remove inline scripts that create a supabase client
    originalHtml = originalHtml.replace(/<script[^>]*>[\s\S]*?(?:createClient|supabase\.createClient|const supabase|let supabase|var supabase)[\s\S]*?<\/script>/gi, '');

    // Inject backend script into HTML
    let updatedHtml: string;
    if (originalHtml.includes("</body>")) {
      updatedHtml = originalHtml.replace("</body>", `\n${backendScript}\n</body>`);
    } else {
      updatedHtml = originalHtml + `\n${backendScript}`;
    }

    return new Response(
      JSON.stringify({
        tables,
        edge_functions: [],
        updated_html: updatedHtml,
        features,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-backend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
