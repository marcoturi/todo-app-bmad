import HomePage from "@/routes/Home/HomePage";
import { renderWithProviders } from "@/shared/store/test";
import { screen } from "@testing-library/react";

describe("HomePage", () => {
  test("Should load", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });
});
