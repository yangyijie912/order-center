# Order Center

这是一个基于 Next.js + TypeScript 的订单管理中心示例项目，包含前端页面、API 路由和订单状态机实现（用于演示订单生命周期和操作）。

**主要技术栈**

- Next.js (App Router)
- React + TypeScript
- 自研状态机实现（`useStateMachine`）

## 快速开始

安装依赖：

```bash
pnpm install
# 或
npm install
```

本地开发启动：

```bash
pnpm dev
# 或
npm run dev
```

在浏览器打开 [http://localhost:3000](http://localhost:3000/)

## 项目结构（摘要）

- `src/app/`：Next.js 路由与页面（包括 `api` 路由）。
- `src/features/orders/`：订单相关功能，包括 UI 组件、domain、hooks、services 与状态机实现。
- `src/features/auth/`：认证与权限相关逻辑。
- `src/public/`：静态资源。

更多文件夹和说明请查看代码目录。

## 关键点说明

- Orders API：在 `src/app/api/orders` 下定义了多个 API 路由（如创建、查询、支付、退款、发货、取消、批量操作等），路由以文件夹结构组织（例如 `src/app/api/orders/[id]/pay/route.ts`）。

- 订单状态机：项目的订单状态与操作由状态机驱动，主要位置为 `src/features/orders/domain/stateMachine.ts`（以及 `useOrderMachine.ts`、`uiActionMap.ts` 等），使复杂的状态转移、并发操作与权限控制变得可预测与可测试。

- 状态机实现说明（自研 `useStateMachine`）：

  1）一个轻量的有限状态机抽象，入口位于 `src/hooks/useStateMachine.ts`，订单的具体转移表定义在 `src/features/orders/domain/stateMachine.ts`。

  2）功能点：该实现提供状态管理、事件分发（`dispatch`）、守卫（`guard`）、副作用（`effect`）的执行、可用操作枚举（`actions`）、异步执行标记（`pending`）和错误跟踪（`error`）。

  3）在本项目的用法：通过 `useOrderMachine`（封装于 `src/features/orders/hooks/useOrderMachine.ts`）将 `orderTransitions` 注入到 `useStateMachine`，UI 向 `dispatch` 发送事件触发转移；副作用（如调用 `ordersApi`）在转移定义中实现为 `effect`。

- 服务层与模拟：后端调用封装在 `src/features/orders/services`（例如 `ordersApi.ts`、`paymentSimulator.ts`），便于在本地模拟支付/退款流程并替换为真实服务。

- 权限与认证：`src/features/auth` 提供权限角色与服务器端判断（如 `roles.ts`、`server.ts`），页面层通过 hooks (`useAuthRole.ts`) 控制动作可见性与可执行性。

- Hooks 与封装：常用逻辑被抽成 hooks（`useOrderList`、`useOrderActions`、`useOrderSelection`、`useOrderMachine`），便于复用与测试。。

## 自研组件库（beaver-ui）

- 组件库名称：`beaver-ui`（已在 `package.json` 中列为依赖）。
- 功能概要：提供常用的企业级 UI 组件（例如 `Button`、`Modal`、`Table`、`Form`、`Toast` 等），并包含主题化与可定制样式能力，方便在订单管理场景中复用。
