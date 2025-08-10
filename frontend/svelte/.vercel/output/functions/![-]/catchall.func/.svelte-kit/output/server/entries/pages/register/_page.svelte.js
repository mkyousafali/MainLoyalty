import { T as head, G as attr_class, I as attr, D as pop, z as push, J as stringify } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let mobileNumber = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Customer Registration - Urban Market Loyalty</title>`;
  });
  $$payload.out.push(`<div class="registration-container svelte-1cw7620"><div class="registration-card svelte-1cw7620"><div class="registration-header svelte-1cw7620"><h1 class="registration-title svelte-1cw7620">🎯 Customer Registration</h1> <p class="registration-subtitle svelte-1cw7620">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`Enter your mobile number to start registration`);
  }
  $$payload.out.push(`<!--]--></p></div> <div class="progress-indicator svelte-1cw7620"><div${attr_class(`progress-step ${stringify("active")}`, "svelte-1cw7620")}><div class="step-number svelte-1cw7620">1</div> <div class="step-label svelte-1cw7620">Mobile Verification</div></div> <div${attr_class(`progress-line ${stringify("")}`, "svelte-1cw7620")}></div> <div${attr_class(`progress-step ${stringify("")}`, "svelte-1cw7620")}><div class="step-number svelte-1cw7620">2</div> <div class="step-label svelte-1cw7620">Registration Form</div></div> <div${attr_class(`progress-line ${stringify("")}`, "svelte-1cw7620")}></div> <div${attr_class(`progress-step ${stringify("")}`, "svelte-1cw7620")}><div class="step-number svelte-1cw7620">3</div> <div class="step-label svelte-1cw7620">Complete</div></div></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="form-section svelte-1cw7620"><div class="form-group svelte-1cw7620"><label for="mobile" class="form-label svelte-1cw7620">Mobile Number</label> <input id="mobile" type="tel"${attr("value", mobileNumber)} placeholder="Enter your 10-digit mobile number" class="form-input svelte-1cw7620" maxlength="10" autocomplete="tel"/> <div class="form-hint svelte-1cw7620">Enter the mobile number you were registered with</div></div> <button class="btn btn-primary svelte-1cw7620"${attr("disabled", !mobileNumber, true)}>`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span>Verify Mobile Number</span>`);
    }
    $$payload.out.push(`<!--]--></button></div>`);
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
