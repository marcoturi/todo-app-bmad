export type Todo = {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoRequest = {
  description: string;
};

export type UpdateTodoRequest = {
  completed: boolean;
};
