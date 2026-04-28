# Student Attendance Tracking and Analytics System

<p align="center">
  A university independent project for student check-in, session management, and attendance analysis.
</p>

<p align="center">
  <a href="https://student-attendance-tracking-analyti.vercel.app/login">Live Website</a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <strong>Languages:</strong> <a href="#english">English</a> | <a href="#chinese">中文</a>
</p>

---

<a id="english"></a>

## English

## Overview

This is a student attendance system built as a university independent project. It covers the basic attendance flow from login and check-in to session management and attendance analysis.

The project keeps the scope practical: students can submit attendance with a session code, and lecturers can manage sessions, view records, and identify students with low attendance.

## Features

- Role-based login for students and lecturers
- Student check-in with a session code
- Lecturer tools for creating, loading, and closing sessions
- Attendance charts and low-attendance reminders
- Language switch and adjustable text size

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Firebase Auth
- Firestore
- Chart.js
- Tailwind CSS 4

## Project Structure

```text
app/
  components/      Shared UI components
  login/           Login page
  student/         Student page
  lecturer/        Lecturer page
src/
  lib/             Firebase config, demo accounts, shared constants
docs/              Project notes and usage guide
```

Usage guides:

- [English guide](docs/USAGE_GUIDE_EN.md)
- [中文指南](docs/USAGE_GUIDE_ZH.md)

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Environment Variables

Create `.env.local` and provide the Firebase values used by the app:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` can be left empty if you do not use Analytics.

## Demo Accounts

Student:

- `s001 / student123`
- `s002 / student123`
- `s003 / student123`

Lecturer:

- `lecturer01 / teach123`

## Notes

- The current low-attendance warning uses `40%` as the minimum threshold because that is the project requirement.
- Firestore rules in this repo are simplified for academic demo use.
- Demo accounts and sample data are included for testing and presentation.

## License

This repository is kept for university independent project, portfolio, and demo use.

---

<a id="chinese"></a>

## 中文

## 项目简介

这是一个大学独立项目形式的学生考勤系统，覆盖了登录、签到、会话管理和出勤分析这些核心流程。

项目范围控制得比较明确，不追求复杂的平台能力，重点是把老师和学生两端最常用的考勤功能做完整。

## 主要功能

- 学生和老师分角色登录
- 学生通过签到码完成签到
- 老师创建、加载、关闭签到
- 查看出勤图表和低出勤提醒
- 支持语言切换和字号调整

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Firebase Auth
- Firestore
- Chart.js
- Tailwind CSS 4

## 项目结构

```text
app/
  components/      公共 UI 组件
  login/           登录页
  student/         学生端页面
  lecturer/        老师端页面
src/
  lib/             Firebase 配置、演示账号、公共常量
docs/              项目说明文档
```

使用指南：

- [English guide](docs/USAGE_GUIDE_EN.md)
- [中文指南](docs/USAGE_GUIDE_ZH.md)

## 本地运行

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:3000`。

## 环境变量

新建 `.env.local`，填入项目使用的 Firebase 配置：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

如果没有用到 Analytics，`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` 可以留空。

## 演示账号

学生：

- `s001 / student123`
- `s002 / student123`
- `s003 / student123`

老师：

- `lecturer01 / teach123`

## 说明

- 当前低出勤预警的最小阈值按项目要求设为 `40%`。
- 仓库里的 Firestore 规则是学术演示版本，不按生产环境标准设计。
- 演示账号和示例数据保留在仓库里，方便本地测试和答辩展示。

## 许可说明

本仓库主要用于大学独立项目、作品展示和演示。
