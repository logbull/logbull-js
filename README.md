# LogBull JavaScript/TypeScript

<div align="center">
<img src="assets/logo.svg" style="margin-bottom: 20px;" alt="Log Bull Logo" width="250"/>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/logbull.svg)](https://www.npmjs.com/package/logbull)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

A JavaScript/TypeScript library for sending logs to [LogBull](https://github.com/logbull/logbull) - a simple log collection system.

</div>

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
  - [1. Standalone Logger](#1-standalone-logger)
  - [2. Winston Integration](#2-winston-integration)
  - [3. Pino Integration](#3-pino-integration)
- [Configuration Options](#configuration-options)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Requirements](#requirements)
- [License](#license)

## Features

- **Multiple integration options**: Standalone logger, Winston transport, and Pino transport
- **Context support**: Attach persistent context to logs (session_id, user_id, etc.)
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Framework integration**: Easy integration with Express.js, Fastify, and other Node.js frameworks

## Installation

```bash
npm install logbull
```

This single package includes everything you need: the standalone logger, Winston transport, and Pino transport.

## Quick Start

The fastest way to start using LogBull is with the standalone logger:

```typescript
import { LogBullLogger, LogLevel } from "logbull";

const logger = new LogBullLogger({
  host: "http://LOGBULL_HOST",
  projectId: "LOGBULL_PROJECT_ID",
  apiKey: "YOUR_API_KEY", // optional
  logLevel: LogLevel.INFO,
});

logger.info("User logged in successfully", {
  user_id: "12345",
  username: "john_doe",
  ip: "192.168.1.100",
});
```

## Usage Examples

### 1. Standalone Logger

```typescript
import { LogBullLogger, LogLevel } from "logbull";

// Initialize logger
const logger = new LogBullLogger({
  host: "http://LOGBULL_HOST",
  projectId: "LOGBULL_PROJECT_ID",
  apiKey: "YOUR_API_KEY",
  logLevel: LogLevel.INFO,
});

// Basic logging
logger.info("User logged in successfully", {
  user_id: "12345",
  username: "john_doe",
  ip: "192.168.1.100",
});

logger.error("Database connection failed", {
  database: "users_db",
  error_code: 500,
});

// Context management
const sessionLogger = logger.withContext({
  session_id: "sess_abc123",
  user_id: "user_456",
});

sessionLogger.info("Processing request", {
  action: "purchase",
});
```

### 2. Winston Integration

```typescript
import winston from "winston";
import { LogBullTransport } from "logbull";

// Create Winston logger with LogBull transport
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new LogBullTransport({
      host: "http://LOGBULL_HOST",
      projectId: "LOGBULL_PROJECT_ID",
      apiKey: "YOUR_API_KEY",
    }),
  ],
});

// Use standard Winston logging
logger.info("User action", {
  user_id: "12345",
  action: "login",
  ip: "192.168.1.100",
});

logger.error("Payment failed", {
  order_id: "ord_123",
  amount: 99.99,
  currency: "USD",
});

// Winston child logger (context)
const requestLogger = logger.child({
  request_id: "req_789",
  session_id: "sess_456",
});

requestLogger.info("Request started");
requestLogger.info("Request completed", { duration_ms: 250 });
```

### 3. Pino Integration

```typescript
import pino from "pino";
import { createPinoTransport } from "logbull";

// Create Pino logger with LogBull transport
const transport = createPinoTransport({
  host: "http://LOGBULL_HOST",
  projectId: "LOGBULL_PROJECT_ID",
  apiKey: "YOUR_API_KEY",
});

const logger = pino({ level: "info" }, transport);

// Use standard Pino logging
logger.info(
  {
    user_id: "12345",
    action: "login",
    ip: "192.168.1.100",
  },
  "User action"
);

logger.error(
  {
    order_id: "ord_123",
    amount: 99.99,
    currency: "USD",
  },
  "Payment failed"
);

// Pino child logger (context)
const requestLogger = logger.child({
  request_id: "req_789",
  session_id: "sess_456",
});

requestLogger.info("Request started");
requestLogger.info({ duration_ms: 250 }, "Request completed");
```

## Configuration Options

### Available Log Levels

```typescript
enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}
```

## API Reference

### LogBullLogger

#### Methods

- `debug(message: string, fields?: Record<string, any>)`: Log debug message
- `info(message: string, fields?: Record<string, any>)`: Log info message
- `warning(message: string, fields?: Record<string, any>)`: Log warning message
- `error(message: string, fields?: Record<string, any>)`: Log error message
- `critical(message: string, fields?: Record<string, any>)`: Log critical message
- `withContext(context: Record<string, any>): LogBullLogger`: Create new logger with additional context
- `flush()`: Immediately send all queued logs
- `shutdown(): Promise<void>`: Stop background processing and send remaining logs

### LogBullTransport (Winston)

#### Methods

- `log(info: any, callback: () => void)`: Winston log method (called automatically)
- `flush()`: Immediately send all queued logs
- `close()`: Close the transport
- `shutdown(): Promise<void>`: Stop and send remaining logs

### LogBullPinoTransport (Pino)

#### Methods

- `flush()`: Immediately send all queued logs
- `shutdown(): Promise<void>`: Stop and send remaining logs

#### Functions

- `createPinoTransport(config: Config)`: Create a Pino transport stream

## Requirements

- **Node.js**: 16.0.0 or higher
- **TypeScript**: 5.0.0 or higher (for TypeScript projects)

For Node.js 18+, native `fetch` is used. For older versions, the built-in `https` module is used.
