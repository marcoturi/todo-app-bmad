@todos
Feature: Update Todo API — Toggle Completion

  Scenario: Mark a todo as complete
    Given a todo is inserted with description "Buy groceries" and its id is stored
    When I toggle the stored todo completion to true
    Then I receive a 200 response with a todo object
    And the response todo has completed true
    And the response todo has updatedAt greater than or equal to createdAt

  Scenario: Mark a completed todo as incomplete
    Given a todo is inserted with description "Buy groceries" and its id is stored
    When I toggle the stored todo completion to true
    And I toggle the stored todo completion to false
    Then I receive a 200 response with a todo object
    And the response todo has completed false
    And the response todo has updatedAt greater than or equal to createdAt

  Scenario: Returns 404 for a non-existent todo id
    When I send a PATCH to "/api/v1/todos/00000000-0000-0000-0000-000000000000" with completed true
    Then I receive a 404 response

  Scenario: Returns 400 for an invalid UUID path parameter
    When I send a PATCH to "/api/v1/todos/not-a-uuid" with completed true
    Then I receive a 400 response
