interface GalleryAutoplayEntry {
	active: boolean;
	available: boolean;
	centerDistance: number;
	onActiveChange: (active: boolean) => void;
}

export interface GalleryAutoplayRegistration {
	update: (state: { available: boolean; centerDistance: number }) => void;
	claim: () => void;
	release: () => void;
	unregister: () => void;
}

const entries = new Map<symbol, GalleryAutoplayEntry>();
let claimedEntry: symbol | null = null;

function selectEntry(): symbol | null {
	if (claimedEntry) {
		const claimed = entries.get(claimedEntry);
		if (!claimed) claimedEntry = null;
		else if (claimed.available) return claimedEntry;
	}

	let selected: symbol | null = null;
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const [token, entry] of entries) {
		if (!entry.available || entry.centerDistance >= nearestDistance) continue;
		selected = token;
		nearestDistance = entry.centerDistance;
	}

	return selected;
}

function refreshActiveGallery(): void {
	const selected = selectEntry();

	for (const [token, entry] of entries) {
		const active = token === selected;
		if (entry.active === active) continue;
		entry.active = active;
		entry.onActiveChange(active);
	}
}

/** Coordinate project galleries so only one visible gallery advances at a time. */
export function registerGalleryAutoplay(
	onActiveChange: (active: boolean) => void
): GalleryAutoplayRegistration {
	const token = Symbol('project-gallery');
	entries.set(token, {
		active: false,
		available: false,
		centerDistance: Number.POSITIVE_INFINITY,
		onActiveChange
	});

	return {
		update(state) {
			const entry = entries.get(token);
			if (!entry) return;
			entry.available = state.available;
			entry.centerDistance = state.centerDistance;
			refreshActiveGallery();
		},
		claim() {
			claimedEntry = token;
			refreshActiveGallery();
		},
		release() {
			if (claimedEntry !== token) return;
			claimedEntry = null;
			refreshActiveGallery();
		},
		unregister() {
			entries.delete(token);
			if (claimedEntry === token) claimedEntry = null;
			refreshActiveGallery();
		}
	};
}
