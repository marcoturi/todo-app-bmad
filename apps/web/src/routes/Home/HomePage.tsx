import { TodoList } from '@/features/todos/components/TodoList';
import { Container } from '@/UI/Elements/Container';
import { Text } from '@/UI/Elements/Text';

function HomePage() {
  return (
    <Container data-testid="home-page">
      <Text size="7" as="h1" className="!mb-6 block font-semibold">
        My Tasks
      </Text>
      <TodoList />
    </Container>
  );
}

export default HomePage;
