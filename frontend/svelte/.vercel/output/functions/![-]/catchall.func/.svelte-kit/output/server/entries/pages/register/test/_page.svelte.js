import { P as ensure_array_like, I as attr, R as maybe_selected, K as escape_html } from "../../../../chunks/index.js";
function _page($$payload) {
  let customer = { name: "", preferred_branch: "" };
  let branches = ["Main Branch", "City Center", "Green Hills"];
  const each_array = ensure_array_like(branches);
  $$payload.out.push(`<div class="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-md p-6"><h2 class="text-2xl font-semibold mb-6 text-center">🪪 Register Your Card</h2> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="mb-4"><label class="block font-medium mb-1">Full Name</label> <input class="w-full border px-3 py-2 rounded" type="text"${attr("value", customer.name)} placeholder="Enter your name"/></div> <div class="mb-6"><label class="block font-medium mb-1">Preferred Branch</label> <select class="w-full border px-3 py-2 rounded">`);
  $$payload.select_value = customer.preferred_branch;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>-- Select Branch --</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let b = each_array[$$index];
    $$payload.out.push(`<option${attr("value", b)}${maybe_selected($$payload, b)}>${escape_html(b)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <button class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold">✅ Create My Card</button></div>`);
}
export {
  _page as default
};
