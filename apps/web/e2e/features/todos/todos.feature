@todos
Feature: Todo User Journeys

  Scenario: Empty state is shown on first load
    Given the API returns an empty todo list
    When I visit the home page
    Then I see the empty state message

  Scenario: User can add a new todo and it appears in the list
    Given the user navigates to the home page
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    Then the todo list contains "Buy groceries"

  Scenario: Newly added todo persists after page reload
    Given the user navigates to the home page
    When the user types "Walk the dog" in the todo input
    And the user submits the create todo form
    And the user reloads the page
    Then the todo list contains "Walk the dog"

  Scenario: User can complete a todo
    Given the user navigates to the home page
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    When the user completes the todo "Buy groceries"
    Then the todo "Buy groceries" is shown as completed

  Scenario: User can uncomplete a completed todo
    Given the user navigates to the home page
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    When the user completes the todo "Buy groceries"
    And the user completes the todo "Buy groceries"
    Then the todo list contains "Buy groceries"

  Scenario: User can delete a todo
    Given the user navigates to the home page
    When the user types "Buy groceries" in the todo input
    And the user submits the create todo form
    When the user deletes the todo "Buy groceries"
    Then the todo "Buy groceries" is not in the list
