import {
  test,
  beforeAll,
  afterAll,
  describe,
  expect,
  beforeEach,
} from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  test("o usuário consegue criar uma nova transação", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "Nova Transação",
        amount: 8000,
        type: "credit",
      })
      .expect(204);
  });

  test("o usuário pode listar suas proprias transações", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Nova Transação",
        amount: 8000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");
    const listTransactionsResnponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsResnponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "Nova Transação",
        amount: 8000,
      }),
    ]);
  });

  test("o usuário pode listar uma transação especifica", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Nova Transação",
        amount: 8000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");
    const listTransactionsResnponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsResnponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "Nova Transação",
        amount: 8000,
      }),
    ]);

    const transactionId = listTransactionsResnponse.body.transactions[0].id;
    const getTransactionResnponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResnponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "Nova Transação",
        amount: 8000,
      })
    );
  });

  test("o usuário pode consultar o resumo das transações", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Nova Transação",
        amount: 8000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Nova Transação de Débito",
        amount: 2000,
        type: "debit",
      });

    const summaryResnponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryResnponse.body.summary).toEqual({
      amount: 6000,
    });
  });
});
