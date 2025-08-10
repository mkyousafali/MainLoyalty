type DynamicRoutes = {
	"/admin/edit-offer/[id]": { id: string };
	"/api/upload-queue/status/[jobId]": { jobId: string };
	"/register/[mobile]": { mobile: string }
};

type Layouts = {
	"/": { id?: string; jobId?: string; mobile?: string };
	"/admin-login": undefined;
	"/admin": { id?: string };
	"/admin/analytics-reports": undefined;
	"/admin/analytics": undefined;
	"/admin/assign-card-type": undefined;
	"/admin/assign-coupons": undefined;
	"/admin/clear-transactions": undefined;
	"/admin/create-offer": undefined;
	"/admin/customer-management": undefined;
	"/admin/database-test": undefined;
	"/admin/edit-offer": { id?: string };
	"/admin/edit-offer/[id]": { id: string };
	"/admin/export-data": undefined;
	"/admin/extend-validity": undefined;
	"/admin/manage-branches": undefined;
	"/admin/manage-card-types": undefined;
	"/admin/manage-coupons": undefined;
	"/admin/notification-center": undefined;
	"/admin/offers-management": undefined;
	"/admin/password-reset": undefined;
	"/admin/set-master-admin": undefined;
	"/admin/support-settings": undefined;
	"/admin/terms-management": undefined;
	"/admin/upload-customers": undefined;
	"/admin/upload-status": undefined;
	"/admin/upload-transactions": undefined;
	"/admin/user-management": undefined;
	"/admin/user-reports": undefined;
	"/admin/user-roles": undefined;
	"/api": { jobId?: string };
	"/api/upload-queue": { jobId?: string };
	"/api/upload-queue/recent": undefined;
	"/api/upload-queue/status": { jobId?: string };
	"/api/upload-queue/status/[jobId]": { jobId: string };
	"/auto-login": undefined;
	"/customer-support": undefined;
	"/dashboard": undefined;
	"/gift-points": undefined;
	"/home-delivery": undefined;
	"/login": undefined;
	"/my-gift": undefined;
	"/my-offers": undefined;
	"/pay-later": undefined;
	"/pickup-store": undefined;
	"/register": { mobile?: string };
	"/register/test": undefined;
	"/register/[mobile]": { mobile: string };
	"/simple-dashboard": undefined;
	"/terms-conditions": undefined;
	"/transactions": undefined;
	"/virtual-card": undefined
};

export type RouteId = "/" | "/admin-login" | "/admin" | "/admin/analytics-reports" | "/admin/analytics" | "/admin/assign-card-type" | "/admin/assign-coupons" | "/admin/clear-transactions" | "/admin/create-offer" | "/admin/customer-management" | "/admin/database-test" | "/admin/edit-offer" | "/admin/edit-offer/[id]" | "/admin/export-data" | "/admin/extend-validity" | "/admin/manage-branches" | "/admin/manage-card-types" | "/admin/manage-coupons" | "/admin/notification-center" | "/admin/offers-management" | "/admin/password-reset" | "/admin/set-master-admin" | "/admin/support-settings" | "/admin/terms-management" | "/admin/upload-customers" | "/admin/upload-status" | "/admin/upload-transactions" | "/admin/user-management" | "/admin/user-reports" | "/admin/user-roles" | "/api" | "/api/upload-queue" | "/api/upload-queue/recent" | "/api/upload-queue/status" | "/api/upload-queue/status/[jobId]" | "/auto-login" | "/customer-support" | "/dashboard" | "/gift-points" | "/home-delivery" | "/login" | "/my-gift" | "/my-offers" | "/pay-later" | "/pickup-store" | "/register" | "/register/test" | "/register/[mobile]" | "/simple-dashboard" | "/terms-conditions" | "/transactions" | "/virtual-card";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/admin-login" | "/admin" | "/admin/analytics-reports" | "/admin/analytics" | "/admin/assign-card-type" | "/admin/assign-coupons" | "/admin/clear-transactions" | "/admin/create-offer" | "/admin/customer-management" | "/admin/database-test" | "/admin/edit-offer" | `/admin/edit-offer/${string}` & {} | "/admin/export-data" | "/admin/extend-validity" | "/admin/manage-branches" | "/admin/manage-card-types" | "/admin/manage-coupons" | "/admin/notification-center" | "/admin/offers-management" | "/admin/password-reset" | "/admin/set-master-admin" | "/admin/support-settings" | "/admin/terms-management" | "/admin/upload-customers" | "/admin/upload-status" | "/admin/upload-transactions" | "/admin/user-management" | "/admin/user-reports" | "/admin/user-roles" | "/api" | "/api/upload-queue" | "/api/upload-queue/recent" | "/api/upload-queue/status" | `/api/upload-queue/status/${string}` & {} | "/auto-login" | "/customer-support" | "/dashboard" | "/gift-points" | "/home-delivery" | "/login" | "/my-gift" | "/my-offers" | "/pay-later" | "/pickup-store" | "/register" | "/register/test" | `/register/${string}` & {} | "/simple-dashboard" | "/terms-conditions" | "/transactions" | "/virtual-card";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/currency-symbol.svg" | "/favicon.svg" | "/icons/icon-144x144.svg" | "/icons/icon-192x192.png" | "/icons/icon-512x512.png" | "/icons/icon.png" | "/icons/README.md" | "/logo.png" | "/manifest.json" | "/Return-to-Work Notice After Annual Leave.pdf" | "/sample_coupon_assignments.csv" | "/sample_coupon_creation.csv" | "/sample_coupon_creation.xlsx" | "/sample_customer_eligibility.csv" | "/sample_customer_registration.csv" | "/~$sample_coupon_creation.xlsx" | "/~$كميات وتكاليف محطة احد المسارحةابو احمد السهلي.xlsx" | "/~$كميات وتكاليف محطة الشروق  (صامتة).xlsx" | "/حليمه حساني  (1).pdf" | "/حليمه حساني .pdf" | "/كميات وتكاليف محطة احد المسارحةابو احمد السهلي.xlsx" | "/كميات وتكاليف محطة الشروق  (صامتة).xlsx";