@todos
Feature: Create Todo

  Background:
    Given the todos database is empty

  Scenario: Successfully create a todo
    When I create a todo with description "Buy milk"
    Then I receive a 201 response
    And the response body contains a todo with description "Buy milk"
    And the todo has completed status false
    And the todo has a valid UUID id
    And the todo has valid ISO 8601 createdAt and updatedAt timestamps

  Scenario: Reject empty description
    When I create a todo with description ""
    Then I receive a 400 response

  Scenario: Reject description that exceeds 500 characters
    When I create a todo with a description of 501 characters
    Then I receive a 400 response

  Scenario: Reject missing description field
    When I create a todo with no description field
    Then I receive a 400 response

  Scenario: Created todo is retrievable via GET
    When I create a todo with description "Walk the dog"
    Then I receive a 201 response
    When I request the list of todos
    Then I receive a list with 1 todo
    And the first todo has description "Walk the dog"
