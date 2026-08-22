import assert from "node:assert/strict";
import test from "node:test";
import { buildLocalIntake } from "../lib/intake.ts";

test("keeps every independent matter in a comma-separated brain dump", () => {
  const result = buildLocalIntake("写论文摘要，跑一遍模型，报销打车费，预约牙医，给妈妈回电话");
  assert.equal(result.eggs.length, 5);
  assert.deepEqual(result.eggs.map((egg) => egg.kind), ["writing", "analysis", "admin", "health", "communication"]);
});

test("does not deduplicate separate matters that share a creature", () => {
  const result = buildLocalIntake("修改摘要。还要写方法部分。另外回复审稿意见");
  assert.equal(result.eggs.length, 3);
  assert.deepEqual(result.eggs.map((egg) => egg.species), ["椰子章鱼", "椰子章鱼", "椰子章鱼"]);
});

test("merges one deliverable's refinements but separates research, communication, and emotion", () => {
  const input = "导师让我做完 PPT，还要翻译。我还想往里面补一些 evidence。与此同时，我自己还要推进手上正在写的文章。真的很内耗，导师一直不看我的文章，让我特别痛苦。我想发消息催催他，可我又不敢催。";
  const result = buildLocalIntake(input);
  assert.equal(result.eggs.length, 4);
  assert.deepEqual(result.eggs.map((egg) => egg.kind), ["assigned", "writing", "emotion", "communication"]);
});
