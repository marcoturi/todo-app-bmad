import { NotFoundException } from '#src/shared/exceptions/index.ts';

export class TodoNotFoundError extends NotFoundException {
  constructor(id: string) {
    super(`Todo with id '${id}' not found`);
  }
}
