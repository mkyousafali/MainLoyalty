import { P as ensure_array_like, R as maybe_selected, I as attr, K as escape_html, S as attr_style, J as stringify, G as attr_class, D as pop, z as push } from "../../../../chunks/index.js";
import { s as supabase } from "../../../../chunks/supabase.js";
function _page($$payload, $$props) {
  push();
  let isLoading = false;
  let error = "";
  let selectedDateRange = "30days";
  let selectedBranch = "";
  let branches = [];
  let totalCustomers = 0;
  let totalTransactions = 0;
  let totalRevenue = 0;
  let totalPointsIssued = 0;
  let totalPointsRedeemed = 0;
  let activeCustomers = 0;
  let newCustomersThisPeriod = 0;
  let averageOrderValue = 0;
  let cardTypeStats = [];
  let branchStats = [];
  let customerGrowthData = [];
  let recentTransactions = [];
  let recentRegistrations = [];
  let revenueChartData = [];
  let pointsChartData = [];
  async function loadAnalytics() {
    try {
      isLoading = true;
      const dateFilter = getDateFilter();
      await Promise.all([
        loadOverviewStats(dateFilter),
        loadCardTypeStats(),
        loadBranchStats(dateFilter),
        loadCustomerGrowth(dateFilter),
        loadRecentActivities(),
        loadChartData(dateFilter)
      ]);
    } catch (err) {
      error = `Failed to load analytics: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  function getDateFilter() {
    const now = /* @__PURE__ */ new Date();
    let startDate;
    switch (selectedDateRange) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        break;
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
        break;
      case "1year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1e3);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    }
    return startDate.toISOString().split("T")[0];
  }
  async function loadOverviewStats(dateFilter) {
    try {
      let customerQuery = supabase.from("customers").select("*", { count: "exact", head: true });
      if (selectedBranch) ;
      const { count: totalCustomersCount } = await customerQuery;
      totalCustomers = totalCustomersCount || 0;
      let newCustomerQuery = supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", dateFilter);
      if (selectedBranch) ;
      const { count: newCustomersCount } = await newCustomerQuery;
      newCustomersThisPeriod = newCustomersCount || 0;
      let transactionQuery = supabase.from("transactions").select("bill_amount, add_amt, redeem").gte("bill_date", dateFilter);
      if (selectedBranch) ;
      const { data: transactionData } = await transactionQuery;
      if (transactionData) {
        totalTransactions = transactionData.length;
        totalRevenue = transactionData.reduce((sum, t) => sum + (t.bill_amount || 0), 0);
        totalPointsIssued = transactionData.reduce((sum, t) => sum + (t.add_amt || 0), 0);
        totalPointsRedeemed = transactionData.reduce((sum, t) => sum + (t.redeem || 0), 0);
        averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      }
      let activeCustomerQuery = supabase.from("transactions").select("customer", { count: "exact" }).gte("bill_date", dateFilter);
      if (selectedBranch) ;
      const { data: activeCustomerData } = await activeCustomerQuery;
      activeCustomers = activeCustomerData ? new Set(activeCustomerData.map((t) => t.customer)).size : 0;
    } catch (err) {
      console.error("Error loading overview stats:", err);
    }
  }
  async function loadCardTypeStats() {
    try {
      let query = supabase.from("customers").select(`
          card_types(name_en, color),
          points
        `);
      if (selectedBranch) ;
      const { data } = await query;
      if (data) {
        const stats = data.reduce(
          (acc, customer) => {
            const cardType = customer.card_types?.name_en || "No Card";
            const color = customer.card_types?.color || "#gray";
            if (!acc[cardType]) {
              acc[cardType] = { name: cardType, color, count: 0, totalPoints: 0 };
            }
            acc[cardType].count++;
            acc[cardType].totalPoints += customer.points || 0;
            return acc;
          },
          {}
        );
        cardTypeStats = Object.values(stats);
      }
    } catch (err) {
      console.error("Error loading card type stats:", err);
    }
  }
  async function loadBranchStats(dateFilter) {
    try {
      if (selectedBranch) ;
      const { data } = await supabase.from("branches").select(`
          *,
          customers(count),
          transactions!inner(bill_amount, bill_date)
        `);
      if (data) {
        branchStats = data.map((branch) => {
          const recentTransactions2 = branch.transactions.filter((t) => t.bill_date >= dateFilter);
          return {
            name: branch.name_en,
            customers: branch.customers.length,
            transactions: recentTransactions2.length,
            revenue: recentTransactions2.reduce((sum, t) => sum + (t.bill_amount || 0), 0)
          };
        });
      }
    } catch (err) {
      console.error("Error loading branch stats:", err);
    }
  }
  async function loadCustomerGrowth(dateFilter) {
    try {
      let query = supabase.from("customers").select("created_at").gte("created_at", dateFilter).order("created_at");
      if (selectedBranch) ;
      const { data } = await query;
      if (data) {
        const growth = data.reduce(
          (acc, customer) => {
            const date = new Date(customer.created_at).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          },
          {}
        );
        customerGrowthData = Object.entries(growth).map(([date, count]) => ({ date, count }));
      }
    } catch (err) {
      console.error("Error loading customer growth:", err);
    }
  }
  async function loadRecentActivities() {
    try {
      let transactionQuery = supabase.from("transactions").select(`
          *,
          customers(name)
        `).order("created_at", { ascending: false }).limit(5);
      if (selectedBranch) ;
      const { data: transactions } = await transactionQuery;
      recentTransactions = transactions || [];
      let registrationQuery = supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(5);
      if (selectedBranch) ;
      const { data: registrations } = await registrationQuery;
      recentRegistrations = registrations || [];
    } catch (err) {
      console.error("Error loading recent activities:", err);
    }
  }
  async function loadChartData(dateFilter) {
    try {
      let query = supabase.from("transactions").select("bill_date, bill_amount, add_amt, redeem").gte("bill_date", dateFilter).order("bill_date");
      if (selectedBranch) ;
      const { data } = await query;
      if (data) {
        const chartData = data.reduce(
          (acc, transaction) => {
            const date = transaction.bill_date;
            if (!acc[date]) {
              acc[date] = { date, revenue: 0, pointsIssued: 0, pointsRedeemed: 0 };
            }
            acc[date].revenue += transaction.bill_amount || 0;
            acc[date].pointsIssued += transaction.add_amt || 0;
            acc[date].pointsRedeemed += transaction.redeem || 0;
            return acc;
          },
          {}
        );
        const chartArray = Object.values(chartData);
        revenueChartData = chartArray;
        pointsChartData = chartArray;
      }
    } catch (err) {
      console.error("Error loading chart data:", err);
    }
  }
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount).replace("SAR", "﷼");
  }
  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }
  {
    {
      loadAnalytics();
    }
  }
  const each_array = ensure_array_like(branches);
  $$payload.out.push(`<div class="p-6"><div class="max-w-7xl mx-auto"><div class="mb-8"><div class="flex justify-between items-center"><div><h1 class="text-3xl font-bold text-gray-900 mb-2">Analytics &amp; Reports</h1> <p class="text-gray-600">Comprehensive analytics and insights for your loyalty program.</p></div> <button class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">📊 Export Data</button></div></div> <div class="bg-white rounded-lg shadow p-6 mb-6"><div class="flex flex-wrap gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label> <select class="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedDateRange;
  $$payload.out.push(`<option value="7days"${maybe_selected($$payload, "7days")}>Last 7 Days</option><option value="30days"${maybe_selected($$payload, "30days")}>Last 30 Days</option><option value="90days"${maybe_selected($$payload, "90days")}>Last 90 Days</option><option value="1year"${maybe_selected($$payload, "1year")}>Last Year</option>`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div><label class="block text-sm font-medium text-gray-700 mb-2">Branch</label> <select class="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">`);
  $$payload.select_value = selectedBranch;
  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>All Branches</option><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branch = each_array[$$index];
    $$payload.out.push(`<option${attr("value", branch.id)}${maybe_selected($$payload, branch.id)}>${escape_html(branch.name_en)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div></div></div> `);
  if (isLoading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div> <p class="text-gray-600 mt-2">Loading analytics...</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array_1 = ensure_array_like(cardTypeStats);
    const each_array_3 = ensure_array_like(recentTransactions.slice(0, 5));
    const each_array_4 = ensure_array_like(recentRegistrations.slice(0, 5));
    $$payload.out.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-blue-600 mr-4">👥</div> <div><p class="text-sm font-medium text-gray-500">Total Customers</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(totalCustomers))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-green-600 mr-4">💰</div> <div><p class="text-sm font-medium text-gray-500">Total Revenue</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatCurrency(totalRevenue))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-purple-600 mr-4">🛒</div> <div><p class="text-sm font-medium text-gray-500">Total Transactions</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(totalTransactions))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-orange-600 mr-4">⭐</div> <div><p class="text-sm font-medium text-gray-500">Points Issued</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(totalPointsIssued))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-red-600 mr-4">🎁</div> <div><p class="text-sm font-medium text-gray-500">Points Redeemed</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(totalPointsRedeemed))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-teal-600 mr-4">🔥</div> <div><p class="text-sm font-medium text-gray-500">Active Customers</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(activeCustomers))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-indigo-600 mr-4">📈</div> <div><p class="text-sm font-medium text-gray-500">New Customers</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatNumber(newCustomersThisPeriod))}</p></div></div></div> <div class="bg-white rounded-lg shadow p-6"><div class="flex items-center"><div class="text-3xl text-pink-600 mr-4">💳</div> <div><p class="text-sm font-medium text-gray-500">Avg Order Value</p> <p class="text-2xl font-bold text-gray-900">${escape_html(formatCurrency(averageOrderValue))}</p></div></div></div></div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"><div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold mb-4">Card Type Distribution</h3> <div class="space-y-4"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let cardType = each_array_1[$$index_1];
      $$payload.out.push(`<div class="flex items-center justify-between"><div class="flex items-center"><div class="w-4 h-4 rounded-full mr-3"${attr_style(`background-color: ${stringify(cardType.color)}`)}></div> <span class="font-medium">${escape_html(cardType.name)}</span></div> <div class="text-right"><div class="font-bold">${escape_html(cardType.count)}</div> <div class="text-sm text-gray-500">${escape_html(formatNumber(cardType.totalPoints))} pts</div></div></div>`);
    }
    $$payload.out.push(`<!--]--></div></div> `);
    {
      $$payload.out.push("<!--[-->");
      const each_array_2 = ensure_array_like(branchStats);
      $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold mb-4">Branch Performance</h3> <div class="space-y-4"><!--[-->`);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let branch = each_array_2[$$index_2];
        $$payload.out.push(`<div class="border-l-4 border-blue-400 pl-4"><div class="font-medium">${escape_html(branch.name)}</div> <div class="grid grid-cols-3 gap-4 text-sm text-gray-600"><div><span class="font-medium">${escape_html(branch.customers)}</span> <span>customers</span></div> <div><span class="font-medium">${escape_html(branch.transactions)}</span> <span>transactions</span></div> <div><span class="font-medium">${escape_html(formatCurrency(branch.revenue))}</span> <span>revenue</span></div></div></div>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
    $$payload.out.push(`<!--]--> <div${attr_class(`bg-white rounded-lg shadow p-6 ${stringify("")}`)}><h3 class="text-lg font-semibold mb-4">Recent Transactions</h3> <div class="space-y-3"><!--[-->`);
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let transaction = each_array_3[$$index_3];
      $$payload.out.push(`<div class="flex justify-between items-center text-sm"><div><div class="font-medium">${escape_html(transaction.customers?.name || "Unknown")}</div> <div class="text-gray-500">Bill #${escape_html(transaction.bill_no)}</div></div> <div class="text-right"><div class="font-medium">${escape_html(formatCurrency(transaction.bill_amount))}</div> <div class="text-gray-500">${escape_html(new Date(transaction.created_at).toLocaleDateString())}</div></div></div>`);
    }
    $$payload.out.push(`<!--]--></div></div> <div class="bg-white rounded-lg shadow p-6"><h3 class="text-lg font-semibold mb-4">Recent Registrations</h3> <div class="space-y-3"><!--[-->`);
    for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
      let customer = each_array_4[$$index_4];
      $$payload.out.push(`<div class="flex justify-between items-center text-sm"><div><div class="font-medium">${escape_html(customer.name)}</div> <div class="text-gray-500 font-mono">${escape_html(customer.customer)}</div></div> <div class="text-right"><div class="font-medium">${escape_html(customer.points)} pts</div> <div class="text-gray-500">${escape_html(new Date(customer.created_at).toLocaleDateString())}</div></div></div>`);
    }
    $$payload.out.push(`<!--]--></div></div></div> `);
    if (customerGrowthData.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_5 = ensure_array_like(customerGrowthData);
      $$payload.out.push(`<div class="bg-white rounded-lg shadow p-6 mb-8"><h3 class="text-lg font-semibold mb-4">Customer Growth</h3> <div class="h-64 flex items-end space-x-2"><!--[-->`);
      for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
        let dataPoint = each_array_5[$$index_5];
        $$payload.out.push(`<div class="flex flex-col items-center"><div class="bg-blue-500 rounded-t"${attr_style(`height: ${stringify(dataPoint.count / Math.max(...customerGrowthData.map((d) => d.count)) * 200)}px; width: 20px;`)}></div> <div class="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">${escape_html(new Date(dataPoint.date).toLocaleDateString())}</div></div>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> `);
  if (error) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">${escape_html(error)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
