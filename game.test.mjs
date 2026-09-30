import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { scoreAnswer, shuffle } from "./dist/game.js";

test("shuffling preserves all choices without changing the library", () => {
	const original = [1, 2, 3, 4];
	const changed = shuffle(original, () => 0);
	assert.deepEqual(original, [1, 2, 3, 4]);
	assert.deepEqual([...changed].sort(), original);
	assert.notDeepEqual(changed, original);
});
test("wrong guesses earn zero; streak bonuses cap and untimed guesses omit speed", () => {
	assert.equal(
		scoreAnswer({ correct: false, streak: 0, remaining: 50, timed: true }),
		0,
	);
	assert.equal(
		scoreAnswer({ correct: true, streak: 1, remaining: 50, timed: true }),
		175,
	);
	assert.equal(
		scoreAnswer({ correct: true, streak: 9, remaining: 50, timed: false }),
		225,
	);
});
test("playable fakes match the real provider response and retain distinct source receipts", async () => {
	const rounds = JSON.parse(
		await readFile(new URL("./dist/rounds.json", import.meta.url), "utf8"),
	);
	const evidence = JSON.parse(
		await readFile(
			new URL("./generation-evidence.json", import.meta.url),
			"utf8",
		),
	);
	const generated = JSON.parse(
		evidence.response.choices[0].message.content,
	).rounds;
	assert.equal(rounds.length, 12);
	assert.equal(new Set(rounds.map((r) => r.real)).size, 12);
	for (const round of rounds) {
		assert.equal(
			round.fake,
			generated.find((r) => r.index === round.index).fake,
		);
		assert.notEqual(round.fake, round.real);
		assert.equal(round.generation.responseId, evidence.responseId);
		assert.ok(round.source.startsWith("https://www.gutenberg.org/ebooks/"));
	}
});
