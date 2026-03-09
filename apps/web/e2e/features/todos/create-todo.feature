Feature: Create Todo

  Background:
    Given the user navigates to the home page

  Scenario: User can add a new todo
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    Then the todo list contains "Buy groceries"

  Scenario: Empty input does not submit
    When the user submits the create todo form without typing anything
    Then a validation error is displayed
    And no new todo is added to the list

  Scenario: Input is cleared after successful submission
    When the user types "Walk the dog" in the todo input
    And the user submits the create todo form
    Then the todo input is empty
