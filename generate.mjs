import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const key = (
	process.env.POLLINATIONS_API_KEY ||
	(process.env.POLLINATIONS_KEY_FILE
		? await readFile(process.env.POLLINATIONS_KEY_FILE, "utf8")
		: "")
).trim();
if (!key) throw Error("Set POLLINATIONS_API_KEY or POLLINATIONS_KEY_FILE");
const api = (path, init = {}) =>
	fetch(`https://gen.pollinations.ai${path}`, {
		...init,
		headers: { ...init.headers, Authorization: `Bearer ${key}` },
	});
const before = await (await api("/account/balance")).json();
if (!(before.balance >= 0.02)) throw Error("Insufficient budget");
const real = JSON.parse(await readFile(`${root}/source-rounds.json`, "utf8"));
const prompt = `Create a literary real-or-AI game dataset. For EACH indexed archival passage supplied below, write an ORIGINAL counterfeit, approximately the SAME word count, subject, character names, punctuation and period style. Do not copy any sentence. Avoid modern language and deliberately obvious giveaways. Also write one specific comparison observation tied to actual differences; do not claim linguistic traits reliably identify AI. Return JSON {"rounds":[{"index":0,"fake":"...","observation":"..."},...]}, all 12 indices exactly once. No markdown.\n${JSON.stringify(real.map((r, index) => ({ index, title: r.title, real: r.real })))}`;
const request = {
	model: "openai/gpt-5.4-nano",
	messages: [{ role: "user", content: prompt }],
	response_format: { type: "json_object" },
	reasoning_effort: "minimal",
	max_completion_tokens: 5000,
	seed: Date.now() % 2147483647,
};
const response = await api("/v1/chat/completions", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(request),
});
const data = await response.json();
if (!response.ok)
	throw Error(JSON.stringify({ status: response.status, error: data.error }));
const parsed = JSON.parse(data.choices[0].message.content);
if (
	parsed.rounds?.length !== 12 ||
	new Set(parsed.rounds.map((r) => r.index)).size !== 12
)
	throw Error("Incomplete dataset");
const rounds = real.map((r, index) => {
	const generated = parsed.rounds.find((x) => x.index === index);
	if (
		!generated ||
		typeof generated.fake !== "string" ||
		generated.fake.length < 100 ||
		generated.fake === r.real ||
		typeof generated.observation !== "string"
	)
		throw Error("Invalid round");
	return {
		...r,
		index,
		...generated,
		generation: {
			model: request.model,
			responseId: data.id,
			generatedAt: new Date().toISOString(),
		},
		prompt:
			"Write an original passage matching this excerpt’s subject, length, character names and period style, without copying any sentence.",
	};
});
const after = await (await api("/account/balance")).json();
const evidence = {
	model: request.model,
	responseId: data.id,
	usage: data.usage,
	request,
	response: data,
};
await writeFile(
	`${root}/dist/rounds.json`,
	`${JSON.stringify(rounds, null, 2)}\n`,
);
await writeFile(
	`${root}/generation-evidence.json`,
	`${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(
	JSON.stringify({
		rounds: rounds.length,
		responseId: data.id,
		usage: data.usage,
		cost: before.balance - after.balance,
		balance: after.balance,
	}),
);
