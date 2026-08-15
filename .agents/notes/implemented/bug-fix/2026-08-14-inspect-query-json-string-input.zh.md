# Agent Note：cordis_inspect_query 接受 JSON 编码字符串形式的 input

Status: implemented

[English](2026-08-14-inspect-query-json-string-input.md) | 中文

## 问题

`cordis_inspect_query` 的 `input` 参数声明为 `type: 'json'`，编译到线上是一个无类型属性。在 anthropic-messages API 上，GLM-5.2 会把无类型属性序列化为 JSON 编码字符串，于是模型发出的是 `"input": "{\"service\": \"tokenMeter\"}"`。这个字符串能通过工具参数校验——无类型参数接受任意 JSON 值，字符串也是其中之一——随后被 Inspect 提供方的 `{ "type": "object" }` 输入 schema 以 `"input" must be an object` 拒绝。在该提供方上，所有 Service/Event 精确查询因此失败，而目录查询（不带 `input`）正常；报错指向校验而非编码，掩盖了真正的根因。

## 决策

`cordis_inspect_query` 在提供方 schema 校验之前先用 `JSON.parse` 解码字符串形式的 `input`（`@deepseek-ai/dsh-tool-cordis` 中的 `decodeInspectInput`）。无法解析的字符串以 `input must be a JSON value or a JSON-encoded string` 加解析器原因失败。参数描述现在写明两种可接受形式。解码放在拥有该参数的工具里，而不是适配器或 inspect 注册表：适配器保持对线路的忠实，注册表继续按提供方声明的 schema 校验。

## 曾考虑的替代方案

- **在适配器统一矫正字符串编码的对象。** 不采用：适配器应原样传达提供方发来的内容；其他 `type: 'json'` 参数（例如 `workflow` 的 `args`）可能合法地收到字符串标量，全局矫正会悄悄改变它们。
- **把参数在线上声明为 `type: 'object'`。** 不采用：当提供方方法声明数组或标量输入时该参数必须能传它们，`object` 是错误描述。
- **不改工具，让调用方改。** 调用方是部署路由到的任何模型；工具集无法改变提供方侧的序列化选择，只能接住它。

## 后果

在模型会把无类型属性编码为字符串的提供方上，精确 Inspect 查询恢复正常；直接发送对象的调用不受影响（原样透传）。这一接受行为已反映在生成的工具目录中。若将来某提供方发出非 JSON 字符串，仍会失败，但报错会点名编码问题。
