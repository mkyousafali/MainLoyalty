export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45'),
	() => import('./nodes/46'),
	() => import('./nodes/47'),
	() => import('./nodes/48')
];

export const server_loads = [];

export const dictionary = {
		"/": [3],
		"/admin-login": [31],
		"/admin": [4,[2]],
		"/admin/analytics-reports": [6,[2]],
		"/admin/analytics": [5,[2]],
		"/admin/assign-card-type": [7,[2]],
		"/admin/assign-coupons": [8,[2]],
		"/admin/clear-transactions": [9,[2]],
		"/admin/create-offer": [10,[2]],
		"/admin/customer-management": [11,[2]],
		"/admin/database-test": [12,[2]],
		"/admin/edit-offer/[id]": [13,[2]],
		"/admin/export-data": [14,[2]],
		"/admin/extend-validity": [15,[2]],
		"/admin/manage-branches": [16,[2]],
		"/admin/manage-card-types": [17,[2]],
		"/admin/manage-coupons": [18,[2]],
		"/admin/notification-center": [19,[2]],
		"/admin/offers-management": [20,[2]],
		"/admin/password-reset": [21,[2]],
		"/admin/set-master-admin": [22,[2]],
		"/admin/support-settings": [23,[2]],
		"/admin/terms-management": [24,[2]],
		"/admin/upload-customers": [25,[2]],
		"/admin/upload-status": [26,[2]],
		"/admin/upload-transactions": [27,[2]],
		"/admin/user-management": [28,[2]],
		"/admin/user-reports": [29,[2]],
		"/admin/user-roles": [30,[2]],
		"/auto-login": [32],
		"/customer-support": [33],
		"/dashboard": [34],
		"/gift-points": [35],
		"/home-delivery": [36],
		"/login": [37],
		"/my-gift": [38],
		"/my-offers": [39],
		"/pay-later": [40],
		"/pickup-store": [41],
		"/register": [42],
		"/register/test": [43],
		"/register/[mobile]": [44],
		"/simple-dashboard": [45],
		"/terms-conditions": [46],
		"/transactions": [47],
		"/virtual-card": [48]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';