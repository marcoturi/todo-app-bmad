import assert from 'node:assert/strict';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

Before({ tags: '@todos' }, async function (this: ICustomWorld) {
  await this.db`TRUNCATE todos`;
});

Given('the todos database is empty', async function (this: ICustomWorld) {
  await this.db`TRUNCATE todos`;
});

Given(
  'a todo exists with description {string}',
  async function (this: ICustomWorld, description: string) {
    await this.db`
    INSERT INTO todos (id, description, completed, created_at, updated_at)
    VALUES (gen_random_uuid(), ${description}, false, now(), now())
  `;
    // Small delay to ensure distinct created_at timestamps for ordering assertions
    await new Promise((resolve) => setTimeout(resolve, 10));
  },
);

When('I request the list of todos', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: '/api/v1/todos',
  });
});

Then('I receive an empty list', function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, 200);
  assert.ok(
    this.context.latestResponse!.headers['content-type']?.includes('application/json'),
    'Content-Type must be application/json',
  );
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response body should be a direct array');
  assert.equal(body.length, 0);
});

Then('I receive a list with {int} todo', function (this: ICustomWorld, count: number) {
  assert.equal(this.context.latestResponse!.statusCode, 200);
  assert.ok(
    this.context.latestResponse!.headers['content-type']?.includes('application/json'),
    'Content-Type must be application/json',
  );
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response body should be a direct array');
  assert.equal(body.length, count);
});

Then('I receive a list with {int} todos', function (this: ICustomWorld, count: number) {
  assert.equal(this.context.latestResponse!.statusCode, 200);
  assert.ok(
    this.context.latestResponse!.headers['content-type']?.includes('application/json'),
    'Content-Type must be application/json',
  );
  const body = this.context.latestResponse!.json();
  assert.ok(Array.isArray(body), 'Response body should be a direct array');
  assert.equal(body.length, count);
});

Then('the first todo has description {string}', function (this: ICustomWorld, description: string) {
  const body = this.context.latestResponse!.json();
  assert.equal(body[0].description, description);
});

Then('the first todo has completed status false', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.equal(body[0].completed, false);
});

Then(
  'the todos are in creation order starting with {string}',
  function (this: ICustomWorld, firstDescription: string) {
    const body = this.context.latestResponse!.json();
    assert.equal(body[0].description, firstDescription);
    for (const todo of body) {
      assert.ok(typeof todo.id === 'string', 'Todo must have a string id');
      assert.ok(typeof todo.description === 'string', 'Todo must have a string description');
      assert.ok(typeof todo.completed === 'boolean', 'Todo must have a boolean completed');
      assert.ok(
        ISO_8601_REGEX.test(todo.createdAt),
        `createdAt must be ISO 8601 format, got: ${todo.createdAt}`,
      );
      assert.ok(
        ISO_8601_REGEX.test(todo.updatedAt),
        `updatedAt must be ISO 8601 format, got: ${todo.updatedAt}`,
      );
    }
  },
);

// ── Create Todo steps ────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

When(
  'I create a todo with description {string}',
  async function (this: ICustomWorld, description: string) {
    this.context.latestResponse = await this.server.inject({
      method: 'POST',
      url: '/api/v1/todos',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description }),
    });
  },
);

When(
  'I create a todo with a description of {int} characters',
  async function (this: ICustomWorld, length: number) {
    const description = 'a'.repeat(length);
    this.context.latestResponse = await this.server.inject({
      method: 'POST',
      url: '/api/v1/todos',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description }),
    });
  },
);

When('I create a todo with no description field', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: '/api/v1/todos',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
});

Then('I receive a 201 response', function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, 201);
  assert.ok(
    this.context.latestResponse!.headers['content-type']?.includes('application/json'),
    'Content-Type must be application/json',
  );
});

Then('I receive a 400 response', function (this: ICustomWorld) {
  assert.equal(this.context.latestResponse!.statusCode, 400);
  const body = this.context.latestResponse!.json();
  assert.ok(typeof body.statusCode === 'number', 'RFC 9457: must have statusCode');
  assert.ok(typeof body.error === 'string', 'RFC 9457: must have error string');
  assert.ok(typeof body.message === 'string', 'RFC 9457: must have message string');
});

Then(
  'the response body contains a todo with description {string}',
  function (this: ICustomWorld, description: string) {
    const body = this.context.latestResponse!.json();
    assert.equal(body.description, description);
  },
);

Then('the todo has completed status false', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.equal(body.completed, false);
});

Then('the todo has a valid UUID id', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json();
  assert.ok(UUID_REGEX.test(body.id), `id must be a valid UUID, got: ${body.id}`);
});

Then(
  'the todo has valid ISO 8601 createdAt and updatedAt timestamps',
  function (this: ICustomWorld) {
    const body = this.context.latestResponse!.json();
    assert.ok(
      ISO_8601_REGEX.test(body.createdAt),
      `createdAt must be ISO 8601, got: ${body.createdAt}`,
    );
    assert.ok(
      ISO_8601_REGEX.test(body.updatedAt),
      `updatedAt must be ISO 8601, got: ${body.updatedAt}`,
    );
  },
);
