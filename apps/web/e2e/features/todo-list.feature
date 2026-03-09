@todo-list
Feature: Todo List UI

  Scenario: Loading indicator is shown while fetching todos
    Given the API response for todos is delayed
    When I visit the home page
    Then I see the loading indicator

  Scenario: Empty state message is shown when there are no todos
    Given the API returns an empty todo list
    When I visit the home page
    Then I see the empty state message

  Scenario: Todos are displayed in creation order
    Given the API returns the following todos:
      | description   | completed |
      | Buy groceries | false     |
      | Walk the dog  | true      |
    When I visit the home page
    Then I see 2 todos in the list
    And the first todo is "Buy groceries"
    And the second todo is "Walk the dog"

  Scenario: Completed todo is visually distinguished with strikethrough
    Given the API returns the following todos:
      | description  | completed |
      | Walk the dog | true      |
    When I visit the home page
    Then the todo "Walk the dog" is shown with a strikethrough

  Scenario: Error state is shown when the API fails
    Given the API returns a server error for todos
    When I visit the home page
    Then I see an error message
    And I see a retry button
