import { scoreAnswer, shuffle } from "./game.js";

const $ = (id) => document.getElementById(id);
let library = [],
	rounds = [],
	position = 0,
	score = 0,
	streak = 0,
	history = [],
	fakeSide = "",
	deadline = 0,
	timer = null,
	locked = true,
	timed = true;
const show = (id) => {
	for (const name of ["intro", "game", "results"]) $(name).hidden = name !== id;
};
const seconds = () =>
	Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
function tick() {
	const left = seconds();
	$("time").textContent = left;
	$("timer-fill").style.width = `${(left / 60) * 100}%`;
	if (left === 0) answer(null);
}
function start() {
	if (!library.length) return;
	clearInterval(timer);
	rounds = shuffle(library).slice(0, 6);
	position = score = streak = 0;
	history = [];
	timed = !$("untimed").checked;
	show("game");
	renderRound();
}
function renderRound() {
	locked = false;
	fakeSide = Math.random() < 0.5 ? "a" : "b";
	const round = rounds[position];
	$("round-label").textContent = `PAIR ${position + 1} / ${rounds.length}`;
	$("score").textContent = score;
	$("streak").textContent = streak;
	$("reveal").hidden = true;
	for (const side of ["a", "b"]) {
		$(side).disabled = false;
		$(side).className = "passage";
		const text = side === fakeSide ? round.fake : round.real;
		$(`text-${side}`).textContent = /[.!?”"]$/.test(text) ? text : `${text}…`;
		$(side).querySelector(".pick").textContent =
			`Choose ${side.toUpperCase()} as the AI text`;
	}
	$("time").textContent = timed ? "60" : "—";
	$("timer-fill").style.width = "100%";
	deadline = performance.now() + 60000;
	if (timed) timer = setInterval(tick, 200);
	$("a").focus();
}
function answer(side) {
	if (locked) return;
	locked = true;
	clearInterval(timer);
	const round = rounds[position];
	const remaining = seconds();
	if (timed && remaining === 0) side = null;
	const correct = side === fakeSide;
	streak = correct ? streak + 1 : 0;
	const points = scoreAnswer({ correct, streak, remaining, timed });
	score += points;
	history.push({ round, correct, points, timedOut: side === null });
	for (const s of ["a", "b"]) {
		$(s).disabled = true;
		$(s).classList.add(s === fakeSide ? "fake" : "real");
		$(s).querySelector(".pick").textContent =
			s === fakeSide ? "AI-GENERATED COUNTERFEIT" : "ARCHIVAL HUMAN TEXT";
	}
	$("score").textContent = score;
	$("streak").textContent = streak;
	$("verdict").textContent =
		side === null
			? `Time’s up. ${fakeSide.toUpperCase()} was generated.`
			: correct
				? `Correct. ${fakeSide.toUpperCase()} is the counterfeit. +${points}`
				: `The counterfeit was ${fakeSide.toUpperCase()}.`;
	$("origin").textContent =
		`Human source: ${round.author}, ${round.title} (${round.year}). ${round.license}`;
	$("observation").textContent = round.observation;
	$("source").href = round.source;
	$("record").textContent =
		`Generated with ${round.generation.model} via gen.pollinations.ai. Response: ${round.generation.responseId}. Date: ${round.generation.generatedAt.slice(0, 10)}.`;
	$("prompt").textContent = `Brief: ${round.prompt}`;
	$("reveal").hidden = false;
	$("next").textContent =
		position === rounds.length - 1 ? "See your report" : "Next pair";
	$("next").focus();
}
function advance() {
	if (!locked) return;
	if (++position < rounds.length) {
		renderRound();
		return;
	}
	show("results");
	const correct = history.filter((x) => x.correct).length;
	$("result-title").textContent =
		`${correct} / ${rounds.length} counterfeits found.`;
	$("result-detail").textContent =
		`${score} points. ${timed ? "Timed reading" : "Untimed reading"}. Each round’s answer is backed by a source and a generation record.`;
	$("history").replaceChildren();
	for (const entry of history) {
		const row = document.createElement("div");
		row.className = "history-row";
		const title = document.createElement("span");
		title.textContent = entry.round.title;
		const result = document.createElement("span");
		result.textContent = entry.timedOut
			? "Timed out"
			: entry.correct
				? `Found · +${entry.points}`
				: "Missed";
		row.append(title, result);
		$("history").append(row);
	}
	$("again").focus();
}
for (const s of ["a", "b"]) $(s).addEventListener("click", () => answer(s));
$("play").addEventListener("click", start);
$("again").addEventListener("click", start);
$("next").addEventListener("click", advance);
document.addEventListener("keydown", (event) => {
	if (
		event.ctrlKey ||
		event.metaKey ||
		event.altKey ||
		event.target.matches("input,summary")
	)
		return;
	const key = event.key.toLowerCase();
	if (!$("game").hidden && !locked && ["a", "b"].includes(key)) {
		event.preventDefault();
		answer(key);
	} else if (!$("game").hidden && locked && key === "n") {
		event.preventDefault();
		advance();
	}
});
document.addEventListener("visibilitychange", () => {
	if (!document.hidden && timed && !locked && !$("game").hidden) tick();
});
$("play").disabled = true;
try {
	const response = await fetch("rounds.json");
	if (!response.ok) throw Error("Dataset unavailable");
	library = await response.json();
	if (library.length < 6) throw Error("Dataset incomplete");
	$("play").disabled = false;
} catch {
	$("error").textContent =
		"The reading room could not load. Please reload to try again.";
}
