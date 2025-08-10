export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["currency-symbol.svg","favicon.svg","icons/icon-144x144.svg","icons/icon-192x192.png","icons/icon-512x512.png","icons/icon.png","icons/README.md","logo.png","manifest.json","Return-to-Work Notice After Annual Leave.pdf","sample_coupon_assignments.csv","sample_coupon_creation.csv","sample_coupon_creation.xlsx","sample_customer_eligibility.csv","sample_customer_registration.csv","~$sample_coupon_creation.xlsx","~$كميات وتكاليف محطة احد المسارحةابو احمد السهلي.xlsx","~$كميات وتكاليف محطة الشروق  (صامتة).xlsx","حليمه حساني  (1).pdf","حليمه حساني .pdf","كميات وتكاليف محطة احد المسارحةابو احمد السهلي.xlsx","كميات وتكاليف محطة الشروق  (صامتة).xlsx","service-worker.js"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".md":"text/markdown",".json":"application/json",".pdf":"application/pdf",".csv":"text/csv"},
	_: {
		client: {start:"_app/immutable/entry/start.CV44dOhV.js",app:"_app/immutable/entry/app.DQSn9YUw.js",imports:["_app/immutable/entry/start.CV44dOhV.js","_app/immutable/chunks/Bc_wzfnz.js","_app/immutable/chunks/Y1pQyyvi.js","_app/immutable/chunks/Ck91ypkQ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/qrUVQqOk.js","_app/immutable/chunks/CmJYm0S5.js","_app/immutable/entry/app.DQSn9YUw.js","_app/immutable/chunks/D9Z9MdNV.js","_app/immutable/chunks/Ck91ypkQ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/Y1pQyyvi.js","_app/immutable/chunks/RujGBxXx.js","_app/immutable/chunks/J-1wTRcM.js","_app/immutable/chunks/Qt-Iq8OT.js","_app/immutable/chunks/DcXenzi0.js","_app/immutable/chunks/CmJYm0S5.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:true},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js')),
			__memo(() => import('./nodes/19.js')),
			__memo(() => import('./nodes/20.js')),
			__memo(() => import('./nodes/21.js')),
			__memo(() => import('./nodes/22.js')),
			__memo(() => import('./nodes/23.js')),
			__memo(() => import('./nodes/24.js')),
			__memo(() => import('./nodes/25.js')),
			__memo(() => import('./nodes/26.js')),
			__memo(() => import('./nodes/27.js')),
			__memo(() => import('./nodes/28.js')),
			__memo(() => import('./nodes/29.js')),
			__memo(() => import('./nodes/30.js')),
			__memo(() => import('./nodes/31.js')),
			__memo(() => import('./nodes/32.js')),
			__memo(() => import('./nodes/33.js')),
			__memo(() => import('./nodes/34.js')),
			__memo(() => import('./nodes/35.js')),
			__memo(() => import('./nodes/36.js')),
			__memo(() => import('./nodes/37.js')),
			__memo(() => import('./nodes/38.js')),
			__memo(() => import('./nodes/39.js')),
			__memo(() => import('./nodes/40.js')),
			__memo(() => import('./nodes/41.js')),
			__memo(() => import('./nodes/42.js')),
			__memo(() => import('./nodes/43.js')),
			__memo(() => import('./nodes/44.js')),
			__memo(() => import('./nodes/45.js')),
			__memo(() => import('./nodes/46.js')),
			__memo(() => import('./nodes/47.js')),
			__memo(() => import('./nodes/48.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/admin-login",
				pattern: /^\/admin-login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/admin/analytics-reports",
				pattern: /^\/admin\/analytics-reports\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/admin/analytics",
				pattern: /^\/admin\/analytics\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/admin/assign-card-type",
				pattern: /^\/admin\/assign-card-type\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/admin/assign-coupons",
				pattern: /^\/admin\/assign-coupons\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/admin/clear-transactions",
				pattern: /^\/admin\/clear-transactions\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/admin/create-offer",
				pattern: /^\/admin\/create-offer\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/admin/customer-management",
				pattern: /^\/admin\/customer-management\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/admin/database-test",
				pattern: /^\/admin\/database-test\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/admin/edit-offer/[id]",
				pattern: /^\/admin\/edit-offer\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/admin/export-data",
				pattern: /^\/admin\/export-data\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/admin/extend-validity",
				pattern: /^\/admin\/extend-validity\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/admin/manage-branches",
				pattern: /^\/admin\/manage-branches\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/admin/manage-card-types",
				pattern: /^\/admin\/manage-card-types\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/admin/manage-coupons",
				pattern: /^\/admin\/manage-coupons\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/admin/notification-center",
				pattern: /^\/admin\/notification-center\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/admin/offers-management",
				pattern: /^\/admin\/offers-management\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/admin/password-reset",
				pattern: /^\/admin\/password-reset\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/admin/set-master-admin",
				pattern: /^\/admin\/set-master-admin\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/admin/support-settings",
				pattern: /^\/admin\/support-settings\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/admin/terms-management",
				pattern: /^\/admin\/terms-management\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/admin/upload-customers",
				pattern: /^\/admin\/upload-customers\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/admin/upload-status",
				pattern: /^\/admin\/upload-status\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/admin/upload-transactions",
				pattern: /^\/admin\/upload-transactions\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/admin/user-management",
				pattern: /^\/admin\/user-management\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/admin/user-reports",
				pattern: /^\/admin\/user-reports\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/admin/user-roles",
				pattern: /^\/admin\/user-roles\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/api/upload-queue",
				pattern: /^\/api\/upload-queue\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/upload-queue/_server.ts.js'))
			},
			{
				id: "/api/upload-queue/recent",
				pattern: /^\/api\/upload-queue\/recent\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/upload-queue/recent/_server.ts.js'))
			},
			{
				id: "/api/upload-queue/status",
				pattern: /^\/api\/upload-queue\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/upload-queue/status/_server.ts.js'))
			},
			{
				id: "/api/upload-queue/status/[jobId]",
				pattern: /^\/api\/upload-queue\/status\/([^/]+?)\/?$/,
				params: [{"name":"jobId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/upload-queue/status/_jobId_/_server.ts.js'))
			},
			{
				id: "/auto-login",
				pattern: /^\/auto-login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/customer-support",
				pattern: /^\/customer-support\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/gift-points",
				pattern: /^\/gift-points\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/home-delivery",
				pattern: /^\/home-delivery\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/my-gift",
				pattern: /^\/my-gift\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/my-offers",
				pattern: /^\/my-offers\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/pay-later",
				pattern: /^\/pay-later\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/pickup-store",
				pattern: /^\/pickup-store\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/register/test",
				pattern: /^\/register\/test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/register/[mobile]",
				pattern: /^\/register\/([^/]+?)\/?$/,
				params: [{"name":"mobile","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/simple-dashboard",
				pattern: /^\/simple-dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 45 },
				endpoint: null
			},
			{
				id: "/terms-conditions",
				pattern: /^\/terms-conditions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 46 },
				endpoint: null
			},
			{
				id: "/transactions",
				pattern: /^\/transactions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 47 },
				endpoint: null
			},
			{
				id: "/virtual-card",
				pattern: /^\/virtual-card\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 48 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
