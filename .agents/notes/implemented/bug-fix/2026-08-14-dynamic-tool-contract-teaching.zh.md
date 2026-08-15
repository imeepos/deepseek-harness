# Agent Note: 在模型阅读处教学动态 Tool 定义契约

Status: implemented

[English](2026-08-14-dynamic-tool-contract-teaching.md) | 中文

## 问题

一个动态 Package 的 `apply` 通过 `harness.defineTool` 注册 Tool 却漏掉 `output.render` 时，define 顺利通过，白花一轮审批与激活，然后才以 `harness.defineTool output.render must be a function` 失败。该校验时机本身是正确的——`apply` 是 DSL 收到定义的最早时刻，而 `cordis_define` 刻意只解析不运行函数体——但契约没有出现在模型写代码前会读的任何地方：`harness` builtin 检查目录只有一行光秃秃的 `defineTool(definition: ToolDefinition)` 签名，技能的工具注册一节只有三句话且零示例，而 `parameters` 是「名字→schema」映射而非 JSON-Schema 包装这一点，只能靠反推 `dsh-tool-todo` 源码发现。

## 决策

**在模型会查阅的两个面上教学契约，并钉住目录。** `HOST_BUILTIN_INSPECTION` 的 `harness` 条目（经 Builtin Inspect Provider 提供）现在列出必填的 `name, description, parameters, execute, output` 字段，说明 `parameters` 是名字→schema 映射，并标注 `output.render` 必填及其内容块数组返回值；其 description 写明 `cordis_define` 只解析不运行、完整契约在激活时的 `apply` 中强制执行。`cordis-plugin-development` 技能的注册一节补上一个字段齐全的最小完整示例。包测试钉住这些目录行，教学内容无法悄然回退。

**校验留在原处。** 把契约校验前移进 `cordis_define` 需要执行 `apply`，也就是在用户批准前运行模型写的代码；只干跑函数体又抓不住发生在 `apply` 内的定义——而观测到的失败恰恰都在那里。沙箱在激活时抛出的教学错误仍是权威的、最早可解析的检查。

## 考虑过的替代方案

- **define 时干跑函数体并校验返回的 plugin 形状** —— 已否决：观测到的失败类位于 `apply` 内部，干跑抓不住；而 define 将背上异步求值、挂起防护与函数体顶层代码双重执行。
- **审批前用记录型桩上下文执行 `apply`** —— 已否决：先同意后执行是审批设计本身；用运行未批准代码来换一轮往返，得不偿失。
- **只把检查移进 `registerTool`** —— 已否决：`defineTool` 是每个定义都经过的规范化层，在那里校验已同时覆盖直接与间接注册。

## 后果

写动态 Tool 前查询 Builtins 或加载技能的模型能看到完整的必填形状与「解析/apply」校验分期；最常见的单一失败（漏 `output.render`）已在两个面上声明并被测试钉住。激活时的教学错误不变，仍漏网的失败保持单跳修复路径。
