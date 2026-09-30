export function shuffle(items, random = Math.random) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
export function scoreAnswer({ correct, streak, remaining, timed }) {
	return correct
		? 100 +
				Math.min(streak, 5) * 25 +
				(timed ? Math.max(0, Math.floor(remaining)) : 0)
		: 0;
}
