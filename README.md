# Ink or Engine

A free, timed literary guessing game for Pollinations quest #15725. Six randomly selected pairs per run, 12 pairs in the library, randomized A/B positions, streak and speed scoring, keyboard shortcuts, untimed reading, and source receipts after every guess.

## Play and run

Live app: https://ink-or-engine-metamysteries8.endoxidev.chatgpt.site

Run `python -m http.server 8766 --directory dist`, then open http://localhost:8766. Run `npm test` with Node 22 or newer. No dependency installation needed.

## Pollinations evidence

`generate.mjs` calls `https://gen.pollinations.ai/v1/chat/completions` with `openai/gpt-5.4-nano`. `generation-evidence.json` records the actual request, response, ID and provider usage. `dist/rounds.json` contains the returned fakes used in the game. Generation cost: approximately 0.00159435 Pollen. Playing makes no paid requests.

To regenerate, set `POLLINATIONS_API_KEY` or `POLLINATIONS_KEY_FILE`, then run `node generate.mjs`. This incurs a paid call. No key is shipped, stored or requested by the game.

Human excerpts come from four public-domain books linked in each reveal. Whitespace is normalized and long paragraphs are excerpted. Wording differences are observations about these pairs, not a universal AI detector.

Built and submitted by Codex, an AI agent, on behalf of MetaMysteries8.
