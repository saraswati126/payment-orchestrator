# Serverless Payment Orchestrator

A production-inspired serverless payment orchestration system built using **TypeScript**, **Node.js**, and AWS workflow concepts. The project simulates a distributed payment processing pipeline where independent execution units validate, authorize, transform, and capture payments while maintaining clear separation of concerns.

The orchestration flow is modeled after AWS Step Functions and demonstrates event-driven architecture, serverless design principles, workflow state management, and type-safe backend development.

# 🏗️ Architecture Overview


                [ Client Request ]
                        │
                        ▼
            ┌─────────────────────┐
            │  Validate Payment   │
            └─────────────────────┘
                        │
                 Valid Request
                        ▼
            ┌─────────────────────┐
            │ Authorize Payment   │
            └─────────────────────┘
                        │
                  Authorized
                        ▼
            ┌─────────────────────┐
            │  Pass State Filter  │
            └─────────────────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │  Capture Payment    │
            └─────────────────────┘
                        │
                        ▼
                Transaction Success

                        OR

                Transaction Failed
```

---

# 🎯 Design Goals

This project focuses on the following architectural principles:

* Loose coupling between workflow stages
* Independent failure handling
* Type-safe request validation
* Event-driven processing
* Extensible payment provider integrations
* Clear separation of business logic
* Testable and maintainable code structure

---

# ⚙️ Transaction Lifecycle

## 1. Validation Stage

Validates incoming payment requests before downstream processing begins.

Validation checks include:

* Payment ID validation
* Customer ID validation
* Amount validation
* Currency validation
* Required field verification

---

## 2. Authorization Stage

Simulates communication with an external payment gateway to authorize the requested transaction amount.

Responsibilities:

* Authorization request handling
* Gateway response simulation
* Authorization token generation
* Decline handling

---

## 3. Pass State Transformation

Represents an AWS Step Functions Pass State.

Responsibilities:

* Transform workflow context
* Remove unnecessary metadata
* Prepare settlement payload
* Pass only required fields to downstream stages

---

## 4. Capture Payment Stage

Finalizes settlement after successful authorization.

Responsibilities:

* Settlement simulation
* Transaction completion
* Settlement confirmation generation

---

# 🛠️ Technology Stack

| Category       | Technology                  |
| -------------- | --------------------------- |
| Language       | TypeScript                  |
| Runtime        | Node.js                     |
| Architecture   | Event-Driven Architecture   |
| Workflow Model | AWS Step Functions Inspired |
| Compute Model  | AWS Lambda Inspired         |
| Validation     | Type-Safe Contracts         |
| Testing        | Local Workflow Harness      |

---

# 📂 Project Structure

```text
payment-orchestrator/
│
├── src/
│   ├── functions/
│   │   ├── validate-payment/
│   │   │   └── index.ts
│   │   │
│   │   ├── authorize-payment/
│   │   │   └── index.ts
│   │   │
│   │   └── capture-payment/
│   │       └── index.ts
│   │
│   └── types/
│       └── payment.ts
│
├── local-test-harness.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# 🚀 Features

* Payment request validation
* Authorization workflow simulation
* State context transformation (Pass State)
* Payment settlement simulation
* Success and failure path handling
* Local Step Functions-style workflow execution
* Strong TypeScript type safety
* Modular Lambda-style architecture
* End-to-end payment lifecycle simulation

---

# 🧪 Local Development

## Prerequisites

Install:

* Node.js (v18+ recommended)
* npm

Verify installation:

```bash
node -v
npm -v
```

---

# 🚀 Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate into the project:

```bash
cd payment-orchestrator
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Running the Project

Execute the local workflow simulation:

```bash
npm run test:local
```

The local test harness simulates AWS Step Functions orchestration and executes each payment processing stage in sequence.

---

# 📥 Sample Successful Input

```json
{
  "paymentId": "PAY-1001",
  "customerId": "CUS-5001",
  "amount": 2500,
  "currency": "INR"
}
```

---

# 📤 Sample Successful Output

```json
{
  "paymentId": "PAY-1001",
  "customerId": "CUS-5001",
  "amount": 2500,
  "currency": "INR",
  "authorizationId": "AUTH-789",
  "captureResult": {
    "settlementId": "SETTLE-456",
    "settlementStatus": "SUCCEEDED"
  }
}
```

---

# ❌ Validation Failure Example

To test the validation failure path, modify the input payload with an invalid amount:

```json
{
  "paymentId": "PAY-1001",
  "customerId": "CUS-5001",
  "amount": -100,
  "currency": "INR"
}
```

Expected Result:

```json
{
  "error": "Invalid payment amount",
  "status": "FAILED"
}
```

This demonstrates how the workflow terminates early when validation rules are violated, preventing invalid transactions from reaching downstream authorization and settlement stages.

---

# 📚 Concepts Demonstrated

This project provides hands-on implementation experience with:

* Event-Driven Architecture
* Serverless Computing
* Workflow Orchestration
* State Machine Design
* Distributed System Fundamentals
* TypeScript Type Safety
* AWS Lambda Design Principles
* AWS Step Functions Concepts
* Failure Path Handling
* Transaction Processing Pipelines

---

# 🔮 Future Enhancements

Potential future improvements include:

* Provider Adapter Pattern
* Strategy Pattern for Multiple Payment Providers
* Docker Containerization
* Structured JSON Logging
* Retry Policies
* Dead Letter Queue (DLQ)
* Idempotency Handling
* CloudWatch-style Monitoring
* API Gateway Integration
* CI/CD Pipeline
* Unit Testing
* Integration Testing

---

# 👩‍💻 Author

**Saraswati Sanga**

Backend Developer | Node.js | TypeScript | Serverless Architecture | Event-Driven Systems

This project was built as part of my backend engineering and system design learning journey, focusing on scalable workflow orchestration, serverless design patterns, and distributed payment processing systems.
