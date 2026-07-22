export type MoveDetail = {
	dx: number;
	dy: number;
};

type MovableOptions = {
	onMoveStart?: () => void;
	onMove?: (detail: MoveDetail) => void;
	onMoveEnd?: (detail: { moved: boolean }) => void;
};

export function movable(node: SVGGraphicsElement, initialOptions: MovableOptions) {
	let options = initialOptions;
	let activePointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let previousX = 0;
	let previousY = 0;
	let moved = false;

	function handlePointerMove(event: PointerEvent): void {
		if (event.pointerId !== activePointerId) return;
		if (!moved && Math.hypot(event.clientX - startX, event.clientY - startY) <= 4) return;
		const dx = event.clientX - previousX;
		const dy = event.clientY - previousY;
		previousX = event.clientX;
		previousY = event.clientY;
		moved = true;
		options.onMove?.({ dx, dy });
	}

	function finishMove(event: PointerEvent): void {
		if (event.pointerId !== activePointerId) return;
		const pointerId = activePointerId;
		activePointerId = null;
		options.onMoveEnd?.({ moved });
		if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
	}

	function handlePointerDown(event: PointerEvent): void {
		if (event.button !== 0 || activePointerId !== null) return;
		event.preventDefault();
		event.stopPropagation();
		activePointerId = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		previousX = event.clientX;
		previousY = event.clientY;
		moved = false;
		node.setPointerCapture(event.pointerId);
		options.onMoveStart?.();
	}

	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', finishMove);
	node.addEventListener('pointercancel', finishMove);

	return {
		update(nextOptions: MovableOptions) {
			options = nextOptions;
		},
		destroy() {
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', finishMove);
			node.removeEventListener('pointercancel', finishMove);
		}
	};
}
