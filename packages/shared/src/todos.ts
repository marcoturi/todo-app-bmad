export interface Todo {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  description: string;
}

export interface UpdateTodoRequest {
  completed: boolean;
}
