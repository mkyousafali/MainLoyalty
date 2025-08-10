import { G as attr_class, I as attr, K as escape_html, D as pop, z as push, P as ensure_array_like } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
import { s as supabase, T as TABLES } from "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let filteredCustomers, canClearByDate, canClearByCustomers, canClear;
  let untilDate = "";
  let searchTerm = "";
  let selectedCustomers = [];
  let selectAll = false;
  let isLoading = true;
  let customers = [];
  async function loadCustomers() {
    isLoading = true;
    try {
      const { data, error } = await supabase.from(TABLES.CUSTOMERS).select(`
          id,
          mobile,
          name,
          email,
          address,
          created_at
        `).order("created_at", { ascending: false });
      if (error) {
        console.error("Error loading customers:", error);
        customers = [];
      } else {
        customers = (data || []).map((customer) => ({
          id: customer.id,
          customer_code: customer.mobile,
          full_name: customer.name || `Customer ${customer.mobile}`,
          email: customer.email || "",
          phone: customer.mobile,
          total_transactions: 0,
          // TODO: Calculate from transactions
          total_amount: 0,
          // TODO: Calculate from transactions
          created_at: customer.created_at
        }));
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      customers = [];
    } finally {
      isLoading = false;
    }
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  filteredCustomers = customers.filter((customer) => customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) || customer.email.toLowerCase().includes(searchTerm.toLowerCase()) || customer.phone.includes(searchTerm));
  canClearByDate = untilDate;
  canClearByCustomers = selectedCustomers.length > 0;
  canClear = canClearByDate || canClearByCustomers;
  {
    if (filteredCustomers.length > 0) {
      selectAll = filteredCustomers.every((customer) => selectedCustomers.includes(customer.id));
    }
  }
  {
    loadCustomers();
  }
  $$payload.out.push(`<div class="clear-transactions-page svelte-imi3zo"><div class="page-header svelte-imi3zo"><div class="header-content svelte-imi3zo"><div class="header-text svelte-imi3zo"><h1 class="svelte-imi3zo">Clear Transactions</h1> <p class="header-description svelte-imi3zo">Remove transaction data by date range and/or specific customers. This action cannot be undone.</p></div> <div class="header-actions"><button${attr_class("clear-button svelte-imi3zo", void 0, { "enabled": canClear })}${attr("disabled", !canClear, true)}><span class="button-icon svelte-imi3zo">🗑️</span> Clear Selected Data</button></div></div></div> <div class="warning-notice svelte-imi3zo"><div class="warning-icon svelte-imi3zo">⚠️</div> <div class="warning-content svelte-imi3zo"><h3 class="svelte-imi3zo">Important Warning</h3> <p class="svelte-imi3zo">Clearing transactions will permanently delete the selected data and cannot be recovered. Please ensure you have proper backups before proceeding.</p></div></div> <div class="content-grid svelte-imi3zo"><div class="card date-selection-card svelte-imi3zo"><div class="card-header svelte-imi3zo"><h2 class="svelte-imi3zo">Clear by Date</h2> <p class="svelte-imi3zo">Select date to clear all transactions up to and including the specified date</p></div> <div class="card-content svelte-imi3zo"><div class="date-inputs svelte-imi3zo"><div class="input-group svelte-imi3zo"><label for="untilDate" class="svelte-imi3zo">Clear transactions until date:</label> <input type="date" id="untilDate"${attr("value", untilDate)}${attr("max", today)} class="date-input svelte-imi3zo"/></div></div> `);
  if (canClearByDate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="date-summary svelte-imi3zo"><div class="summary-item svelte-imi3zo"><span class="summary-label svelte-imi3zo">Clear Until:</span> <span class="summary-value svelte-imi3zo">${escape_html(untilDate)}</span></div> <div class="summary-item svelte-imi3zo"><span class="summary-label svelte-imi3zo">Action:</span> <span class="summary-value danger svelte-imi3zo">All transactions up to this date will be deleted</span></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div> <div class="card customer-selection-card svelte-imi3zo"><div class="card-header svelte-imi3zo"><h2 class="svelte-imi3zo">Clear by Customers</h2> <p class="svelte-imi3zo">Select specific customers to clear all their transaction data</p></div> <div class="card-content svelte-imi3zo"><div class="search-controls svelte-imi3zo"><div class="search-box svelte-imi3zo"><input type="text" placeholder="Search customers by name, code, email, or phone..."${attr("value", searchTerm)} class="search-input svelte-imi3zo"/> <span class="search-icon svelte-imi3zo">🔍</span></div> <div class="selection-info"><span class="selected-count svelte-imi3zo">${escape_html(selectedCustomers.length)} of ${escape_html(filteredCustomers.length)} selected</span></div></div> <div class="customer-table-container svelte-imi3zo">`);
  if (isLoading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-state svelte-imi3zo"><div class="loading-spinner svelte-imi3zo"></div> <p>Loading customers...</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(filteredCustomers);
    $$payload.out.push(`<table class="customer-table svelte-imi3zo"><thead><tr><th class="select-column svelte-imi3zo"><label class="checkbox-label svelte-imi3zo"><input type="checkbox"${attr("checked", selectAll, true)} class="select-checkbox svelte-imi3zo"/> <span class="checkbox-custom"></span></label></th><th class="svelte-imi3zo">Code</th><th class="svelte-imi3zo">Customer Name</th><th class="svelte-imi3zo">Email</th><th class="svelte-imi3zo">Phone</th><th class="svelte-imi3zo">Transactions</th><th class="svelte-imi3zo">Total Amount</th><th class="svelte-imi3zo">Registration</th></tr></thead><tbody><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let customer = each_array[$$index];
      $$payload.out.push(`<tr${attr_class("customer-row svelte-imi3zo", void 0, { "selected": selectedCustomers.includes(customer.id) })}><td class="select-column svelte-imi3zo"><label class="checkbox-label svelte-imi3zo"><input type="checkbox"${attr("checked", selectedCustomers.includes(customer.id), true)} class="select-checkbox svelte-imi3zo"/> <span class="checkbox-custom"></span></label></td><td class="customer-code svelte-imi3zo">${escape_html(customer.customer_code)}</td><td class="customer-name svelte-imi3zo">${escape_html(customer.full_name)}</td><td class="customer-email svelte-imi3zo">${escape_html(customer.email || "N/A")}</td><td class="customer-phone svelte-imi3zo">${escape_html(customer.phone)}</td><td class="transaction-count svelte-imi3zo">${escape_html(customer.total_transactions)}</td><td class="total-amount svelte-imi3zo">${escape_html(customer.total_amount.toLocaleString())} SAR</td><td class="registration-date svelte-imi3zo">${escape_html(new Date(customer.created_at).toLocaleDateString())}</td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table>`);
  }
  $$payload.out.push(`<!--]--> `);
  if (!isLoading && filteredCustomers.length === 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="no-results svelte-imi3zo"><div class="no-results-icon svelte-imi3zo">👥</div> <h3 class="svelte-imi3zo">No customers found</h3> <p class="svelte-imi3zo">Try adjusting your search criteria</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (selectedCustomers.length > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="selection-summary svelte-imi3zo"><h3 class="svelte-imi3zo">Selected Customers Summary</h3> <div class="summary-stats svelte-imi3zo"><div class="stat-item svelte-imi3zo"><span class="stat-label svelte-imi3zo">Customers Selected:</span> <span class="stat-value svelte-imi3zo">${escape_html(selectedCustomers.length)}</span></div> <div class="stat-item svelte-imi3zo"><span class="stat-label svelte-imi3zo">Total Transactions:</span> <span class="stat-value svelte-imi3zo">${escape_html(filteredCustomers.filter((c) => selectedCustomers.includes(c.id)).reduce((sum, c) => sum + c.total_transactions, 0))}</span></div> <div class="stat-item svelte-imi3zo"><span class="stat-label svelte-imi3zo">Total Amount:</span> <span class="stat-value svelte-imi3zo">${escape_html(filteredCustomers.filter((c) => selectedCustomers.includes(c.id)).reduce((sum, c) => sum + c.total_amount, 0).toLocaleString())} SAR</span></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
export {
  _page as default
};
