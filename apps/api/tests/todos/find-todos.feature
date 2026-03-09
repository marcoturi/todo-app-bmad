@todos
Feature: Find Todos

  Background:
    Given the todos database is empty

  Scenario: Retrieve empty todo list
    When I request the list of todos
    Then I receive an empty list

  Scenario: Retrieve list with one todo
    Given a todo exists with description "Buy groceries"
    When I request the list of todos
    Then I receive a list with 1 todo
    And the first todo has description "Buy groceries"
    And the first todo has completed status false

  Scenario: Retrieve list with multiple todos in creation order
    Given a todo exists with description "First task"
    And a todo exists with description "Second task"
    And a todo exists with description "Third task"
    When I request the list of todos
    Then I receive a list with 3 todos
    And the todos are in creation order starting with "First task"
