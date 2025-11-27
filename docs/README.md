# 📚 OpenPanel Documentation

Welcome to the complete OpenPanel documentation!

## 🎯 What is OpenPanel?

OpenPanel is a **modern, self-hosted control panel** for managing containerized applications with integrated AI support.

---

## 🚀 Quick Start

### 👤 For Users
1. **[Main README](../README.md)** ⭐ - Installation and quick start
2. **[Environment Setup](../.env.example)** - Configuration guide

### 👨‍💻 For Developers
1. **[CLAUDE.md](../CLAUDE.md)** ⭐ - Complete technical guide
2. **[Domain Documentation](./domains/)** ⭐⭐⭐ - **Domain-driven docs (optimized for LLMs)**
3. **[System Architecture](./architecture/01-system-architecture.md)** - Architecture overview

---

## 📂 Documentation Structure

### 🎯 **NEW: Domain-Driven Documentation** (Recommended)

**Location**: [`docs/domains/`](./domains/)

**Why?** Each domain file contains **100% of the context** needed - from business rules to implementation code - in a single file. Perfect for LLMs!

**Available Domains**:
- **[authentication.md](./domains/authentication.md)** - Login, JWT, users, API keys
- **[projects-teams.md](./domains/projects-teams.md)** - Projects and team collaboration
- **[containers.md](./domains/containers.md)** - Docker, builds, deployments
- **[networking.md](./domains/networking.md)** - Domains, SSL, Traefik
- **[storage.md](./domains/storage.md)** - Backups and databases

**Full Index**: [domains/INDEX.md](./domains/INDEX.md)

---

### 🏗️ Architecture Documentation

**Location**: [`docs/architecture/`](./architecture/)

- **[01-system-architecture.md](./architecture/01-system-architecture.md)** - High-level system design
- Monorepo structure (apps/api, apps/web, packages/shared)
- Tech stack decisions

---

## 📊 Project Status

| Aspect | Status |
|--------|--------|
| Core Features | ✅ 85% Complete |
| Domain Docs | ✅ Complete |
| Testing | 🔄 In Progress |

---

## 🧭 Navigation Guide

### If you want to...

**...understand how a feature works end-to-end:**
→ Read the corresponding **[domain doc](./domains/)**

**...get started quickly:**
→ Read **[Main README](../README.md)**

**...develop a new feature:**
→ Read **[CLAUDE.md](../CLAUDE.md)** + relevant **[domain doc](./domains/)**

**...understand the big picture:**
→ Read **[System Architecture](./architecture/01-system-architecture.md)**

---

## 🔗 Quick Links

- **[CLAUDE.md](../CLAUDE.md)** - Development guide
- **[Domain Index](./domains/INDEX.md)** - All domains
- **[GitHub](https://github.com/msoutole/openpanel)** - Repository
- **[Main README](../README.md)** - Project README

---

## 💡 About Domain-Driven Documentation

Traditional docs separate content by type (user stories, API docs, architecture). This creates fragmentation.

**Domain-Driven approach**: Everything about a feature in ONE file.

**Benefits for LLMs**:
- ✅ Single file read = 100% context
- ✅ Less hallucination (business rules + code together)
- ✅ Faster responses (no file hopping)

See **[domains/INDEX.md](./domains/INDEX.md)** for more details.

---

**Welcome to OpenPanel! 🎉**

Version: 0.1.0 | Last updated: 2025-11-26

