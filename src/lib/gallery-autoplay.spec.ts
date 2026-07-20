import { describe, expect, it, vi } from 'vitest';
import { registerGalleryAutoplay } from './gallery-autoplay';

describe('registerGalleryAutoplay', () => {
	it('activates only the nearest eligible gallery while honoring an explicit claim', () => {
		const firstActive = vi.fn();
		const secondActive = vi.fn();
		const first = registerGalleryAutoplay(firstActive);
		const second = registerGalleryAutoplay(secondActive);

		try {
			first.update({ available: true, centerDistance: 300 });
			second.update({ available: true, centerDistance: 100 });
			expect(firstActive).toHaveBeenLastCalledWith(false);
			expect(secondActive).toHaveBeenLastCalledWith(true);

			first.claim();
			expect(firstActive).toHaveBeenLastCalledWith(true);
			expect(secondActive).toHaveBeenLastCalledWith(false);

			first.update({ available: false, centerDistance: 300 });
			expect(secondActive).toHaveBeenLastCalledWith(true);

			first.update({ available: true, centerDistance: 300 });
			expect(firstActive).toHaveBeenLastCalledWith(true);

			first.release();
			expect(secondActive).toHaveBeenLastCalledWith(true);
		} finally {
			first.unregister();
			second.unregister();
		}
	});
});
