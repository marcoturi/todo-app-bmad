import { CreateTodoForm } from '@/features/todos/components/CreateTodoForm';
import { TodoList } from '@/features/todos/components/TodoList';
import { Container } from '@/UI/Elements/Container';
import { Text } from '@/UI/Elements/Text';

function HomePage() {
  return (
    <Container data-testid="home-page">
      <Text size="7" as="p" className="!mb-6 block font-semibold">
        My Tasks
      </Text>
      <CreateTodoForm />
      <TodoList />
    </Container>
  );
}

export default HomePage;
