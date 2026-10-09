# Studycamp blog cluster (US, English, DataForSEO, pulled 2026-09-20)

Volume = Google Ads monthly US search volume. KD = DataForSEO keyword difficulty (0-100). Raw data: research/studycamp-shortlist.json, research/studycamp-serps.json, research/studycamp-keywords.json.
SERP pattern across all 10: university learning centers + thin listicles + Reddit. Gap = concrete, honest, copy-able examples and a real point of view. Top-3 slots are mostly AI Overview / featured snippet, so answer-first formatting matters.

| # | Slug | Primary keyword | Vol | KD | Also cover (vol) | Role |
|---|------|-----------------|-----|----|------------------|------|
| 1 | how-to-study-effectively | how to study effectively | 90,500 | 24 | study techniques 2,900 KD20; best study techniques 2,400 KD30 | Hub / pillar |
| 2 | note-taking-methods | note taking methods | 90,500 | 28 | outline method 2,900 KD2; how to take good notes 1,600 KD18 | Spoke (notes) |
| 3 | cornell-notes | cornell notes | 60,500 | 39 | how to take cornell notes 1,300; cornell notes example 5,400 | Spoke (notes), Studycamp has Cornell templates |
| 4 | feynman-technique | feynman technique | 12,100 | 19 | | Spoke (understanding) |
| 5 | active-recall | active recall | 9,900 | 24 | blurting method 880 KD0; retrieval practice 2,900 KD39 | Spoke (memory) |
| 6 | spaced-repetition | spaced repetition | 5,400 | 37 | leitner system 1,000 KD17; spaced repetition app 1,000 KD24 | Spoke (memory) |
| 7 | ai-study-tools | ai study tools | 6,600 | 27 | best ai study tools 880; chatgpt for studying 1,000 KD10; ai pdf summarizer 1,300 KD23 | Spoke (AI), product-adjacent |
| 8 | quizlet-alternatives | quizlet alternatives | 2,900 | 0 | quizlet vs anki 1,600 KD0; is quizlet free 2,900 KD17; anki alternative 140 | Comparison / commercial |
| 9 | how-to-make-flashcards | how to make flashcards | 1,600 | 19 | best flashcard app 1,300 KD23; how to study with flashcards 320 KD5 | Spoke (flashcards), product-adjacent |
| 10 | how-to-study-for-exams | how to study for exams | 2,400 | 20 | how to study for finals 880 KD7; study schedule for finals 590 KD6; exam study plan 480; study plan template 720 KD2 | Spoke (exams) |

Follow-ups not in this batch: ai pdf summarizer, pomodoro technique (KD 69, too hard for now), gpa calculator (823k, tool not post), blurting method, leitner system.

## Internal linking map (write links as site-relative paths, e.g. /features/study-ai/flashcards; other posts as /blog/<slug>)
- 1 how-to-study-effectively: links to ALL other 9 posts (hub), /features/handy-tools/pomodoro, /features/handy-tools/sounds
- 2 note-taking-methods: /blog/cornell-notes, /blog/how-to-study-effectively, /features/backpack/notes, /features/backpack/canvas, /features/backpack/voice-recorder
- 3 cornell-notes: /blog/note-taking-methods, /blog/active-recall, /features/backpack/notes
- 4 feynman-technique: /blog/active-recall, /blog/how-to-study-effectively, /features/study-ai/chat
- 5 active-recall: /blog/spaced-repetition, /blog/how-to-make-flashcards, /blog/feynman-technique, /features/study-ai/flashcards, /features/study-ai/quiz
- 6 spaced-repetition: /blog/active-recall, /blog/how-to-make-flashcards, /blog/how-to-study-for-exams, /features/study-ai/flashcards (do not claim scheduling)
- 7 ai-study-tools: /features/study-ai/chat, /features/study-ai/summary, /features/study-ai/quiz, /vs/studyfetch, /vs/mindgrasp, /blog/quizlet-alternatives
- 8 quizlet-alternatives: /vs/quizlet, /features/study-ai/flashcards, /pricing, /blog/ai-study-tools, /blog/how-to-make-flashcards
- 9 how-to-make-flashcards: /blog/active-recall, /blog/spaced-repetition, /features/study-ai/flashcards, /blog/quizlet-alternatives
- 10 how-to-study-for-exams: /blog/active-recall, /blog/spaced-repetition, /blog/how-to-study-effectively, /features/backpack/calendar, /features/handy-tools/countdown, /features/handy-tools/pomodoro

## Output format (every post)
File: /Users/can/Projects/studycamp/blogmd/<slug>.md. Flat frontmatter (one `key: value` per line, values plain or quoted, NO nested YAML, NO lists, NO multiline). Then markdown body.
```
---
slug: <slug>
title: <H1 shown on page, sentence case, primary keyword near the front, <= 65 chars>
seoTitle: <title tag, <= 60 chars, ends with " | Studycamp" only if it fits>
description: <meta description, 140-158 chars, primary keyword, no em dashes>
date: 2026-09-20
updated: 2026-09-20
category: <Study skills | Notes | Memory | AI | Exams | Flashcards | Comparisons>
tags: <comma separated, 3-5>
keyword: <primary keyword>
author: Studycamp
tools: <comma separated feature paths, e.g. /features/study-ai/flashcards, /features/backpack/notes>
excerpt: <one sentence, 20-30 words, for the index card>
---
```
Body rules: do NOT include an H1 (the page renders the title). Start with the direct answer (2-3 sentences), then a `## Key takeaways` bullet list (3-5 bullets), then H2/H3 sections. Plain markdown only (GFM tables OK). No HTML, no inline SVG, no images (none available yet), no JSON-LD. Inline-link sources. End with `## FAQ` (3-5 H3 questions, real People-Also-Ask style, 2-4 sentence answers), then a short `## Sources` list (only sources actually cited). Length: hub 2,400-3,000 words; others 1,600-2,300 words.
