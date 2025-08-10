import { K as escape_html, G as attr_class, I as attr, D as pop, z as push, J as stringify } from "../../../../chunks/index.js";
import "../../../../chunks/supabase.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  let uploading = false;
  let uploadMode = "eligibility";
  $$payload.out.push(`<div class="page-header svelte-axbp6k"><div class="header-content svelte-axbp6k"><div class="header-left svelte-axbp6k"><h1 class="page-title svelte-axbp6k">📤 Customer Bulk Upload</h1> <p class="page-description svelte-axbp6k">Upload Excel/CSV files for customer eligibility or full registration.
        Support for progress tracking and comprehensive error reporting.</p></div> <div class="header-actions svelte-axbp6k"><button class="btn btn-success svelte-axbp6k" title="Download Excel template with proper format"><span class="btn-icon svelte-axbp6k">📥</span> Download ${escape_html("Eligibility")} Template</button> <button class="btn btn-secondary svelte-axbp6k"><span class="btn-icon svelte-axbp6k">📋</span> ${escape_html("View History")}</button></div></div></div> <div class="mode-selection svelte-axbp6k"><div class="mode-card svelte-axbp6k"><h3 class="mode-title svelte-axbp6k"><span class="title-icon svelte-axbp6k">⚙️</span> Upload Mode</h3> <div class="mode-options svelte-axbp6k"><label${attr_class("mode-option svelte-axbp6k", void 0, { "active": uploadMode === "eligibility" })}><input type="radio"${attr("checked", uploadMode === "eligibility", true)} value="eligibility"${attr("disabled", uploading, true)} class="svelte-axbp6k"/> <div class="option-content svelte-axbp6k"><div class="option-header svelte-axbp6k"><span class="option-icon svelte-axbp6k">📱</span> <span class="option-title svelte-axbp6k">Eligibility Upload</span></div> <p class="option-description svelte-axbp6k">Upload mobile numbers only for customer eligibility. 
            Numbers will be available for future registration.</p> <div class="option-features svelte-axbp6k"><span class="feature svelte-axbp6k">✓ Mobile numbers only</span> <span class="feature svelte-axbp6k">✓ Fast processing</span> <span class="feature svelte-axbp6k">✓ Eligibility tracking</span></div></div></label> <label${attr_class("mode-option svelte-axbp6k", void 0, { "active": uploadMode === "full" })}><input type="radio"${attr("checked", uploadMode === "full", true)} value="full"${attr("disabled", uploading, true)} class="svelte-axbp6k"/> <div class="option-content svelte-axbp6k"><div class="option-header svelte-axbp6k"><span class="option-icon svelte-axbp6k">👥</span> <span class="option-title svelte-axbp6k">Full Registration</span></div> <p class="option-description svelte-axbp6k">Upload complete customer data for immediate registration.
            Includes validation and automatic account creation.</p> <div class="option-features svelte-axbp6k"><span class="feature svelte-axbp6k">✓ Complete customer data</span> <span class="feature svelte-axbp6k">✓ Automatic registration</span> <span class="feature svelte-axbp6k">✓ Data validation</span></div></div></label></div></div></div> <div class="upload-section svelte-axbp6k"><div class="upload-card svelte-axbp6k"><div class="upload-header svelte-axbp6k"><h3 class="card-title svelte-axbp6k"><span class="title-icon svelte-axbp6k">📁</span> ${escape_html(
    "Upload Eligibility File"
  )}</h3></div> <div class="upload-content svelte-axbp6k"><div class="upload-instructions svelte-axbp6k"><h4 class="svelte-axbp6k">📝 ${escape_html("Eligibility")} Upload Instructions:</h4> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="instruction-item svelte-axbp6k"><span class="instruction-icon svelte-axbp6k">📋</span> <span class="instruction-text svelte-axbp6k">Upload a file containing <strong class="svelte-axbp6k">mobile numbers only</strong> (one per row)</span></div> <div class="instruction-item svelte-axbp6k"><span class="instruction-icon svelte-axbp6k">📱</span> <span class="instruction-text svelte-axbp6k">Mobile numbers must be 10 digits starting with 5 (e.g., 5012345678)</span></div> <div class="instruction-item svelte-axbp6k"><span class="instruction-icon svelte-axbp6k">✅</span> <span class="instruction-text svelte-axbp6k">Numbers will be stored for future customer registration eligibility</span></div>`);
  }
  $$payload.out.push(`<!--]--> <div class="instruction-item svelte-axbp6k"><span class="instruction-icon svelte-axbp6k">📄</span> <span class="instruction-text svelte-axbp6k">Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</span></div> <div class="sample-files svelte-axbp6k"><h5 class="svelte-axbp6k">📥 Sample Files:</h5> <div class="sample-links svelte-axbp6k"><a${attr("href", `/sample_customer_${stringify("eligibility")}.csv`)} download="" class="sample-link svelte-axbp6k"><span class="sample-icon svelte-axbp6k">📄</span> Download Sample CSV</a> <button class="sample-link svelte-axbp6k"><span class="sample-icon svelte-axbp6k">📊</span> Generate Excel Template</button></div></div></div> <div class="file-input-container svelte-axbp6k"><input type="file" accept=".xlsx,.xls,.csv" class="file-input svelte-axbp6k" id="fileInput"${attr("disabled", uploading, true)}/> <label for="fileInput"${attr_class("file-input-label svelte-axbp6k", void 0, { "disabled": uploading })}><span class="upload-icon svelte-axbp6k">📎</span> <span class="upload-text svelte-axbp6k">${escape_html(`Choose ${"eligibility"} file`)}</span></label></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <button${attr_class("btn btn-primary upload-btn svelte-axbp6k", void 0, { "loading": uploading })}${attr("disabled", true, true)}>`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<span class="btn-icon svelte-axbp6k">⬆️</span> <span class="svelte-axbp6k">Upload ${escape_html("Eligibility Numbers")}</span>`);
  }
  $$payload.out.push(`<!--]--></button> <div class="upload-instructions svelte-axbp6k"><h4 class="svelte-axbp6k">📝 File Format Instructions:</h4> <ul class="svelte-axbp6k"><li class="svelte-axbp6k">Excel (.xlsx, .xls) or CSV (.csv) files accepted</li> <li class="svelte-axbp6k">Each row should contain one mobile number</li> <li class="svelte-axbp6k">Mobile numbers must be exactly 10 digits</li> <li class="svelte-axbp6k">No headers required - just the numbers</li> <li class="svelte-axbp6k">Duplicate numbers will be ignored</li> <li class="svelte-axbp6k">Numbers will be available for customer registration</li></ul></div></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
export {
  _page as default
};
