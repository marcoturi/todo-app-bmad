@todos
Feature: Delete Todo API

  Scenario: Successfully delete an existing todo
    Given a todo is inserted with description "Buy groceries" and its id is stored
    When I delete the stored todo
    Then I receive a 200 response with an empty body
    And the deleted todo is no longer in the list

  Scenario: Returns 404 for a non-existent todo id
    When I send a DELETE to "/api/v1/todos/00000000-0000-0000-0000-000000000000"
    Then I receive a 404 response

  Scenario: Returns 400 for an invalid UUID path parameter
    When I send a DELETE to "/api/v1/todos/not-a-uuid"
    Then I receive a 400 response
