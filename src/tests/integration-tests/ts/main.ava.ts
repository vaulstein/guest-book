import { Worker, NEAR, NearAccount } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // deploy contract
  const root = worker.rootAccount;
  const contract = await root.createAndDeploy(
    root.getSubAccount("guest-book").accountId,
    "./out/main.wasm",
    { initialBalance: NEAR.parse("30 N").toJSON() }
  );

  // some test accounts
  const alice = await root.createSubAccount("alice", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });
  const bob = await root.createSubAccount("bob", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });
  const charlie = await root.createSubAccount("charlie", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract, alice, bob, charlie };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("send one message and retrieve it", async (t) => {
    const { root, contract, alice, bob, charlie } = t.context.accounts;
    await root.call(contract, "addMessage", { text: 'aloha' });
    const msgs = await contract.view("getMessages");
    const expectedMessagesResult = [{
      premium: false,
      sender: root.accountId,
      text: 'aloha'
    }];
    t.deepEqual(msgs, expectedMessagesResult);
  });

  test("send two messages and expect two total", async (t) => {
    const { root, contract, alice, bob, charlie } = t.context.accounts;
    await root.call(contract, "addMessage", { text: 'aloha' });
    await alice.call(contract, "addMessage", { text: 'hola' });
    const msgs: Object[] = await contract.view("getMessages");
    const expected = 2;
    t.deepEqual(msgs.length, expected);
  });