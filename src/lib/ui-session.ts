import { getContext, setContext } from 'svelte';

const UI_SESSION_CONTEXT = Symbol('ui-session');

export interface UiSession {
	homeIntroPlayed: boolean;
}

export function createUiSession(): UiSession {
	return { homeIntroPlayed: false };
}

export function provideUiSession(): UiSession {
	return setContext(UI_SESSION_CONTEXT, createUiSession());
}

export function useUiSession(): UiSession {
	return getContext<UiSession | undefined>(UI_SESSION_CONTEXT) ?? createUiSession();
}

export function consumeHomeIntro(session: UiSession): boolean {
	if (session.homeIntroPlayed) return false;
	session.homeIntroPlayed = true;
	return true;
}
